'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MarkerClusterGroup } from 'leaflet.markercluster';
import { getMediaUrl, type PublicRoom } from '@/lib/api';

interface RoomsMapViewProps {
  rooms: PublicRoom[];
  onSelectRoom: (room: PublicRoom) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

type MapLayerMode = 'satellite' | 'plan';

const DEFAULT_CENTER: [number, number] = [45.8095, 1.3318]; // Feytiat
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 15;
const FEYTIAT_BOUNDS = L.latLngBounds([45.798, 1.314], [45.821, 1.350]);

const TYPOLOGIE_LABELS: Record<string, string> = {
  gymnase: 'Gymnase',
  salle_polyvalente: 'Salle polyvalente',
  salle_reunion: 'Salle de réunion',
};

const TYPOLOGIE_PIN_COLORS: Record<string, string> = {
  gymnase: '#146E67',
  salle_polyvalente: '#97BF0D',
  salle_reunion: '#CD2429',
};

const TILE_LAYERS: Record<MapLayerMode, { url: string; attribution: string }> = {
  satellite: {
    url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    attribution: '&copy; IGN-F/Géoportail',
  },
  plan: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createPinIcon(room: PublicRoom, isSelected: boolean): L.DivIcon {
  const pinColor = TYPOLOGIE_PIN_COLORS[room.typologie ?? 'salle_polyvalente'] ?? '#146E67';
  const labelBg = isSelected ? '#146E67' : '#ffffff';
  const labelColor = isSelected ? '#ffffff' : '#1E2420';
  const ringStyle = isSelected
    ? 'box-shadow:0 0 0 4px rgba(20,110,103,0.35),0 6px 14px rgba(0,0,0,0.35);transform:scale(1.1);'
    : 'box-shadow:0 4px 10px rgba(0,0,0,0.3);';

  return L.divIcon({
    className: 'custom-room-pin',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:auto;">
        <span style="background:${labelBg};color:${labelColor};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.22);margin-bottom:6px;line-height:1.2;">
          ${escapeHtml(room.nom)}
        </span>
        <div style="width:34px;height:34px;border-radius:9999px;background:${pinColor};border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;color:#ffffff;transition:transform 0.15s ease;${ringStyle}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"></path>
            <path d="M5 21V7l7-4 7 4v14"></path>
            <path d="M9 10h1"></path>
            <path d="M14 10h1"></path>
            <path d="M9 14h1"></path>
            <path d="M14 14h1"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function buildPopupHtml(room: PublicRoom): string {
  const mediaUrl = getMediaUrl(room.imageUrl);
  const typo = room.typologie ? TYPOLOGIE_LABELS[room.typologie] ?? 'Salle' : 'Salle';
  const badgeText = room.accesPmr ? 'Accès PMR · Disponible' : 'Disponible à la réservation';

  const thumbBlock = mediaUrl
    ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(room.nom)}" style="width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;display:block;background:#F7F8F4;" />`
    : `<div style="width:64px;height:64px;border-radius:12px;background:#F7F8F4;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#6D746E;">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
           <path d="M3 21h18"></path>
           <path d="M5 21V7l7-4 7 4v14"></path>
         </svg>
       </div>`;

  return `
    <div style="width:272px;padding:14px;font-family:inherit;color:#1E2420;background:#ffffff;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        ${thumbBlock}
        <div style="min-width:0;flex:1;">
          <div style="font-size:14px;font-weight:900;line-height:1.25;color:#1E2420;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${escapeHtml(room.nom)}
          </div>
          <div style="margin-top:2px;font-size:12px;font-weight:600;color:#6D746E;">
            Capacité : ${room.capaciteMax} pers. · ${escapeHtml(typo)}
          </div>
          <div style="margin-top:8px;display:inline-block;background:#CFEDE5;color:#146E67;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;">
            ${escapeHtml(badgeText)}
          </div>
        </div>
      </div>
      <button
        type="button"
        data-open-room-id="${room.id}"
        style="margin-top:12px;width:100%;background:#146E67;color:#ffffff;border:none;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;"
      >
        Voir la fiche
      </button>
    </div>
  `;
}

export default function RoomsMapView({
  rooms,
  onSelectRoom,
  onResetFilters,
  hasActiveFilters,
}: RoomsMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersByIdRef = useRef<Map<number, L.Marker>>(new Map());
  const onSelectRoomRef = useRef(onSelectRoom);
  const roomsRef = useRef(rooms);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [layerMode, setLayerMode] = useState<MapLayerMode>('satellite');

  useEffect(() => {
    onSelectRoomRef.current = onSelectRoom;
    roomsRef.current = rooms;
  }, [onSelectRoom, rooms]);

  // Initialisation unique de la carte Leaflet sans contrôles de zoom par défaut
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      minZoom: MIN_ZOOM,
      maxZoom: 19,
      maxBounds: FEYTIAT_BOUNDS,
      maxBoundsViscosity: 1.0,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    const initialLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: 19,
    }).addTo(map);

    const clusterGroup = new MarkerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 24,
    });
    map.addLayer(clusterGroup);

    const container = mapContainerRef.current;
    const handlePopupClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>('[data-open-room-id]');
      if (!btn) return;
      const id = Number(btn.getAttribute('data-open-room-id'));
      const found = roomsRef.current.find((r) => r.id === id);
      if (found) onSelectRoomRef.current(found);
    };
    container.addEventListener('click', handlePopupClick);

    map.on('popupclose', () => {
      setSelectedRoomId(null);
    });

    mapInstanceRef.current = map;
    tileLayerRef.current = initialLayer;
    clusterGroupRef.current = clusterGroup;

    return () => {
      container.removeEventListener('click', handlePopupClick);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  // Changement de fond de carte (Satellite / Plan)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_LAYERS[layerMode];
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [layerMode]);

  // Synchronisation des marqueurs lorsque la liste de salles filtrées change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markersByIdRef.current.clear();

    const geoRooms = rooms.filter(
      (r): r is PublicRoom & { latitude: number; longitude: number } =>
        typeof r.latitude === 'number' && typeof r.longitude === 'number',
    );

    if (geoRooms.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);

    geoRooms.forEach((room) => {
      const coords: [number, number] = [room.latitude, room.longitude];
      bounds.extend(coords);

      const marker = L.marker(coords, {
        icon: createPinIcon(room, false),
        title: room.nom,
      });

      marker.bindPopup(buildPopupHtml(room), {
        className: 'room-map-popup',
        closeButton: false,
        maxWidth: 290,
        offset: [0, -52],
      });

      marker.on('click', () => {
        setSelectedRoomId(room.id);
        map.flyTo(coords, Math.max(map.getZoom(), 15), { duration: 0.4 });
        marker.openPopup();
      });

      markersByIdRef.current.set(room.id, marker);
      clusterGroup.addLayer(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }, [rooms]);

  // Mise à jour visuelle du marqueur sélectionné sans recréer les calques ni fermer la popup
  useEffect(() => {
    markersByIdRef.current.forEach((marker, id) => {
      const room = roomsRef.current.find((r) => r.id === id);
      if (!room) return;
      marker.setIcon(createPinIcon(room, id === selectedRoomId));
    });
  }, [selectedRoomId]);

  const geoRoomsCount = rooms.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number',
  ).length;

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <section
      aria-label="Carte interactive des salles"
      className="relative h-144 w-full overflow-hidden bg-ink lg:h-160"
    >
      <div ref={mapContainerRef} className="z-0 h-full w-full" />

      {/* Contrôles de zoom épurés en haut à gauche */}
      <div className="absolute top-4 left-4 z-400 flex flex-col overflow-hidden rounded-soft border border-line bg-white shadow-card">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoomer sur la carte"
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-b border-line text-base font-bold text-ink transition-colors hover:bg-paper"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Dézoomer sur la carte"
          className="flex h-9 w-9 cursor-pointer items-center justify-center text-base font-bold text-ink transition-colors hover:bg-paper"
        >
          −
        </button>
      </div>

      {/* Sélecteur discret Satellite / Plan en haut à droite */}
      <div
        role="group"
        aria-label="Fond de carte"
        className="absolute top-4 right-4 z-400 inline-flex rounded-pill border border-line bg-white/95 p-1 shadow-card backdrop-blur-xs"
      >
        <button
          type="button"
          aria-pressed={layerMode === 'satellite'}
          onClick={() => setLayerMode('satellite')}
          className={`cursor-pointer rounded-pill px-3 py-1 text-caption font-bold uppercase tracking-wider transition-colors ${
            layerMode === 'satellite' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          aria-pressed={layerMode === 'plan'}
          onClick={() => setLayerMode('plan')}
          className={`cursor-pointer rounded-pill px-3 py-1 text-caption font-bold uppercase tracking-wider transition-colors ${
            layerMode === 'plan' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          }`}
        >
          Plan
        </button>
      </div>

      {/* Bannière contextuelle quand aucune salle ne correspond */}
      {geoRoomsCount === 0 && (
        <div
          role="status"
          className="absolute inset-x-4 top-16 z-400 mx-auto flex max-w-md flex-col items-center gap-3 rounded-card border border-line bg-white/95 p-5 text-center shadow-panel backdrop-blur-xs"
        >
          <p className="text-body-sm font-bold text-ink">
            Aucune salle géolocalisée ne correspond aux critères sélectionnés.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="cursor-pointer rounded-control bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary-hover"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </section>
  );
}
