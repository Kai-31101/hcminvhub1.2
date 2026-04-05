
  # HCMInvHub

  This repository contains the HCMInvHub frontend and a small ChatGPT Apps SDK wrapper so the app can be exposed inside ChatGPT as an MCP connector.

  ## Run locally

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the Vite development server.

  ## Run for ChatGPT

  1. Run `npm run build`.
  2. Run `npm run start:chatgpt`.
  3. Expose the server with HTTPS, for example `ngrok http 8787`.
  4. In ChatGPT, enable Developer mode and add the connector URL ending in `/mcp`.

  The MCP server serves the built app as a ChatGPT component and also exposes `http://localhost:8787/preview` for a browser preview.

  ## Deploy on Render

  This repo now includes a `render.yaml` blueprint for a Node web service.

  1. Push this repository to GitHub.
  2. In Render, create a new Blueprint or Web Service from the repo.
  3. If you use the blueprint, Render will pick up `render.yaml` automatically.
  4. After deploy finishes, copy your public Render URL and use `<your-render-url>/mcp` as the ChatGPT connector URL.

  Health checks are available at `/health`, and the app preview is available at `/preview`.

  Render is the recommended stable-host option for this project because it gives you a persistent `*.onrender.com` URL without buying a domain.

  ## Deploy on Railway

  Railway also works with this repo because it now exposes a standard `npm start`, and this repository includes a `railway.toml` file with the expected build/start/health-check settings.

  Suggested settings:

  - Build command: `npm install && npm run build`
  - Start command: `npm start`
  - Health check path: `/health`

  After Railway generates a public domain, use `<your-railway-url>/mcp` in ChatGPT.

  Railway gives you a persistent `*.up.railway.app` URL once you generate a public domain for the service.

  ## Figma In Codex

  This workspace now includes an `AGENTS.md` file that tells Codex to use the Figma plugin for Figma URLs, node inspection, screenshots, Code Connect, and design-to-code work.

  In Codex Desktop, the Figma plugin is enabled separately from the repo. Once authenticated, you can ask Codex to implement a screen or component directly from a Figma URL.
  
