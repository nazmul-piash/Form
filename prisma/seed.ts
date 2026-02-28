import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
    },
  });

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // Create Client
  const client = await prisma.user.create({
    data: {
      email: 'client@acme.com',
      role: 'CLIENT',
      organizationId: org.id,
    },
  });

  // Create a sample form with multiple insurance items
  const form = await prisma.form.create({
    data: {
      clientName: 'John Doe',
      email: 'client@acme.com',
      status: 'Draft',
      organizationId: org.id,
      createdById: client.id,
    },
  });

  await prisma.insuranceItem.create({
    data: {
      formId: form.id,
      insuranceType: 'Private Liability Insurance',
      package: 'Comfort',
      requestType: 'New Policy',
      effectiveDate: new Date(),
      duration: '1 year',
      price: '150',
    },
  });

  await prisma.insuranceItem.create({
    data: {
      formId: form.id,
      insuranceType: 'Legal Protection Insurance',
      package: 'Premium',
      requestType: 'Upgrade',
      currentPolicyNumber: 'POL-12345',
      effectiveDate: new Date(),
      duration: '1 year',
      price: '200',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
