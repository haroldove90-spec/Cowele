
import React, { useState } from 'react';
import { Star, Navigation, Accessibility, DollarSign, X, CheckCircle2, Clock, AlertCircle, MessageSquare, Send, Compass, Map as MapIcon, User } from 'lucide-react';
import { Bathroom, BathroomStatus } from '../types';

interface BathroomDetailCardProps {
  bathroom: Bathroom;
  distance: number | null;
  onClose: () => void;
  onStatusReport: (status: BathroomStatus) => void;
  onSubmitReview?: (bathroomId: string, rating: number, comment: string) => void;
}

const statusInfo: Record<BathroomStatus, { label: string, color: string, icon: any }> = {
  clean: { label: 'Limpio', color: 'bg-green-500', icon: CheckCircle2 },
  busy: { label: 'Con Fila', color: 'bg-yellow-500', icon: Clock },
  out_of_service: { label: 'Inactivo', color: 'bg-red-500', icon: AlertCircle }
};

const BathroomDetailCard: React.FC<BathroomDetailCardProps> = ({ bathroom, distance, onClose, onStatusReport, onSubmitReview }) => {
  const currentStatus = statusInfo[bathroom.status || 'clean'];
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [showNav, setShowNav] = useState(false);

  const navigateTo = (type: 'google' | 'waze') => {
    const url = type === 'google' 
      ? `https://www.google.com/maps/dir/?api=1&destination=${bathroom.lat},${bathroom.lng}`
      : `https://waze.com/ul?ll=${bathroom.lat},${bathroom.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  const reviews = bathroom.reviews || [];

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-[32px] shadow-2xl z-30 p-6 border border-gray-100 animate-in slide-in-from-bottom max-w-lg mx-auto overflow-hidden flex flex-col max-h-[85vh]">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 bg-gray-50 p-2 rounded-full hover:text-secondary z-10"><X className="w-5 h-5" /></button>

      <div className="flex gap-4 mb-4 shrink-0">
        <img src={bathroom.photo} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={bathroom.name} />
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-black text-lg italic uppercase truncate">{bathroom.name}</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase truncate">{bathroom.address}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-secondary font-black text-xs">{distance !== null ? `${(distance * 1000).toFixed(0)}m` : '--'}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black text-xs"><Star className="w-3 h-3 fill-current" /> {bathroom.rating}</div>
            <span className={`px-2 py-0.5 rounded-full text-white text-[8px] font-black uppercase ${currentStatus.color}`}>{currentStatus.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
        <button onClick={() => setShowNav(!showNav)} className="bg-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
          <Navigation className="w-4 h-4" /> Cómo llegar
        </button>
        <div className="flex gap-2">
           <div className={`flex-1 flex flex-col items-center justify-center rounded-xl bg-gray-50 ${bathroom.accessibility.wheelchair ? 'text-blue-500' : 'text-gray-200'}`}><Accessibility className="w-4 h-4" /></div>
           <div className={`flex-1 flex flex-col items-center justify-center rounded-xl bg-gray-50 ${bathroom.isPaid ? 'text-secondary' : 'text-green-500'}`}><DollarSign className="w-4 h-4" /></div>
        </div>
      </div>

      {showNav && (
        <div className="flex gap-2 mb-4 animate-in fade-in shrink-0">
          <button onClick={() => navigateTo('google')} className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase"><MapIcon className="w-4 h-4" /> Google Maps</button>
          <button onClick={() => navigateTo('waze')} className="flex-1 bg-cyan-50 text-cyan-600 p-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase"><Compass className="w-4 h-4" /> Waze</button>
        </div>
      )}

      {/* SECCIÓN DE RESEÑAS (Scrollable) */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
        <h4 className="text-[10px] font-black text-gray-400 uppercase italic">Reseñas de la comunidad ({reviews.length})</h4>
        {reviews.length === 0 ? (
          <p className="text-[10px] text-gray-300 font-bold italic py-4">Sé el primero en calificar este lugar...</p>
        ) : (
          reviews.slice(0, 5).map((r, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-secondary uppercase flex items-center gap-1"><User className="w-2 h-2" /> {r.user_name || 'Anónimo'}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star key={starIdx} className={`w-2 h-2 ${starIdx < (r.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-bold text-black">{r.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* CAPTURA DE RESEÑA */}
      <div className="bg-gray-50 p-4 rounded-3xl border-2 border-primary/20 shrink-0">
        <div className="flex items-center justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-125">
              <Star className={`w-6 h-6 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="¿Cómo está el baño hoy?" 
            className="flex-1 bg-white rounded-xl px-4 py-3 text-xs font-black text-black outline-none border-2 border-transparent focus:border-secondary placeholder:text-gray-400 shadow-inner" 
          />
          <button 
            onClick={() => { 
              if(reviewText.trim() && onSubmitReview) { 
                onSubmitReview(bathroom.id, rating, reviewText); 
                setReviewText(''); 
              } 
            }}
            className="bg-secondary text-white px-5 rounded-xl active:scale-95 shadow-lg flex items-center justify-center"
          ><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default BathroomDetailCard;
