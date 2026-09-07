/**
 * Report print template.
 *
 * Renders a styled, print-only A4 document for each supported report type.
 * It is portaled into the hidden #print-root and shown only during printing
 * via the `print-report` body class (see index.css). Mirrors the Collection
 * receipt printing pattern but for full A4 reports.
 */

export default function PrintTemplate({ type, data, from, to }) {
  const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const titleFor = {
    collection: 'Daily Collection Summary',
    factory: 'Factory Reconciliation',
    payments: 'Weekly Payment Sheet',
    passbook: 'Supplier Passbook',
  }[type] || 'Report';

  const subtitleFor = {
    collection: `${from} → ${to}`,
    factory: `${from} → ${to}`,
    payments: `${from} → ${to}`,
    passbook: data?.farmerName || (data?.farmer ? `Supplier: ${data.farmer}` : ''),
  }[type] || '';

  const Stat = ({ label, value }) => (
    <div className="rpt-stat">
      <div className="rpt-stat-label">{label}</div>
      <div className="rpt-stat-value">{value}</div>
    </div>
  );

  return (
    <div className="rpt">
      <div className="rpt-header">
        <div className="rpt-logo">🍃</div>
        <div className="rpt-org">TeaLeafLedger</div>
        <div className="rpt-title">{titleFor}</div>
        {subtitleFor && <div className="rpt-subtitle">{subtitleFor}</div>}
      </div>

      {type === 'collection' && (
        <>
          <div className="rpt-stats">
            <Stat label="Collections" value={data?.totalCollections || 0} />
            <Stat label="Total weight" value={`${(data?.totalWeight || 0).toFixed(1)} kg`} />
            <Stat label="Total value" value={money(data?.totalAmount)} />
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Supplier</th><th>Grade</th><th className="rpt-right">Weight</th><th className="rpt-right">Amount</th></tr>
            </thead>
            <tbody>
              {(data?.collections || []).map((c, i) => (
                <tr key={i}>
                  <td>{c.date}</td><td>{c.farmer}</td><td>{c.grade}</td>
                  <td className="rpt-right">{c.weight?.toFixed(1)} kg</td>
                  <td className="rpt-right">{money(c.amount)}</td>
                </tr>
              ))}
              {!(data?.collections || []).length && <tr><td colSpan="5" className="rpt-center">No collections in this period.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {type === 'factory' && (
        <table>
          <thead>
            <tr><th>Delivery</th><th>Factory</th><th className="rpt-right">Sent</th><th className="rpt-right">Factory wt</th><th className="rpt-right">Variance</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(data?.deliveries || []).map((d, i) => (
              <tr key={i}>
                <td>{d.number}</td><td>{d.factory}</td>
                <td className="rpt-right">{d.sent?.toFixed(1)} kg</td>
                <td className="rpt-right">{d.factoryWeight?.toFixed(1)} kg</td>
                <td className={d.variance < 0 ? 'rpt-right rpt-variance-neg' : 'rpt-right rpt-variance-pos'}>
                  {d.variance >= 0 ? '+' : ''}{d.variance?.toFixed(1)} kg
                </td>
                <td>{d.status}</td>
              </tr>
            ))}
            {!(data?.deliveries || []).length && <tr><td colSpan="6" className="rpt-center">No deliveries in this period.</td></tr>}
          </tbody>
        </table>
      )}

      {type === 'payments' && (
        <>
          <div className="rpt-stats">
            <Stat label="Suppliers due" value={data?.supplierCount || 0} />
            <Stat label="Total due" value={money(data?.totalDue)} />
          </div>
          <table>
            <thead>
              <tr><th>Supplier</th><th>Code</th><th className="rpt-right">Due</th></tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r, i) => (
                <tr key={i}><td>{r.farmer}</td><td>{r.code}</td><td className="rpt-right">{money(r.due)}</td></tr>
              ))}
              {!(data?.rows || []).length && <tr><td colSpan="3" className="rpt-center">No payments due this week.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {type === 'passbook' && data?.farmer && (
        <>
          <div className="rpt-stats">
            <Stat label="Earned" value={money(data.earned)} />
            <Stat label="Advances" value={money(data.advances)} />
            <Stat label="Payments" value={money(data.payments)} />
            <Stat label="Balance" value={money(data.balance)} />
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th className="rpt-right">Amount</th></tr>
            </thead>
            <tbody>
              {(data?.transactions || []).map((t, i) => (
                <tr key={i}><td>{t.date}</td><td>{t.type}</td><td className="rpt-right">{money(t.amount)}</td></tr>
              ))}
              {!(data?.transactions || []).length && <tr><td colSpan="3" className="rpt-center">No transactions for this supplier.</td></tr>}
            </tbody>
          </table>
        </>
      )}

      <div className="rpt-footer">
        Generated by TeaLeafLedger · {now}
      </div>
    </div>
  );
}
