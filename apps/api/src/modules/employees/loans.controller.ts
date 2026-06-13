import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("employees/loans")
export class LoansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("list/all")
  @RequirePermissions("employees.read")
  async getAllLoans() {
    return this.prisma.employeeLoan.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post()
  @RequirePermissions("employees.update")
  async createLoan(
    @Body()
    body: {
      employeeId: string;
      principal: number;
      interestRate: number;
      totalPayable: number;
      emiAmount: number;
      repaymentStart: string;
    }
  ) {
    return this.prisma.employeeLoan.create({
      data: {
        employeeId: body.employeeId,
        principal: body.principal,
        interestRate: body.interestRate,
        totalPayable: body.totalPayable,
        emiAmount: body.emiAmount,
        balanceAmount: body.totalPayable,
        repaymentStart: new Date(body.repaymentStart),
      },
    });
  }

  @Patch(":id/decide")
  @RequirePermissions("employees.approve")
  async decideLoan(
    @Param("id") id: string,
    @Body() body: { status: "APPROVED" | "REJECTED" }
  ) {
    return this.prisma.employeeLoan.update({
      where: { id },
      data: { status: body.status },
    });
  }
}
