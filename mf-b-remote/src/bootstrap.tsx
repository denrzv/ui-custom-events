import React from "react";
import { createRoot } from "react-dom/client";
import { WidgetB } from "./widgetB";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing in index.html");

createRoot(container).render(
    <React.StrictMode>
        <WidgetB />
    </React.StrictMode>
);