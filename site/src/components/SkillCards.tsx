import { SKILLS } from "@/content/agent";

/**
 * The two skills, one card each. What triggers it, what it does, and what it
 * leaves behind in the record, because the last of those is the only part a
 * reader can go and check.
 */
export default function SkillCards() {
  return (
    <div className="cc-skills">
      {SKILLS.map((s) => (
        <section className="cc-skill" key={s.name}>
          <h3>{s.name}</h3>
          <div className="cc-label">Triggers on</div>
          <p className="cc-skill-t">{s.triggers}</p>
          <ul className="cc-skill-d">
            {s.does.map((d) => <li key={d}>{d}</li>)}
          </ul>
          <div className="cc-label">Leaves behind</div>
          <p className="cc-skill-w">{s.writes}</p>
        </section>
      ))}
    </div>
  );
}
