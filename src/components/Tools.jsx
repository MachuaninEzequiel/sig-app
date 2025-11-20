import React, { useContext, useState, useEffect } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Draw, DragBox } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke, Circle, Fill } from "ol/style";
import { getLength } from "ol/sphere";
import { platformModifierKeyOnly } from "ol/events/condition";
import GeoJSON from "ol/format/GeoJSON";

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

      const topLayer = visibleLayers[visibleLayers.length - 1];
      const url = topLayer
        .getSource()
        .getGetFeatureInfoUrl(evt.coordinate, viewRes, "EPSG:3857", {
          INFO_FORMAT: "application/json",
        });

      if (url) {
        try {
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.features.length > 0) {
            setResults(
              data.features.map((f) => ({
                layer: topLayer.get("title"),
                properties: f.properties,
              }))
            );
          } else {
            setResults([]);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    map.on("singleclick", handleMapClick);
    return () => map.un("singleclick", handleMapClick);
  }, [map, activeTool]);

  // Función consulta WFS BBOX
  const queryWFSByBox = async (extent) => {
    const visibleLayers = map
      .getLayers()
      .getArray()
      .filter((l) => l.getVisible() && l.get("name"));
    if (visibleLayers.length === 0) return;

    const targetLayer = visibleLayers[visibleLayers.length - 1];
    const url = `${CONFIG.geoserverUrl}/${
      CONFIG.workspace
    }/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${
      CONFIG.workspace
    }:${targetLayer.get(
      "name"
    )}&maxFeatures=50&outputFormat=application/json&bbox=${extent.join(
      ","
    )},EPSG:3857`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.features && data.features.length > 0) {
        setResults(
          data.features.map((f) => ({
            layer: targetLayer.get("title"),
            properties: f.properties,
          }))
        );
        // Feedback visual
        vectorSource.addFeatures(new GeoJSON().readFeatures(data));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
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
                    {Object.entries(res.properties).map(([key, val]) => (
                      <li key={key}>
                        <b>{key}:</b> {val}
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
