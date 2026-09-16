/**
 * One-off: switch the live DB affiliate tag to the user's real tag (wigwise-20).
 * (The seed default was updated too; this updates the running site immediately.)
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const updated = await db.setting.update({
    where: { key: 'amazon_affiliate_tag' },
    data: { value: 'wigwise-20' },
  })
  console.log('affiliate tag now:', updated.value)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
