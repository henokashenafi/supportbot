import { NextRequest, NextResponse } from "next/server";
import { getWidget, saveWidget, deleteWidget } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const config = await getWidget(id);
    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (err) {
    console.error("GET /api/widgets/[id]:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await getWidget(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { botName, welcomeMessage, brandColor, knowledgeBase } = await req.json();
    if (!botName || !welcomeMessage || !brandColor || !knowledgeBase) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const updated = {
      ...existing,
      botName: botName.trim(),
      welcomeMessage: welcomeMessage.trim(),
      brandColor: brandColor.trim(),
      knowledgeBase: knowledgeBase.trim(),
      updatedAt: new Date().toISOString(),
    };
    await saveWidget(updated);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/widgets/[id]:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await deleteWidget(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/widgets/[id]:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
