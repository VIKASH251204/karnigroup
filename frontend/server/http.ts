export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const forbidden = (message = "Forbidden") => new HttpError(403, message);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message);

export const ok = (data: unknown, status = 200) => Response.json(data, { status });

export async function readJson<T = Record<string, any>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw badRequest("Invalid JSON body");
  }
}

export function intParam(url: URL, name: string, fallback = 0): number {
  const n = parseInt(url.searchParams.get(name) ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function strParam(url: URL, name: string): string | null {
  const v = url.searchParams.get(name);
  return v && v.trim() ? v.trim() : null;
}

export function paging(url: URL) {
  const page = Math.max(1, intParam(url, "page", 1));
  const pageSize = Math.min(500, Math.max(1, intParam(url, "pageSize", 20)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** Parses a date query param; date-only `to` values are treated as end of that day. */
export function dateRange(url: URL) {
  const year = new Date().getUTCFullYear();
  const parse = (v: string | null, endOfDay: boolean) => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v)) d.setUTCHours(23, 59, 59, 999);
    return d;
  };
  const from = parse(url.searchParams.get("from"), false) ?? new Date(Date.UTC(year, 0, 1));
  const to = parse(url.searchParams.get("to"), true) ?? new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  return { from, to };
}

export function toDate(v: unknown, field: string): Date {
  const d = new Date(String(v ?? ""));
  if (isNaN(d.getTime())) throw badRequest(`Invalid ${field}`);
  return d;
}

export const trimOrNull = (v: unknown) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
