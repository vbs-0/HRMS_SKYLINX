import { PrismaClient, ApprovalStatus } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const employeeId = "emp_1003";
  const attendanceLogId = "cmq7zfmgc009h75mwpafs3v6f"; // Existing log for Kabir Sethi

  // 1. Delete any existing pending regularization for this employee to prevent duplicates
  await prisma.attendanceRegularization.deleteMany({
    where: { employeeId, status: ApprovalStatus.PENDING }
  });

  // 2. Create pending regularization request
  const reg = await prisma.attendanceRegularization.create({
    data: {
      employeeId,
      attendanceLogId,
      requestedCheckInAt: new Date("2026-05-25T04:00:00.000Z"),
      requestedCheckOutAt: new Date("2026-05-25T13:00:00.000Z"),
      reason: "Biometric failure at entry gate",
      status: ApprovalStatus.PENDING,
    }
  });
  console.log("Created Regularization Request:", reg);

  // 3. Delete any existing pending overtime requests
  await prisma.overtimeRequest.deleteMany({
    where: { employeeId, status: ApprovalStatus.PENDING }
  });

  // 4. Create pending overtime request
  const ot = await prisma.overtimeRequest.create({
    data: {
      employeeId,
      attendanceLogId,
      hours: 2.5,
      reason: "Deploying critical patch to production",
      status: ApprovalStatus.PENDING,
    }
  });
  console.log("Created Overtime Request:", ot);

  await prisma.$disconnect();
}

main().catch(console.error);
