// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <ErrorBoundary onRetry={() => window.location.reload()}>
                <App />
            </ErrorBoundary>
        </AuthProvider>
    </React.StrictMode>
);

console.log(
    "%c[Whats-4-Dinner]%c App booted successfully 🚀",
    "color: #10b981; font-weight: bold;",
    "color: inherit"
);
