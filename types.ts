
export type BathroomStatus = 'clean' | 'busy' | 'out_of_service';

export interface Bathroom {
  id: string;
  name: string;
  address: string;
  fullAddress?: string;
  googleMapsUrl?: string;
  lat: number;
  lng: number;
  isPaid: boolean;
  price: number;
  rating: number;
  photo: string;
  accessibility: {
    wheelchair: boolean;
    babyChanging: boolean;
    genderNeutral: boolean;
  };
  payment: {
    coins: boolean;
    card: boolean;
    consumptionRequired: boolean;
  };
  status: BathroomStatus;
  lastReported: string;
  isAccessible: boolean;
  createdBy?: string; // Nombre del usuario que lo registró
  reviews?: Review[];
}

export interface Review {
  id: string;
  bathroom_id: string;
  user?: string;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}
