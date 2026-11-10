import { CheckIcon, XIcon } from '../Icons'

export default function SkillList({ skills = [], type = 'neutral' }) {
  if (!skills || skills.length === 0) return null

  const variant = ['neutral', 'matched', 'missing'].includes(type) ? type : 'neutral'

  return (
    <div className={`skills-list skills-list-polished ${variant}`}>
      {skills.map((skill, index) => (
        <span key={`${skill}-${index}`} className={`skill-chip skill-chip-polished ${variant}`}>
          {variant === 'missing' && <XIcon size={11} aria-hidden="true" />}
          {variant === 'matched' && <CheckIcon size={11} aria-hidden="true" />}
          <span>{skill}</span>
        </span>
      ))}

      <style>{`
        .skills-list-polished {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
        }
        .skill-chip-polished {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 25px;
          max-width: 100%;
          padding: 5px 9px;
          border: 1px solid var(--border-color, rgba(167, 139, 250, .2));
          border-radius: 7px;
          color: var(--text-secondary, #c8c2d8);
          background: rgba(139, 92, 246, .055);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .skill-chip-polished.matched {
          border-color: rgba(52, 211, 153, .24);
          color: var(--success, #34d399);
          background: rgba(52, 211, 153, .075);
        }
        .skill-chip-polished.missing {
          border-color: rgba(248, 113, 113, .23);
          color: var(--danger, #f87171);
          background: rgba(248, 113, 113, .065);
        }
        .skill-chip-polished svg { flex: 0 0 auto; }
      `}</style>
    </div>
  )
}
