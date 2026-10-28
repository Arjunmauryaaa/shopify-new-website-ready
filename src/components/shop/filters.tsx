"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { SORT_OPTIONS } from "@/lib/shopify/facets";
import type { FacetGroup } from "@/lib/shopify/types";

type Props = { groups: FacetGroup[]; total?: number };

export function FilterBar({ groups, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const urlSelected = params.getAll("f");
  // Checkboxes respond instantly; the URL (and server render) catches up in the transition.
  const [selected, setSelected] = useOptimistic(urlSelected);
  const priceMin = params.get("price_min") ?? "";
  const priceMax = params.get("price_max") ?? "";
  const sort = params.get("sort") ?? "featured";
  const activeCount = selected.length + (priceMin || priceMax ? 1 : 0);

  const labelFor = (id: string) => groups.flatMap((g) => g.values).find((v) => v.id === id)?.label ?? id;

  function push(next: URLSearchParams) {
    next.delete("after");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function toggle(id: string) {
    const next = new URLSearchParams(params.toString());
    const all = next.getAll("f");
    const updated = all.includes(id) ? all.filter((x) => x !== id) : [...all, id];
    next.delete("f");
    for (const v of updated) next.append("f", v);
    next.delete("after");
    const qs = next.toString();
    startTransition(() => {
      setSelected(updated);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function setPrice(min: string, max: string) {
    const next = new URLSearchParams(params.toString());
    if (min) next.set("price_min", min);
    else next.delete("price_min");
    if (max) next.set("price_max", max);
    else next.delete("price_max");
    push(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    ["f", "price_min", "price_max"].forEach((k) => next.delete(k));
    push(next);
  }

  function setSort(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "featured") next.delete("sort");
    else next.set("sort", value);
    push(next);
  }

  const panel = (
    <div className="filters__groups">
      {groups.map((g) =>
        g.kind === "price" ? (
          <PriceFields key={g.id} min={priceMin} max={priceMax} onApply={setPrice} />
        ) : g.values.length === 0 ? null : (
          <fieldset key={g.id} className="filter-group">
            <legend className="label">{g.label}</legend>
            {g.values.map((v) => (
              <label key={v.id} className="check">
                <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} />
                <span>{v.label}</span>
                {v.count !== undefined && <span className="muted">({v.count})</span>}
              </label>
            ))}
          </fieldset>
        ),
      )}
    </div>
  );

  return (
    <div className="filterbar" data-pending={pending || undefined}>
      <div className="filterbar__row">
        {groups.length > 0 && (
          <button type="button" className="text-btn filterbar__open" onClick={() => setOpen(true)} aria-haspopup="dialog">
            Filter{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        )}
        {total !== undefined && <p className="muted small filterbar__count">{total} {total === 1 ? "product" : "products"}</p>}
        <label className="sort">
          <span className="label">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {activeCount > 0 && (
        <ul className="chips" aria-label="Active filters">
          {selected.map((id) => (
            <li key={id}>
              <button type="button" className="chip" onClick={() => toggle(id)} aria-label={`Remove filter ${labelFor(id)}`}>
                {labelFor(id)} <CloseIcon />
              </button>
            </li>
          ))}
          {(priceMin || priceMax) && (
            <li>
              <button type="button" className="chip" onClick={() => setPrice("", "")} aria-label="Remove price filter">
                {priceMin || "0"} – {priceMax || "any"} <CloseIcon />
              </button>
            </li>
          )}
          <li><button type="button" className="text-btn" onClick={clearAll}>Clear all</button></li>
        </ul>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} side="left" label="Filters" className="filter-dialog">
        <div className="drawer">
          <div className="drawer__head">
            <h2 className="label">Filter</h2>
            <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <div className="drawer__scroll">{panel}</div>
          <div className="drawer__foot">
            <button type="button" className="btn btn--solid btn--block" onClick={() => setOpen(false)}>View results</button>
            {activeCount > 0 && <button type="button" className="text-btn" onClick={clearAll}>Clear all</button>}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function PriceFields({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const invalid = lo !== "" && hi !== "" && Number(lo) > Number(hi);
  return (
    <fieldset className="filter-group">
      <legend className="label">Price</legend>
      <form
        className="price-fields"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) onApply(lo, hi);
        }}
      >
        <label>
          <span className="visually-hidden">Minimum price</span>
          <input inputMode="decimal" pattern="\d*(\.\d{1,2})?" placeholder="Min" value={lo} onChange={(e) => setLo(e.target.value)} />
        </label>
        <span aria-hidden="true">–</span>
        <label>
          <span className="visually-hidden">Maximum price</span>
          <input inputMode="decimal" pattern="\d*(\.\d{1,2})?" placeholder="Max" value={hi} onChange={(e) => setHi(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--outline" disabled={invalid}>Apply</button>
      </form>
      {invalid && <p className="form-error small">Minimum must be lower than maximum.</p>}
    </fieldset>
  );
}
