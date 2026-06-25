import React from 'react';
import SaveFrameArt from './SaveFrameArt';

export default function SaveFrameWrapper({ frameId, children, className = '', compact = false }) {
  if (!frameId) return children;

  const radiusClass = compact ? 'rounded-xl' : 'rounded-2xl';

  return (
    <div className={`relative w-full overflow-visible ${className}`}>
      {children}
      <SaveFrameArt frameId={frameId} compact={compact} radiusClass={radiusClass} />
    </div>
  );
}
