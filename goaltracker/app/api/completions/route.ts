import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const goalId = searchParams.get("goalId");

    const where: Record<string, unknown> = {};
    if (goalId) where.goalId = goalId;
    if (from || to) {
      where.date = {} as Record<string, string>;
      if (from) (where.date as Record<string, string>).gte = from;
      if (to) (where.date as Record<string, string>).lte = to;
    }

    const completions = await prisma.completion.findMany({
      where,
      orderBy: { date: "desc" },
      include: { goal: true },
    });
    return NextResponse.json(completions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch completions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const completion = await prisma.completion.upsert({
      where: { goalId_date: { goalId: body.goalId, date: body.date } },
      update: { note: body.note ?? null },
      create: {
        goalId: body.goalId,
        date: body.date,
        note: body.note ?? null,
      },
    });
    return NextResponse.json(completion);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create completion" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    await prisma.completion.deleteMany({
      where: { goalId: body.goalId, date: body.date },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete completion" }, { status: 500 });
  }
}
