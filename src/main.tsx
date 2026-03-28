
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

const RESET_ONCE_KEY = "hcminvhub-reset-once-2026-03-26";

if (!window.sessionStorage.getItem(RESET_ONCE_KEY)) {
  window.sessionStorage.setItem(RESET_ONCE_KEY, "true");
  window.localStorage.clear();
  window.location.reload();
}

createRoot(document.getElementById("root")!).render(<App />);
  
