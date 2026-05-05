/** Sesión de depuración del agente (sin PII: solo hashes y longitudes). */

const AGENT_ENDPOINT =
  "http://127.0.0.1:7372/ingest/e4602b70-4a74-459a-902b-0df6473208d3";
const DEBUG_SESSION_ID = "7b6477";

export function beneficiaryFieldProbe(
  datos: Record<string, unknown> | undefined,
): { len: number; h: number | null } {
  const v = datos?.nombres_apellidos_beneficiario;
  if (typeof v !== "string") {
    return { len: -1, h: null };
  }
  let h = 0;
  for (let i = 0; i < v.length; i++) {
    h = ((h << 5) - h + v.charCodeAt(i)) | 0;
  }
  return { len: v.length, h };
}

export function idSuffix(id: string): string {
  return id.length <= 10 ? id : id.slice(-10);
}

// #region agent log
export function agentSessionLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  const body = {
    sessionId: DEBUG_SESSION_ID,
    timestamp: Date.now(),
    ...payload,
    data: payload.data ?? {},
  };
  console.debug("[dbg-session-7b6477]", body);
  void fetch(AGENT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}
// #endregion
