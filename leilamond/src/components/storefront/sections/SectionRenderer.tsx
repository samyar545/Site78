import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "../ProductCard";

type Section = Awaited<ReturnType<typeof getVisibleSections>>[number];

export async function getVisibleSections() {
  const now = new Date();
  return prisma.homepageSection.findMany({
    where: {
      isActive: true,
      status: "PUBLISHED",
      OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
      AND: [{ OR: [{ visibleUntil: null }, { visibleUntil: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
    include: { products: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } }, orderBy: { sortOrder: "asc" } } },
  });
}

async function fetchProductsForSection(section: Section) {
  const limit = section.productLimit ?? 8;

  if (section.products.length > 0) {
    return section.products.map((link) => link.product);
  }

  const baseInclude = { images: { where: { isPrimary: true }, take: 1 } };

  switch (section.type) {
    case "NEW_PRODUCTS":
      return prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { publishedAt: "desc" }, take: limit, include: baseInclude });
    case "BEST_SELLERS":
      return prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { salesCount: "desc" }, take: limit, include: baseInclude });
    case "DISCOUNT_PRODUCTS":
      return prisma.product.findMany({ where: { status: "ACTIVE", compareAtPrice: { not: null } }, take: limit, include: baseInclude });
    case "PRODUCT_GRID":
    case "PRODUCT_CAROUSEL":
      return prisma.product.findMany({
        where: { status: "ACTIVE", ...(section.categoryId ? { categoryId: section.categoryId } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: baseInclude,
      });
    default:
      return [];
  }
}

function SectionHeading({ title }: { title: string | null }) {
  if (!title) return null;
  return <h2 className="mb-4 text-lg font-bold text-text">{title}</h2>;
}

async function HeroBanner({ section }: { section: Section }) {
  return (
    <section
      className="relative mb-10 flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundColor: section.backgroundColor ?? "var(--color-surface)" }}
    >
      {section.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={section.imageUrl} alt={section.title ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="relative z-10 text-center">
        {section.title && <h1 className="mb-2 text-3xl font-bold text-white drop-shadow">{section.title}</h1>}
        {section.description && <p className="mb-4 text-white/90 drop-shadow">{section.description}</p>}
        {section.linkUrl && (
          <Link href={section.linkUrl} className="inline-block rounded-full bg-primary px-6 py-2 text-sm text-white hover:opacity-90">
            مشاهده محصولات
          </Link>
        )}
      </div>
    </section>
  );
}

async function CategoryGrid() {
  const categories = await prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: "asc" }, take: 8 });
  return (
    <section className="mb-10">
      <SectionHeading title="دسته‌بندی‌ها" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-3 text-center text-xs text-text hover:border-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {c.icon ?? "✦"}
            </div>
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

async function ProductsSection({ section }: { section: Section }) {
  const products = await fetchProductsForSection(section);
  if (products.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionHeading title={section.title} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function CustomBanner({ section }: { section: Section }) {
  return (
    <section className="mb-10 overflow-hidden rounded-lg border border-border">
      <Link href={section.linkUrl ?? "#"}>
        {section.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.imageUrl} alt={section.title ?? ""} className="w-full object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center bg-surface text-text-muted">{section.title}</div>
        )}
      </Link>
    </section>
  );
}

function TextSection({ section }: { section: Section }) {
  return (
    <section className="mb-10 rounded-lg bg-surface p-6 text-center">
      {section.title && <h2 className="mb-2 text-lg font-bold text-text">{section.title}</h2>}
      {section.description && <p className="text-sm text-text-muted">{section.description}</p>}
    </section>
  );
}

export async function HomeSections() {
  const sections = await getVisibleSections();

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-text-muted">
        هنوز هیچ بخشی برای صفحه اصلی منتشر نشده است. از پنل ادمین → «چیدمان صفحه اصلی» شروع کنید.
      </div>
    );
  }

  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "HERO_BANNER":
            return <HeroBanner key={section.id} section={section} />;
          case "CATEGORY_GRID":
            return <CategoryGrid key={section.id} />;
          case "CUSTOM_BANNER":
          case "ADVERTISEMENT":
            return <CustomBanner key={section.id} section={section} />;
          case "TEXT_SECTION":
            return <TextSection key={section.id} section={section} />;
          case "PRODUCT_GRID":
          case "PRODUCT_CAROUSEL":
          case "DISCOUNT_PRODUCTS":
          case "NEW_PRODUCTS":
          case "BEST_SELLERS":
            return <ProductsSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
