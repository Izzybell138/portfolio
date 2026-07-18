import { useRef, useState } from 'react'

/**
 * <ImageSlot> — React port of the omelette `<image-slot>` custom element.
 *
 * Renders the user-fillable image placeholder: a framed slot with a dashed
 * ring, image icon, caption, and "browse files" sub-line. Clicking (or
 * dropping an image onto) the slot fills it, covering the frame. Shape is
 * controlled via `shape` ('rect' | 'rounded' | 'circle' | 'pill') and
 * `radius` (px, for 'rounded').
 */
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']

function radiusFor(shape, radius) {
  switch (shape) {
    case 'rect': return '0'
    case 'circle': return '50%'
    case 'pill': return '999px'
    case 'rounded':
    default: return (radius != null ? radius : 12) + 'px'
  }
}

export default function ImageSlot({
  shape = 'rounded',
  radius,
  placeholder = 'Drop an image',
  style = {},
}) {
  const inputRef = useRef(null)
  const [src, setSrc] = useState(null)
  const [over, setOver] = useState(false)
  const br = radiusFor(shape, radius)

  const loadFile = (file) => {
    if (!file || !ACCEPT.includes(file.type)) return
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files && e.dataTransfer.files[0]
    loadFile(file)
  }

  return (
    <div
      style={{
        display: 'block',
        position: 'relative',
        font: '13px/1.3 system-ui,-apple-system,sans-serif',
        color: 'rgba(0,0,0,.55)',
        width: '100%',
        height: '100%',
        aspectRatio: '3 / 2',
        ...style,
      }}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'rgba(0,0,0,.04)',
          borderRadius: br,
          outline: over ? '2px solid #c96442' : 'none',
          outlineOffset: '-2px',
        }}
      >
        {src ? (
          <img
            alt=""
            draggable="false"
            src={src}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
            }}
          />
        ) : (
          <div
            className="empty"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
              padding: '12px',
              boxSizing: 'border-box',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => inputRef.current && inputRef.current.click()}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.45 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <div className="cap" style={{ maxWidth: '90%', fontWeight: 500, letterSpacing: '.01em' }}>
              {placeholder}
            </div>
            <div className="sub" style={{ fontSize: '11px' }}>
              or <u style={{ textUnderlineOffset: '2px', textDecorationColor: 'rgba(0,0,0,.25)' }}>browse files</u>
            </div>
          </div>
        )}
      </div>
      {!src && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            border: over ? '1.5px dashed #c96442' : '1.5px dashed rgba(0,0,0,.25)',
            borderRadius: br,
            transition: 'border-color .12s',
          }}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        hidden
        onChange={(e) => loadFile(e.target.files && e.target.files[0])}
      />
    </div>
  )
}
