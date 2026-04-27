import { NextResponse } from "next/server";

/** Standard error shape returned by all API routes */
export type ApiError = { error: string };

/** Generic API response — either data or an error */
export type ApiResponse<T> = T | ApiError;

/** Type guard: true if response is an error */
export function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  return typeof res === "object" && res !== null && "error" in res;
}

/** Shorthand for NextResponse.json error responses */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message } satisfies ApiError, { status });
}
