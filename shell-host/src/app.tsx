import React, { Suspense, useEffect, useState } from "react";

const RemoteWidgetA = React.lazy(() =>
    import("mfA/WidgetA").then((module) => ({
        default: module.WidgetA
    }))
);

const RemoteWidgetB = React.lazy(() =>
    import("mfB/WidgetB").then((module) => ({
        default: module.WidgetB
    }))
);

export function App() {
    const [lastEvent, setLastEvent] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<any>;
            setLastEvent(ce.detail ?? null);
        };

        window.addEventListener("crm:context-changed", handler);
        return () => window.removeEventListener("crm:context-changed", handler);
    }, []);

    return (
        <div style={{ fontFamily: "sans-serif", padding: 16 }}>
            <h2>Shell Host (3000)</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Suspense fallback={<div>Loading MF A...</div>}>
                    <RemoteWidgetA />
                </Suspense>

                <Suspense fallback={<div>Loading MF B...</div>}>
                    <RemoteWidgetB />
                </Suspense>
            </div>

            <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Last <code>crm:context-changed</code> detail:
                </div>
                <pre style={{ background: "#f6f6f6", padding: 8, borderRadius: 8 }}>
          {JSON.stringify(lastEvent, null, 2)}
        </pre>
            </div>
        </div>
    );
}