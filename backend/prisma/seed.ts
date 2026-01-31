import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sedang melakukan seeding roles...');

  const roles = [
    { name: 'superadmin', guard_name: 'web' },
    { name: 'operator', guard_name: 'web' },
    { name: 'supervisor', guard_name: 'web' },
    { name: 'mahasiswa', guard_name: 'web' },
  ];

  for (const role of roles) {
    // Cek apakah role sudah ada berdasarkan name
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name },
    });

    if (!existingRole) {
      // Jika belum ada, create
      await prisma.role.create({
        data: role,
      });
      console.log(`Role "${role.name}" berhasil dibuat`);
    } else {
      console.log(`Role "${role.name}" sudah ada, dilewati`);
    }
  }

  console.log('Sedang melakukan seeding permissions...');

  // Permissions untuk User model
  const userPermissions = [
    'view_user',
    'view_any_user',
    'create_user',
    'update_user',
    'delete_user',
    'delete_any_user',
    'restore_user',
    'restore_any_user',
    'force_delete_user',
    'force_delete_any_user',
  ];

  // Permissions untuk Role model
  const rolePermissions = [
    'view_role',
    'view_any_role',
    'create_role',
    'update_role',
    'delete_role',
    'delete_any_role',
  ];

  const allPermissions = [
    ...userPermissions.map((name) => ({ name, guard_name: 'web' })),
    ...rolePermissions.map((name) => ({ name, guard_name: 'web' })),
  ];

  for (const permission of allPermissions) {
    // Cek apakah permission sudah ada berdasarkan name
    const existingPermission = await prisma.permission.findFirst({
      where: { name: permission.name },
    });

    if (!existingPermission) {
      // Jika belum ada, create
      await prisma.permission.create({
        data: permission,
      });
      console.log(`Permission "${permission.name}" berhasil dibuat`);
    } else {
      console.log(`Permission "${permission.name}" sudah ada, dilewati`);
    }
  }

  console.log('Seeding selesai!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });