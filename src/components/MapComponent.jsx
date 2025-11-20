// src/components/MapComponent.jsx
import React, { useEffect, useContext, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import OSM from "ol/source/OSM";
import ImageWMS from "ol/source/ImageWMS";
import ScaleLine from "ol/control/ScaleLine";
import { fromLonLat } from "ol/proj";
import { MapContext } from "../context/MapContext";
import { CONFIG } from "../config";

const MapComponent = () => {
  const mapRef = useRef();
  const { setMap } = useContext(MapContext);

  useEffect(() => {
    // 1. Capa Base OSM
    const osmLayer = new TileLayer({
      source: new OSM(),
      properties: { title: "Mapa Base (OSM)", isBase: true },
    });

    // 2. Capas WMS desde Config
    const wmsLayers = CONFIG.layers.map((layerConfig) => {
      return new ImageLayer({
        source: new ImageWMS({
          url: `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wms`,
          params: {
            LAYERS: `${CONFIG.workspace}:${layerConfig.name}`,
            TILED: true,
          },
          serverType: "geoserver",
        }),
        visible: layerConfig.visible,
        properties: { title: layerConfig.title, name: layerConfig.name }, // Guardamos metadata
      });
    });

    // 3. Inicializar Mapa
    const mapObj = new Map({
      target: mapRef.current,
      layers: [osmLayer, ...wmsLayers],
      view: new View({
        center: fromLonLat(CONFIG.center),
        zoom: CONFIG.zoom,
      }),
      controls: [], // Limpiamos controles por defecto para agregar ScaleLine manual
    });

    // 4. Control de Escala [cite: 14]
    mapObj.addControl(new ScaleLine({ units: "metric" }));

    setMap(mapObj);

    return () => mapObj.setTarget(null);
  }, [setMap]);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
};

export default MapComponent;
