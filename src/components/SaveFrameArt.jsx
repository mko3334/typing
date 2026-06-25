import React from 'react';

const FRAME_BORDER = {
  sakura: { width: 5, color: '#f472b6', outer: '#fbcfe8' },
  mint: { width: 5, color: '#10b981', outer: '#a7f3d0' },
  sky: { width: 5, color: '#0284c7', outer: '#7dd3fc' },
  lemon: { width: 5, color: '#eab308', outer: '#fde047' },
  lavender: { width: 5, color: '#7c3aed', outer: '#c4b5fd' },
  gold: { width: 6, color: '#d97706', outer: '#fbbf24' },
  diamond: { width: 6, color: '#0891b2', outer: '#67e8f9' },
  fire: { width: 5, color: '#ea580c', outer: '#fb923c' },
  star: { width: 5, color: '#7c3aed', outer: '#fde047' },
  trophy: { width: 6, color: '#c2410c', outer: '#fbbf24' },
};

function SakuraPetal({ r = 10, rot = 0, fill = '#fda4af', stroke = '#e11d48' }) {
  const pts = [];
  for (let i = 0; i < 5; i += 1) {
    const a = ((rot + i * 72 - 90) * Math.PI) / 180;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth="1.5" />;
}

function SakuraCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,32) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <SakuraPetal r={13} rot={0} />
        <SakuraPetal r={8} rot={36} fill="#fbcfe8" stroke="#fb7185" />
        <circle r="3" fill="#be123c" />
        <circle cx="16" cy="-4" r="2" fill="#fb7185" />
        <circle cx="-14" cy="6" r="2" fill="#fb7185" />
      </g>
    </svg>
  );
}

function MintCluster({ flipX = false, flipY = false }) {
  const leaf = (x, y, rot) => (
    <path
      key={`${x}-${y}-${rot}`}
      d="M0,0 C6,-12 16,-8 14,3 C10,12 0,8 0,0 Z"
      fill="#6ee7b7"
      stroke="#059669"
      strokeWidth="1.5"
      transform={`translate(${x},${y}) rotate(${rot})`}
    />
  );
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(28,28) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        {leaf(0, 0, -20)}
        {leaf(8, 4, 25)}
        {leaf(-6, 8, -50)}
      </g>
    </svg>
  );
}

function CloudCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(30,34) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <ellipse cx="0" cy="0" rx="16" ry="10" fill="#fff" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="-12" cy="4" rx="10" ry="8" fill="#fff" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="12" cy="4" rx="11" ry="9" fill="#fff" stroke="#38bdf8" strokeWidth="2" />
      </g>
    </svg>
  );
}

function LemonCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,32) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <path d="M-12,0 A12,12 0 0,1 12,0 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#eab308" strokeWidth="1.5" />
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#eab308" strokeWidth="1" />
        <line x1="5" y1="-5" x2="-5" y2="5" stroke="#eab308" strokeWidth="1" />
      </g>
    </svg>
  );
}

function LavenderCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,32) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx={Math.cos((deg * Math.PI) / 180) * 9}
            cy={Math.sin((deg * Math.PI) / 180) * 9}
            rx="4.5"
            ry="7"
            fill="#ddd6fe"
            stroke="#7c3aed"
            strokeWidth="1.2"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="3.5" fill="#a78bfa" />
      </g>
    </svg>
  );
}

function GoldCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,36) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <path
          d="M-14,8 L-9,-8 L-3,2 L0,-12 L3,2 L9,-8 L14,8 Z"
          fill="#fde047"
          stroke="#b45309"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="-14" y="8" width="28" height="5" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function DiamondCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,32) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <polygon points="0,-16 12,-4 0,16 -12,-4" fill="#a5f3fc" stroke="#0891b2" strokeWidth="2" />
        <polygon points="0,-16 12,-4 0,0 -12,-4" fill="#e0f2fe" stroke="#0891b2" strokeWidth="1.5" />
        <line x1="0" y1="-16" x2="0" y2="16" stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="-12" y1="-4" x2="12" y2="-4" stroke="#22d3ee" strokeWidth="1.5" />
        <circle r="3" fill="#fff" stroke="#0e7490" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function FireCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,38) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <path d="M0,16 C-8,6 -6,-8 0,-16 C6,-8 8,6 0,16 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" />
        <path d="M0,12 C-4,4 -3,-2 0,-8 C3,-2 4,4 0,12 Z" fill="#fde047" />
      </g>
    </svg>
  );
}

function StarCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,32) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <polygon
          points="0,-14 3.5,-4.5 14,-4.5 5.5,2.5 9,13 0,6.5 -9,13 -5.5,2.5 -14,-4.5 -3.5,-4.5"
          fill="#fde047"
          stroke="#7c3aed"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

function TrophyCluster({ flipX = false, flipY = false }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" aria-hidden>
      <g transform={`translate(32,34) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}>
        <path d="M-10,0 L-7,-10 L7,-10 L10,0 L8,8 L-8,8 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
        <rect x="-5" y="8" width="10" height="5" rx="1" fill="#d97706" />
        <path d="M-14,-2 Q-8,-12 -2,-2" fill="none" stroke="#ca8a04" strokeWidth="2" />
        <path d="M14,-2 Q8,-12 2,-2" fill="none" stroke="#ca8a04" strokeWidth="2" />
      </g>
    </svg>
  );
}

const CORNER_ART = {
  sakura: SakuraCluster,
  mint: MintCluster,
  sky: CloudCluster,
  lemon: LemonCluster,
  lavender: LavenderCluster,
  gold: GoldCluster,
  diamond: DiamondCluster,
  fire: FireCluster,
  star: StarCluster,
  trophy: TrophyCluster,
};

function EdgeMotif({ frameId }) {
  if (frameId === 'sakura') {
    return (
      <svg viewBox="0 0 120 20" className="h-5 w-16" aria-hidden>
        {[20, 50, 80, 110].map((x) => (
          <circle key={x} cx={x} cy="10" r="3" fill="#fb7185" />
        ))}
        <path d="M10,10 Q30,2 50,10 T90,10 T110,10" fill="none" stroke="#f9a8d4" strokeWidth="2" />
      </svg>
    );
  }
  if (frameId === 'sky') {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden>
        <circle cx="20" cy="20" r="10" fill="#fde047" stroke="#f59e0b" strokeWidth="2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="20"
            y1="20"
            x2={20 + Math.cos((deg * Math.PI) / 180) * 16}
            y2={20 + Math.sin((deg * Math.PI) / 180) * 16}
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    );
  }
  if (frameId === 'diamond') {
    return (
      <svg viewBox="0 0 80 20" className="h-4 w-20" aria-hidden>
        <polygon points="10,10 20,2 30,10 20,18" fill="#bae6fd" stroke="#0891b2" strokeWidth="1.5" />
        <polygon points="40,10 50,2 60,10 50,18" fill="#e0f2fe" stroke="#0891b2" strokeWidth="1.5" />
        <polygon points="70,10 80,2 90,10 80,18" fill="#bae6fd" stroke="#0891b2" strokeWidth="1.5" />
      </svg>
    );
  }
  if (frameId === 'gold' || frameId === 'trophy') {
    return (
      <svg viewBox="0 0 60 16" className="h-4 w-14" aria-hidden>
        <rect x="4" y="6" width="52" height="4" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        {[12, 30, 48].map((x) => (
          <circle key={x} cx={x} cy="8" r="3" fill="#fde047" stroke="#92400e" strokeWidth="1" />
        ))}
      </svg>
    );
  }
  return null;
}

export function getFrameBorder(frameId) {
  return FRAME_BORDER[frameId] || { width: 4, color: '#a855f7', outer: '#ddd6fe' };
}

export function SaveFrameDecorations({ frameId, compact = false }) {
  const Art = CORNER_ART[frameId];
  if (!Art) return null;

  const size = compact ? 36 : 52;
  const offset = compact ? -6 : -8;

  const corners = [
    { flipX: false, flipY: false, top: offset, left: offset },
    { flipX: true, flipY: false, top: offset, right: offset },
    { flipX: true, flipY: true, bottom: offset, right: offset },
    { flipX: false, flipY: true, bottom: offset, left: offset },
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <div
          key={index}
          className="pointer-events-none absolute z-[15]"
          style={{
            width: size,
            height: size,
            top: corner.top,
            left: corner.left,
            right: corner.right,
            bottom: corner.bottom,
          }}
        >
          <Art flipX={corner.flipX} flipY={corner.flipY} />
        </div>
      ))}
      {!compact && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-[15] -translate-x-1/2 -translate-y-1/2">
          <EdgeMotif frameId={frameId} />
        </div>
      )}
    </>
  );
}

export default function SaveFrameArt({ frameId, compact = false, radiusClass = 'rounded-2xl' }) {
  const border = getFrameBorder(frameId);
  if (!frameId) return null;

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-[15] ${radiusClass}`}
        style={{
          boxShadow: `inset 0 0 0 ${border.width}px ${border.color}, inset 0 0 0 ${border.width + 4}px ${border.outer}`,
        }}
      />
      <SaveFrameDecorations frameId={frameId} compact={compact} />
    </>
  );
}
