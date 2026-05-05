// ============================================================
// DataTable.jsx - Reusable table with sort/filter/paginate/search
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function DataTable({
  rows,
  columns,
  allColumns,  // Optional: all columns including hidden ones (for filtering)
  searchPlaceholder = "Search...",
  searchableFields = [],
  emptyMessage = "No data",
  rowKey,
  inlineSearch = false  // when true, search + filter on same line
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null
  const [filters, setFilters] = useState({}); // column key -> array of selected values
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openFilterCol, setOpenFilterCol] = useState(null);

  // Debounce search at 2 chars (per spec)
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.length === 0 || search.length >= 2) setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when search/filters/pageSize change
  useEffect(() => { setPage(1); }, [debouncedSearch, filters, pageSize]);

  // Use allColumns for filtering if provided, otherwise use columns
  const columnsForFiltering = allColumns || columns;
  const filterableCols = columnsForFiltering.filter(c => c.filterable !== false);

  // Filter pipeline
  const filtered = useMemo(() => {
    let result = rows;
    if (debouncedSearch && searchableFields.length > 0) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(r => searchableFields.some(f => {
        const v = typeof f === "function" ? f(r) : r[f];
        return v && String(v).toLowerCase().includes(q);
      }));
    }
    for (const [colKey, vals] of Object.entries(filters)) {
      if (!vals || vals.length === 0) continue;
      const col = columnsForFiltering.find(c => c.key === colKey);
      if (!col) continue;
      result = result.filter(r => {
        const v = col.filterValue ? col.filterValue(r) : (col.accessor ? col.accessor(r) : r[col.key]);
        return vals.includes(v);
      });
    }
    return result;
  }, [rows, debouncedSearch, filters, columnsForFiltering, searchableFields]);

  // Sort pipeline
  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered;
    const col = columns.find(c => c.key === sortCol);
    if (!col) return filtered;
    const out = [...filtered];
    out.sort((a, b) => {
      const va = col.sortValue ? col.sortValue(a) : (col.accessor ? col.accessor(a) : a[col.key]);
      const vb = col.sortValue ? col.sortValue(b) : (col.accessor ? col.accessor(b) : b[col.key]);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase(); const sb = String(vb).toLowerCase();
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [filtered, sortCol, sortDir, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (colKey) => {
    if (sortCol !== colKey) { setSortCol(colKey); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else if (sortDir === "desc") { setSortCol(null); setSortDir(null); }
    else setSortDir("asc");
  };

  const distinctValues = (col) => {
    const set = new Set();
    for (const r of rows) {
      const v = col.filterValue ? col.filterValue(r) : (col.accessor ? col.accessor(r) : r[col.key]);
      if (v !== null && v !== undefined && v !== "") set.add(v);
    }
    return [...set].sort();
  };

  const toggleFilter = (colKey, val) => {
    setFilters(prev => {
      const cur = prev[colKey] || [];
      return cur.includes(val)
        ? { ...prev, [colKey]: cur.filter(x => x !== val) }
        : { ...prev, [colKey]: [...cur, val] };
    });
  };

  const removeFilter = (colKey, val) => {
    setFilters(prev => ({ ...prev, [colKey]: (prev[colKey] || []).filter(x => x !== val) }));
  };

  const clearAllFilters = () => setFilters({});
  const activeFilterCount = Object.values(filters).reduce((acc, v) => acc + (v?.length || 0), 0);

  const SortIcon = ({ colKey }) => {
    if (sortCol !== colKey) return <ArrowUpDown size={12} className="text-slate-400" />;
    if (sortDir === "asc") return <ArrowUp size={12} className="text-blue-600" />;
    return <ArrowDown size={12} className="text-blue-600" />;
  };

  const SearchBar = (
    <div className="relative w-full max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
      />
      {search.length > 0 && search.length < 2 && (
        <span className="absolute -bottom-5 left-0 text-[10px] text-amber-700">Type 2+ characters</span>
      )}
      {search && (
        <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
          <X size={14} className="text-slate-500" />
        </button>
      )}
    </div>
  );

  const FilterBar = (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={14} className="text-slate-600" />
      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Filters:</span>
      {filterableCols.map(col => {
        const distinct = distinctValues(col);
        const selected = filters[col.key] || [];
        if (distinct.length === 0) return null;
        return (
          <div key={col.key} className="relative">
            <button
              onClick={() => setOpenFilterCol(openFilterCol === col.key ? null : col.key)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                selected.length > 0
                  ? "bg-blue-50 border-blue-400 text-blue-800"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {col.label}
              {selected.length > 0 && <span className="ml-0.5 px-1 py-0.5 bg-blue-600 text-white rounded text-[9px]">{selected.length}</span>}
              <ChevronDown />
            </button>
            {openFilterCol === col.key && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenFilterCol(null)} />
                <div className="absolute z-20 mt-1 left-0 bg-white border border-slate-300 rounded-md shadow-lg min-w-[200px] max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-slate-200 sticky top-0 bg-white">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Filter by {col.label}</div>
                  </div>
                  {distinct.map(v => (
                    <label key={String(v)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={selected.includes(v)}
                        onChange={() => toggleFilter(col.key, v)}
                        className="rounded"
                      />
                      <span className="flex-1">{String(v)}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="text-xs text-blue-700 hover:text-blue-900 underline ml-2">
          Clear all
        </button>
      )}
    </div>
  );

  const ActiveFilterPills = activeFilterCount > 0 && (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {Object.entries(filters).map(([colKey, vals]) =>
        (vals || []).map(v => {
          const col = columns.find(c => c.key === colKey);
          return (
            <span key={`${colKey}-${v}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 rounded text-xs">
              <span className="font-semibold">{col?.label}:</span> {String(v)}
              <button onClick={() => removeFilter(colKey, v)} className="hover:bg-blue-200 rounded-full ml-0.5">
                <X size={11} />
              </button>
            </span>
          );
        })
      )}
    </div>
  );

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm">
      {inlineSearch ? (
        <div className="p-3 border-b border-slate-200 flex items-center gap-3 flex-wrap">
          {SearchBar}
          {FilterBar}
          <span className="text-xs text-slate-700 font-medium ml-auto">{sorted.length} of {rows.length} results</span>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-slate-200">
            {SearchBar}
          </div>
          <div className="px-3 py-2 border-b border-slate-200 flex flex-wrap items-center gap-2">
            {FilterBar}
            <span className="text-xs text-slate-700 font-medium ml-auto">{sorted.length} of {rows.length} results</span>
          </div>
        </>
      )}

      {activeFilterCount > 0 && (
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          {ActiveFilterPills}
        </div>
      )}

      <div className="overflow-x-auto" style={{ maxHeight: "600px", overflowY: "auto" }}>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0 z-[1]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable !== false ? () => toggleSort(col.key) : undefined}
                  className={`text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-800 font-bold border-b border-slate-300 ${
                    col.sortable !== false ? "cursor-pointer hover:bg-slate-200 select-none" : ""
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable !== false && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-600 text-sm">{emptyMessage}</td></tr>
            ) : paginated.map(r => (
              <tr key={rowKey(r)} className="border-b border-slate-100 hover:bg-blue-50/40 transition">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-900 align-top">
                    {col.render ? col.render(r) : (col.accessor ? col.accessor(r) : r[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(parseInt(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-900"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span className="ml-3">
            {sorted.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`} of {sorted.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={safePage === 1}
            onClick={() => setPage(1)}
            className="px-2 py-1 text-xs rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-slate-800"
          >First</button>
          <button
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
          ><ChevronLeft size={14} /></button>
          {pageNumbers(safePage, totalPages).map((n, i) =>
            n === "..." ? (
              <span key={`e${i}`} className="px-2 text-xs text-slate-500">…</span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-2.5 py-1 text-xs rounded border font-medium ${
                  n === safePage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >{n}</button>
            )
          )}
          <button
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
          ><ChevronRight size={14} /></button>
          <button
            disabled={safePage === totalPages}
            onClick={() => setPage(totalPages)}
            className="px-2 py-1 text-xs rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-slate-800"
          >Last</button>
        </div>
      </div>
    </div>
  );
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function ChevronDown() {
  return <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
