
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Bathroom, UserLocation, BathroomStatus } from '../types';
import { SLP_CENTER } from '../constants';
import { MapPinned, Loader2 } from 'lucide-react';

const MapController = ({ 
  selectedBathroom, 
  bathrooms, 
  userLocation,
  globalFitTrigger
}: { 
  selectedBathroom: Bathroom | null, 
  bathrooms: Bathroom[],
  userLocation: UserLocation | null,
  globalFitTrigger: number
}) => {
  const map = useMap();
  const hasInitialFitRef = useRef<boolean>(false);
  
  // Función para ajustar la vista a todos los baños
  const fitAllBathrooms = () => {
    if (bathrooms.length > 0) {
      const bounds = L.latLngBounds(bathrooms.map(b => [Number(b.lat), Number(b.lng)]));
      map.invalidateSize();
      map.fitBounds(bounds, { 
        padding: [80, 80], 
        maxZoom: 16, 
        duration: 1.5,
        animate: true 
      });
    } else {
      map.flyTo([SLP_CENTER.lat, SLP_CENTER.lng], 14, { duration: 1.5 });
    }
  };

  // Ajuste inicial cuando los datos se cargan
  useEffect(() => {
    if (bathrooms.length > 0) {
      setTimeout(fitAllBathrooms, 600);
      hasInitialFitRef.current = true;
    }
  }, [bathrooms]);

  // Asegurar que el mapa reconozca su tamaño correctamente de forma periódica
  useEffect(() => {
    const timer = setInterval(() => map.invalidateSize(), 2000);
    map.invalidateSize();
    return () => clearInterval(timer);
  }, [map]);

  // Trigger manual desde el botón global
  useEffect(() => {
    if (globalFitTrigger > 0) {
      fitAllBathrooms();
    }
  }, [globalFitTrigger]);

  // Enfoque a baño seleccionado
  useEffect(() => {
    if (selectedBathroom && selectedBathroom.lat && selectedBathroom.lng) {
      map.flyTo([Number(selectedBathroom.lat), Number(selectedBathroom.lng)], 18, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedBathroom, map]);

  return null;
};

const coweleIcon = new L.Icon({
  iconUrl: 'https://tritex.com.mx/coweleiconomapa.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48], 
  popupAnchor: [0, -48],
  className: 'cowele-marker-shadow'
});

const coweleHighlightedIcon = new L.Icon({
  iconUrl: 'https://tritex.com.mx/coweleiconomapa.png',
  iconSize: [56, 56],
  iconAnchor: [28, 56],
  popupAnchor: [0, -56],
  className: 'marker-pulse-cowele' 
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  bathrooms: Bathroom[];
  userLocation: UserLocation | null;
  onSelectBathroom: (b: Bathroom) => void;
  filterRadius: number;
  selectedBathroom: Bathroom | null;
  highlightedId?: string | null;
}

const MapView: React.FC<MapViewProps> = ({ 
  bathrooms, 
  userLocation, 
  onSelectBathroom, 
  filterRadius, 
  selectedBathroom,
  highlightedId 
}) => {
  const [globalFitTrigger, setGlobalFitTrigger] = useState(0);
  
  const validBathrooms = useMemo(() => bathrooms.filter(b => 
    b.lat !== undefined && b.lng !== undefined && 
    !isNaN(Number(b.lat)) && !isNaN(Number(b.lng))
  ), [bathrooms]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100%' }}>
      {/* Botón de Enfoque Global */}
      <button 
        onClick={() => setGlobalFitTrigger(prev => prev + 1)}
        className="absolute top-28 right-4 z-[400] bg-white text-secondary p-4 rounded-full shadow-2xl border-2 border-primary active:scale-90 transition-all group"
        title="Ver todos los baños"
      >
        <MapPinned className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      <MapContainer 
        center={[SLP_CENTER.lat, SLP_CENTER.lng]} 
        zoom={14} 
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapController 
          selectedBathroom={selectedBathroom} 
          bathrooms={validBathrooms} 
          userLocation={userLocation}
          globalFitTrigger={globalFitTrigger}
        />
        
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {userLocation && userLocation.lat && (
          <>
            <Marker position={[Number(userLocation.lat), Number(userLocation.lng)]} icon={userIcon} />
            <Circle 
              center={[Number(userLocation.lat), Number(userLocation.lng)]} 
              radius={filterRadius * 1000} 
              pathOptions={{ 
                color: '#F14513', 
                fillColor: '#F14513', 
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '5, 10'
              }} 
            />
          </>
        )}

        {validBathrooms.map(b => {
          const isSelected = highlightedId === b.id || (selectedBathroom && selectedBathroom.id === b.id);
          return (
            <Marker 
              key={b.id} 
              position={[Number(b.lat), Number(b.lng)]} 
              icon={isSelected ? coweleHighlightedIcon : coweleIcon} 
              eventHandlers={{ 
                click: () => onSelectBathroom(b) 
              }} 
              zIndexOffset={isSelected ? 1000 : 0}
            />
          );
        })}
      </MapContainer>

      <style>{`
        .cowele-marker-shadow {
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.3));
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .marker-pulse-cowele {
          filter: drop-shadow(0 0 12px #F14513);
          transform: scale(1.1);
          animation: map-marker-bounce 0.5s ease-out;
        }
        @keyframes map-marker-bounce {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MapView;
