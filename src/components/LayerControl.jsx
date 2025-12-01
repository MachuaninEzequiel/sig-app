import React, { useContext, useState, useEffect, useMemo } from "react";
import { MapContext } from "./Map";

const LayerControl = () => {
  const map = useContext(MapContext);
  const [layers, setLayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!map) return;
    const logicLayers = map
      .getLayers()
      .getArray()
      .filter((l) => l.get("title"));
    setLayers(logicLayers);
  }, [map]);

  const toggle = (layer) => {
    layer.setVisible(!layer.getVisible());
    setLayers([...layers]);
  };

  
  const hideAllLayers = () => {
    layers.forEach((l) => l.setVisible(false));
    
    setLayers([...layers]);
  };

  
  const hasVisibleLayers = layers.some((l) => l.getVisible());

  
  const groupedLayers = useMemo(() => {
    const groups = {};
    layers.forEach((layer) => {
      if (searchTerm !== "") return;
      const cat = layer.get("category") || "Otras";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(layer);
    });
    return groups;
  }, [layers, searchTerm]);

  const filteredLayers = layers.filter((layer) =>
    layer.get("title").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!map) return null;

  return (
    <div className="panel layer-control-panel">
      <h3>Capas ({layers.length})</h3>
      
      <input
        type="text"
        placeholder="Buscar capa..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="layer-search"
      />

      
      <button 
        className="btn-clean-layers" 
        onClick={hideAllLayers}
        disabled={!hasVisibleLayers} 
        title="Ocultar todas las capas visibles"
      >
        Desactivar todas las capas
      </button>

      <div className="layer-list-container">
        {searchTerm !== "" ? (
          <div className="search-results">
            {filteredLayers.length > 0 ? (
              filteredLayers.map((l, i) => (
                <LayerItem key={i} layer={l} toggle={toggle} />
              ))
            ) : (
              <p style={{ color: "#999", textAlign: "center" }}>
                No hay resultados
              </p>
            )}
          </div>
        ) : (
          Object.entries(groupedLayers).map(([category, groupLayers]) => (
            <details key={category}>
              <summary>
                {category} <span className="badge">{groupLayers.length}</span>
              </summary>
              <div className="group-content">
                {groupLayers.map((l, i) => (
                  <LayerItem key={i} layer={l} toggle={toggle} />
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
};

const LayerItem = ({ layer, toggle }) => (
  <div className="layer-item">
    <label>
      <input
        type="checkbox"
        checked={layer.getVisible()}
        onChange={() => toggle(layer)}
      />
      <span title={layer.get("title")}>{layer.get("title")}</span>
    </label>
  </div>
);

export default LayerControl;