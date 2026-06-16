import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';

// X位置をカラム（2列）に固定して積み上げる
// それぞれの列に絵文字を下から積んでいく

const COL_COUNT = 2;
const EMOJI_SIZE = 42; // px

const PhysicsSidebar = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const [items, setItems] = useState([]); // { id, emoji, col, row, animating }

  // 各列の積み上げ数を管理
  const colCountsRef = useRef([0, 0]);

  useImperativeHandle(ref, () => ({
    dropEmoji: (emoji) => {
      const id = Date.now() + Math.random();

      // 少ない列に積む（バランス調整）
      const col = colCountsRef.current[0] <= colCountsRef.current[1] ? 0 : 1;
      const row = colCountsRef.current[col];
      colCountsRef.current[col]++;

      setItems(prev => [...prev, { id, emoji, col, row, animating: true }]);

      // アニメーション完了後にanimatingフラグをoff
      setTimeout(() => {
        setItems(prev =>
          prev.map(item => item.id === id ? { ...item, animating: false } : item)
        );
      }, 700);
    },
    clearAll: () => {
      setItems([]);
      colCountsRef.current = [0, 0];
    },
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => {
        const colWidth = 50; // %
        // xはカラム中央
        const x = item.col === 0 ? 25 : 75; // %

        // bottomは行数 × サイズ
        const bottomPx = item.row * (EMOJI_SIZE - 4);

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              transform: 'translateX(-50%)',
              fontSize: EMOJI_SIZE,
              lineHeight: 1,
              // animating中はtopから落下、完了したらbottomに固定
              ...(item.animating ? {
                top: 0,
                bottom: 'auto',
                animation: `fall-to-${item.row}-${item.col} 0.65s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
              } : {
                bottom: bottomPx,
                top: 'auto',
                transform: `translateX(-50%) rotate(${(item.col === 0 ? -1 : 1) * (3 + (item.row % 3) * 2)}deg)`,
              }),
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
              transition: item.animating ? 'none' : 'bottom 0.3s ease-out',
            }}
          >
            {item.emoji}
          </div>
        );
      })}

      {/* 動的な落下アニメーション用のstyle要素 */}
      <style>{`
        @keyframes fall-simple {
          0% {
            top: -60px;
            opacity: 0;
            transform: translateX(-50%) scale(0.5) rotate(-15deg);
          }
          60% {
            opacity: 1;
            transform: translateX(-50%) scale(1.15) rotate(5deg);
          }
          80% {
            transform: translateX(-50%) scale(0.95) rotate(-3deg);
          }
          100% {
            top: calc(100% - 52px);
            opacity: 1;
            transform: translateX(-50%) scale(1) rotate(2deg);
          }
        }
      `}</style>

      {items.filter(i => i.animating).map(item => (
        <div
          key={`anim-${item.id}`}
          style={{
            position: 'absolute',
            left: `${item.col === 0 ? 25 : 75}%`,
            transform: 'translateX(-50%)',
            fontSize: EMOJI_SIZE,
            lineHeight: 1,
            top: '-60px',
            animation: 'fall-simple 0.65s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
            pointerEvents: 'none',
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
});

export default PhysicsSidebar;
