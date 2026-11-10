export default function EmptyState({ icon: IconComponent, title, description, action }) {
  return (
    <div className="empty-state empty-state-enhanced">
      {IconComponent && (
        <div className="empty-state-icon" aria-hidden="true">
          <IconComponent size={27} />
        </div>
      )}

      {title && <p className="empty-state-title">{title}</p>}
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}

      <style>{`
        .empty-state-enhanced {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 190px;
          padding: 30px 18px;
          border: 1px dashed var(--border-color, rgba(167, 139, 250, .22));
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(139, 92, 246, .045), transparent 72%);
          text-align: center;
        }
        .empty-state-icon {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          margin-bottom: 2px;
          border: 1px solid rgba(167, 139, 250, .2);
          border-radius: 17px;
          color: #b9a4ff;
          background: rgba(139, 92, 246, .1);
        }
        .empty-state-title {
          margin: 0;
          color: var(--text-primary, inherit);
          font-size: 14px;
          font-weight: 750;
          line-height: 1.4;
        }
        .empty-state-description {
          max-width: 420px;
          margin: 0;
          color: var(--text-muted, #9692a8);
          font-size: 11px;
          line-height: 1.65;
        }
        .empty-state-action { margin-top: 5px; }
      `}</style>
    </div>
  )
}
