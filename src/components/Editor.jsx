import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Circle, Fill, Stroke } from "ol/style";
import WFS from "ol/format/WFS";

const Editor = () => {
  const map = useContext(MapContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editSource] = useState(new VectorSource());

  useEffect(() => {
    if (!map) return;
    const editLayer = new VectorLayer({
      source: editSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: "#ff0000" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
      zIndex: 1000,
    });
    map.addLayer(editLayer);
    return () => map.removeLayer(editLayer);
  }, [map, editSource]);

  const startEditing = () => {
    if (!map) return;
    setIsEditing(true);
    const draw = new Draw({ source: editSource, type: "Point" });

    draw.on("drawend", async (evt) => {
      const feature = evt.feature;
      map.removeInteraction(draw);

      const nombre = prompt("Nombre del nuevo elemento:");

      if (nombre) {
        feature.set("nombre", nombre); // Asegúrate de que esta columna exista
        feature.setGeometryName(CONFIG.editLayer.geomField);

        const formatWFS = new WFS();
        const node = formatWFS.writeTransaction([feature], null, null, {
          featureType: CONFIG.editLayer.name,
          featureNS: CONFIG.editLayer.featureNS,
          srsName: "EPSG:3857",
        });

        const payload = new XMLSerializer().serializeToString(node);

        try {
          const response = await fetch(
            `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wfs`,
            {
              method: "POST",
              body: payload,
              headers: { "Content-Type": "text/xml" },
            }
          );
          if (response.ok) alert("✅ Guardado exitosamente.");
          else alert("❌ Error al guardar.");
        } catch (error) {
          console.error(error);
          alert("❌ Error de conexión.");
        }
      }

      editSource.clear();
      setIsEditing(false);
    });

    map.addInteraction(draw);
  };

  return (
    <div className="panel editor-panel highlight-panel">
      <h3>Edición</h3>
      <button
        onClick={startEditing}
        disabled={isEditing}
        style={{ width: "100%", padding: "10px" }}
      >
        {isEditing ? "Click en el mapa..." : "➕ Nuevo Punto"}
      </button>
    </div>
  );
};

export default Editor;
