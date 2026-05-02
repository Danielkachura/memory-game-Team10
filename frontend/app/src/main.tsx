import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Apply saved theme before first render to avoid flash
(function () {
  const stored = localStorage.getItem("squad-rps-site-theme");
  const theme = stored === "blue" || stored === "ember" || stored === "midnight" ? stored : "ember";
  document.documentElement.dataset.siteTheme = theme;
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
