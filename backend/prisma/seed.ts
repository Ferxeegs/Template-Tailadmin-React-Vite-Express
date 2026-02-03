import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  console.log('Sedang melakukan seeding superadmin user...');

  // Cek apakah superadmin user sudah ada
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@rusunawa.com' },
        { username: 'superadmin' },
      ],
    },
  });

  if (!existingSuperAdmin) {
    // Hash password untuk superadmin
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const adminEmail = process.env.SEEDER_ADMIN_EMAIL || 'admin@rusunawa.com';
    const adminPassword = process.env.SEEDER_ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.SEEDER_ADMIN_USERNAME || 'superadmin';
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Buat superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        firstname: 'Super',
        lastname: 'Admin',
        fullname: 'Super Admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Ambil role superadmin
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'superadmin' },
    });

    if (superAdminRole) {
      // Assign role superadmin ke user
      await prisma.userRole.create({
        data: {
          user_id: superAdmin.id,
          role_id: superAdminRole.id,
        },
      });
      const adminEmail = process.env.SEEDER_ADMIN_EMAIL || 'admin@rusunawa.com';
      const adminPassword = process.env.SEEDER_ADMIN_PASSWORD || 'admin123';
      console.log('Superadmin user berhasil dibuat dengan role superadmin');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Warning: Role superadmin tidak ditemukan, user dibuat tanpa role');
    }
  } else {
    console.log('Superadmin user sudah ada, dilewati');
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