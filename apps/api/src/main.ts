import "reflect-metadata";
import helmet from "helmet";
import * as express from "express";
import * as path from "path";
import * as fs from "fs";
import { json, urlencoded } from "express";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use((req: any, res: any, next: any) => {
    console.log(`[API REQUEST] ${req.method} ${req.url} - Auth Header: ${req.headers.authorization ? "Present" : "Missing"}`);
    res.on("finish", () => {
      console.log(`[API RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });
    next();
  });
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));
  app.enableCors({ origin: true, credentials: true });

  // Serve static files from apps/api/uploads
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("SKYLINX PeopleOS API")
    .setDescription("HRMS, payroll, attendance, leave, ATS and admin APIs")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 4000, "0.0.0.0");
}

bootstrap();
