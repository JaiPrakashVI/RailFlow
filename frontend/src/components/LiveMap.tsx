import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface StationData {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  platforms_count: number;
}

interface TrackData {
  id: string;
  from_station_id: string;
  to_station_id: string;
  distance: number;
  speed_limit: number;
  single_line: boolean;
  status: string;
}

interface TrainData {
  id: string;
  name: string;
  type: string;
  status: string;
  delay: number;
  lat: number;
  lng: number;
  speed: number;
  platform: number;
  source: string;
  destination: string;
}

interface LiveMapProps {
  stations: StationData[];
  tracks: TrackData[];
  trains: TrainData[];
  onSelectTrain?: (trainId: string) => void;
  onSelectStation?: (stationId: string) => void;
  congestionOverlay?: boolean;
}

const LiveMap: React.FC<LiveMapProps> = ({
  stations,
  tracks,
  trains,
  onSelectTrain,
  onSelectStation,
  congestionOverlay = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tracksRef = useRef<L.Polyline[]>([]);
  const stationsRef = useRef<L.CircleMarker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center map on South India coordinate centroid
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([11.2, 78.5], 7);

    // Dark tile layer for enterprise style matching command rooms
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render Stations and Tracks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old tracks and stations
    tracksRef.current.forEach(t => t.remove());
    tracksRef.current = [];
    stationsRef.current.forEach(s => s.remove());
    stationsRef.current = [];

    // Render Tracks
    tracks.forEach(track => {
      const fromSt = stations.find(s => s.id === track.from_station_id);
      const toSt = stations.find(s => s.id === track.to_station_id);

      if (fromSt && toSt) {
        const coords: [number, number][] = [
          [fromSt.lat, fromSt.lng],
          [toSt.lat, toSt.lng]
        ];

        // Determine color
        let color = '#10b981'; // Emerald
        if (track.status === 'Maintenance') {
          color = '#8b5cf6'; // Violet
        } else if (track.status === 'Blocked') {
          color = '#ef4444'; // Crimson
        } else if (congestionOverlay) {
          // Congestion overlay mode (heatmaps style)
          const congestionVal = Math.random(); // Mocked congestion factor
          if (congestionVal > 0.75) color = '#ef4444';
          else if (congestionVal > 0.45) color = '#f59e0b';
        }

        const polyline = L.polyline(coords, {
          color: color,
          weight: track.single_line ? 2.5 : 4,
          opacity: 0.8,
          dashArray: track.status === 'Maintenance' ? '5, 5' : undefined
        }).addTo(map);

        // Bind popup
        polyline.bindTooltip(
          `Track ${track.id}<br>${fromSt.name} &harr; ${toSt.name}<br>Limit: ${track.speed_limit} km/h<br>Status: ${track.status}`,
          { sticky: true }
        );

        tracksRef.current.push(polyline);
      }
    });

    // Render Stations
    stations.forEach(station => {
      const circle = L.circleMarker([station.lat, station.lng], {
        radius: station.platforms_count > 6 ? 9 : 6,
        fillColor: '#0ea5e9', // Cyan
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.8
      }).addTo(map);

      circle.bindTooltip(`Station: ${station.name} (${station.code})<br>Platforms: ${station.platforms_count}`, { sticky: true });

      circle.on('click', () => {
        if (onSelectStation) {
          onSelectStation(station.id);
        }
      });

      stationsRef.current.push(circle);
    });

  }, [stations, tracks, congestionOverlay]);

  // Update Train Positions dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Identify trains to keep, add, and remove
    const activeTrainIds = new Set(trains.map(t => t.id));

    // Remove defunct markers
    Object.keys(markersRef.current).forEach(tId => {
      if (!activeTrainIds.has(tId)) {
        markersRef.current[tId].remove();
        delete markersRef.current[tId];
      }
    });

    // Create/update active markers
    trains.forEach(train => {
      // Ignore completed or scheduled (not on tracks yet) trains
      if (train.status === 'Completed' || train.status === 'Scheduled') {
        if (markersRef.current[train.id]) {
          markersRef.current[train.id].remove();
          delete markersRef.current[train.id];
        }
        return;
      }

      // Determine pulsing marker color
      let markerColor = 'var(--clr-emerald)';
      if (train.status === 'Delayed' || train.status === 'Running Late') {
        markerColor = 'var(--clr-amber)';
      } else if (train.status === 'Halted') {
        markerColor = 'var(--clr-crimson)';
      }

      const customIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            background-color: ${markerColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${markerColor};
            font-size: 8px;
            font-weight: bold;
            color: #000000;
          " class="pulse-animation">
            ${train.id.substring(1)}
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      if (markersRef.current[train.id]) {
        // Move existing marker smoothly
        markersRef.current[train.id].setLatLng([train.lat, train.lng]);
        markersRef.current[train.id].setIcon(customIcon);
        markersRef.current[train.id].getTooltip()?.setContent(
          `Train ${train.id}: ${train.name}<br>Status: ${train.status}<br>Delay: ${train.delay}m<br>Speed: ${Math.round(train.speed)} km/h`
        );
      } else {
        // Create new marker
        const marker = L.marker([train.lat, train.lng], { icon: customIcon }).addTo(map);
        marker.bindTooltip(
          `Train ${train.id}: ${train.name}<br>Status: ${train.status}<br>Delay: ${train.delay}m<br>Speed: ${Math.round(train.speed)} km/h`,
          { direction: 'top', offset: [0, -10] }
        );

        marker.on('click', () => {
          if (onSelectTrain) {
            onSelectTrain(train.id);
          }
        });

        markersRef.current[train.id] = marker;
      }
    });

  }, [trains]);

  return <div ref={mapContainerRef} className="map-panel" />;
};

export default LiveMap;
