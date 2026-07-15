import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

let prisma: PrismaClient;

function getClient() {
    if (!prisma) {
        prisma = new PrismaClient({ adapter });
        return prisma;
    }

    return prisma;
}

export default getClient();