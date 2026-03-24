"use client";

import { useRouter } from "next/navigation";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  rowHref?: (item: T) => string;
  keyField?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  rowHref,
  keyField = "id",
}: DataTableProps<T>) {
  const router = useRouter();

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (rowHref) {
      router.push(rowHref(item));
    }
  };

  const isClickable = !!onRowClick || !!rowHref;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-1">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((item, i) => (
            <tr
              key={(item[keyField] as string) || i}
              onClick={() => handleRowClick(item)}
              className={`transition-colors ${
                isClickable
                  ? "cursor-pointer hover:bg-[#ffffff05]"
                  : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-text-secondary ${col.className || ""}`}
                >
                  {col.render
                    ? col.render(item)
                    : (item[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
