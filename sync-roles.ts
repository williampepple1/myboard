import prisma from './src/lib/prisma'

async function main() {
  await prisma.organizationRole.updateMany({
    where: { name: 'Admin' },
    data: { canEditNote: true },
  })
  await prisma.organizationRole.updateMany({
    where: { name: 'Member' },
    data: { canEditNote: true },
  })
  console.log('Roles updated successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
