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

const Tools = ({ onToggleAnalysis }) => {
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
      style: (feature) => {
        const geomType = feature.getGeometry().getType();

        // Estilo especial para rectángulos de consulta
        if (geomType === 'Polygon') {
          return new Style({
            stroke: new Stroke({ color: "#667eea", width: 3 }),
            fill: new Fill({ color: "rgba(102, 126, 234, 0.15)" }),
          });
        }

        // Estilo para puntos y líneas (mediciones)
        return new Style({
          stroke: new Stroke({ color: "#667eea", width: 4 }),
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: "#667eea" }),
            stroke: new Stroke({ color: "white", width: 2 })
          }),
          fill: new Fill({ color: "rgba(102, 126, 234, 0.1)" }),
        });
      },
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

  // Formatear distancia en formato argentino (coma para decimales, punto para miles)
  const formatDistance = (meters) => {
    const km = meters / 1000;
    const kmStr = km.toFixed(3);
    const [intPart, decPart] = kmStr.split('.');

    // Agregar separador de miles (punto)
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Unir con coma como separador decimal
    return `${formattedInt},${decPart} km`;
  };

  
  const startMeasureFree = () => {
    if (!map) return;
    clearInteractions();
    setResults(null); // Limpiar resultados de consultas anteriores
    setActiveTool("measure-free");
    setMeasureMode("free");
    setMeasuring(true);
    setMeasureVal("0,000 km");

    const draw = new Draw({
      source: vectorSource,
      type: "LineString",
      style: new Style({
        stroke: new Stroke({ color: "#667eea", width: 3, lineDash: [10, 5] }),
        image: new Circle({
          radius: 6,
          stroke: new Stroke({ color: "#667eea", width: 2 }),
          fill: new Fill({ color: "rgba(255, 255, 255, 0.8)" })
        })
      })
    });

    draw.on("drawstart", (evt) => {
      const sketch = evt.feature;
      sketch.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        const length = getLength(geom);
        setMeasureVal(formatDistance(length));
      });
    });

    map.addInteraction(draw);
    drawRef.current = draw;
  };

  
  const startMeasureBetween = () => {
    if (!map) return;
    clearInteractions();
    setResults(null); // Limpiar resultados de consultas anteriores
    vectorSource.clear(); // Limpiar mediciones anteriores
    setActiveTool("measure-between");
    setMeasureMode("between");
    setMeasuring(true);
    betweenPointsRef.current = [];
    setMeasureVal("Seleccione punto A");

    const handleClick = (evt) => {
      const coord = evt.coordinate;

      // Si ya hay 2 puntos, limpiar y empezar nueva medición
      if (betweenPointsRef.current.length >= 2) {
        vectorSource.clear();
        betweenPointsRef.current = [];
      }

      betweenPointsRef.current.push(coord);
      const point = new Feature({ geometry: new Point(coord) });
      vectorSource.addFeature(point);

      if (betweenPointsRef.current.length === 1) {
        setMeasureVal("Seleccione punto B");
      }

      if (betweenPointsRef.current.length === 2) {
        const coords = betweenPointsRef.current.slice(0, 2);
        const line = new Feature({ geometry: new LineString(coords) });
        vectorSource.addFeature(line);
        const dist = getLength(line.getGeometry());
        setMeasureVal(formatDistance(dist));
      }
    };
    map.on("singleclick", handleClick);
  };

  
  const activatePointInfo = () => {
    clearInteractions();
    setMeasureVal(null); // Limpiar tooltip de mediciones
    setActiveTool("info-point");
    map.on("singleclick", handlePointClick);
  };

  const handlePointClick = (evt) => {
      // Agregar marcador visual en el punto clickeado
      vectorSource.clear();
      const marker = new Feature({
        geometry: new Point(evt.coordinate)
      });
      vectorSource.addFeature(marker);

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

      if (!topLayer) {
        setResults([{ layer: "Info", properties: { msg: "No hay capas WMS disponibles" } }]);
        return;
      }

      const url = topLayer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewRes, "EPSG:3857", {
          INFO_FORMAT: "application/json",
          FEATURE_COUNT: 10,
      });

      if (url) {
        try {
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
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
            setResults([{ layer: topLayer.get("title"), properties: { msg: "No se encontraron elementos en este punto" } }]);
          }
        } catch (err) {
          console.error(err);
          setResults([{ layer: "Error", properties: { msg: "Error al consultar el servidor" } }]);
        }
      }
  };

  
  const activateBoxInfo = () => {
    clearInteractions();
    setMeasureVal(null); // Limpiar tooltip de mediciones
    setActiveTool("info-box");
    const box = new DragBox({ condition: always, className: 'ol-dragbox' });
    box.on("boxend", () => {
        const geometry = box.getGeometry();
        const extent = geometry.getExtent();

        // Dibujar el rectángulo permanente en el mapa
        vectorSource.clear();
        const boxFeature = new Feature({ geometry: geometry });
        vectorSource.addFeature(boxFeature);

        queryWFSByBox(extent);
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
             const layerTitle = layer.get("title") || layerName;

             const url = `${CONFIG.geoserverUrl}/${CONFIG.workspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=${CONFIG.workspace}:${layerName}&count=50&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::3857&bbox=${bbox},urn:ogc:def:crs:EPSG::3857`;

             const resp = await fetch(url);
             if(!resp.ok) return [];

             const data = await resp.json();

             return (data.features || []).map(f => ({
               layer: layerTitle,
               layerName: layerName,
               properties: f.properties
             }));
        });

        const allResults = await Promise.all(allFeaturesPromises);
        const combined = allResults.flat();

        if(combined.length > 0) {
             setResults(combined);
        } else {
            setResults([{ layer: "Info", properties: { msg: "No se encontraron elementos en el área seleccionada" } }]);
        }
    } catch(e) {
      console.error(e);
      setResults([{ layer: "Error", properties: { msg: "Error al consultar el servidor" } }]);
    }
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

        <div className="tool-pill-separator"></div>

        <button
          onClick={onToggleAnalysis}
          className="tool-pill-btn"
          title="Abrir panel de análisis"
        >
          🔬 Análisis
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
             <button className="close-results" onClick={()=>{setResults(null); vectorSource.clear();}}>X</button>
          </div>
          <div className="results-list">
             {results.length === 0 ? <p>Sin datos</p> :
               results.map((res, idx) => {
                 const isInfoMessage = res.layer === "Info" || res.layer === "Error";

                 // Filtrar propiedades innecesarias
                 const hiddenFields = ['igds_style', 'igds_type', 'igds_weigh', 'igds_color',
                                      'igds_level', 'rotation', 'group', 'progreso', 'coord',
                                      't_act', 'fclass', 'dataset'];

                 const filteredProps = Object.entries(res.properties || {})
                   .filter(([key, val]) => {
                     // Ocultar campos técnicos
                     if (hiddenFields.includes(key)) return false;
                     // Ocultar valores null, undefined o vacíos
                     if (val === null || val === undefined || val === '') return false;
                     return true;
                   });

                 return (
                   <div key={idx} className={`result-item ${isInfoMessage ? 'info-message' : ''}`}>
                     <strong>{res.layer}</strong>
                     <ul>
                       {filteredProps.length > 0 ? (
                         filteredProps.map(([key, val]) => (
                           <li key={key}>
                             {isInfoMessage ? String(val) : <><b>{key}:</b> {String(val)}</>}
                           </li>
                         ))
                       ) : (
                         <li>Sin información disponible</li>
                       )}
                     </ul>
                   </div>
                 );
               })}
          </div>
        </div>
      )}
    </>
  );
};

export default Tools;