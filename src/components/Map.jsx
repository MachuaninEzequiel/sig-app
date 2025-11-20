import React, { useEffect, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Image as ImageLayer } from "ol/layer";
import { OSM, ImageWMS } from "ol/source";
import { fromLonLat } from "ol/proj";
import { ScaleLine, Zoom } from "ol/control"; // Importamos ScaleLine
import { CONFIG } from "../config";

// Exportamos el contexto para usarlo en los hijos
export const MapContext = React.createContext();

const MapWrapper = ({ children }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    // 1. Configurar Capas WMS desde config.js
    const wmsLayers = CONFIG.layers.map(
      (l) =>
        new ImageLayer({
          source: new ImageWMS({
            url: `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wms`,
            params: { LAYERS: `${CONFIG.workspace}:${l.name}`, TILED: true },
            serverType: "geoserver",
          }),
          visible: l.visible,
          // Guardamos metadata importante en la capa
          properties: {
            title: l.title,
            name: l.name,
            category: l.category,
          },
        })
    );

    // 2. Inicializar el objeto Mapa
    const mapObject = new Map({
      target: "map-container",
      layers: [
        new TileLayer({ source: new OSM() }), // Capa Base
        ...wmsLayers,
      ],
      view: new View({
        center: fromLonLat(CONFIG.center),
        zoom: CONFIG.zoom,
      }),
      controls: [], // Limpiamos controles por defecto para personalizar
    });

    // 3. AGREGAR CONTROLES (Zoom y ESCALA)
    mapObject.addControl(new Zoom());
    mapObject.addControl(
      new ScaleLine({ units: "metric", bar: true, text: true, minWidth: 140 })
    );

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
      {/* Renderizamos la interfaz sobre el mapa solo cuando esté listo */}
      {map && <div className="ui-overlay">{children}</div>}
    </MapContext.Provider>
  );
};

export default MapWrapper;
