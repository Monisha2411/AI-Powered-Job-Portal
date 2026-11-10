
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../Icons'

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = '',
}) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const modalWidth =
    size === 'lg' ? '760px' :
    size === 'sm' ? '420px' :
    '560px'

  return createPortal(
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(7, 6, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: modalWidth,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          background: 'var(--surface)',
          color: 'var(--text)',
          boxShadow: '0 25px 80px rgba(0,0,0,.5)',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '15px',
              padding: '18px 22px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <span
                style={{
                  width: '4px',
                  height: '24px',
                  borderRadius: '5px',
                  background: '#9675f5',
                }}
              />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750 }}>
                {title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="icon-btn"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        <div
          style={{
            padding: '22px',
            overflowY: 'auto',
            minHeight: 0,
            flex: 1,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '15px 22px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
