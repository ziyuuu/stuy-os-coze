/**
 * Validation helpers — API route 请求解析 wrapper
 *
 * Usage:
 *   const parsed = await parseBody(request, SomeSchema);
 *   if (!parsed.success) return parsed.errorResponse;
 *   const { data } = parsed;
 */
import { NextResponse } from "next/server";
import type { ZodSchema, ZodError } from "zod";

export interface ParseSuccess<T> {
  success: true;
  data: T;
}

export interface ParseFailure {
  success: false;
  errorResponse: ReturnType<typeof NextResponse.json>;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function formatZodError(error: ZodError): string {
  return error.issues
    .map((i) => {
      const path = i.path.join(".");
      return path ? `${path}: ${i.message}` : i.message;
    })
    .join("; ");
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { success: false, error: formatZodError(result.error) },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}
