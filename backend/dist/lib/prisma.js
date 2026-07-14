import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
console.log("from prism", process.env.DATABASE_URL);
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});
export default prisma;
//# sourceMappingURL=prisma.js.map