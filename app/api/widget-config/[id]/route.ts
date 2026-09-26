import { NextRequest, NextResponse } from "next/server";
import { getWidget } from "@/lib/storage";
import { PublicWidgetConfig } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const config = await getWidget(id);
    if (!config) {
      return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }));
    }
    const pub: PublicWidgetConfig = {
      id:             config.id,
      botName:        config.botName,
      welcomeMessage: config.welcomeMessage,
      brandColor:     config.brandColor,
    };
    return withCors(NextResponse.json(pub));
  } catch (err) {
    console.error("GET /api/widget-config/[id]:", err);
    return withCors(NextResponse.json({ error: "Failed" }, { status: 500 }));
  }
}
