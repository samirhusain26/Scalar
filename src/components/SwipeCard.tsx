import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Entity } from '../types';

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  entity: Entity;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

export function SwipeCard({ entity, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const yesOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const noOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    }
  };

  if (!isTop) {
    // Stacked card behind — static, slightly offset
    return (
      <div className="absolute inset-0 border border-charcoal/30 bg-paper-white px-6 py-8 font-mono translate-y-2 scale-[0.96]">
        <div className="text-center">
          <div className="text-lg font-bold uppercase tracking-widest text-charcoal/30">
            {entity.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      drag="x"
      dragSnapToOrigin
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      className="absolute inset-0 border-2 border-charcoal bg-paper-white px-6 py-8 font-mono cursor-grab active:cursor-grabbing touch-manipulation select-none z-10 shadow-[4px_4px_0px_0px_#18181B]"
    >
      {/* YES indicator */}
      <motion.div
        style={{ opacity: yesOpacity }}
        className="absolute top-4 right-4 border-2 border-thermal-green text-thermal-green px-3 py-1 text-sm font-bold uppercase tracking-widest rotate-12"
      >
        YES
      </motion.div>

      {/* NO indicator */}
      <motion.div
        style={{ opacity: noOpacity }}
        className="absolute top-4 left-4 border-2 border-thermal-orange text-thermal-orange px-3 py-1 text-sm font-bold uppercase tracking-widest -rotate-12"
      >
        NO
      </motion.div>

      {/* Card content */}
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold uppercase tracking-widest text-charcoal text-center">
          {entity.name}
        </div>
      </div>

      {/* Swipe hints at bottom */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6">
        <span className="text-[10px] text-charcoal/30 uppercase tracking-widest">← No</span>
        <span className="text-[10px] text-charcoal/30 uppercase tracking-widest">Yes →</span>
      </div>
    </motion.div>
  );
}
