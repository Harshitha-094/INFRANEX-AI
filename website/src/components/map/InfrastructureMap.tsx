import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident } from '../../types';
import {
  BENGALURU_CENTER,
  BENGALURU_DEFAULT_ZOOM,
  BENGALURU_LOCATION_LABEL,
  BENGALURU_SERVICE_BOUNDARY_POLYGON,
} from '../../utils/bengaluruBoundary';

interface InfrastructureMapProps {
  incidents?: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  selectableCoordinates?: boolean;
  onCoordinateSelect?: (coords: { lat: number; lng: number }) => void;
  selectedIncidentId?: string;
  markerCoordinates?: { lat: number; lng: number } | null;
  height?: string;
  center?: [number, number];
  zoom?: number;
  showBadge?: boolean;
}

export const InfrastructureMap: React.FC<InfrastructureMapProps> = ({
  incidents = [],
  onSelectIncident,
  selectableCoordinates = false,
  onCoordinateSelect,
  selectedIncidentId,
  markerCoordinates = null,
  height = '480px',
  center,
  zoom = BENGALURU_DEFAULT_ZOOM,
  showBadge = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  const initialCenter: [number, number] = center || [BENGALURU_CENTER.lat, BENGALURU_CENTER.lng];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: true,
      });

      // Standard OpenStreetMap tiles (no third-party API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Render Bengaluru Service Area Boundary Polygon
      boundaryLayerRef.current = L.polygon(BENGALURU_SERVICE_BOUNDARY_POLYGON, {
        color: '#06b6d4',
        weight: 2,
        dashArray: '6, 8',
        fillColor: '#06b6d4',
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        selectionMarkerRef.current = null;
      }
    };
  }, []);

  // Pan and re-center map when center or zoom changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom || mapInstanceRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Synchronize selection marker with markerCoordinates prop
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerCoordinates && markerCoordinates.lat && markerCoordinates.lng) {
      const latlng = L.latLng(markerCoordinates.lat, markerCoordinates.lng);
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.setLatLng(latlng);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div class="w-8 h-8 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-bounce">
            <span class="text-slate-950 font-bold text-xs">📍</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        selectionMarkerRef.current = L.marker(latlng, { icon: pickerIcon }).addTo(map);
      }
    } else {
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
        selectionMarkerRef.current = null;
      }
    }
  }, [markerCoordinates?.lat, markerCoordinates?.lng]);

  // Handle map click coordinate picking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!selectableCoordinates || !onCoordinateSelect) return;
      const { lat, lng } = e.latlng;
      const cleanLat = +lat.toFixed(5);
      const cleanLng = +lng.toFixed(5);
      onCoordinateSelect({ lat: cleanLat, lng: cleanLng });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectableCoordinates, onCoordinateSelect]);

  // Update incident markers when incidents change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    incidents.forEach((inc) => {
      const isSelected = inc.id === selectedIncidentId;
      const severityColor =
        inc.severity === 'critical'
          ? 'bg-rose-500 ring-rose-400/50 shadow-rose-500/50'
          : inc.severity === 'high'
          ? 'bg-amber-500 ring-amber-400/50 shadow-amber-500/50'
          : inc.severity === 'medium'
          ? 'bg-cyan-500 ring-cyan-400/50 shadow-cyan-500/50'
          : 'bg-emerald-500 ring-emerald-400/50 shadow-emerald-500/50';

      const categoryEmoji =
        inc.category === 'roads'
          ? '🚧'
          : inc.category === 'water'
          ? '💧'
          : inc.category === 'electrical'
          ? '⚡'
          : inc.category === 'lighting'
          ? '💡'
          : inc.category === 'drainage'
          ? '🌊'
          : '🏗️';

      const customIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div class="relative group cursor-pointer">
            ${
              inc.severity === 'critical'
                ? '<div class="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping"></div>'
                : ''
            }
            <div class="relative w-8 h-8 rounded-full ${severityColor} text-white font-bold text-xs flex items-center justify-center border-2 ${
          isSelected ? 'border-yellow-300 ring-4 ring-yellow-400/40 scale-125' : 'border-slate-900'
        } shadow-md transition-transform duration-200 hover:scale-125">
              <span>${categoryEmoji}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([inc.location.lat, inc.location.lng], { icon: customIcon });

      const popupHtml = `
        <div class="p-1 max-w-xs font-sans text-slate-100">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-semibold uppercase tracking-wider">${
              inc.id
            }</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              inc.severity === 'critical'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : inc.severity === 'high'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
            }">${inc.severity}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-100 leading-snug mb-1">${inc.title}</h4>
          <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">${inc.description}</p>
          <div class="text-[10px] text-slate-400 flex items-center gap-1 mb-2 font-mono">
            <span>📍 ${inc.location.address}</span>
          </div>
          <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span class="text-slate-400">AI Confidence: <strong class="text-cyan-400">${(
              inc.aiAnalysis.confidenceScore * 100
            ).toFixed(0)}%</strong></span>
            <span class="text-cyan-400 hover:underline font-semibold cursor-pointer">Open Details →</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });

      marker.addTo(layer);
    });
  }, [incidents, selectedIncidentId, onSelectIncident]);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl isolate ${
        selectableCoordinates ? 'cursor-crosshair' : ''
      }`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Clear Bengaluru, Karnataka Map Label */}
      {showBadge && (
        <div className="absolute top-3 right-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2 shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-bold tracking-wide text-white">{BENGALURU_LOCATION_LABEL}</span>
          <span className="text-[10px] font-mono text-cyan-400 border-l border-slate-700 pl-2">BBMP Jurisdiction</span>
        </div>
      )}

      {selectableCoordinates && (
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/50 text-xs text-cyan-300 flex items-center gap-2 shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Map Pinning Active • Click within Bengaluru to set or move pin
        </div>
      )}
    </div>
  );
};
