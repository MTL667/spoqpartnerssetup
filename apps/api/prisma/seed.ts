import { PrismaClient, UserRole, IntegrationType, ContractType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  { email: 'admin@spoq.nl', password: 'Admin123!', role: UserRole.ADMIN },
  { email: 'sarah@spoq.nl', password: 'Sarah123!', role: UserRole.BDM },
  { email: 'tom@spoq.nl', password: 'Tom123!', role: UserRole.IT },
  { email: 'lisa@spoq.nl', password: 'Lisa123!', role: UserRole.MARKETING },
  { email: 'pieter@spoq.nl', password: 'Pieter123!', role: UserRole.SALES },
  { email: 'marc@techflow.be', password: 'Marc123!', role: UserRole.PARTNER, partnerId: 'partner-techflow' },
];

const INTEGRATION_TYPES = [IntegrationType.FORMS_ERP, IntegrationType.PARTNER_PORTAL, IntegrationType.API_INTEGRATION];
const CONTRACT_TYPES = [ContractType.EXPERT_PARTNER, ContractType.SOFTWARE_PARTNER];

async function main() {
  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        locale: 'nl',
        partnerId: user.partnerId ?? null,
      },
    });
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }

  for (const intType of INTEGRATION_TYPES) {
    for (const contType of CONTRACT_TYPES) {
      const existing = await prisma.template.findFirst({
        where: { integrationType: intType, contractType: contType },
      });
      if (!existing) {
        await prisma.template.create({
          data: {
            integrationType: intType,
            contractType: contType,
            version: 1,
            active: true,
          },
        });
        console.log(`Seeded template: ${intType} / ${contType} v1`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
