import { NextRequest, NextResponse } from "next/server";
import { forwardPublicLicensingRequest } from "@/lib/licensing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const result = await forwardPublicLicensingRequest("/v1/refresh", payload);
  return NextResponse.json(result.body, { status: result.status });
}
