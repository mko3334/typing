import React from 'react';

export function parseFuriganaString(str = '') {
  const segments = [];
  const re = /\{([^|{}]+)\|([^{}]+)\}/g;
  let lastIndex = 0;

  for (const match of str.matchAll(re)) {
    if (match.index > lastIndex) {
      segments.push({ type: 'plain', text: str.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'ruby', reading: match[1], text: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < str.length) {
    segments.push({ type: 'plain', text: str.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'plain', text: str }];
}

export default function FuriganaText({ children, className = '', rubyClassName = '' }) {
  const text = typeof children === 'string' ? children : '';
  const segments = parseFuriganaString(text);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === 'ruby' ? (
          <ruby key={index} className="furigana-ruby">
            {segment.text}
            <rt className={rubyClassName || 'furigana-rt'}>{segment.reading}</rt>
          </ruby>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
