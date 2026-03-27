import type { ListingAddOn, ListingAddOnKind } from "../types/domain";

export function normalizeListingAddOns(value: unknown): ListingAddOn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Partial<ListingAddOn>;
      const label = typeof data.label === "string" ? data.label.trim() : "";
      const kind = data.kind === "drink" ? "drink" : data.kind === "side" ? "side" : null;
      const price = typeof data.price === "number" ? data.price : Number(data.price ?? NaN);
      const id =
        typeof data.id === "string" && data.id.trim()
          ? data.id.trim()
          : `${kind ?? "option"}-${index + 1}`;

      if (!label || !kind || !Number.isFinite(price) || price < 0) {
        return null;
      }

      return {
        id,
        kind,
        label,
        price,
      };
    })
    .filter((item): item is ListingAddOn => Boolean(item));
}

export function buildListingAddOn(kind: ListingAddOnKind): ListingAddOn {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    label: "",
    price: 0,
  };
}

export function groupListingAddOns(addOns: ListingAddOn[]) {
  return {
    drinks: addOns.filter((item) => item.kind === "drink"),
    sides: addOns.filter((item) => item.kind === "side"),
  };
}

export function sumListingAddOns(addOns: ListingAddOn[]) {
  return addOns.reduce((total, item) => total + item.price, 0);
}

export function formatListingAddOns(addOns: ListingAddOn[]) {
  if (addOns.length === 0) {
    return "No extras selected";
  }

  return addOns
    .map((item) => `${item.label} (+ZMW ${item.price.toFixed(2)})`)
    .join(", ");
}
