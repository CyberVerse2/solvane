import { NextResponse } from "next/server";
import { pingRpc } from "@/lib/stellar";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await pingRpc();
  return NextResponse.json(health);
}
