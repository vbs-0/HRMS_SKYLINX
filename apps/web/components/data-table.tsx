"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { SkeletonRows, EmptyState, DataState } from "./ui";

export type Column<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortBy?: (row: T) => string | number;
  align?: "left" | "right";
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  search?: (row: T, q: string) => boolean;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (keys: string[]) => void;
  bulkBar?: (keys: string[], clear: () => void) => React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  pageSize?: number;
  toolbar?: React.ReactNode;
};

export function DataTable<T>({
  columns, rows, rowKey, loading, error, search, onRowClick, rowActions,
  selectable, onSelectionChange, bulkBar, emptyTitle = "Nothing here yet", emptyMessage, pageSize = 25, toolbar,
}: Props<T>) {
  const [q, setQ] = React.useState("");
  const [sortId, setSortId] = React.useState<string | null>(null);
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);
  const [sel, setSel] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    let r = rows;
    if (q && search) r = r.filter((row) => search(row, q.toLowerCase()));
    if (sortId) {
      const col = columns.find((c) => c.id === sortId);
      if (col?.sortBy) {
        r = [...r].sort((a, b) => {
          const av = col.sortBy!(a), bv = col.sortBy!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return r;
  }, [rows, q, search, sortId, dir, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);
  React.useEffect(() => { setPage(0); }, [q, sortId, dir]);

  function toggleSort(c: Column<T>) {
    if (!c.sortBy) return;
    if (sortId === c.id) setDir(dir === "asc" ? "desc" : "asc");
    else { setSortId(c.id); setDir("asc"); }
  }
  function toggleRow(k: string) {
    const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); setSel(n); onSelectionChange?.([...n]);
  }
  function toggleAll() {
    const allKeys = view.map(rowKey);
    const everyOn = allKeys.every((k) => sel.has(k));
    const n = new Set(sel);
    allKeys.forEach((k) => (everyOn ? n.delete(k) : n.add(k)));
    setSel(n); onSelectionChange?.([...n]);
  }
  const clear = () => { setSel(new Set()); onSelectionChange?.([]); };

  return (
    <div className="rounded-card border border-line bg-raised shadow-e1">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle p-3">
        {search ? (
          <div className="flex items-center gap-2 rounded-control border border-line-strong bg-raised px-2.5">
            <Search className="h-4 w-4 text-text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search table"
              className="h-9 w-48 bg-transparent text-sm outline-none placeholder:text-text-muted" />
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>

      {/* bulk bar */}
      {selectable && sel.size > 0 ? (
        <div className="flex items-center gap-3 border-b border-line-subtle bg-selected px-4 py-2 text-sm">
          <span className="font-semibold text-brand-700">{sel.size} selected</span>
          {bulkBar?.([...sel], clear)}
          <button onClick={clear} className="ml-auto text-text-muted hover:text-text-primary">Clear</button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sunken text-left">
              {selectable ? (
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" aria-label="Select all" checked={view.length > 0 && view.every((r) => sel.has(rowKey(r)))} onChange={toggleAll} />
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={c.id} className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted ${c.align === "right" ? "text-right" : ""}`}
                  aria-sort={sortId === c.id ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sortBy ? (
                    <button onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 hover:text-text-primary">
                      {c.header}
                      {sortId === c.id ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
              {rowActions ? <th className="w-px px-3 py-2.5" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="p-4"><SkeletonRows rows={6} /></td></tr>
            ) : error ? (
              <tr><td colSpan={columns.length + 2} className="p-4"><DataState tone="error" message={error} /></td></tr>
            ) : view.length === 0 ? (
              <tr><td colSpan={columns.length + 2} className="p-6"><EmptyState title={q ? "No results" : emptyTitle} message={q ? "Try a different search." : emptyMessage} /></td></tr>
            ) : (
              view.map((row) => {
                const k = rowKey(row);
                return (
                  <tr key={k} onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-line-subtle ${onRowClick ? "cursor-pointer" : ""} hover:bg-surface-hover ${sel.has(k) ? "bg-selected" : ""}`}>
                    {selectable ? (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Select row" checked={sel.has(k)} onChange={() => toggleRow(k)} />
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td key={c.id} className={`px-3 py-2.5 ${c.align === "right" ? "text-right tabular font-mono text-[12.5px]" : "text-text-primary"} ${c.className || ""}`}>{c.cell(row)}</td>
                    ))}
                    {rowActions ? <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>{rowActions(row)}</td> : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {!loading && !error && filtered.length > 0 ? (
        <div className="flex items-center justify-between border-t border-line-subtle px-4 py-2.5 text-sm text-text-muted">
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="grid h-8 w-8 place-items-center rounded-control hover:bg-surface-hover disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-2">{page + 1} / {pages}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="grid h-8 w-8 place-items-center rounded-control hover:bg-surface-hover disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
