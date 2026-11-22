import { getMadtownStats, MADTOWN_COST_FOOTNOTE, MADTOWN_COSTS, MADTOWN_MONTHLY_USD } from '@/madtown-stats';

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** madtown.today's monthly bill, beside its live counts when madtown.today answers. */
export default async function MadtownLedger() {
  const stats = await getMadtownStats();
  // Leave out today, which is still filling in.
  const days = stats?.days.slice(1) ?? [];
  const visitorDays = days.reduce((s, d) => s + d.visitors, 0);
  const games = days.reduce((s, d) => s + d.gamesFinished, 0);
  const perDay = days.length ? visitorDays / days.length : 0;

  return (
    <section className="cs-demo" aria-labelledby="madtown-ledger">
      <div className="cs-demo-head">
        <h3 id="madtown-ledger">What madtown.today costs to run</h3>
        <span className="cs-demo-tag">{stats ? 'Live counts' : 'Costs only'}</span>
      </div>
      <div className="cs-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Each month</th>
              <th scope="col">For</th>
              <th scope="col">Cost</th>
            </tr>
          </thead>
          <tbody>
            {MADTOWN_COSTS.map((c) => (
              <tr key={c.item}>
                <td>{c.item}</td>
                <td>{c.note}</td>
                <td>${c.usd}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" colSpan={2}>
                Total
              </th>
              <td>
                <strong>${MADTOWN_MONTHLY_USD}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="cs-calc-note">{MADTOWN_COST_FOOTNOTE}</p>
      {stats && days.length > 0 ? (
        <>
          <dl className="cs-calc-out">
            <div>
              <dt>Visitors a day</dt>
              <dd>{fmt(perDay)}</dd>
            </div>
            <div>
              <dt>Games played</dt>
              <dd>{fmt(games)}</dd>
            </div>
            <div>
              <dt>Since launch</dt>
              <dd>{fmt(stats.visitorsSinceLaunch)}</dd>
            </div>
            <div>
              <dt>Per visitor-day</dt>
              <dd>{visitorDays ? `${fmt((MADTOWN_MONTHLY_USD / ((visitorDays / days.length) * 30)) * 100, 2)}¢` : '—'}</dd>
            </div>
          </dl>
          <p className="cs-calc-note">
            The last {days.length} full days, from madtown.today&apos;s own counts, refreshed twice a day. A visitor is one browser on one day, so someone who comes
            back every day counts every day. Games played adds up finished Four Lakes and Word games, solved Chair Stacks and Madison Asks votes. Per visitor-day
            is the monthly bill over a month of visitors at this pace.
          </p>
        </>
      ) : (
        <p className="cs-calc-note">madtown.today&apos;s live counts couldn&apos;t be loaded just now, so only the costs are shown.</p>
      )}
    </section>
  );
}
