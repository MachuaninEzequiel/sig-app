import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";

const Legend = () => {
  const map = useContext(MapContext);
  const [visibleLayers, setVisibleLayers] = useState([]);

  // Actualizar leyenda cada vez que el usuario interactúa con el mapa (simple hack)
  useEffect(() => {
    if (!map) return;

    const update = () => {
      const active = map
        .getLayers()
        .getArray()
        .filter((l) => l.get("title") && l.getVisible());
      setVisibleLayers([...active]);
    };

    // Escuchar cambios de visibilidad (click en el mapa sirve de trigger generico)
    map.on("click", update);
    // También un intervalo para detectar cambios desde el LayerControl
    const interval = setInterval(update, 500);

    return () => clearInterval(interval);
  }, [map]);

  return (
    <div className="panel">
      <h3>Simbología</h3>
      {visibleLayers.map((l, i) => {
        const name = l.get("name");
        const src = `${CONFIG.geoserverUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${CONFIG.workspace}:${name}`;
        return (
          <div key={i} style={{ marginBottom: "10px" }}>
            <small>{l.get("title")}</small>
            <br />
            <img src={src} alt="Legend" />
          </div>
        );
      })}
    </div>
  );
};

export default Legend;
