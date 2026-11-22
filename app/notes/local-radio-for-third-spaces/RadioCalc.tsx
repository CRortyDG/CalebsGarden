'use client';

import { useId, useState } from 'react';
import { BITRATES, INCLUDED_GB, monthlyCost, transferGb } from './maths';

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

function Slider(props: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="cs-calc-row">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      <output htmlFor={id}>
        {fmt(props.value)} {props.unit}
      </output>
    </div>
  );
}

export default function RadioCalc() {
  const [shops, setShops] = useState(50);
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(30);
  const [kbps, setKbps] = useState(192);

  const gb = transferGb(kbps, shops, hours, days);
  const cost = monthlyCost(gb);
  const peakMbps = (shops * kbps) / 1000;

  return (
    <section className="cs-demo" aria-labelledby="radio-calc">
      <div className="cs-demo-head">
        <h3 id="radio-calc">Scale it yourself</h3>
        <span className="cs-demo-tag">Calculator</span>
      </div>
      <div className="cs-demo-bar" role="group" aria-label="Bitrate">
        {BITRATES.map((b) => (
          <button key={b} type="button" className={`cs-btn${b === kbps ? ' is-on' : ''}`} aria-pressed={b === kbps} onClick={() => setKbps(b)}>
            {b} kbps
          </button>
        ))}
      </div>
      <Slider label="Shops" value={shops} min={1} max={500} unit={shops === 1 ? 'shop' : 'shops'} onChange={setShops} />
      <Slider label="Hours a day" value={hours} min={1} max={24} unit="h" onChange={setHours} />
      <Slider label="Days a month" value={days} min={1} max={31} unit="days" onChange={setDays} />
      <dl className="cs-calc-out">
        <div>
          <dt>Transfer</dt>
          <dd>{gb >= 1000 ? `${fmt(gb / 1000, 2)} TB` : `${fmt(gb)} GB`}</dd>
        </div>
        <div>
          <dt>Monthly cost</dt>
          <dd>${fmt(cost, 2)}</dd>
        </div>
        <div>
          <dt>Per shop</dt>
          <dd>${fmt(cost / shops, 2)}</dd>
        </div>
        <div>
          <dt>Peak outgoing</dt>
          <dd>{fmt(peakMbps, 1)} Mbps</dd>
        </div>
      </dl>
      <p className="cs-calc-note">
        One $5 Nanode with {fmt(INCLUDED_GB / 1000)} TB included, then $0.005 per GB. Bandwidth only. Past a few hundred Mbps at peak, check the server&apos;s outgoing
        speed limit too, not just the transfer.
      </p>
    </section>
  );
}
