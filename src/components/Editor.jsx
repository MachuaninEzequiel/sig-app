import React, { useContext, useState, useEffect, useRef } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Circle, Fill, Stroke } from "ol/style";
import WFS from "ol/format/WFS";
import GeoJSON from "ol/format/GeoJSON";
import "../App.css"

const Editor = ({ onClose }) => {
  const map = useContext(MapContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editSource] = useState(new VectorSource());
  const drawRef = useRef(null);
  const [geometryType, setGeometryType] = useState("Point");

  useEffect(() => {
    if (!map) return;

    // Capa para mostrar los puntos mientras se edita
    const editLayer = new VectorLayer({
      source: editSource,
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: "rgba(102, 126, 234, 0.7)" }),
          stroke: new Stroke({ color: "#ffffff", width: 3 }),
        }),
      }),
      zIndex: 10000,
    });

    map.addLayer(editLayer);
    return () => {
      map.removeLayer(editLayer);
      if (drawRef.current) {
        map.removeInteraction(drawRef.current);
      }
    };
  }, [map, editSource]);

  const startEditing = () => {
    if (!map || isEditing) return;

    setIsEditing(true);
    editSource.clear();

    const draw = new Draw({
      source: editSource,
      type: geometryType,
      style: new Style({
        stroke: new Stroke({ color: "#667eea", width: 3 }),
        fill: new Fill({ color: "rgba(102, 126, 234, 0.2)" }),
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: "rgba(102, 126, 234, 0.5)" }),
          stroke: new Stroke({ color: "#667eea", width: 3 }),
        }),
      }),
    });

    draw.on("drawend", async (evt) => {
      const feature = evt.feature;

      // Pedir nombre al usuario
      const nombre = prompt("Ingrese el nombre del nuevo elemento:");

      if (!nombre || nombre.trim() === "") {
        // Si cancela o no ingresa nombre, limpiar y salir
        editSource.clear();
        map.removeInteraction(draw);
        drawRef.current = null;
        setIsEditing(false);
        return;
      }

      // Configurar el nombre del atributo
      feature.set("nombre", nombre.trim());

      // Configurar el nombre del campo de geometría
      feature.setGeometryName(CONFIG.editLayer.geomField);

      // Crear la transacción WFS-T
      // IMPORTANTE: Enviamos en EPSG:3857 (proyección del mapa)
      // GeoServer hará la conversión a EPSG:4326 automáticamente
      const formatWFS = new WFS();
      const node = formatWFS.writeTransaction([feature], null, null, {
        featureType: CONFIG.editLayer.name,
        featureNS: CONFIG.editLayer.featureNS,
        srsName: "EPSG:3857", // Cambio: usamos la proyección del mapa
        featurePrefix: CONFIG.workspace,
        geometryName: CONFIG.editLayer.geomField,
      });

      let payload = new XMLSerializer().serializeToString(node);

      // Fix: OpenLayers usa <geometry> pero nuestra columna es <geom>
      // Reemplazamos manualmente en el XML
      payload = payload.replace(/<geometry>/g, `<${CONFIG.editLayer.geomField}>`);
      payload = payload.replace(/<\/geometry>/g, `</${CONFIG.editLayer.geomField}>`);

      console.log("📤 Enviando WFS-T:", payload);

      try {
        const response = await fetch(
          `${CONFIG.geoserverUrl}/${CONFIG.workspace}/wfs`,
          {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "text/xml" },
          }
        );

        const responseText = await response.text();
        console.log("📥 Respuesta GeoServer:", responseText);

        if (response.ok && !responseText.includes("Exception")) {
          alert(`✅ Elemento "${nombre}" guardado exitosamente en la base de datos.`);

          // Limpiar el punto temporal (ya está en la base de datos)
          editSource.clear();

          // Refrescar la capa WMS para que se vean los nuevos elementos
          map.getLayers().forEach((layer) => {
            const layerName = layer.get("name");
            if (layerName === CONFIG.editLayer.name) {

              const source = layer.getSource();
              if (source && source.updateParams) {
              
                source.updateParams({ _t: Date.now() });
              }
            }
          });
        } else {
          console.error("Error en WFS-T:", responseText);
          alert("❌ Error al guardar el elemento. Revisa la consola para más detalles.");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        alert("❌ Error de conexión con GeoServer.");
      }

      
      map.removeInteraction(draw);
      drawRef.current = null;
      setIsEditing(false);
    });

    map.addInteraction(draw);
    drawRef.current = draw;
  };

  const cancelEditing = () => {
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    editSource.clear();
    setIsEditing(false);
  };

  return (
    <div className="panel editor-panel highlight-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0 }}>✏️ Dibujar </h3>
        <button
          onClick={onClose}
          className="btn-Dibujar"
          title="Cerrar panel de edición"
        >
          ×
        </button>
      </div>

      <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
        Agrega nuevos elementos al mapa
      </p>

      {!isEditing ? (
        <>
          <label style={{ fontSize: "0.9rem", fontWeight: "500", marginBottom: "5px", display: "block" }}>
            Tipo de geometría:
          </label>
          <select
            value={geometryType}
            onChange={(e) => setGeometryType(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "0.9rem",
            }}
          >
            <option value="Point">📍 Punto</option>
            <option value="LineString">📏 Línea</option>
            <option value="Polygon">⬡ Polígono</option>
          </select>

          <button
            onClick={startEditing}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#627ae4ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.95rem",
            }}
          >
            + Nuevo Elemento
          </button>
        </>
      ) : (
        <div>
          <p style={{
            backgroundColor: "#667eea",
            color: "white",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
            fontSize: "0.9rem",
            fontWeight: "500",
          }}>
            {geometryType === "Point" && "📍 Haz clic en el mapa para agregar un punto"}
            {geometryType === "LineString" && "📏 Haz clic para dibujar una línea (doble clic para terminar)"}
            {geometryType === "Polygon" && "⬡ Haz clic para dibujar un polígono (doble clic para terminar)"}
          </p>
          <button
            onClick={cancelEditing}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            ✖ Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default Editor;
