"use client";

import type { Category, UnmappedReference } from "@/types";
import { Button, Input } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
// Note: NextUI Table requires direct TableRow children. Avoid wrapping rows in custom components.

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function UnmappedReferences({ pageSize = 10 }: { pageSize?: number }) {
  const { data: categories } = useSWR<Category[]>("/categories/api", fetcher);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => {
    // Reset to first page when search changes
    setPage(1);
  }, [debounced]);
  const query = debounced ? `&q=${encodeURIComponent(debounced)}` : "";
  const key = `/references/api?unmapped=true&limit=${pageSize}&page=${page}${query}`;
  const {
    data: refsData,
    mutate,
    isLoading,
  } = useSWR<{ data: UnmappedReference[]; page: number; limit: number; total: number; totalPages: number }>(
    key,
    fetcher
  );

  const options = useMemo(() => categories ?? [], [categories]);
  const [selected, setSelected] = useState<Record<string, string>>({}); // reference -> categoryId
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  // no-op: using native <select> so no special selection parsing required

  const assign = async (reference: string, categoryId: number) => {
    // optimistic: remove the row locally
    const prev = refsData?.data ?? [];
    const newTotal = Math.max(0, (refsData?.total ?? prev.length) - 1);
    const newLimit = refsData?.limit ?? pageSize;
    const newPage = refsData?.page ?? page;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / newLimit));
    mutate(
      {
        data: prev.filter(r => r.reference !== reference),
        page: newPage,
        limit: newLimit,
        total: newTotal,
        totalPages: newTotalPages,
      },
      { revalidate: false }
    );
    try {
      await fetch("/reference-mappings/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, category_id: Number(categoryId) }),
      });
      // revalidate to pick up next batch
      mutate();
    } catch (e) {
      // rollback on error
      mutate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Input
          size="sm"
          type="text"
          placeholder="Search references..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        {search && (
          <Button size="sm" variant="light" onPress={() => setSearch("")}>
            Clear
          </Button>
        )}
      </div>
      <div className="overflow-auto rounded-medium border border-default-200">
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-content2 sticky top-0 z-[1]">
            <tr>
              <th className="text-left text-sm font-semibold p-3 border-b border-default-200">Reference</th>
              <th className="text-left text-sm font-semibold p-3 border-b border-default-200">Category</th>
              <th className="text-left text-sm font-semibold p-3 border-b border-default-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (!refsData?.data || refsData.data.length === 0) ? (
              <tr>
                <td className="p-3 text-sm text-foreground-500" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : (refsData?.data ?? []).length === 0 ? (
              <tr>
                <td className="p-3 text-sm text-foreground-500" colSpan={3}>
                  All references mapped!
                </td>
              </tr>
            ) : (
              (refsData?.data ?? []).map(item => (
                <tr key={item.reference} className="odd:bg-content1 even:bg-content2">
                  <td className="p-3 align-middle max-w-[60ch]">
                    <div className="truncate" title={item.reference}>
                      {item.reference}
                    </div>
                  </td>
                  <td className="p-3 align-middle">
                    <select
                      aria-label={`Select category for ${item.reference}`}
                      className="min-w-[220px] h-9 rounded-medium border border-default-200 bg-content1 px-2 text-sm"
                      disabled={options.length === 0}
                      value={selected[item.reference] ?? ""}
                      onChange={e => {
                        const v = e.target.value;
                        setSelected(m => ({ ...m, [item.reference]: v }));
                      }}
                    >
                      <option value="" disabled>
                        Choose category
                      </option>
                      {options.map(o => (
                        <option key={o.id} value={String(o.id)}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 align-middle">
                    <Button
                      color="primary"
                      size="sm"
                      isDisabled={!selected[item.reference]}
                      isLoading={!!assigning[item.reference]}
                      onPress={async () => {
                        const v = selected[item.reference];
                        if (!v) return;
                        setAssigning(m => ({ ...m, [item.reference]: true }));
                        try {
                          await assign(item.reference, Number(v));
                        } finally {
                          setAssigning(m => ({ ...m, [item.reference]: false }));
                          setSelected(m => {
                            const { [item.reference]: _, ...rest } = m;
                            return rest;
                          });
                        }
                      }}
                    >
                      Assign
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-foreground-500">
          {(() => {
            const curPage = refsData?.page ?? page;
            const lim = refsData?.limit ?? pageSize;
            const total = refsData?.total ?? 0;
            const start = total === 0 ? 0 : (curPage - 1) * lim + 1;
            const end = Math.min(total, curPage * lim);
            const totalPages = refsData?.totalPages ?? Math.max(1, Math.ceil(total / lim));
            return `Showing ${start}-${end} of ${total} • Page ${curPage} of ${totalPages}`;
          })()}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            isDisabled={(refsData?.page ?? page) <= 1}
            onPress={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="flat"
            isDisabled={(refsData?.page ?? page) >= (refsData?.totalPages ?? 1)}
            onPress={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
