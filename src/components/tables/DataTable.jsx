// A simple, readable table used across all CRUD pages.
// `columns` is [{ key, header, render?(row) }]. `actions(row)` renders
// the action buttons for a row (view/edit/delete etc).
//
// Responsiveness:
// - The table never shrinks its columns to fit the container. It keeps
//   its natural content width (min-w-max) and the wrapper scrolls both
//   horizontally AND vertically (overflow-auto) instead of clipping or
//   squeezing columns off-screen on small laptops/tablets.
// - `maxHeight` (optional, defaults to "70vh") caps the table's height
//   so long lists scroll INSIDE the table instead of pushing the whole
//   page down. The header stays pinned (sticky) while scrolling.
// - Below the `md` breakpoint it still falls back to the stacked card
//   view, unchanged.
export default function DataTable({
  columns,
  data,
  actions,
  rowKey = "_id",
  maxHeight = "70vh",
}) {
  return (
    <>
      {/* Desktop / tablet / small-laptop table — fully scrollable */}
      <div
        className="hidden overflow-auto rounded-xl border border-primary bg-card md:block"
        style={{ maxHeight }}
      >
        <table className="w-full min-w-max text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-secondary text-xs uppercase tracking-wide text-secondary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 font-medium"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row[rowKey]}
                className="border-b border-secondary last:border-0 hover:bg-muted-action/40"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 align-middle text-primary"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap px-4 py-3">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div
        className="flex flex-col gap-3 overflow-y-auto md:hidden"
        style={{ maxHeight }}
      >
        {data.map((row) => (
          <div
            key={row[rowKey]}
            className="rounded-xl border border-primary bg-card p-4 animate-fade-up"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="shrink-0 text-secondary">{col.header}</span>
                <span className="min-w-0 truncate text-right text-primary">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
            {actions && <div className="mt-3 flex justify-end gap-2">{actions(row)}</div>}
          </div>
        ))}
      </div>
    </>
  );
}