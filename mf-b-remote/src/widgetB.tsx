import React, { useEffect, useMemo, useState } from "react";

type ContextChangedDetail = {
    correlationId?: string;
    source?: string;
    payload?: {
        filter?: string;
        reloadToken?: number;
    };
};

type CallbackIntentDetail = {
    correlationId?: string;
    source?: string;
    clientId?: string;
    phone?: string;
};

type ApiResponse = {
    filter: string;
    serverTime: string;
    items: Array<{ id: number; text: string }>;
};

type CapabilityIssueResponse = {
    capability: string;
    expiresInSec: number;
};

type CallbackActionResponse = {
    status: string;
    callId: string;
};

export function WidgetB() {
    // --- existing demo (re-render / reload) ---
    const [filter, setFilter] = useState("vip");
    const [reloadToken, setReloadToken] = useState<number>(() => Date.now());
    const [data, setData] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- new demo (capability-protected action) ---
    const [role, setRole] = useState<"OPERATOR" | "TRAINEE">("OPERATOR");
    const [intent, setIntent] = useState<{ clientId: string; phone: string } | null>(null);
    const [capability, setCapability] = useState<string | null>(null);
    const [capExpiresIn, setCapExpiresIn] = useState<number | null>(null);
    const [actionStatus, setActionStatus] = useState<string>("idle");
    const [actionError, setActionError] = useState<string | null>(null);
    const [lastCallId, setLastCallId] = useState<string | null>(null);

    const backendBase = "http://localhost:8080";

    const commonHeaders = useMemo(() => {
        // В MVP мы имитируем SSO/Tyk заголовками.
        // В реале это будет access token + gateway claims.
        return {
            "Content-Type": "application/json",
            "X-User-Id": "operator-1",
            "X-Role": role
        } as const;
    }, [role]);

    // 1) слушаем CustomEvent для "простого" сценария (перерисовка/перезагрузка)
    useEffect(() => {
        const handler = (event: Event) => {
            const e = event as CustomEvent<ContextChangedDetail>;
            const payload = e.detail?.payload;

            setFilter(payload?.filter ?? "default");
            setReloadToken(payload?.reloadToken ?? Date.now());
        };

        window.addEventListener("crm:context-changed", handler);
        return () => window.removeEventListener("crm:context-changed", handler);
    }, []);

    // 2) делаем fetch по сигналу (filter/reloadToken)
    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                setError(null);

                const url = `${backendBase}/api/data?filter=${encodeURIComponent(filter)}`;
                const resp = await fetch(url, { signal: controller.signal });

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const json = (await resp.json()) as ApiResponse;
                setData(json);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                setError(String(err?.message ?? err));
                setData(null);
            }
        })();

        return () => controller.abort();
    }, [backendBase, filter, reloadToken]);

    // 3) слушаем CustomEvent для "опасного" действия (intent)
    useEffect(() => {
        const handler = (event: Event) => {
            const e = event as CustomEvent<CallbackIntentDetail>;
            const d = e.detail;

            // CustomEvent = недоверенный вход: минимальная проверка формы
            if (!d?.clientId || !d?.phone) return;

            setIntent({ clientId: d.clientId, phone: d.phone });

            // сбрасываем старые результаты
            setCapability(null);
            setCapExpiresIn(null);
            setLastCallId(null);
            setActionError(null);
            setActionStatus("intent-received");
        };

        window.addEventListener("crm:callback:intent", handler);
        return () => window.removeEventListener("crm:callback:intent", handler);
    }, []);

    async function requestCapability() {
        if (!intent) return;

        setActionStatus("requesting-capability");
        setActionError(null);

        try {
            const resp = await fetch(`${backendBase}/api/capabilities`, {
                method: "POST",
                headers: commonHeaders,
                body: JSON.stringify({
                    eventType: "crm:callback",
                    clientId: intent.clientId,
                    phone: intent.phone,
                    sourceMf: "mf-b"
                })
            });

            const json = (await resp.json()) as any;

            if (!resp.ok) {
                throw new Error(`${json.reasonCode ?? "ERROR"}: ${json.message ?? "Unknown error"}`);
            }

            const ok = json as CapabilityIssueResponse;
            setCapability(ok.capability);
            setCapExpiresIn(ok.expiresInSec);
            setActionStatus("capability-issued");
        } catch (e: any) {
            setActionError(String(e?.message ?? e));
            setActionStatus("error");
        }
    }

    async function performCallback(override?: { clientId?: string; phone?: string; capability?: string }) {
        if (!intent) return;
        const cap = override?.capability ?? capability;
        if (!cap) return;

        const clientId = override?.clientId ?? intent.clientId;
        const phone = override?.phone ?? intent.phone;

        setActionStatus("calling");
        setActionError(null);

        try {
            const resp = await fetch(`${backendBase}/api/actions/callback`, {
                method: "POST",
                headers: commonHeaders,
                body: JSON.stringify({
                    capability: cap,
                    clientId,
                    phone
                })
            });

            const json = (await resp.json()) as any;

            if (!resp.ok) {
                throw new Error(`${json.reasonCode ?? "ERROR"}: ${json.message ?? "Unknown error"}`);
            }

            const ok = json as CallbackActionResponse;
            setLastCallId(ok.callId);
            setActionStatus(`CALL OK: ${ok.callId}`);
        } catch (e: any) {
            setActionError(String(e?.message ?? e));
            setActionStatus("error");
        }
    }

    // Для тестов "эксплойта" прямо кнопками:
    function testPayloadMismatch() {
        // Подмена телефона при выполнении с валидной capability
        performCallback({ phone: "+70000000000" });
    }

    function testReplay() {
        // Два раза выполнить одним и тем же capability
        if (!capability) return;
        performCallback().then(() => performCallback()); // второй вызов должен дать CAPABILITY_REPLAY
    }

    return (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
            <h3>Microfrontend B</h3>

            {/* --- block 1: simple reload demo --- */}
            <div style={{ fontSize: 13 }}>
                Listening: <code>crm:context-changed</code>
            </div>
            <div style={{ marginTop: 6 }}>
                Current filter: <b>{filter}</b>
            </div>

            {error && (
                <p style={{ color: "crimson" }}>
                    Error: {error} <br />
                    Проверь, что backend на 8080 запущен и CORS разрешён.
                </p>
            )}

            {!data && !error && <p>Loading...</p>}

            {data && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>serverTime: {data.serverTime}</div>
                    <ul>
                        {data.items.map((i) => (
                            <li key={i.id}>{i.text}</li>
                        ))}
                    </ul>
                </div>
            )}

            <hr style={{ margin: "14px 0" }} />

            {/* --- block 2: capability-protected action demo --- */}
            <div style={{ fontSize: 13 }}>
                Listening: <code>crm:callback:intent</code> (capability protected action)
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 13 }}>
                    Role:&nbsp;
                    <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="TRAINEE">TRAINEE</option>
                    </select>
                </label>

                <span style={{ fontSize: 12, opacity: 0.75 }}>
          (в MVP имитируем SSO/Tyk заголовком <code>X-Role</code>)
        </span>
            </div>

            {!intent && <div style={{ marginTop: 8 }}>Ждём intent (можно подделать из консоли) …</div>}

            {intent && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13 }}>
                        <b>Intent</b>: clientId=<code>{intent.clientId}</code>, phone=<code>{intent.phone}</code>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={requestCapability} disabled={actionStatus === "requesting-capability" || actionStatus === "calling"}>
                            Request capability
                        </button>

                        <button
                            onClick={() => performCallback()}
                            disabled={!capability || actionStatus === "calling" || actionStatus === "requesting-capability"}
                        >
                            Perform callback
                        </button>

                        <button onClick={testPayloadMismatch} disabled={!capability}>
                            Test: payload mismatch
                        </button>

                        <button onClick={testReplay} disabled={!capability}>
                            Test: replay
                        </button>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                        Capability: {capability ? <code>{capability}</code> : <i>none</i>}
                        {capExpiresIn != null && <> (expiresInSec={capExpiresIn})</>}
                    </div>

                    <div style={{ marginTop: 6 }}>
                        <b>Status:</b> {actionStatus}
                    </div>

                    {lastCallId && (
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                            lastCallId: <code>{lastCallId}</code>
                        </div>
                    )}

                    {actionError && (
                        <div style={{ marginTop: 8, color: "crimson" }}>
                            {actionError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}