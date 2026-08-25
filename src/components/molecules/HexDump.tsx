import { cn } from '@/lib/cn';
import { hexRows, toHex } from '@/utils/encoding';

interface HexDumpProps {
  bytes: number[];
  perRow?: number;
  showAscii?: boolean;
  highlight?: number[];
  onByteHover?: (offset: number | null) => void;
  className?: string;
  baseOffset?: number;
}

/** A stripped-down hex editor view: offset, bytes, ASCII gutter. */
export function HexDump({
  bytes,
  perRow = 16,
  showAscii = true,
  highlight,
  onByteHover,
  className,
  baseOffset = 0,
}: HexDumpProps) {
  const rows = hexRows(bytes, perRow);
  const hot = new Set(highlight ?? []);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="tabnum w-full border-collapse text-[11px]">
        <tbody>
          {rows.map((row) => (
            <tr key={row.offset} className="align-top">
              <td className="w-[70px] py-0.5 pr-3 text-faint select-none">
                {toHex(baseOffset + row.offset, 8)}
              </td>
              <td className="py-0.5">
                <div className="flex flex-wrap gap-x-1">
                  {row.bytes.map((b, i) => {
                    const offset = row.offset + i;
                    return (
                      <span
                        key={i}
                        onMouseEnter={() => onByteHover?.(offset)}
                        onMouseLeave={() => onByteHover?.(null)}
                        className={cn(
                          'px-0.5',
                          hot.has(offset) ? 'bg-mint text-void' : 'text-ink',
                          i % 4 === 3 && 'mr-1.5',
                        )}
                      >
                        {toHex(b)}
                      </span>
                    );
                  })}
                </div>
              </td>
              {showAscii && (
                <td className="w-[150px] py-0.5 pl-3 whitespace-pre text-faint">
                  {row.ascii}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
