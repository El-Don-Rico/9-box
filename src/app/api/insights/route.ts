import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

const client = new Anthropic();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { question, conversationHistory } = await request.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  // Fetch assessment data for this manager's team
  const latestCycle = await prisma.assessmentCycle.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  if (!latestCycle) {
    return NextResponse.json({ error: "No assessment cycles found" }, { status: 404 });
  }

  const assessments = await prisma.managerAssessment.findMany({
    where: { managerId: session.user.id, cycleId: latestCycle.id, submittedAt: { not: null } },
    include: {
      employee: { select: { id: true, name: true, jobTitle: true, team: true, role: true } },
    },
  });

  const selfAssessments = await prisma.selfAssessment.findMany({
    where: {
      cycleId: latestCycle.id,
      employeeId: { in: assessments.map((a) => a.employeeId) },
      submittedAt: { not: null },
    },
  });

  const selfMap = new Map(selfAssessments.map((s) => [s.employeeId, s]));

  // Build structured data summary for Claude
  const teamData = assessments.map((a) => {
    const self = selfMap.get(a.employeeId);
    const valuesAlignment =
      a.valCustomerFirst && a.valStepIntoArena && a.valFlockToProblems && a.valGiveEnergy
        ? Math.round(((a.valCustomerFirst + a.valStepIntoArena + a.valFlockToProblems + a.valGiveEnergy) / 4) * 10) / 10
        : null;
    const talentDensity = a.performance && a.potential ? a.performance * a.potential : null;
    const culturalMomentum = valuesAlignment && a.engagement ? Math.round(valuesAlignment * a.engagement * 10) / 10 : null;

    return {
      name: a.employee.name,
      jobTitle: a.employee.jobTitle,
      team: a.employee.team,
      role: a.employee.role,
      managerAssessment: {
        performance: a.performance,
        performanceEvidence: a.performanceEvidence,
        potential: a.potential,
        potentialEvidence: a.potentialEvidence,
        valuesAlignment,
        valCustomerFirst: a.valCustomerFirst,
        valStepIntoArena: a.valStepIntoArena,
        valFlockToProblems: a.valFlockToProblems,
        valGiveEnergy: a.valGiveEnergy,
        valuesEvidence: a.valuesEvidence,
        engagement: a.engagement,
        engagementEvidence: a.engagementEvidence,
        trend: a.trend,
        notes: a.notes,
      },
      scores: { talentDensity, culturalMomentum },
      selfAssessment: self
        ? {
            performance: self.performance,
            performanceJustification: self.performanceJustification,
            achievements: self.achievements,
            blockers: self.blockers,
            learning: self.learning,
            engagement: self.engagement,
            engagementDriver: self.engagementDriver,
            supportNeeded: self.supportNeeded,
            goalsNextMonth: self.goalsNextMonth,
          }
        : null,
    };
  });

  const cycleName = `${new Date(0, latestCycle.month - 1).toLocaleString("en", { month: "long" })} ${latestCycle.year}`;

  const systemPrompt = `You are a people analytics assistant for Visory Performance, a 9-box performance management platform. You help managers analyze their team's assessment data and provide actionable insights.

## Context
- Assessment cycle: ${cycleName} (${latestCycle.status})
- Manager: ${session.user.name}
- Team size: ${teamData.length} direct reports with submitted assessments

## Scoring System
- Performance, Potential, Engagement: rated 1-3 (1=Low, 2=Medium, 3=High)
- Values (Customer First, Step Into Arena, Flock To Problems, Give Energy): rated 1-3 each
- Values Alignment: average of the 4 values scores
- Talent Density: Performance x Potential (out of 9, target >= 6)
- Cultural Momentum: Values Alignment x Engagement (out of 9, target >= 6)
- Trend: IMPROVING, STABLE, or DECLINING

## 9-Box Grid
Box 1 (Talent Density): Performance on X-axis, Potential on Y-axis
Box 2 (Cultural Momentum): Values Alignment on X-axis, Engagement on Y-axis

## Team Data
${JSON.stringify(teamData, null, 2)}

## Guidelines
- Be specific, reference team members by name
- Provide actionable recommendations
- Flag risks (low engagement, declining trends, low cultural momentum)
- Highlight strengths and development opportunities
- When discussing scores, explain what they mean in practical terms
- Keep responses concise but thorough
- Format responses with markdown for readability`;

  // Build messages array from conversation history
  const messages: Anthropic.MessageParam[] = [];
  if (conversationHistory?.length) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: "user", content: question });

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "AI service not configured. Set ANTHROPIC_API_KEY." }, { status: 503 });
    } else if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "AI service rate limited. Try again shortly." }, { status: 429 });
    } else if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `AI service error: ${error.message}` }, { status: 502 });
    }
    throw error;
  }
}
