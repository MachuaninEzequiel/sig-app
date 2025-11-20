// src/components/Map.jsx
import React, { useEffect, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Image as ImageLayer } from "ol/layer";
import { OSM, ImageWMS } from "ol/source";
import { fromLonLat } from "ol/proj";
import { ScaleLine } from "ol/control";
import { CONFIG } from "../config";

// Contexto para compartir el mapa con los controles
export const MapContext = React.createContext();

const MapWrapper = ({ children }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    // 1. Capas WMS iniciales
    const wmsLayers = CONFIG.layers.map(
      (l) =>
        new ImageLayer({
          source: new ImageWMS({
            url: `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wms`,
            params: { LAYERS: `${CONFIG.workspace}:${l.name}`, TILED: true },
            serverType: "geoserver",
          }),
          visible: l.visible,
          properties: { ...l }, // Guardar metadata (nombre, título) en la capa
        })
    );

    // 2. Inicializar Mapa
    const mapObject = new Map({
      target: "map-container",
      layers: [
        new TileLayer({ source: new OSM() }), // Capa base
        ...wmsLayers,
      ],
      view: new View({
        center: fromLonLat(CONFIG.center),
        zoom: CONFIG.zoom,
      }),
      controls: [], // Limpios
    });

    mapObject.addControl(new ScaleLine());
    setMap(mapObject);

    return () => mapObject.setTarget(null);
  }, []);

  return (
    <MapContext.Provider value={map}>
      <div
        id="map-container"
        style={{
          width: "100%",
          height: "100vh",
          position: "absolute",
          zIndex: 0,
        }}
      ></div>
      {/* Renderizamos los controles (hijos) solo cuando el mapa existe */}
      {map && <div className="ui-overlay">{children}</div>}
    </MapContext.Provider>
  );
};

export default MapWrapper;
