
import React from 'react';
import { Download, X } from 'lucide-react';

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] bg-teal-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-xl">
          <Download className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <p className="font-bold text-sm">Instalar Aplicación</p>
          <p className="text-[10px] opacity-90">Acceso rápido y mejor experiencia</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onInstall}
          className="bg-white text-teal-600 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
        >
          INSTALAR
        </button>
        <button 
          onClick={onDismiss}
          className="p-1 opacity-70 hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
