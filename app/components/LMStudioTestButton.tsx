'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import LMStudioModal from './LMStudioModal';

export default function LMStudioTestButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Протестировать LM Studio
      </button>

      <LMStudioModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}