import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme on document element
const html = document.documentElement;
if (localStorage.theme === "dark" || (!localStorage.theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  html.classList.add("dark");
} else {
  html.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
