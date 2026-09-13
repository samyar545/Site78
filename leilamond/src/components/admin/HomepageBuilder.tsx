"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/admin/Badge";

type Section = {
  id: string;
  type: string;
  title: string | null;
  isActive: boolean;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
};

const TYPE_LABEL: Record<string, string> = {
  HERO_BANNER: "بنر اصلی (Hero)",
  PRODUCT_GRID: "شبکه محصولات",
  PRODUCT_CAROUSEL: "اسلایدر محصولات",
  CATEGORY_GRID: "شبکه دسته‌بندی‌ها",
  DISCOUNT_PRODUCTS: "محصولات تخفیف‌دار",
  NEW_PRODUCTS: "جدیدترین محصولات",
  BEST_SELLERS: "پرفروش‌ترین‌ها",
  ADVERTISEMENT: "تبلیغ",
  CUSTOM_BANNER: "بنر سفارشی",
  TEXT_SECTION: "بخش متنی",
  BRAND_SECTION: "بخش برندها",
};

function SortableRow({
  section,
  onToggleActive,
  onPublishToggle,
}: {
  section: Section;
  onToggleActive: (s: Section) => void;
  onPublishToggle: (s: Section) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-md border border-border bg-background p-3"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-text-muted active:cursor-grabbing"
          aria-label="جابه‌جایی"
        >
          ⠿
        </button>
        <div>
          <div className="text-sm font-medium text-text">{section.title || TYPE_LABEL[section.type]}</div>
          <div className="text-xs text-text-muted">{TYPE_LABEL[section.type]}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone={section.status === "PUBLISHED" ? "success" : "warning"}>
          {section.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}
        </Badge>
        <button
          onClick={() => onPublishToggle(section)}
          className="rounded-md border border-border px-2 py-1 text-xs text-text hover:bg-muted"
        >
          {section.status === "PUBLISHED" ? "بازگرداندن به پیش‌نویس" : "انتشار"}
        </button>
        <button
          onClick={() => onToggleActive(section)}
          className={
            section.isActive
              ? "rounded-md px-2 py-1 text-xs text-success hover:bg-muted"
              : "rounded-md px-2 py-1 text-xs text-text-muted hover:bg-muted"
          }
        >
          {section.isActive ? "فعال" : "غیرفعال"}
        </button>
      </div>
    </div>
  );
}

export function HomepageBuilder({ initial }: { initial: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [newType, setNewType] = useState<keyof typeof TYPE_LABEL>("PRODUCT_GRID");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function persistOrder(next: Section[]) {
    setSections(next);
    await fetch("/api/admin/homepage-sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    persistOrder(arrayMove(sections, oldIndex, newIndex));
  }

  async function toggleActive(section: Section) {
    await fetch(`/api/admin/homepage-sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !section.isActive }),
    });
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, isActive: !s.isActive } : s)));
  }

  async function togglePublish(section: Section) {
    const nextStatus = section.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/admin/homepage-sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, status: nextStatus } : s)));
  }

  async function addSection() {
    const res = await fetch("/api/admin/homepage-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, title: TYPE_LABEL[newType] }),
    });
    if (res.ok) {
      router.refresh();
      const { section } = await res.json();
      setSections((prev) => [...prev, section]);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <p className="mb-3 text-sm text-text-muted">
          دسته‌ها را با کشیدن (Drag) جابه‌جا کنید — ترتیب بلافاصله ذخیره می‌شود.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((s) => (
                <SortableRow key={s.id} section={s} onToggleActive={toggleActive} onPublishToggle={togglePublish} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-text-muted">
            هنوز هیچ Section ای اضافه نشده — از پنل کنار شروع کنید.
          </div>
        )}
      </div>

      <div className="h-fit rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text">افزودن Section</h2>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as keyof typeof TYPE_LABEL)}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {Object.entries(TYPE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={addSection}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:opacity-90"
        >
          افزودن به صفحه اصلی
        </button>
      </div>
    </div>
  );
}
