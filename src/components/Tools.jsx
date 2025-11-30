import React, { useContext, useState, useEffect, useRef } from "react";
import { MapContext } from "./Map"; // Verifica que la ruta sea correcta según tu estructura
import { CONFIG } from "../config";
import { Draw, DragBox } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke, Circle, Fill } from "ol/style";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { getLength } from "ol/sphere";
import { toLonLat } from "ol/proj";
import { always } from "ol/events/condition";

const Tools = () => {
  const map = useContext(MapContext);
  const [activeTool, setActiveTool] = useState(null);
  const [results, setResults] = useState(null);
  const [measureVal, setMeasureVal] = useState(null);

  // Capa auxiliar para dibujos
  const [vectorSource] = useState(new VectorSource());
  const [measureMode, setMeasureMode] = useState(null); 
  const [measuring, setMeasuring] = useState(false);
  
  const drawRef = useRef(null);
  const dragBoxRef = useRef(null);
  const betweenPointsRef = useRef([]);

  useEffect(() => {
    if (!map) return;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({ color: "#ffcc33", width: 3 }),
        image: new Circle({ radius: 7, fill: new Fill({ color: "#ffcc33" }) }),
        fill: new Fill({ color: "rgba(255, 255, 0, 0.1)" }),
      }),
      zIndex: 9999,
    });
    map.addLayer(vectorLayer);
    return () => map.removeLayer(vectorLayer);
  }, [map, vectorSource]);

  const clearInteractions = () => {
    if (!map) return;
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (dragBoxRef.current) {
      map.removeInteraction(dragBoxRef.current);
      dragBoxRef.current = null;
    }
    map.un("singleclick", handlePointClick);
    setMeasuring(false);
    setMeasureMode(null);
    setActiveTool(null);
  };

  const fullReset = () => {
    clearInteractions();
    vectorSource.clear();
    setResults(null);
    setMeasureVal(null);
  };

  
  const startMeasureFree = () => {
    if (!map) return;
    clearInteractions();
    setActiveTool("measure-free");
    setMeasureMode("free");
    setMeasuring(true);
    setMeasureVal("0.000 km");

    const draw = new Draw({ 
      source: vectorSource, 
      type: "LineString",
      style: new Style({
        stroke: new Stroke({ color: "rgba(0, 0, 0, 0.5)", width: 2, lineDash: [10, 10] }),
        image: new Circle({ radius: 5, stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }), fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }) })
      })
    });

    draw.on("drawstart", (evt) => {
      const sketch = evt.feature;
      sketch.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        const length = getLength(geom);
        setMeasureVal(`${(length / 1000).toFixed(3)} km`);
      });
    });

    map.addInteraction(draw);
    drawRef.current = draw;
  };

  
  const startMeasureBetween = () => {
    if (!map) return;
    clearInteractions();
    setActiveTool("measure-between");
    setMeasureMode("between");
    setMeasuring(true);
    betweenPointsRef.current = [];
    setMeasureVal("Seleccione punto A");

    const handleClick = (evt) => {
      const coord = evt.coordinate;
      betweenPointsRef.current.push(coord);
      const point = new Feature({ geometry: new Point(coord) });
      vectorSource.addFeature(point);

      if (betweenPointsRef.current.length === 1) setMeasureVal("Seleccione punto B");

      if (betweenPointsRef.current.length === 2) {
        const coords = betweenPointsRef.current.slice(0, 2);
        const line = new Feature({ geometry: new LineString(coords) });
        vectorSource.addFeature(line);
        const dist = getLength(line.getGeometry());
        setMeasureVal(`${(dist / 1000).toFixed(3)} km`);
        map.un("singleclick", handleClick);
        setMeasuring(false);
        setMeasureMode(null);
        setActiveTool(null);
      }
    };
    map.on("singleclick", handleClick);
  };

  
  const activatePointInfo = () => {
    clearInteractions();
    setActiveTool("info-point");
    map.on("singleclick", handlePointClick);
  };

  const handlePointClick = (evt) => {
      doWmsQuery(evt);
  };

  const doWmsQuery = async (evt) => {
      const viewRes = map.getView().getResolution();
      const visibleLayers = map.getLayers().getArray().filter((l) => l.getVisible() && l.get("name"));

      if (visibleLayers.length === 0) {
        setResults([{ layer: "Info", properties: { msg: "Active una capa para consultar" } }]);
        return;
      }

      let topLayer = null;
      for (let i = visibleLayers.length - 1; i >= 0; i--) {
        const layer = visibleLayers[i];
        const source = layer.getSource();
        if (source && typeof source.getGetFeatureInfoUrl === "function") {
          topLayer = layer;
          break;
        }
      }

      if (!topLayer) return;

      const url = topLayer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewRes, "EPSG:3857", {
          INFO_FORMAT: "application/json",
          FEATURE_COUNT: 10,
      });

      if (url) {
        try {
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
            vectorSource.clear();
            const enhanced = data.features.map((f) => {
              const geom = f.geometry || null;
              let coords = null;
              if (geom && geom.coordinates) {
                  if (geom.type === "Point") coords = toLonLat(geom.coordinates);
              }
              return { layer: topLayer.get("title"), properties: f.properties || {}, geometry: geom, coords };
            });
            setResults(enhanced);
          } else {
            setResults([]);
          }
        } catch (err) { console.error(err); }
      }
  };

  
  const activateBoxInfo = () => {
    clearInteractions();
    setActiveTool("info-box");
    const box = new DragBox({ condition: always, className: 'ol-dragbox' });
    box.on("boxend", () => {
        queryWFSByBox(box.getGeometry().getExtent());
    });
    map.addInteraction(box);
    dragBoxRef.current = box;
  };

  const queryWFSByBox = async (extent) => {
    if (!map) return;
    const visibleLayers = map.getLayers().getArray().filter((l) => l.getVisible() && l.get("name"));
    
    if (visibleLayers.length === 0) {
        setResults([{ layer: "Info", properties: { msg: "Active una capa" } }]);
        return;
    }

    const bbox = extent.join(",");
    try {
        const allFeaturesPromises = visibleLayers.map(async (layer) => {
             const layerName = layer.get("name");
             // REVISA TU CONFIG AQUÍ
             const url = `${CONFIG.geoserverUrl}/${CONFIG.workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${CONFIG.workspace}:${layerName}&maxFeatures=50&outputFormat=application/json&bbox=${bbox},EPSG:3857`;
             const resp = await fetch(url);
             if(!resp.ok) return [];
             const data = await resp.json();
             return data.features || [];
        });

        const allResults = await Promise.all(allFeaturesPromises);
        const combined = allResults.flat();
        if(combined.length > 0) {
             setResults(combined.map(f => ({ layer: "Consulta Caja", properties: f.properties })));
        } else {
            setResults([]);
        }
    } catch(e) { console.error(e); }
  };

  const showClearButton = activeTool || (results && results.length > 0) || measureVal;

  return (
    <>
      
      <div className="tools-pill-container">
        
        <button
          onClick={() => startMeasureFree()}
          className={`tool-pill-btn ${measureMode === "free" ? "active" : ""}`}
          title="Medir distancia libre"
        >
          📏 Medir(Libre)
        </button>

        <button
          onClick={() => startMeasureBetween()}
          className={`tool-pill-btn ${measureMode === "between" ? "active" : ""}`}
          title="Medir entre dos puntos"
        >
          📐 Medir (Puntos)
        </button>

        <div className="tool-pill-separator"></div>

        <button
          onClick={activatePointInfo}
          className={`tool-pill-btn ${activeTool === "info-point" ? "active" : ""}`}
          title="Consultar información en un punto"
        >
          📍 Consulta (Punto)
        </button>

        <button
          onClick={activateBoxInfo}
          className={`tool-pill-btn ${activeTool === "info-box" ? "active" : ""}`}
          title="Consultar información arrastrando una caja"
        >
          ⬜ Consulta (Caja)
        </button>

        {showClearButton && (
            <button
              onClick={fullReset}
              className="tool-pill-btn btn-pill-clear"
              title="Limpiar todo"
            >
              🗑️ Limpiar
            </button>
        )}
      </div>

      
      {measureVal && (
        <div className="floating-measure-tooltip">
           {measureVal}
        </div>
      )}

      
      {results && (
        <div className="result-box info-result">
          <div className="result-header">
             <h4>Resultados ({results.length})</h4>
             <button className="close-results" onClick={()=>setResults(null)}>X</button>
          </div>
          <div className="results-list">
             {results.length === 0 ? <p>Sin datos</p> : 
               results.map((res, idx) => (
                <div key={idx} className="result-item">
                  <strong>{res.layer}</strong>
                  <ul>
                    {Object.entries(res.properties || {}).map(([key, val]) => (
                      <li key={key}><b>{key}:</b> {String(val)}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Tools;