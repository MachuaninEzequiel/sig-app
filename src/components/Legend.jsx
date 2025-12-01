import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";

const Legend = ({ leyendaBtn, setLeyendaBtn }) => {
  const map = useContext(MapContext);
  const [visibleLayers, setVisibleLayers] = useState([]);
  
  // Estado para manejar el Pop-up
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!map) return;

    const updateLegends = () => {
      const active = map
        .getLayers()
        .getArray()
        .filter((l) => l.get("title") && l.getVisible());
      setVisibleLayers([...active].reverse());
    };

    updateLegends();

    const key = map.on("rendercomplete", updateLegends);
    return () => map.un("rendercomplete", key);
  }, [map]);

  if (visibleLayers.length === 0) return null;

  const closePreview = () => setPreviewImage(null);

  // --- FUNCIÓN CLAVE PARA QUE NO SE MUEVA EL MAPA ---
  const stopAllEvents = (e) => {
    e.stopPropagation();
    // Esto asegura que OpenLayers no reciba la señal de 'empezar a arrastrar'
    e.nativeEvent.stopImmediatePropagation(); 
  };

  return (
    <>
      <div className={`panel-leyenda legend-panel ${!leyendaBtn ? "collapsed" : ""}`}>
        <button
          className={`leyend-toggle ${leyendaBtn ? "open" : ""}`}
          onClick={() => setLeyendaBtn(!leyendaBtn)}
          title={leyendaBtn ? "Minimizar simbología" : "Mostrar simbología"}
        >
          {leyendaBtn ? "X" : "+"}
        </button>

        <h3>Simbología</h3>

        <div className="legend-content">
          {visibleLayers.map((l, i) => {
            const name = l.get("name");
            // Thumb pequeño
            const thumbUrl = `${CONFIG.geoserverUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${CONFIG.workspace}:${name}`;
            // Imagen Full
            const fullUrl = `${CONFIG.geoserverUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${CONFIG.workspace}:${name}`;

            return (
              <div key={i} className="legend-item">
                <span className="legend-title">{l.get("title")}</span>
                <img 
                    src={thumbUrl} 
                    alt={l.get("title")} 
                    className="legend-thumbnail"
                    onClick={() => setPreviewImage({ src: fullUrl, title: l.get("title") })}
                    title="Click para ampliar"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL / POP-UP --- */}
      {previewImage && (
        <div 
            className="legend-modal-overlay" 
            onClick={closePreview}
            // Evitamos que el scroll del mouse haga zoom en el mapa si estás sobre el overlay
            onWheel={stopAllEvents} 
        >
          <div 
            className="legend-modal-content" 
            // Detenemos TODOS los eventos que causan movimiento en el mapa
            onClick={(e) => e.stopPropagation()}
            onMouseDown={stopAllEvents}
            onPointerDown={stopAllEvents}
            onWheel={stopAllEvents}
            onDoubleClick={stopAllEvents}
          >
            <div className="legend-modal-header">
                <h4>{previewImage.title}</h4>
                <button className="close-modal-btn" onClick={closePreview}>✕</button>
            </div>
            <div className="legend-modal-body">
                <img src={previewImage.src} alt="Leyenda completa" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Legend;