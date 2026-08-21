import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Filter, X, ExternalLink, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/services/api';
import type { MapMarker, MapRoute, RailwayZone } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  HEALTHY: '#16a34a',
  ATTENTION: '#f59e0b',
  CRITICAL: '#dc2626',
  UNDER_MAINTENANCE: '#3b82f6',
  RETIRED: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  HEALTHY: 'Healthy',
  ATTENTION: 'Attention',
  CRITICAL: 'Critical',
  UNDER_MAINTENANCE: 'Under Maintenance',
  RETIRED: 'Retired',
};

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [zones, setZones] = useState<RailwayZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    api.zones.list().then(setZones).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (zoneFilter) params.zone_id = Number(zoneFilter);
        if (statusFilter) params.status = statusFilter;
        const [m, r] = await Promise.all([
          api.maps.markers(Object.keys(params).length ? params : undefined),
          api.maps.routes(),
        ]);
        setMarkers(m);
        setRoutes(r);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [zoneFilter, statusFilter]);

  const filteredTypes = useMemo(() => {
    const types = new Set(markers.map((m) => m.fitting_type).filter(Boolean));
    return Array.from(types);
  }, [markers]);

  const displayMarkers = useMemo(() => {
    if (!typeFilter) return markers;
    return markers.filter((m) => m.fitting_type === typeFilter);
  }, [markers, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Railway Asset Map</h1>
          <p className="text-sm text-slate-500 mt-1">{displayMarkers.length} fittings displayed</p>
        </div>
      </div>

      <div className="glass-card-static p-3 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-400" />
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-rail-blue"
        >
          <option value="">All Zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-rail-blue"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-rail-blue"
        >
          <option value="">All Types</option>
          {filteredTypes.map((t) => (
            <option key={t} value={t!}>{t}</option>
          ))}
        </select>
        <div className="flex gap-2 ml-auto">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {STATUS_LABELS[status]?.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card-static overflow-hidden relative" style={{ height: 'calc(100vh - 260px)' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 size={24} className="animate-spin text-rail-blue" />
          </div>
        )}
        <MapContainerInner
          markers={displayMarkers}
          routes={routes}
          selectedMarker={selectedMarker}
          onSelectMarker={setSelectedMarker}
        />
      </div>

      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 glass-strong z-50 overflow-y-auto p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Asset Details</h3>
              <button
                onClick={() => setSelectedMarker(null)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <InfoRow label="Fitting Code" value={selectedMarker.fitting_code} />
              <InfoRow label="Type" value={selectedMarker.fitting_type || '--'} />
              <InfoRow label="Location" value={selectedMarker.location_name || '--'} />
              <InfoRow
                label="Health Score"
                value={
                  <span className={clsx(
                    'font-semibold',
                    selectedMarker.health_score >= 70 ? 'text-green-600' :
                    selectedMarker.health_score >= 40 ? 'text-amber-600' :
                    'text-red-600'
                  )}>
                    {selectedMarker.health_score}
                  </span>
                }
              />
              <InfoRow label="Status" value={
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${STATUS_COLORS[selectedMarker.status]}20`, color: STATUS_COLORS[selectedMarker.status] }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[selectedMarker.status] }} />
                  {STATUS_LABELS[selectedMarker.status]}
                </span>
              } />
              <InfoRow label="Latitude" value={selectedMarker.latitude.toFixed(6)} />
              <InfoRow label="Longitude" value={selectedMarker.longitude.toFixed(6)} />
            </div>
            <a
              href={`/fittings/${selectedMarker.id}`}
              className="mt-4 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-rail-blue border border-rail-blue rounded-lg hover:bg-rail-blue/5 transition-colors"
            >
              <ExternalLink size={14} />
              View Passport
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

interface MapInnerProps {
  markers: MapMarker[];
  routes: MapRoute[];
  selectedMarker: MapMarker | null;
  onSelectMarker: (m: MapMarker) => void;
}

function MapContainerInner({ markers, routes, selectedMarker, onSelectMarker }: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [22.5, 78.9],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    markers.forEach((m) => {
      const color = STATUS_COLORS[m.status] || '#6b7280';
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;"/>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon });
      marker.bindPopup(`
        <div style="font-size:12px;min-width:150px;">
          <strong>${m.fitting_code}</strong><br/>
          <span style="color:#666;">${m.fitting_type || 'Unknown'}</span><br/>
          Health: <strong>${m.health_score}</strong><br/>
          Status: <strong style="color:${color}">${STATUS_LABELS[m.status]}</strong><br/>
          ${m.location_name ? `<em>${m.location_name}</em>` : ''}
        </div>
      `);
      marker.on('click', () => onSelectMarker(m));
      layer.addLayer(marker);
    });
  }, [markers, onSelectMarker]);

  useEffect(() => {
    if (!mapRef.current || !routesLayerRef.current) return;
    const layer = routesLayerRef.current;
    layer.clearLayers();

    routes.forEach((r) => {
      if (r.latitudes.length && r.longitudes.length) {
        const latlngs = r.latitudes.map((lat, i) => [lat, r.longitudes[i]] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: '#0B5CAB',
          weight: 3,
          opacity: 0.6,
          dashArray: '6, 4',
        });
        polyline.bindTooltip(r.name);
        layer.addLayer(polyline);
      }
    });
  }, [routes]);

  useEffect(() => {
    if (!mapRef.current || !selectedMarker) return;
    mapRef.current.setView([selectedMarker.latitude, selectedMarker.longitude], 14);
  }, [selectedMarker]);

  return <div ref={containerRef} className="w-full h-full" />;
}
