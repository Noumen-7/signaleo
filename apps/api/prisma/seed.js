const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const MIN_PASSWORD_LENGTH = 12;

async function upsertStaff(email, password, displayName, role) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Mot de passe trop court pour ${email} (min ${MIN_PASSWORD_LENGTH})`);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.staffUser.upsert({
    where: { email },
    update: {
      passwordHash,
      displayName,
      role,
      totpSecret: null,
      active: true,
      failedAttempts: 0,
      lockedUntil: null,
    },
    create: { email, passwordHash, displayName, role, totpSecret: null, active: true },
  });
  console.log(`  ✔ ${role.padEnd(11)} ${email}`);
}

async function main() {
  console.log("Seed Signal'eo :");
  await upsertStaff('responsable@ecole.local', 'SignalEo2026!', 'Responsable vie scolaire', 'RESPONSABLE');
  await upsertStaff('nomena7nomcdi@gmail.com', 'azertyuiopqsdfghjklm', 'Nomena Mahefason', 'ADMIN');

  await prisma.staffUser.updateMany({
    where: { email: 'admin@ecole.local' },
    data: { active: false },
  });

  console.log('\nConnexion : e-mail + mot de passe (pas de 2FA).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
