import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const interviewId = "cmq8fuauj000kpeu50ii821oi";
  const interviewerEmployeeId = "emp_1003";

  // Create feedback
  const feedback = await prisma.interviewFeedback.upsert({
    where: {
      interviewId_interviewerEmployeeId: {
        interviewId,
        interviewerEmployeeId,
      },
    },
    update: {
      rating: 4,
      comments: "Solid frontend engineering background, good depth in TS/JS.",
      recommendation: "HIRE",
    },
    create: {
      interviewId,
      interviewerEmployeeId,
      rating: 4,
      comments: "Solid frontend engineering background, good depth in TS/JS.",
      recommendation: "HIRE",
    },
  });

  console.log("Feedback created:", feedback);

  // Retrieve all feedbacks
  const allFeedbacks = await prisma.interviewFeedback.findMany({
    where: { interviewId },
  });

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { interviewers: true },
  });

  if (interview && allFeedbacks.length === interview.interviewers.length) {
    const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = Math.round((totalRating / allFeedbacks.length) * 10) / 10;
    const rejects = allFeedbacks.filter((f) => f.recommendation === "REJECT");
    const hires = allFeedbacks.filter((f) => f.recommendation === "HIRE");

    let finalFeedback = "Consensus: ";
    if (rejects.length > 0) {
      finalFeedback += `REJECT (${rejects.length} reject votes)`;
    } else if (hires.length === allFeedbacks.length) {
      finalFeedback += "HIRE (Unanimous)";
    } else {
      finalFeedback += "HOLD (Mixed reviews)";
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        feedback: `${finalFeedback}. Avg Rating: ${avgRating}/5. Comments: ${allFeedbacks.map((f) => f.comments).filter(Boolean).join(" | ")}`,
      },
    });

    console.log("Interview updated:", updatedInterview);

    if (interview.roundId) {
      const updatedRound = await prisma.interviewRound.update({
        where: { id: interview.roundId },
        data: { status: "COMPLETED" },
      });
      console.log("Round updated:", updatedRound);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
