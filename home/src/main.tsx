import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker with error handling
try {
  import("./registerSW").catch((err) => {
    console.warn("Service worker registration failed:", err);
  });
} catch (err) {
  console.warn("Service worker import failed:", err);
}

// Render app with error boundary
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial; text-align: center;">
      <h1>خطأ في تحميل التطبيق</h1>
      <p>حدث خطأ أثناء تحميل التطبيق. يرجى إعادة تحميل الصفحة.</p>
      <p style="color: red;">${error instanceof Error ? error.message : String(error)}</p>
      <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">إعادة تحميل</button>
    </div>
  `;
}
