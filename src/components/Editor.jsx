import React, { useContext, useState } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import WFS from "ol/format/WFS";

const Editor = () => {
  const map = useContext(MapContext);
  const [drawing, setDrawing] = useState(false);
  const [tempSource] = useState(new VectorSource());

  React.useEffect(() => {
    if (!map) return;
    const layer = new VectorLayer({ source: tempSource, zIndex: 1000 });
    map.addLayer(layer);
  }, [map]);

  const addPoint = () => {
    setDrawing(true);
    const draw = new Draw({ source: tempSource, type: "Point" });

    draw.on("drawend", async (evt) => {
      const feature = evt.feature;
      const name = prompt("Ingrese un nombre para el punto:");

      if (name) {
        // Configurar atributos para GeoServer
        feature.set("nombre", name); // Ajusta 'nombre' a tu columna real
        feature.setGeometryName(CONFIG.editLayer.geomField);

        // Crear Transacción WFS
        const formatWFS = new WFS();
        const node = formatWFS.writeTransaction([feature], null, null, {
          featureType: CONFIG.editLayer.name,
          featureNS: CONFIG.editLayer.featureNS,
          srsName: "EPSG:3857",
        });

        const payload = new XMLSerializer().serializeToString(node);

        try {
          const res = await fetch(
            `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wfs`,
            {
              method: "POST",
              body: payload,
              headers: { "Content-Type": "text/xml" },
            }
          );
          if (res.ok) alert("Guardado exitosamente!");
          else alert("Error al guardar. Revise consola.");
        } catch (err) {
          console.error(err);
          alert("Error de conexión (CORS?).");
        }
      }

      map.removeInteraction(draw);
      tempSource.clear();
      setDrawing(false);
    });

    map.addInteraction(draw);
  };

  return (
    <div className="panel highlight">
      <h3>Edición</h3>
      <button onClick={addPoint} disabled={drawing}>
        {drawing ? "Click en mapa..." : "➕ Nuevo Punto"}
      </button>
    </div>
  );
};

export default Editor;
