export interface Artist {
  id?: string;
  emri: string;
  mbiemri: string;
  lloji: string;
  lindja?: string;
  bio?: string;
  fotoUrl?: string;
  qyteti: string;
  qytetiEmri: string;
  vepraNr?: number;
  shtuesId?: string;
  shtuesEmri?: string;
  krijuarMe?: any;
}

export interface Work {
  id?: string;
  titulli: string;
  viti?: string;
  medium?: string;
  pershkrim?: string;
  imazhet?: string[];
  shtuesId?: string;
  krijuarMe?: any;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  count?: number;
}

export interface UserProfile {
  uid: string;
  emri: string;
  mbiemri: string;
  emriPlote: string;
  email: string;
  roli: 'artist' | 'shikues' | 'admin';
  krijuarMe?: any;
  approved?:boolean;
}

export const ARTIST_TYPES = [
  'Piktor', 'Skulptor', 'Fotograf', 'Muzikant',
  'Shkrimtar', 'Poet', 'Regjisor', 'Aktor', 'Arkitekt', 'Tjetër'
];

export const ALBANIA_CITIES: City[] = [
  { id:'tirane',      name:'Tiranë',       lat:41.3275, lng:19.8187, region:'Qendër' },
  { id:'durres',      name:'Durrës',        lat:41.3246, lng:19.4565, region:'Perëndim' },
  { id:'vlore',       name:'Vlorë',         lat:40.4667, lng:19.4833, region:'Jug' },
  { id:'shkoder',     name:'Shkodër',       lat:42.0683, lng:19.5126, region:'Veri' },
  { id:'elbasan',     name:'Elbasan',       lat:41.1125, lng:20.0822, region:'Qendër' },
  { id:'korce',       name:'Korçë',         lat:40.6186, lng:20.7808, region:'Lindje' },
  { id:'fier',        name:'Fier',          lat:40.7239, lng:19.5569, region:'Jug' },
  { id:'berat',       name:'Berat',         lat:40.7058, lng:19.9522, region:'Jug' },
  { id:'gjirokaster', name:'Gjirokastër',   lat:40.0758, lng:20.1389, region:'Jug' },
  { id:'sarande',     name:'Sarandë',       lat:39.8753, lng:20.0053, region:'Jug' },
  { id:'pogradec',    name:'Pogradec',      lat:40.9025, lng:20.6553, region:'Lindje' },
  { id:'lezhe',       name:'Lezhë',         lat:41.7836, lng:19.6433, region:'Veri' },
  { id:'kukes',       name:'Kukës',         lat:42.0750, lng:20.4219, region:'Veri' },
  { id:'lushnje',     name:'Lushnjë',       lat:40.9419, lng:19.7050, region:'Qendër' },
  { id:'puke',        name:'Pukë',          lat:42.0444, lng:19.9000, region:'Veri' },
];
