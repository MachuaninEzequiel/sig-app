import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";

const Legend = () => {
  const map = useContext(MapContext);
  const [visibleLayers, setVisibleLayers] = useState([]);

  useEffect(() => {
    if (!map) return;

    const updateLegends = () => {
      const active = map
        .getLayers()
        .getArray()
        .filter((l) => l.get("title") && l.getVisible());
      // Revertir para mostrar orden visual correcto (capa superior arriba)
      setVisibleLayers([...active].reverse());
    };

    updateLegends();

    // Detectar cambios en el mapa (paneo, zoom, cambio de capas)
    const key = map.on("rendercomplete", updateLegends);
    return () => map.un("rendercomplete", key);
  }, [map]);

  if (visibleLayers.length === 0) return null;

  return (
    <div className="panel legend-panel">
      <h3>Simbología</h3>
      <div className="legend-content">
        {visibleLayers.map((l, i) => {
          const name = l.get("name");
          const legendUrl = `${CONFIG.geoserverUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${CONFIG.workspace}:${name}`;

          return (
            <div key={i} className="legend-item">
              <span className="legend-title">{l.get("title")}</span>
              <img src={legendUrl} alt={l.get("title")} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Legend;
