import { NextRequest, NextResponse } from "next/server";
import { DevicePairingError, pollDevicePairing } from "@/lib/device-pairing";

export const runtime = "nodejs";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const requestId = readString(body.requestId);
  const pollToken = readString(body.pollToken);
  if (!requestId || !pollToken) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "requestId and pollToken are required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await pollDevicePairing({ requestId, pollToken });
    return NextResponse.json(result, {
      status: result.status === "expired" ? 410 : 200,
    });
  } catch (error) {
    if (error instanceof DevicePairingError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "pairing_status_failed",
        message:
          error instanceof Error
            ? error.message
            : "Device activation status could not be loaded.",
      },
      { status: 500 },
    );
  }
}
