import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export function requestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function ok<T>(data: T, status = 200, id?: string) {
  return NextResponse.json({ data, requestId: id }, {
    status,
    headers: { "Cache-Control": "private, no-store", ...(id ? { "x-request-id": id } : {}) },
  });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  id: string,
  fields?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}), requestId: id } },
    { status, headers: { "Cache-Control": "private, no-store", "x-request-id": id } },
  );
}

export function methodNotAllowed(id: string) {
  return fail("NOT_FOUND", "Endpoint not found.", 404, id);
}
