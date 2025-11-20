import React, { useContext, useState } from "react";
import { MapContext } from "./Map";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke, Circle, Fill } from "ol/style";
import { getLength } from "ol/sphere";

const Tools = () => {
  const map = useContext(MapContext);
  const [mode, setMode] = useState(null); // 'measure', 'info', null
  const [infoData, setInfoData] = useState(null);

  // Capa vectorial temporal para dibujar medidas
  const [measureSource] = useState(new VectorSource());

  // Inicializar capa de dibujo una sola vez
  React.useEffect(() => {
    if (!map) return;
    const vector = new VectorLayer({
      source: measureSource,
      style: new Style({
        stroke: new Stroke({ color: "#ffcc33", width: 2 }),
        image: new Circle({ radius: 7, fill: new Fill({ color: "#ffcc33" }) }),
      }),
      zIndex: 999,
    });
    map.addLayer(vector);
  }, [map]);

  // Lógica de Consulta
  const handleInfo = async (evt) => {
    if (mode !== "info") return;

    const viewRes = map.getView().getResolution();
    // Buscar en la capa visible más alta
    const targetLayer = map
      .getLayers()
      .getArray()
      .filter((l) => l.getVisible() && l.get("name"))
      .pop(); // La última (más arriba)

    if (!targetLayer) return;

    const url = targetLayer
      .getSource()
      .getGetFeatureInfoUrl(evt.coordinate, viewRes, "EPSG:3857", {
        INFO_FORMAT: "application/json",
      });

    if (url) {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.features.length > 0) {
        setInfoData(data.features[0].properties);
      } else {
        setInfoData({ Mensaje: "No se encontraron datos" });
      }
    }
  };

  React.useEffect(() => {
    if (!map) return;
    if (mode === "info") map.on("singleclick", handleInfo);
    return () => map.un("singleclick", handleInfo);
  }, [map, mode]);

  // Lógica de Medición
  const startMeasure = () => {
    measureSource.clear();
    setMode("measure");
    setInfoData(null);

    // Remover interacciones previas
    map.getInteractions().forEach((i) => {
      if (i instanceof Draw) map.removeInteraction(i);
    });

    const draw = new Draw({ source: measureSource, type: "LineString" });
    draw.on("drawend", (evt) => {
      const len = getLength(evt.feature.getGeometry());
      alert(`Distancia: ${(len / 1000).toFixed(2)} km`);
      setMode(null);
      map.removeInteraction(draw);
    });
    map.addInteraction(draw);
  };

  return (
    <div className="panel">
      <h3>Herramientas</h3>
      <div className="btn-group">
        <button
          onClick={() => setMode("info")}
          className={mode === "info" ? "active" : ""}
        >
          🔍 Consultar
        </button>
        <button
          onClick={startMeasure}
          className={mode === "measure" ? "active" : ""}
        >
          📏 Medir
        </button>
      </div>

      {infoData && (
        <div className="info-box">
          <h4>Resultado:</h4>
          <pre>{JSON.stringify(infoData, null, 2)}</pre>
          <button onClick={() => setInfoData(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default Tools;
