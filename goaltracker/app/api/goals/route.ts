import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: { createdAt: "asc" },
      include: { completions: true },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal = await prisma.goal.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        category: body.category ?? "General",
        color: body.color ?? "#6366f1",
        icon: body.icon ?? "target",
        scheduleType: body.scheduleType ?? "daily",
        scheduleDays: body.scheduleDays ?? null,
        scheduleCount: body.scheduleCount ? Number(body.scheduleCount) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isActive: true,
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
