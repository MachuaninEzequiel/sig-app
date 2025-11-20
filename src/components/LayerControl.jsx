import React, { useContext, useState, useEffect, useMemo } from "react";
import { MapContext } from "./Map";

const LayerControl = () => {
  const map = useContext(MapContext);
  const [layers, setLayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Cargar capas al inicio
  useEffect(() => {
    if (!map) return;
    // Obtenemos todas las capas que definimos en config (tienen propiedad 'title')
    const logicLayers = map
      .getLayers()
      .getArray()
      .filter((l) => l.get("title"));
    setLayers(logicLayers);
  }, [map]);

  const toggle = (layer) => {
    layer.setVisible(!layer.getVisible());
    setLayers([...layers]); // Forzar re-render
  };

  // 2. Agrupar capas por categoría (Memorizado para no recalcular en cada render)
  const groupedLayers = useMemo(() => {
    const groups = {};
    layers.forEach((layer) => {
      // Si escribimos en el buscador, ignoramos las categorías
      if (searchTerm !== "") return;

      // Obtener categoría o usar "Sin Categoría" por defecto
      const cat = layer.get("category") || "Otras";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(layer);
    });
    return groups;
  }, [layers, searchTerm]);

  // 3. Filtrar capas cuando se usa el buscador
  const filteredLayers = layers.filter((layer) =>
    layer.get("title").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!map) return null;

  return (
    <div className="panel layer-control-panel">
      <h3>Capas ({layers.length})</h3>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar capa..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="layer-search"
      />

      <div className="layer-list-container">
        {/* MODO BÚSQUEDA ACTIVO */}
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
          /* MODO CATEGORÍAS (ACORDEÓN) */
          Object.entries(groupedLayers).map(([category, groupLayers]) => (
            <details key={category} open={false}>
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

// Componente pequeño para cada item (checkbox)
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
