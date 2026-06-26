import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { sanitizeUnsupportedColorFunctions } from "./utils/sanitizeCss";
import { ErrorBoundary } from "./components/ErrorBoundary";

sanitizeUnsupportedColorFunctions();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
