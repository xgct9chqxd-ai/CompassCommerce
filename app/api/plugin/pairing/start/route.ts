import { NextRequest, NextResponse } from "next/server";
import { beginDevicePairing, DevicePairingError } from "@/lib/device-pairing";

export const runtime = "nodejs";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidMachineHash(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
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

  const productId = readString(body.productId);
  const machineHash = readString(body.machineHash);
  const platform = readString(body.platform) || null;

  if (!productId || !isValidMachineHash(machineHash)) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "productId and a valid machineHash are required.",
      },
      { status: 400 },
    );
  }

  try {
    const session = await beginDevicePairing({
      productId,
      machineHash,
      platform,
    });

    return NextResponse.json(session, { status: 201 });
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
        error: "pairing_start_failed",
        message: error instanceof Error ? error.message : "Device pairing could not be started.",
      },
      { status: 500 },
    );
  }
}
