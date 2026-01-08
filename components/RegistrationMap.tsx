
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { SLP_CENTER } from '../constants';

const miniCoweleIcon = new L.Icon({
  iconUrl: 'https://tritex.com.mx/coweleiconomapa.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'drop-shadow-lg'
});

interface RegistrationMapProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

const MapController = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  
  useEffect(() => {
    // Forzar el redibujado para evitar que el mapa se vea gris o mal centrado
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        // Usamos setView para un centrado exacto y flyTo para suavidad
        map.setView([lat, lng], map.getZoom() || 18, { animate: true });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [map, lat, lng]);

  return null;
};

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(
        parseFloat(lat.toFixed(10)), 
        parseFloat(lng.toFixed(10))
      );
      // Centrar automáticamente donde se hace clic
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.5 });
    },
  });
  return null;
};

const RegistrationMap: React.FC<RegistrationMapProps> = ({ lat, lng, onLocationSelect }) => {
  // Verificación de seguridad para coordenadas
  const safeLat = (lat && !isNaN(lat) && lat !== 0) ? lat : SLP_CENTER.lat;
  const safeLng = (lng && !isNaN(lng) && lng !== 0) ? lng : SLP_CENTER.lng;

  return (
    <div className="w-full h-64 rounded-[32px] overflow-hidden border-4 border-primary shadow-2xl relative z-10 bg-gray-100">
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={18}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          maxZoom={19}
        />
        <Marker 
          position={[safeLat, safeLng]} 
          icon={miniCoweleIcon} 
          zIndexOffset={1000}
        />
        <MapController lat={safeLat} lng={safeLng} />
        <LocationPicker onLocationSelect={onLocationSelect} />
      </MapContainer>
      
      {/* Indicador de ayuda Pro */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none z-[500] flex justify-center">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[9px] font-black uppercase text-secondary shadow-xl border border-secondary/10 flex items-center gap-2 animate-bounce">
           <span className="w-2 h-2 bg-secondary rounded-full animate-ping"></span>
           Modo Precisión Arquitecto Activo
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-[500]">
        <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[7px] font-bold uppercase tracking-tighter">
          {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
        </div>
      </div>
    </div>
  );
};

export default RegistrationMap;
