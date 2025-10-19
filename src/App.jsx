import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Zap, Trash2, Map, MapPin, Layers, Menu, X } from "lucide-react";

export default function SatelliteMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [lat, setLat] = useState(-0.8947);
  const [lng, setLng] = useState(100.3357);
  const [zoom, setZoom] = useState(11);
  const [tileLayer, setTileLayer] = useState("satelliteLabeled");
  const [geoJsonLayer, setGeoJsonLayer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const tileLayers = {
    osm: {
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 19,
    },
    satellite: {
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 18,
    },
    satelliteLabeled: {
      name: "Satellite Labeled",
      url: "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 20,
    },
    terrain: {
      name: "Terrain",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 19,
    },
    dark: {
      name: "Dark Mode",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 19,
    },
    light: {
      name: "Light Mode",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 19,
    },
    positron: {
      name: "Positron",
      url: "https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 19,
    },
    voyager: {
      name: "Voyager",
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: "by Developer © GeoTax Arutala 2025",
      maxZoom: 18,
    },
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = L.map(mapRef.current).setView([lat, lng], zoom);

    const currentLayer = tileLayers[tileLayer];
    L.tileLayer(currentLayer.url, {
      attribution: currentLayer.attribution,
      maxZoom: currentLayer.maxZoom,
    }).addTo(newMap);

    newMap.on("moveend", () => {
      const center = newMap.getCenter();
      setLat(parseFloat(center.lat.toFixed(4)));
      setLng(parseFloat(center.lng.toFixed(4)));
      setZoom(newMap.getZoom());
    });

    setMap(newMap);

    return () => {
      newMap.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const currentLayer = tileLayers[tileLayer];
    L.tileLayer(currentLayer.url, {
      attribution: currentLayer.attribution,
      maxZoom: currentLayer.maxZoom,
    }).addTo(map);
  }, [tileLayer, map]);

  const handleChangeTileLayer = (layerKey) => {
    setTileLayer(layerKey);
  };

  const handleReset = () => {
    if (map) {
      map.setView([-0.8947, 100.3357], 11);
      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        setGeoJsonLayer(null);
      }
      setSelectedFile(null);
    }
  };

  const loadGeoJsonFile = async (fileName) => {
    if (!map) return;

    try {
      const response = await fetch(`/data/geojson/${fileName}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const geojson = await response.json();

      if (!geojson.features || geojson.features.length === 0) {
        throw new Error("No features found in GeoJSON");
      }

      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
      }

      const newLayer = L.geoJSON(geojson, {
        style: {
          color: "#FF6B6B",
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
              .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
              .join("<br>");
            layer.bindPopup(popupContent);
          }
        },
      }).addTo(map);

      setGeoJsonLayer(newLayer);
      setSelectedFile(fileName);

      try {
        const bounds = newLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        } else {
          console.warn("Bounds not valid, using default view");
          map.setView([-1.13, 100.17], 11);
        }
      } catch (e) {
        console.error("Error getting bounds:", e);
        map.setView([-1.13, 100.17], 11);
      }
    } catch (error) {
      alert(`Error loading GeoJSON: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white flex flex-col">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 p-3 lg:p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2 lg:gap-3">
            <Zap className="text-yellow-400" size={28} />
            <span className="hidden sm:inline">GeoTax Arutala Map Viewer</span>
            <span className="sm:hidden">GeoTax</span>
          </h1>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => handleChangeTileLayer("satelliteLabeled")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "satelliteLabeled"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            🛰️ Satellite
          </button>
          <button
            onClick={() => handleChangeTileLayer("osm")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "osm"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            🗺️ OSM
          </button>
          <button
            onClick={() => handleChangeTileLayer("terrain")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "terrain"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            ⛰️ Terrain
          </button>
          {/* <button
            onClick={() => handleChangeTileLayer("dark")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "dark"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            🌙 Dark
          </button>
          <button
            onClick={() => handleChangeTileLayer("light")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "light"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            ☀️ Light
          </button> */}
          <button
            onClick={() => handleChangeTileLayer("voyager")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "voyager"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            🧭 Voyager
          </button>
          <button
            onClick={() => handleChangeTileLayer("positron")}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base transition duration-300 ${
              tileLayer === "positron"
                ? "bg-yellow-500 text-slate-900 shadow-lg"
                : "bg-slate-700 hover:bg-slate-600"
            }`}>
            ◾ Positron
          </button>

          <div className="border-l border-slate-600 h-8 mx-2"></div>

          <div className="text-xs lg:text-sm flex gap-2 lg:gap-4 flex-wrap">
            <div className="flex gap-1">
              <span className="text-slate-400">📍 Latitude:</span>
              <span className="font-mono">{lat}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-400">📍 Longitude:</span>
              <span className="font-mono">{lng}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-400">🔍 Zoom:</span>
              <span className="font-mono">{zoom}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-3 lg:gap-4 p-3 lg:p-4 overflow-hidden">
        <div
          ref={mapRef}
          className="flex-1 rounded-lg shadow-2xl border-2 border-slate-600 bg-slate-700"
          style={{ minHeight: "0" }}
        />

        <div
          className={`fixed lg:relative right-0 top-0 h-full lg:h-auto w-80 lg:w-72 bg-slate-800 rounded-lg border-2 border-slate-600 shadow-2xl flex flex-col transition-transform duration-300 z-50 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
          style={{ zIndex: isMobile ? 9999 : "auto" }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 p-2 hover:bg-slate-700 rounded-lg">
              <X size={20} />
            </button>
          )}

          <div className="p-4 overflow-y-auto flex flex-col flex-1">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400 mt-8 lg:mt-0">
              <Layers size={22} />
              Layer Data
            </h2>

            <div className="space-y-2 flex-1">
              <button
                onClick={() => {
                  loadGeoJsonFile("Batas_Kecmatan_Padang_WGS84.geojson");
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full text-sm p-3 rounded-lg transition font-medium flex items-center gap-3 ${
                  selectedFile === "Batas_Kecmatan_Padang_WGS84.geojson"
                    ? "bg-green-600 hover:bg-green-700 shadow-lg"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}>
                <MapPin size={18} />
                Batas Kecamatan Padang
              </button>
              <button
                onClick={() => {
                  loadGeoJsonFile("ZNT_AirTawarBarat_WGS84.geojson");
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full text-sm p-3 rounded-lg transition font-medium flex items-center gap-3 ${
                  selectedFile === "ZNT_AirTawarBarat_WGS84.geojson"
                    ? "bg-green-600 hover:bg-green-700 shadow-lg"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}>
                <MapPin size={18} />
                ZNT Air Tawar
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-600">
              <button
                onClick={() => {
                  handleReset();
                  if (isMobile) setSidebarOpen(false);
                }}
                className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-medium transition duration-300 flex items-center justify-center gap-2">
                <Trash2 size={18} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ zIndex: 9998 }}
          />
        )}
      </div>
    </div>
  );
}
