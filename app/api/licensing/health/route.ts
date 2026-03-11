import { NextResponse } from "next/server";
import { fetchLicensingHealth } from "@/lib/licensing";

export const runtime = "nodejs";

export async function GET() {
  const health = await fetchLicensingHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
