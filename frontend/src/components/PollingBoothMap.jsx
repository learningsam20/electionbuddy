import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Shield, Radio, ShieldAlert, Home, ChevronRight, Layers, AlertTriangle } from 'lucide-react';
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import useStore from '../store';

let gmapsInitialized = false;

export default function PollingBoothMap({ data, isOfficer = false }) {
  const { token, user } = useStore();
  const [resources, setResources] = useState([]);
  const [viewMode, setViewMode] = useState('district'); // district, booth
  const [selectedBooth, setSelectedBooth] = useState('PNE-01');
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    setLoading(true);
    const params = isOfficer 
      ? (viewMode === 'district' ? `district=${user?.district || 'Pune'}` : `booth_id=${selectedBooth}`)
      : `booth_id=${user?.voter_id || 'PNE-01'}`; // Mock booth for citizens
      
    fetch(`/api/v1/officer/ext/booth-resources?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setResources(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [isOfficer, viewMode, selectedBooth, token, user]);

  useEffect(() => {
    const initMap = async () => {
      try {
        if (!gmapsInitialized) {
          setOptions({
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            version: "weekly",
          });
          gmapsInitialized = true;
        }

        const { Map } = await importLibrary("maps");
        
        const center = resources.length > 0 
          ? { lat: resources[0].lat, lng: resources[0].lng }
          : { lat: 18.5204, lng: 73.8567 }; // Pune Default

        if (!googleMap.current && mapRef.current) {
          googleMap.current = new Map(mapRef.current, {
            center,
            zoom: viewMode === 'district' ? 12 : 18,
          });
        } else if (googleMap.current) {
          googleMap.current.setCenter(center);
          googleMap.current.setZoom(viewMode === 'district' ? 12 : 18);
        }

        // Clear existing markers
        markers.current.forEach(m => m.setMap(null));
        markers.current = [];

        // Add new markers using standard google.maps.Marker for compatibility
        resources.forEach(r => {
          const marker = new google.maps.Marker({
            position: { lat: r.lat, lng: r.lng },
            map: googleMap.current,
            title: r.name,
            label: {
              text: r.name.charAt(0),
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: r.type === 'control_room' ? '#4f46e5' : r.type === 'guard_room' ? '#f97316' : '#14b8a6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
              scale: 15
            }
          });
          markers.current.push(marker);
        });

      } catch (err) {
        console.error("Google Maps Load Error:", err);
        setMapError("Failed to load Google Maps. Please check your API key.");
      }
    };

    if (mapRef.current) {
      initMap();
    }
  }, [resources, viewMode, isOfficer, data]);

  const getIconForType = (type) => {
    switch (type) {
      case 'control_room': return <Radio size={20} />;
      case 'guard_room': return <Shield size={20} />;
      default: return <Home size={20} />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'control_room': return 'bg-indigo-500';
      case 'guard_room': return 'bg-orange-500';
      default: return 'bg-teal-500';
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    const params = viewMode === 'district' 
      ? `district=${user?.district || 'Pune'}` 
      : `booth_id=${selectedBooth}`;
      
    fetch(`/api/v1/officer/ext/booth-resources?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setResources(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-xl">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
          <MapPin className="text-red-500 mr-2" size={20} /> 
          {isOfficer ? `Logistics Command: ${user?.district || 'Pune'}` : 'Your Polling Station'}
        </h3>
        {isOfficer && (
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('district')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'district' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              District View
            </button>
            <button 
              onClick={() => setViewMode('booth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'booth' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Booth Detail
            </button>
          </div>
        )}
      </div>

      <div className="relative h-[450px] bg-slate-100 dark:bg-slate-900">
        <div ref={mapRef} className="w-full h-full" />
        
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 z-10 p-10 text-center">
             <AlertTriangle size={48} className="text-orange-500 mb-4" />
             <p className="text-slate-900 dark:text-white font-black text-xl mb-2">Map Load Error</p>
             <p className="text-slate-500 max-w-xs">{mapError}</p>
             <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
                <p className="text-xs font-black text-slate-400 uppercase mb-4">Fallback Visualization</p>
                <div className="flex justify-around">
                   {resources.map(r => (
                     <div key={r.id} className="flex flex-col items-center">
                        <div className={`p-3 rounded-full text-white ${getBgColor(r.type)}`}>{getIconForType(r.type)}</div>
                        <span className="text-[10px] font-bold mt-1 dark:text-slate-400">{r.name}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {loading && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl z-20 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
             <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs font-bold dark:text-white">Syncing Logistics...</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
        {isOfficer ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center space-x-3">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"><Radio size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Control Rooms</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{resources.filter(r => r.type === 'control_room').length}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center space-x-3">
               <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600"><Shield size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Guard Rooms</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{resources.filter(r => r.type === 'guard_room').length}</p>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center space-x-3">
               <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600"><Home size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Polling Booths</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{resources.filter(r => r.type === 'booth').length}</p>
               </div>
            </div>
            <button 
              onClick={handleRefresh}
              className="bg-slate-900 dark:bg-teal-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2"
            >
               <Layers size={18} /> Update Layout
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-8">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Distance</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white flex items-center"><Navigation size={18} className="text-teal-500 mr-2" /> 1.2 km</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Wait Time</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white flex items-center"><Clock size={18} className="text-orange-500 mr-2" /> 15 mins</p>
               </div>
            </div>
            <button className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2">
               Navigate to Booth <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
