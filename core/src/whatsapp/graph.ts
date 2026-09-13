/** Meta Graph version used by the sandbox Cloud API client. */
export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Just enough of `fetch` to POST JSON. `typeof fetch` also demands preconnect. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type GraphResult = {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
};

export async function graphRequest(
  token: string,
  path: string,
  init: RequestInit = {},
  fetchFn: FetchLike = fetch,
): Promise<GraphResult> {
  const res = await fetchFn(`${GRAPH_BASE}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body: unknown = await res.json().catch(() => null);
  const err =
    body && typeof body === "object" && "error" in body
      ? String((body as { error?: { message?: string } }).error?.message ?? "")
      : "";
  return { ok: res.ok, status: res.status, body, error: err || undefined };
}
