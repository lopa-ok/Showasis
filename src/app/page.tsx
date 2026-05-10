import AppShell from "../components/AppShell";

export default function HomePage() {
  return (
    <AppShell title="Showasis" subtitle="Reserve your shower slot">
      <section className="panel-grid">
        <article className="panel panel-solid">
          <header className="panel-header">
            <p className="label">next booking</p>
            <span className="panel-tag">today</span>
          </header>
          <p className="panel-body">No shower reserved yet. Choose a slot to lock it in.</p>
          <div className="panel-footer">
            <span className="pill pill-accent">book a slot</span>
            <span className="pill">walk-ins 6-7 am</span>
          </div>
        </article>
        <article className="panel panel-solid">
          <header className="panel-header">
            <p className="label">available slots</p>
            <span className="panel-tag">may 10</span>
          </header>
          <ul className="panel-list">
            <li>7:00 am · 4 spots</li>
            <li>8:30 am · 2 spots</li>
            <li>6:00 pm · 3 spots</li>
          </ul>
          <div className="panel-footer">
            <span className="pill">refresh</span>
            <span className="pill">set reminder</span>
          </div>
        </article>
        <article className="panel panel-solid">
          <header className="panel-header">
            <p className="label">shower guide</p>
            <span className="panel-tag">details</span>
          </header>
          <ul className="panel-list">
            <li>10 min slots + 5 min buffer</li>
            <li>Bring your own towel</li>
            <li>Late arrivals lose the slot after 3 min</li>
          </ul>
        </article>
      </section>
    </AppShell>
  );
}