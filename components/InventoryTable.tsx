"use client";

import type { InventoryItem } from "@/lib/types";

export default function InventoryTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-sunken p-6 text-center text-sm text-muted">
        No stock yet. Use Inventory voice mode and say “Add ten bags of rice to stock.”
      </div>
    );
  }

  const maxQty = Math.max(...items.map((item) => item.qty), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 border-b border-line bg-surface-sunken px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <span>Item</span>
        <span>Stock</span>
        <span>Low at</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => {
          const low = item.qty <= item.lowAt;
          const width = Math.max(8, Math.round((item.qty / maxQty) * 100));
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] items-center gap-3 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold capitalize text-ink">{item.item}</p>
                <p className="text-xs text-muted">Updated by sales and restock voice actions</p>
              </div>
              <div>
                <p className={`font-bold tabular-nums ${low ? "text-terracotta" : "text-green-2"}`}>
                  {item.qty} {item.unit}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-2">
                  <div
                    className={`h-full rounded-full ${low ? "bg-terracotta" : "bg-green"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <span className="text-muted">
                {item.lowAt} {item.unit}
              </span>
              <span
                className={`w-max rounded-full px-2.5 py-1 text-xs font-semibold ${
                  low ? "bg-terracotta/15 text-terracotta" : "bg-green/10 text-green"
                }`}
              >
                {low ? "Restock soon" : "Healthy"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
