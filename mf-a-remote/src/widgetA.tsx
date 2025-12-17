import React, { useMemo, useState } from "react";

type ContextChangedDetail = {
    correlationId: string;
    source: string;
    payload: {
        filter: string;
        reloadToken: number;
    };
};

type CallbackIntentDetail = {
    correlationId: string;
    source: string;
    clientId: string;
    phone: string;
};

export function WidgetA() {
    // для первой демки
    const [filter, setFilter] = useState<string>("vip");

    // для второй демки (capability protected)
    const [clientId, setClientId] = useState<string>("C-100");
    const [phone, setPhone] = useState<string>("+79001234567");

    const correlationId = useMemo(() => `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`, []);

    function emitContextChanged() {
        const detail: ContextChangedDetail = {
            correlationId,
            source: "mf-a",
            payload: {
                filter,
                reloadToken: Date.now()
            }
        };

        window.dispatchEvent(new CustomEvent<ContextChangedDetail>("crm:context-changed", { detail }));
    }

    function emitCallbackIntent() {
        const detail: CallbackIntentDetail = {
            correlationId,
            source: "mf-a",
            clientId,
            phone
        };

        window.dispatchEvent(new CustomEvent<CallbackIntentDetail>("crm:callback:intent", { detail }));
    }

    function emitBoth() {
        emitContextChanged();
        emitCallbackIntent();
    }

    return (
        <div style={{ border: "1px solid #aaa", padding: 12, borderRadius: 8 }}>
            <h3>Microfrontend A</h3>

            <div style={{ fontSize: 13, opacity: 0.8 }}>
                Dispatches:
                <ul style={{ marginTop: 6 }}>
                    <li>
                        <code>crm:context-changed</code> (reload list)
                    </li>
                    <li>
                        <code>crm:callback:intent</code> (capability demo)
                    </li>
                </ul>
            </div>

            <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 13 }}>
                        Filter:&nbsp;
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="vip">vip</option>
                            <option value="smb">smb</option>
                            <option value="default">default</option>
                        </select>
                    </label>
                </div>

                <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 13 }}>
                        clientId:&nbsp;
                        <input
                            style={{ width: 160 }}
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="C-100"
                        />
                    </label>
                    <span style={{ fontSize: 12, opacity: 0.65, marginLeft: 8 }}>
            (ABAC в backend разрешает только <code>C-1xx</code>)
          </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 13 }}>
                        phone:&nbsp;
                        <input
                            style={{ width: 180 }}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+79001234567"
                        />
                    </label>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={emitContextChanged}>Emit context-changed</button>
                    <button onClick={emitCallbackIntent}>Emit callback-intent</button>
                    <button onClick={emitBoth}>
                        Emit both
                    </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                    correlationId: <code>{correlationId}</code>
                </div>
            </div>
        </div>
    );
}