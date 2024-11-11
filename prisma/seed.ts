import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create initial data
  await prisma.folder.create({
    data: {
      name: "root",
      children: {
        create: [
          {
            name: "getting-started",
            articles: {
              create: [
                {
                  title: "Welcome",
                  content: "Welcome to the wiki!",
                  path: "getting-started/welcome",
                  metadata: {},
                },
              ],
            },
          },
        ],
      },
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
