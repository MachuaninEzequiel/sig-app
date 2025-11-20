import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Draw, DragBox } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke, Circle, Fill } from "ol/style";
import { getLength } from "ol/sphere";
import GeoJSON from "ol/format/GeoJSON";
import { toLonLat } from "ol/proj";

const Tools = () => {
  const map = useContext(MapContext);
  const [activeTool, setActiveTool] = useState(null);
  const [results, setResults] = useState(null);
  const [measureVal, setMeasureVal] = useState(null);

  // Capa auxiliar para dibujos
  const [vectorSource] = useState(new VectorSource());

  useEffect(() => {
    if (!map) return;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({ color: "#ffcc33", width: 3 }),
        image: new Circle({ radius: 7, fill: new Fill({ color: "#ffcc33" }) }),
        fill: new Fill({ color: "rgba(255, 255, 0, 0.1)" }),
      }),
      zIndex: 999,
    });
    map.addLayer(vectorLayer);
    return () => map.removeLayer(vectorLayer);
  }, [map, vectorSource]);

  const clearInteractions = () => {
    if (!map) return;
    map.getInteractions().forEach((i) => {
      if (i instanceof Draw || i instanceof DragBox) map.removeInteraction(i);
    });
    vectorSource.clear();
    setResults(null);
    setMeasureVal(null);
  };

  // --- MEDIR ---
  const activateMeasure = () => {
    clearInteractions();
    setActiveTool("measure");
    const draw = new Draw({ source: vectorSource, type: "LineString" });
    draw.on("drawend", (evt) => {
      const length = getLength(evt.feature.getGeometry());
      setMeasureVal(`${(length / 1000).toFixed(2)} km`);
    });
    map.addInteraction(draw);
  };

  // --- CONSULTA PUNTO (WMS) ---
  const activatePointInfo = () => {
    clearInteractions();
    setActiveTool("info-point");
  };

  // --- CONSULTA CAJA (WFS) ---
  const activateBoxInfo = () => {
    clearInteractions();
    setActiveTool("info-box");
    const box = new DragBox(); // DragBox estándar
    box.on("boxend", () => queryWFSByBox(box.getGeometry().getExtent()));
    map.addInteraction(box);
  };

  // Manejador de click para WMS
  useEffect(() => {
    if (!map || activeTool !== "info-point") return;

    const handleMapClick = async (evt) => {
      const viewRes = map.getView().getResolution();
      const visibleLayers = map
        .getLayers()
        .getArray()
        .filter((l) => l.getVisible() && l.get("name"));

      if (visibleLayers.length === 0) {
        setResults([
          {
            layer: "Info",
            properties: { msg: "Active una capa para consultar" },
          },
        ]);
        return;
      }

      // Elegimos la capa superior visible y validamos que tenga getGetFeatureInfoUrl
      let topLayer = null;
      for (let i = visibleLayers.length - 1; i >= 0; i--) {
        const layer = visibleLayers[i];
        const source = layer.getSource();
        if (source && typeof source.getGetFeatureInfoUrl === "function") {
          topLayer = layer;
          break;
        }
      }

      if (!topLayer) {
        setResults([
          {
            layer: "Info",
            properties: { msg: "Ninguna capa WMS visible para consultar" },
          },
        ]);
        return;
      }

      const url = topLayer
        .getSource()
        .getGetFeatureInfoUrl(evt.coordinate, viewRes, "EPSG:3857", {
          INFO_FORMAT: "application/json",
          FEATURE_COUNT: 10,
        });

      if (url) {
        try {
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
            // Limpieza visual anterior
            vectorSource.clear();

            // Convertimos features en un formato amigable y extraemos geometría
            const enhanced = data.features.map((f) => {
              const geom = f.geometry || null;
              let coords = null;
              if (geom && geom.coordinates) {
                // Para puntos
                if (geom.type === "Point") {
                  coords = toLonLat(geom.coordinates, "EPSG:3857");
                } else if (geom.type && Array.isArray(geom.coordinates)) {
                  // Para otras geometrías mostramos el primer conjunto de coordenadas
                  const first = Array.isArray(geom.coordinates[0])
                    ? geom.coordinates[0]
                    : geom.coordinates;
                  coords = toLonLat(first, "EPSG:3857");
                }
              }

              return {
                layer: topLayer.get("title"),
                properties: f.properties || {},
                geometry: geom,
                coords,
              };
            });

            setResults(enhanced);
          } else {
            setResults([]);
          }
        } catch (err) {
          console.error("Error en GetFeatureInfo:", err);
          setResults([
            {
              layer: "Error",
              properties: { msg: `Falló la consulta: ${err.message}` },
            },
          ]);
        }
      }
    };

    map.on("singleclick", handleMapClick);
    return () => map.un("singleclick", handleMapClick);
  }, [map, activeTool, vectorSource]);

  // Función consulta WFS BBOX - TODAS LAS CAPAS VISIBLES
  const queryWFSByBox = async (extent) => {
    if (!map) return;

    const visibleLayers = map
      .getLayers()
      .getArray()
      .filter((l) => l.getVisible() && l.get("name"));

    if (visibleLayers.length === 0) {
      setResults([
        {
          layer: "Info",
          properties: { msg: "Active una capa para consultar" },
        },
      ]);
      return;
    }

    const bbox = extent.join(",");
    console.log("🔍 Consultando TODAS las capas visibles...");
    console.log(
      "📡 Capas:",
      visibleLayers.map((l) => l.get("name"))
    );

    try {
      // Crear promesas para cada capa visible
      const allFeaturesPromises = visibleLayers.map(async (layer) => {
        const layerName = layer.get("name");
        const layerTitle = layer.get("title");
        const url = `${CONFIG.geoserverUrl}/${CONFIG.workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${CONFIG.workspace}:${layerName}&maxFeatures=50&outputFormat=application/json&bbox=${bbox},EPSG:3857`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const resp = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!resp.ok) {
            console.warn(`⚠️ Capa ${layerName}: HTTP ${resp.status}`);
            return [];
          }

          const data = await resp.json();

          if (data.features && data.features.length > 0) {
            console.log(
              `✅ Capa ${layerName}: ${data.features.length} features`
            );

            return data.features.map((f) => {
              const geom = f.geometry || null;
              let coords = null;
              if (geom && geom.coordinates) {
                if (geom.type === "Point") coords = toLonLat(geom.coordinates);
                else if (Array.isArray(geom.coordinates[0]))
                  coords = toLonLat(geom.coordinates[0]);
              }
              return {
                layer: layerTitle,
                properties: f.properties,
                geometry: geom,
                coords,
              };
            });
          }
          return [];
        } catch (layerErr) {
          console.warn(`⚠️ Error consultando ${layerName}:`, layerErr.message);
          return [];
        }
      });

      // Esperar todas las promesas
      const allResults = await Promise.all(allFeaturesPromises);
      const combinedResults = allResults.flat(); // Aplanar el array

      if (combinedResults.length > 0) {
        // Limpiar visual anterior
        vectorSource.clear();

        // Añadir todos los features a la capa visual
        const allFeatures = combinedResults
          .map((res) => {
            if (res.geometry) {
              const feature = new GeoJSON().readFeature(
                { type: "Feature", geometry: res.geometry, properties: {} },
                { featureProjection: "EPSG:3857" }
              );
              return feature;
            }
            return null;
          })
          .filter((f) => f !== null);

        vectorSource.addFeatures(allFeatures);

        setResults(combinedResults);
        console.log(
          `📊 Total de resultados: ${combinedResults.length} features de ${visibleLayers.length} capa(s)`
        );
      } else {
        setResults([]);
        vectorSource.clear();
        console.log("⚠️ Sin resultados en ninguna capa");
      }
    } catch (err) {
      console.error("❌ Error en WFS:", err);

      let errorMsg = err.message;
      if (err.name === "AbortError") {
        errorMsg = "Timeout: GeoServer no respondió en 10 segundos";
      } else if (!navigator.onLine) {
        errorMsg = "Sin conexión a internet";
      }

      setResults([
        {
          layer: "Error",
          properties: { msg: `WFS: ${errorMsg}` },
        },
      ]);
    }
  };

  return (
    <div className="panel tools-panel">
      <h3>Herramientas</h3>
      <div className="tools-buttons">
        <button
          onClick={activateMeasure}
          className={activeTool === "measure" ? "active" : ""}
        >
          📏 Medir Distancia
        </button>
        <button
          onClick={activatePointInfo}
          className={activeTool === "info-point" ? "active" : ""}
        >
          📍 Consulta (Punto)
        </button>
        <button
          onClick={activateBoxInfo}
          className={activeTool === "info-box" ? "active" : ""}
        >
          ⬜ Consulta (Caja)
        </button>
        <button
          onClick={() => {
            clearInteractions();
            setActiveTool(null);
          }}
        >
          ❌ Limpiar
        </button>
      </div>

      {measureVal && (
        <div className="result-box measure-result">
          <strong>Distancia:</strong> {measureVal}
        </div>
      )}

      {results && (
        <div className="result-box info-result">
          <h4>Resultados ({results.length})</h4>
          {results.length === 0 ? (
            <p>Sin datos.</p>
          ) : (
            <div className="results-list">
              {results.map((res, idx) => (
                <div key={idx} className="result-item">
                  <strong>{res.layer}</strong>
                  <ul>
                    {res.geometry && (
                      <li>
                        <b>Geometría:</b> {res.geometry.type}
                      </li>
                    )}
                    {res.coords && (
                      <li>
                        <b>Coordenadas (lon, lat):</b>{" "}
                        {Array.isArray(res.coords)
                          ? res.coords.map((c) => c.toFixed(6)).join(", ")
                          : String(res.coords)}
                      </li>
                    )}
                    {Object.entries(res.properties || {}).map(([key, val]) => (
                      <li key={key}>
                        <b>{key}:</b> {String(val)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tools;
