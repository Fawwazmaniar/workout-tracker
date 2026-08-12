import { LuDumbbell } from 'react-icons/lu';

const sessions = [
  { date: 'Mon · Upper strength', result: 'Completed · 11 sets' },
  { date: 'Sat · Lower strength', result: 'Completed · 12 sets' },
  { date: 'Thu · Push volume', result: 'Completed · 9 sets' },
];

export const History = () => {
  return (
    <section className="surface-page">
      <article className="surface-card">
        <header className="section-head">
          <div>
            <p className="section-title">History</p>
            <p className="section-subtitle">Last sessions and completion notes</p>
          </div>
          <span className="badge">This week</span>
        </header>

        <ul className="row-list">
          {sessions.map((session) => (
            <li className="row-item" key={session.date}>
              <div className="row-main">
                <LuDumbbell className="row-icon" aria-hidden="true" />
                <span className="row-text">{session.date}</span>
              </div>
              <span className="row-meta">{session.result}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
};
