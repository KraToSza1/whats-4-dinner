import { motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';

/**
 * Draggable meal card for meal planner
 */
export function DraggableMealCard({ recipe, onDrop, mealType, dayIndex, children }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const scale = useTransform(x, [-200, 200], [0.9, 1.1]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    // Check if dropped on a valid drop zone
    const dropZone = document.elementFromPoint(info.point.x, info.point.y);
    if (dropZone?.dataset?.dropZone === 'meal-slot') {
      const targetDay = dropZone.dataset.dayIndex;
      const targetMeal = dropZone.dataset.mealType;
      if (targetDay !== undefined && targetMeal) {
        onDrop?.(parseInt(targetDay), targetMeal, recipe);
      }
    }
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, scale }}
      animate={
        isDragging
          ? {
              scale: 1.1,
              zIndex: 1000,
            }
          : {
              scale: 1,
              zIndex: 1,
            }
      }
      whileDrag={{
        cursor: 'grabbing',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-90' : ''}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Drop zone for meal slots
 */
export function MealDropZone({ dayIndex, mealType, isOver, children }) {
  return (
    <motion.div
      data-drop-zone="meal-slot"
      data-day-index={dayIndex}
      data-meal-type={mealType}
      animate={
        isOver
          ? {
              scale: 1.05,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
            }
          : {
              scale: 1,
              backgroundColor: 'transparent',
            }
      }
      transition={{ duration: 0.2 }}
      className="relative min-h-[100px] rounded-lg border-2 border-dashed transition-colors"
    >
      {children}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-lg"
        >
          <span className="text-2xl">✨</span>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Drag handle component
 */
export function DragHandle() {
  return (
    <motion.div
      className="w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </motion.div>
  );
}
