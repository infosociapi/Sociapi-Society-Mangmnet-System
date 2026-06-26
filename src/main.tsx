import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { sanitizeUnsupportedColorFunctions } from "./utils/sanitizeCss";

sanitizeUnsupportedColorFunctions();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
