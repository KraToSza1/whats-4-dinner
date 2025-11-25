import React, { useState, useEffect } from 'react';
import ProModal from './ProModal.jsx';

/**
 * ProModalWrapper - Handles opening ProModal from anywhere in the app
 */
export default function ProModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenProModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openProModal', handleOpenProModal);
    return () => {
      window.removeEventListener('openProModal', handleOpenProModal);
    };
  }, []);

  return <ProModal open={isOpen} onClose={() => setIsOpen(false)} />;
}
