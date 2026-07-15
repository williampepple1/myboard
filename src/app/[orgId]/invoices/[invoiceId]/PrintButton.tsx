'use client';

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm active:scale-95 transition-all duration-200"
    >
      <Printer size={18} />
      Print / Save as PDF
    </button>
  );
}
