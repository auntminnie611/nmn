import { PrismaClient } from "@prisma/client";
import { format, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.completion.deleteMany();
  await prisma.goal.deleteMany();

  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        title: "Lift lower body",
        category: "Fitness",
        color: "#f59e0b",
        scheduleType: "times_per_week",
        scheduleCount: 2,
        description: "Squats, deadlifts, lunges",
      },
    }),
    prisma.goal.create({
      data: {
        title: "Lift upper body",
        category: "Fitness",
        color: "#f97316",
        scheduleType: "times_per_week",
        scheduleCount: 2,
        description: "Bench, rows, overhead press",
      },
    }),
    prisma.goal.create({
      data: {
        title: "10,000 steps",
        category: "Fitness",
        color: "#10b981",
        scheduleType: "daily",
        description: "Hit weekly step goal",
      },
    }),
    prisma.goal.create({
      data: {
        title: "Study session",
        category: "Study",
        color: "#6366f1",
        scheduleType: "times_per_week",
        scheduleCount: 5,
        description: "At least 1 hour of focused study",
      },
    }),
    prisma.goal.create({
      data: {
        title: "Vacuum",
        category: "Cleaning",
        color: "#10b981",
        scheduleType: "weekly_days",
        scheduleDays: "6",
        description: "Vacuum all rooms",
      },
    }),
    prisma.goal.create({
      data: {
        title: "Clean bathroom",
        category: "Cleaning",
        color: "#14b8a6",
        scheduleType: "times_per_month",
        scheduleCount: 2,
      },
    }),
  ]);

  // Add some completions for the past 2 weeks
  const today = new Date();
  const completionData = [];

  for (let i = 14; i >= 1; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");

    // Steps - most days
    if (Math.random() > 0.2) {
      completionData.push({ goalId: goals[2].id, date });
    }

    // Study - weekdays mostly
    const dayOfWeek = subDays(today, i).getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.3) {
      completionData.push({ goalId: goals[3].id, date });
    }

    // Lifting - 2x per week
    if (i % 3 === 0) completionData.push({ goalId: goals[0].id, date });
    if (i % 4 === 0) completionData.push({ goalId: goals[1].id, date });
  }

  // Vacuum last Saturday
  completionData.push({
    goalId: goals[4].id,
    date: format(subDays(today, today.getDay() === 0 ? 1 : today.getDay() + 1), "yyyy-MM-dd"),
  });

  for (const data of completionData) {
    await prisma.completion.upsert({
      where: { goalId_date: { goalId: data.goalId, date: data.date } },
      update: {},
      create: data,
    });
  }

  console.log("Seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
