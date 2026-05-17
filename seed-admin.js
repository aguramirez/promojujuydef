const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.upsert({
    where: { username: 'agustindev' },
    update: { password: 'saludosvarios588145' },
    create: {
      username: 'agustindev',
      password: 'saludosvarios588145'
    }
  });
  console.log('Admin seeded:', admin);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
