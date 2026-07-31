'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure you want to delete the KPIs?",
  message = "Note: All entry history for the KPIs will be PERMANENTLY deleted."
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 pr-8 leading-tight">
            {title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            {message.split('PERMANENTLY').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="italic font-bold text-gray-700">PERMANENTLY</span>}
              </React.Fragment>
            ))}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-10">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-gray-600 font-bold rounded-xl transition-all active:scale-95"
            >
              No
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 px-6 bg-[#555cf8] hover:bg-[#4a51e2] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
