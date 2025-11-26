import React, { useState, useEffect } from 'react';
import PremiumFeatureModal from './PremiumFeatureModal.jsx';

/**
 * PremiumFeatureModalWrapper - Handles opening PremiumFeatureModal from anywhere in the app
 */
export default function PremiumFeatureModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureKey, setFeatureKey] = useState(null);

  useEffect(() => {
    const handleOpenPremiumModal = event => {
      const feature = event.detail?.feature || 'meal_planner';
      setFeatureKey(feature);
      setIsOpen(true);
    };

    window.addEventListener('openPremiumFeatureModal', handleOpenPremiumModal);
    return () => {
      window.removeEventListener('openPremiumFeatureModal', handleOpenPremiumModal);
    };
  }, []);

  return (
    <PremiumFeatureModal isOpen={isOpen} onClose={() => setIsOpen(false)} featureKey={featureKey} />
  );
}
