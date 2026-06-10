import { PrismaClient } from "@prisma/client";

async function run() {
  const defaultUrl = "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: defaultUrl,
      },
    },
  });

  try {
    console.log("Checking if database 'skylinx_peopleos' exists...");
    const dbs = await prisma.$queryRaw<Array<{ datname: string }>>`SELECT datname FROM pg_database WHERE datname = 'skylinx_peopleos'`;
    
    if (dbs.length === 0) {
      console.log("Database 'skylinx_peopleos' does not exist. Creating it...");
      await prisma.$executeRawUnsafe("CREATE DATABASE skylinx_peopleos");
      console.log("Database 'skylinx_peopleos' created successfully!");
    } else {
      console.log("Database 'skylinx_peopleos' already exists.");
    }
  } catch (err: any) {
    console.error("Error checking/creating database:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
