import React from 'react'

interface DataTableProps {
  title?: string
  columns: string[]
  data: any[][]
  className?: string
  firstColumnBold?: boolean
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  className = '',
  firstColumnBold = true,
}) => {
  return (
    <div
      className={`my-8 bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {/* Table Title / Header Bar */}
      {title && (
        <div className="px-6 py-4 border-b border-border-default bg-surface">
          <h3 className="text-[15px] font-black text-text-primary tracking-tight">
            {title}
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-surface-muted border-b border-border-default">
              {columns.map((column, i) => (
                <th
                  key={i}
                  className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="group hover:bg-surface-muted/50 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-6 py-5 text-[13px] leading-relaxed text-text-secondary font-medium ${
                      firstColumnBold && cellIndex === 0
                        ? 'font-black text-text-primary'
                        : ''
                    }`}
                  >
                    {/* Render cell content: if it's a string, we might want to handle it (like bolding parts) */}
                    {typeof cell === 'string' &&
                    cell.startsWith('**') &&
                    cell.endsWith('**') ? (
                      <span className="font-black text-text-primary">
                        {cell.replace(/\*\*/g, '')}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
