import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description ?? null,
        category: body.category,
        color: body.color,
        icon: body.icon,
        scheduleType: body.scheduleType,
        scheduleDays: body.scheduleDays ?? null,
        scheduleCount: body.scheduleCount != null ? Number(body.scheduleCount) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
