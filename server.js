import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const distIndexPath = path.join(distDir, "index.html");
const widgetUri = "ui://widget/hcminvhub.html";
const assetDir = path.join(distDir, "assets");
const faviconPath = path.join(distDir, "favicon.svg");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function readUtf8(filePath) {
  return readFileSync(filePath, "utf8");
}

function requireBuildArtifact() {
  if (!existsSync(distIndexPath)) {
    throw new Error('Missing dist/index.html. Run "npm run build" before starting the ChatGPT server.');
  }
}

function normalizeAssetPath(assetPath) {
  return assetPath.replace(/^\.?\//, "");
}

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function loadBuiltIndexHtml() {
  requireBuildArtifact();
  return readUtf8(distIndexPath);
}

function buildHostedHtml(baseUrl) {
  const indexHtml = loadBuiltIndexHtml();
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return indexHtml
    .replace(/href="\.\/*favicon\.svg"/i, `href="${normalizedBaseUrl}/favicon.svg"`)
    .replace(/href="\.\/*assets\/([^"]+)"/i, `href="${normalizedBaseUrl}/assets/$1"`)
    .replace(/src="\.\/*assets\/([^"]+)"/i, `src="${normalizedBaseUrl}/assets/$1"`);
}

function readStaticAsset(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return {
    body: readFileSync(filePath),
    contentType: getMimeType(filePath),
  };
}

function resolveAssetFile(urlPathname) {
  if (urlPathname === "/favicon.svg") {
    return faviconPath;
  }

  if (urlPathname.startsWith("/assets/")) {
    return path.join(assetDir, urlPathname.slice("/assets/".length));
  }

  return null;
}

function createInvestmentHubServer(baseUrl) {
  const server = new McpServer({ name: "hcminvhub-chatgpt", version: "0.1.0" });

  registerAppResource(
    server,
    "hcminvhub-widget",
    widgetUri,
    {},
    async () => ({
      contents: [
        {
          uri: widgetUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: buildHostedHtml(baseUrl),
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "open_hcminvhub",
    {
      title: "Open HCMInvHub",
      description: "Launch the HCMInvHub demo workspace inside ChatGPT.",
      inputSchema: {},
      _meta: {
        ui: { resourceUri: widgetUri },
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "Opened HCMInvHub in ChatGPT.",
        },
      ],
      structuredContent: {
        app: "hcminvhub",
        defaultRoute: "/investor/explorer",
      },
    }),
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const isMcpPath = url.pathname === MCP_PATH || url.pathname.startsWith(`${MCP_PATH}/`);
  const baseUrl = `${url.protocol}//${url.host}`;

  if (req.method === "OPTIONS" && isMcpPath) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "text/plain; charset=utf-8" })
      .end("HCMInvHub MCP server is running. Use /mcp for ChatGPT or /preview to view the app.");
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res
      .writeHead(200, { "content-type": "text/plain; charset=utf-8" })
      .end("ok");
    return;
  }

  if (req.method === "GET" && url.pathname === "/preview") {
    try {
      res
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(loadBuiltIndexHtml());
    } catch (error) {
      res
        .writeHead(500, { "content-type": "text/plain; charset=utf-8" })
        .end(error instanceof Error ? error.message : "Failed to render preview.");
    }
    return;
  }

  if (req.method === "GET") {
    const filePath = resolveAssetFile(url.pathname);
    if (filePath) {
      const asset = readStaticAsset(filePath);
      if (!asset) {
        res.writeHead(404).end("Not Found");
        return;
      }

      res.writeHead(200, { "content-type": asset.contentType }).end(asset.body);
      return;
    }
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (isMcpPath && req.method && mcpMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createInvestmentHubServer(baseUrl);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`HCMInvHub MCP server listening on http://localhost:${port}${MCP_PATH}`);
});
