import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { listWidgets, saveWidget } from "@/lib/storage";
import { WidgetConfig } from "@/lib/types";

export async function GET() {
  try {
    const widgets = await listWidgets();
    return NextResponse.json(widgets);
  } catch (err) {
    console.error("GET /api/widgets:", err);
    return NextResponse.json({ error: "Failed to load widgets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { botName, welcomeMessage, brandColor, knowledgeBase } = await req.json();
    if (!botName || !welcomeMessage || !brandColor || !knowledgeBase) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const config: WidgetConfig = {
      id: uuidv4(),
      botName: botName.trim(),
      welcomeMessage: welcomeMessage.trim(),
      brandColor: brandColor.trim(),
      knowledgeBase: knowledgeBase.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await saveWidget(config);
    return NextResponse.json(config, { status: 201 });
  } catch (err) {
    console.error("POST /api/widgets:", err);
    return NextResponse.json({ error: "Failed to create widget" }, { status: 500 });
  }
}
