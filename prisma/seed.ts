import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear o actualizar el usuario admin
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {}, // Si existe, no hace nada
    create: {
      username: 'admin',
      password: '123123', // ⚠️ En producción esto debe estar encriptado (hash)
    },
  })

  const configCount = await prisma.businessConfig.count();
  if (configCount === 0) {
    await prisma.businessConfig.create({
      data: {
        startHour: 9,
        endHour: 18,
        interval: 30
      }
    });
    console.log('⚙️ Configuración inicial creada');
  }

  console.log('🌱 Base de datos sembrada correctamente')
  console.log({ admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })