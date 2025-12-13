import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  cell: (row: T) => ReactNode;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  emptyState?: ReactNode;
  className?: string;
};

export function DataTable<T>({ data, columns, emptyState, className }: Props<T>) {
  if (!data.length) {
    return (
      <div className="card p-8 text-center text-muted">
        {emptyState ?? "Nenhum registro encontrado."}
      </div>
    );
  }

  return (
    <div className={cn("card overflow-hidden border border-stroke/60", className)}>
      <div className="overflow-auto">
        <table className="min-w-[960px] divide-y divide-stroke/50">
          <thead className="bg-background-elevated">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={`${column.header}-${index}`}
                  className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
              >
                {column.header}
              </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke/60">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-background-elevated/60 transition">
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "px-4 py-3 text-sm text-foreground/90",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
