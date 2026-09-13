import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

async function main() {
  // 1) Permissions
  const permissionKeys = Object.values(PERMISSIONS);
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, group: key.split(".")[0] },
    });
  }

  // 2) Roles
  const superAdminRole = await prisma.role.upsert({
    where: { key: "SUPER_ADMIN" },
    update: {},
    create: { key: "SUPER_ADMIN", name: "مدیر کل", isSystem: true },
  });

  const customerRole = await prisma.role.upsert({
    where: { key: "CUSTOMER" },
    update: {},
    create: { key: "CUSTOMER", name: "مشتری", isSystem: true },
  });

  const supportAgentRole = await prisma.role.upsert({
    where: { key: "SUPPORT_AGENT" },
    update: {},
    create: { key: "SUPPORT_AGENT", name: "پشتیبان" },
  });

  const orderManagerRole = await prisma.role.upsert({
    where: { key: "ORDER_MANAGER" },
    update: {},
    create: { key: "ORDER_MANAGER", name: "مدیر سفارش‌ها" },
  });

  const productManagerRole = await prisma.role.upsert({
    where: { key: "PRODUCT_MANAGER" },
    update: {},
    create: { key: "PRODUCT_MANAGER", name: "مدیر محصولات" },
  });

  // Super Admin gets every permission
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  // نقش‌های محدودتر — هر کدام فقط دسترسی مربوط به حوزه‌ی خودشان
  const grant = async (roleId: string, keys: string[]) => {
    for (const key of keys) {
      const permission = allPermissions.find((p) => p.key === key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id },
      });
    }
  };

  await grant(supportAgentRole.id, [PERMISSIONS.SUPPORT_READ, PERMISSIONS.SUPPORT_REPLY]);
  await grant(orderManagerRole.id, [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.USERS_READ]);
  await grant(productManagerRole.id, [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.BRANDS_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
  ]);

  // 3) Demo admin user — رمز عبور را بلافاصله بعد از اولین ورود در Production تغییر دهید
  const passwordHash = await bcrypt.hash("Leilamond@Admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@leilamond.test" },
    update: {},
    create: {
      email: "admin@leilamond.test",
      passwordHash,
      firstName: "مدیر",
      lastName: "لیلاموند",
      roleId: superAdminRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  // 4) Demo customer
  const customerPasswordHash = await bcrypt.hash("Customer@123", 12);
  await prisma.user.upsert({
    where: { email: "customer@leilamond.test" },
    update: {},
    create: {
      email: "customer@leilamond.test",
      passwordHash: customerPasswordHash,
      firstName: "مشتری",
      lastName: "نمونه",
      roleId: customerRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  // 5) Categories
  const categoryNames = [
    "آرایش صورت",
    "آرایش چشم",
    "آرایش لب",
    "مراقبت پوست",
    "مراقبت مو",
    "عطر",
    "ضدآفتاب",
    "ابزار آرایشی",
  ];
  const categories = [];
  for (const [i, name] of categoryNames.entries()) {
    const slug = `cat-${i + 1}-${name.replace(/\s/g, "-")}`;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder: i },
    });
    categories.push(cat);
  }

  // 6) Brands
  const brandNames = ["Leilamond Signature", "Rose Atelier", "Velora", "Mira Beauty"];
  const brands = [];
  for (const name of brandNames) {
    const slug = name.toLowerCase().replace(/\s/g, "-");
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    brands.push(brand);
  }

  // 7) ~15 demo products
  for (let i = 1; i <= 15; i++) {
    const category = categories[i % categories.length];
    const brand = brands[i % brands.length];
    const slug = `demo-product-${i}`;
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: `محصول نمونه ${i}`,
        slug,
        shortDescription: "توضیح کوتاه محصول نمونه برای دیتای Demo",
        basePrice: 250_000 + i * 15_000,
        compareAtPrice: i % 3 === 0 ? 350_000 + i * 15_000 : null,
        stock: 20 + i,
        status: "ACTIVE",
        isFeatured: i % 4 === 0,
        isNew: i % 3 === 0,
        categoryId: category.id,
        brandId: brand.id,
        publishedAt: new Date(),
        images: { create: [{ url: `/demo/product-${i}.jpg`, isPrimary: true, sortOrder: 0 }] },
      },
    });
  }

  console.log("✅ Seed کامل شد.");
  console.log("👤 ادمین Demo: admin@leilamond.test / Leilamond@Admin123");
  console.log("👤 کاربر Demo: customer@leilamond.test / Customer@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
