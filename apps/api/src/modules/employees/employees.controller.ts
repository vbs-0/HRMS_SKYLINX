import { Body, Controller, Get, Param, Patch, Post, UseInterceptors, UploadedFile, Req } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateEmployeeDocumentDto, VerifyEmployeeDocumentDto } from "./dto/document.dto";
import { EmployeesService } from "./employees.service";
import { RequirePermissions } from "../../common/auth/permissions.decorator";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions("employees.read")
  list() {
    return this.employeesService.list();
  }

  @Get("documents")
  @RequirePermissions("employees.read")
  documents() {
    return this.employeesService.documents();
  }

  @Post()
  @RequirePermissions("employees.create")
  create(@Body() body: CreateEmployeeDto) {
    return this.employeesService.create(body);
  }

  @Post("bulk-upload")
  @RequirePermissions("employees.create")
  bulkUpload(@Body() body: unknown) {
    return this.employeesService.bulkUpload(body);
  }

  @Get(":id")
  @RequirePermissions("employees.read")
  detail(@Param("id") id: string) {
    return this.employeesService.detail(id);
  }

  @Patch(":id")
  @RequirePermissions("employees.update")
  update(@Param("id") id: string, @Body() body: UpdateEmployeeDto) {
    return this.employeesService.update(id, body);
  }

  @Post(":id/documents/upload")
  @RequirePermissions("employees.update")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    const host = req.get("host");
    const fileUrl = `${req.protocol}://${host}/uploads/${file.filename}`;
    return { fileUrl };
  }

  @Post(":id/documents")
  @RequirePermissions("employees.update")
  uploadDocument(@Param("id") id: string, @Body() body: CreateEmployeeDocumentDto) {
    return this.employeesService.uploadDocument(id, body);
  }

  @Patch(":id/documents/:documentId/verify")
  @RequirePermissions("employees.approve")
  verifyDocument(@Param("id") id: string, @Param("documentId") documentId: string, @Body() body: VerifyEmployeeDocumentDto) {
    return this.employeesService.verifyDocument(id, documentId, body);
  }
}
