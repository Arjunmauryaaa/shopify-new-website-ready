"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { brand } from "@/config/brand";
import { recommendSize } from "@/lib/commerce";

const guide = brand.commerce.sizeGuide;

/** Size chart + "find my size". Hidden unless real size rows are configured in brand.commerce.sizeGuide. */
export function SizeGuideButton({ onPick }: { onPick?: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<Record<string, string>>({});
  if (guide.rows.length === 0) return null;

  const numeric = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, Number(v)]));
  const result = recommendSize(guide, numeric);
  const attempted = Object.values(input).some((v) => v !== "");

  return (
    <>
      <button type="button" className="text-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">Size guide</button>
      <Dialog open={open} onClose={() => setOpen(false)} side="right" label="Size guide" className="size-dialog">
        <div className="drawer">
          <div className="drawer__head">
            <h2 className="label">Size guide ({guide.unit})</h2>
            <button type="button" className="icon-btn" aria-label="Close size guide" onClick={() => setOpen(false)}><CloseIcon /></button>
          </div>
          <div className="drawer__scroll">
            <table className="size-table">
              <thead>
                <tr><th scope="col">Size</th>{guide.measurements.map((m) => <th scope="col" key={m}>{m}</th>)}</tr>
              </thead>
              <tbody>
                {guide.rows.map((r) => (
                  <tr key={r.size}>
                    <th scope="row">{r.size}</th>
                    {guide.measurements.map((m) => <td key={m}>{r.ranges[m] ? `${r.ranges[m][0]}–${r.ranges[m][1]}` : "–"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {guide.note && <p className="small muted">{guide.note}</p>}

            <form className="finder" onSubmit={(e) => e.preventDefault()}>
              <h3 className="label">Find my size</h3>
              {guide.measurements.map((m) => (
                <div className="field" key={m}>
                  <label htmlFor={`fit-${m}`}>{m} ({guide.unit})</label>
                  <input id={`fit-${m}`} inputMode="decimal" value={input[m] ?? ""} onChange={(e) => setInput((s) => ({ ...s, [m]: e.target.value }))} />
                </div>
              ))}
              <p role="status" className="finder__result">
                {attempted && result && <>We suggest <strong>{result.size}</strong>{result.exact ? "." : " (between sizes — we've rounded up)."}</>}
                {attempted && !result && "Those measurements are outside our size range."}
              </p>
              {result && onPick && (
                <button type="button" className="btn btn--outline" onClick={() => { onPick(result.size); setOpen(false); }}>
                  Select size {result.size}
                </button>
              )}
            </form>
          </div>
        </div>
      </Dialog>
    </>
  );
}
