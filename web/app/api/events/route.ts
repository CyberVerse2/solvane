import { NextRequest, NextResponse } from "next/server";
import { getWalletEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ events: [] });
  const events = await getWalletEvents(wallet);
  return NextResponse.json({ events });
}
