import 'dotenv/config'
import prisma from '../src/lib/prisma'

async function main() {
  const result = await prisma.organizationRole.updateMany({
    where: { name: 'Admin' },
    data: {
      canCreateNote: true,
      canEditNote: true,
      canDeleteNote: true,
      canManageFinance: true,
      canViewFinance: true
    }
  })
  console.log(`Updated ${result.count} Admin roles with missing permissions.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
