import type { PriceLine } from '@booking/shared-types';
import type { ReactNode } from 'react';
import { formatRupees } from '@/lib/format';

interface OrderSummaryProps {
  serviceName: string;
  productName: string;
  lines: PriceLine[];
  total: number;
  /** Extra rows above the price lines (flight, booking reference, …). */
  details?: { label: string; value: ReactNode }[];
  footer?: ReactNode;
}

/** Service, details, price lines and total — shown on the booking form and at checkout. */
export function OrderSummary({
  serviceName,
  productName,
  lines,
  total,
  details = [],
  footer,
}: OrderSummaryProps) {
  return (
    <section
      aria-labelledby="order-summary-heading"
      className="rounded-card border border-stone-200 bg-white shadow-card"
    >
      <div className="border-b border-stone-100 p-6">
        <h2
          id="order-summary-heading"
          className="text-xs font-semibold tracking-wider text-gold-600 uppercase"
        >
          Order summary
        </h2>
        <p className="mt-2 text-lg font-semibold text-espresso-900">{productName}</p>
        <p className="text-sm text-stone-500">{serviceName}</p>
      </div>

      {details.length > 0 && (
        <dl className="grid gap-2 border-b border-stone-100 p-6 text-sm">
          {details.map((detail) => (
            <div key={detail.label} className="flex justify-between gap-4">
              <dt className="text-stone-500">{detail.label}</dt>
              <dd className="text-right font-medium text-espresso-900">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <table className="w-full text-sm">
        <caption className="sr-only">Price breakdown</caption>
        <tbody>
          {lines.map((line) => (
            <tr key={line.label}>
              <th scope="row" className="py-2 pl-6 text-left font-normal text-stone-600">
                {line.label} × {line.quantity}
                {line.note !== undefined && (
                  <span className="ml-1 text-xs text-emerald-700">({line.note})</span>
                )}
              </th>
              <td className="py-2 pr-6 text-right font-medium text-espresso-900 tabular-nums">
                {formatRupees(line.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-2 pl-6 text-left font-normal text-stone-600">
              Taxes &amp; fees
            </th>
            <td className="py-2 pr-6 text-right text-stone-600">Included</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-stone-200">
            <th
              scope="row"
              className="py-4 pl-6 text-left text-base font-semibold text-espresso-900"
            >
              Total
            </th>
            <td className="py-4 pr-6 text-right text-xl font-semibold text-espresso-900 tabular-nums">
              {formatRupees(total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {footer !== undefined && <div className="border-t border-stone-100 p-6">{footer}</div>}
    </section>
  );
}
