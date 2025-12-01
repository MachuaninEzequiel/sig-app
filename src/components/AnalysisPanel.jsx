import React, { useContext, useState, useEffect, useRef } from "react";
import { MapContext } from "./Map";
import { CONFIG } from "../config";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { getLength } from "ol/sphere";

const AnalysisPanel = ({ isOpen, onClose }) => {
  const map = useContext(MapContext);
  const [analysisType, setAnalysisType] = useState("longitud-ruta");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Parámetros para consulta de rutas
  const [rutaNumero, setRutaNumero] = useState("11");
  const [tipoRuta, setTipoRuta] = useState("RN");
  const [provincia, setProvincia] = useState("Chaco");

  // Opciones dinámicas
  const [availableRutas, setAvailableRutas] = useState([]);
  const [availableTipos, setAvailableTipos] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Capa temporal para mostrar resultados
  const highlightLayerRef = useRef(null);

  const formatDistance = (meters) => {
    const km = meters / 1000;
    const kmStr = km.toFixed(3);
    const [intPart, decPart] = kmStr.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInt},${decPart} km`;
  };

  const clearHighlight = () => {
    if (highlightLayerRef.current && map) {
      map.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }
  };

  // Limpiar highlight cuando se cierra el panel
  useEffect(() => {
    if (!isOpen) {
        clearHighlight();
        setResults(null);
        setError(null);
    }
  }, [isOpen]);

  // Cargar opciones disponibles al abrir el panel
  useEffect(() => {
    if (isOpen && availableRutas.length === 0) {
      loadAvailableOptions();
    }
  }, [isOpen]);

  const loadAvailableOptions = async () => {
    setLoadingOptions(true);
    try {
      // Usar count para limitar la consulta inicial y obtener muestras
      const url = `${CONFIG.geoserverUrl}/${CONFIG.workspace}/ows?` +
        `service=WFS&version=2.0.0&request=GetFeature&` +
        `typeNames=${CONFIG.workspace}:RedVial&` +
        `outputFormat=application/json&` +
        `srsName=EPSG:3857&` +
        `count=3000`; // Limitar para acelerar

      console.log("Cargando opciones de rutas...");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar opciones");

      const data = await response.json();
      console.log(`Analizando ${data.features?.length || 0} features...`);
      
      // Extraer valores únicos de nro_ruta y administra
      const rutasSet = new Set();
      const tiposSet = new Set();
      
      data.features.forEach(f => {
        const props = f.properties || {};
        if (props.nro_ruta) {
          rutasSet.add(String(props.nro_ruta).trim());
        }
        if (props.administra) {
          const admin = String(props.administra).toLowerCase().trim();
          if (admin.includes('nacional')) tiposSet.add('RN');
          if (admin.includes('provincial')) tiposSet.add('RP');
          if (admin.includes('vecinal')) tiposSet.add('Vecinal');
          if (admin.includes('municipal')) tiposSet.add('Municipal');
        }
      });

      const rutasArray = Array.from(rutasSet).filter(r => r).sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      });

      setAvailableRutas(rutasArray);
      setAvailableTipos(Array.from(tiposSet).sort());
      
      console.log("✓ Rutas disponibles:", rutasArray.length);
      console.log("✓ Tipos disponibles:", Array.from(tiposSet));
    } catch (err) {
      console.error("Error al cargar opciones:", err);
      // En caso de error, usar valores por defecto
      setAvailableTipos(['RN', 'RP', 'Municipal', 'Vecinal']);
      setAvailableRutas([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const calcularLongitudRuta = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    clearHighlight();

    try {
      // Query WFS - SIN LIMIT para traer todas las features
      const url = `${CONFIG.geoserverUrl}/${CONFIG.workspace}/ows?` +
        `service=WFS&version=2.0.0&request=GetFeature&` +
        `typeNames=${CONFIG.workspace}:RedVial&` +
        `outputFormat=application/json&` +
        `srsName=EPSG:3857`;

      console.log("URL Query:", url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        setError(`No se encontraron datos en la capa RedVial.`);
        setLoading(false);
        return;
      }

      // Filtrar en el cliente
      console.log(`Total features recibidas: ${data.features.length}`);
      console.log("Buscando:", tipoRuta, rutaNumero);
      
      // Imprimir algunos ejemplos con nro_ruta
      const withRuta = data.features.filter(f => f.properties && f.properties.nro_ruta);
      console.log(`Features con nro_ruta definido: ${withRuta.length}`);
      if (withRuta.length > 0) {
          console.log("Ejemplos de nro_ruta:", withRuta.slice(0, 5).map(f => f.properties.nro_ruta));
      }

      const filteredFeatures = data.features.filter((feature) => {
        const props = feature.properties || {};
        
        // Los campos son: nro_ruta (puede ser null), nombre (puede ser null), tipo, administra
        const nroRutaStr = String(props.nro_ruta || '').trim();
        const rutaNumeroStr = rutaNumero.trim();
        const nombreStr = String(props.nombre || '').toLowerCase().trim();
        const administraStr = String(props.administra || '').toLowerCase().trim();
        
        // Para RN buscar "Nacional" en administra
        // Para RP buscar "Provincial" en administra
        let matchTipo = false;
        if (tipoRuta.toUpperCase() === 'RN') {
            matchTipo = administraStr.includes('nacional');
        } else if (tipoRuta.toUpperCase() === 'RP') {
            matchTipo = administraStr.includes('provincial');
        }
        
        // Match por nro_ruta (si existe)
        const matchNumero = nroRutaStr === rutaNumeroStr;
        
        return matchTipo && matchNumero;
      });

      console.log(`Features filtradas: ${filteredFeatures.length}`);
      
      if (filteredFeatures.length === 0) {
        // Mostrar información de debug
        const uniqueAdministra = [...new Set(data.features.map(f => f.properties?.administra).filter(Boolean))];
        const uniqueNroRuta = [...new Set(data.features.map(f => f.properties?.nro_ruta).filter(Boolean))];
        console.log("Valores únicos de 'administra':", uniqueAdministra);
        console.log("Valores únicos de 'nro_ruta' (primeros 20):", uniqueNroRuta.slice(0, 20));
        
        setError(`No se encontraron segmentos para la Ruta ${tipoRuta} ${rutaNumero}. Verifica la consola para más información.`);
        setLoading(false);
        return;
      }

      // Calcular longitud
      let totalLength = 0;
      const format = new GeoJSON();
      const features = [];

      console.log(`Procesando ${filteredFeatures.length} features para cálculo y visualización...`);

      filteredFeatures.forEach((featureData, idx) => {
          const feature = format.readFeature(featureData);
          const geom = feature.getGeometry();
          if (geom) {
              const segLength = getLength(geom);
              totalLength += segLength;
              features.push(feature);
              
              if (idx < 5) {
                  console.log(`Segmento ${idx + 1}: ${(segLength/1000).toFixed(3)} km`);
              }
          }
      });

      console.log(`Total de features para visualizar: ${features.length}`);
      console.log(`Longitud total: ${(totalLength/1000).toFixed(3)} km`);

      // Crear capa de resaltado con TODAS las features filtradas
      if (map && features.length > 0) {
          const vectorSource = new VectorSource({
              features: features
          });

          const vectorLayer = new VectorLayer({
              source: vectorSource,
              style: new Style({
                  stroke: new Stroke({
                      color: '#FF0000',
                      width: 5,
                      lineCap: 'round',
                      lineJoin: 'round'
                  })
              }),
              zIndex: 10000
          });

          map.addLayer(vectorLayer);
          highlightLayerRef.current = vectorLayer;
          
          console.log(`Capa agregada al mapa con ${features.length} geometrías`);
          
          // Zoom to extent de todas las features
          const extent = vectorSource.getExtent();
          console.log("Extent de la ruta:", extent);
          map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      }

      setResults({
          tipo: "longitud",
          longitud: formatDistance(totalLength),
          segmentos: features.length,
          ruta: `${tipoRuta} ${rutaNumero}`
      });

    } catch (err) {
      console.error("Error al calcular:", err);
      setError("Error al procesar la solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="panel analysis-panel">
      <h3>
        🔬 Análisis Espacial
        <button className="close-btn" onClick={onClose}>×</button>
      </h3>

      <div className="analysis-form">
        <div className="form-group">
          <label>Tipo de Análisis:</label>
          <select 
            value={analysisType} 
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option value="longitud-ruta">Longitud de Ruta</option>
            {/* <option value="puentes">Puentes en Ruta</option> */}
          </select>
        </div>

        {analysisType === "longitud-ruta" && (
          <>
            {loadingOptions && (
              <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                Cargando opciones...
              </div>
            )}
            
            <div className="form-group">
              <label>Tipo de Ruta:</label>
              <select 
                value={tipoRuta} 
                onChange={(e) => setTipoRuta(e.target.value)}
                disabled={loadingOptions}
              >
                {availableTipos.length > 0 ? (
                  availableTipos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))
                ) : (
                  <>
                    <option value="RN">RN - Nacional</option>
                    <option value="RP">RP - Provincial</option>
                    <option value="Municipal">Municipal</option>
                    <option value="Vecinal">Vecinal</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Número de Ruta:</label>
              {availableRutas.length > 0 ? (
                <select 
                  value={rutaNumero} 
                  onChange={(e) => setRutaNumero(e.target.value)}
                  disabled={loadingOptions}
                >
                  {availableRutas.map(ruta => (
                    <option key={ruta} value={ruta}>Ruta {ruta}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={rutaNumero} 
                  onChange={(e) => setRutaNumero(e.target.value)}
                  placeholder="Ej: 11"
                  disabled={loadingOptions}
                />
              )}
            </div>

            <button 
              className="btn-analyze" 
              onClick={calcularLongitudRuta}
              disabled={loading || loadingOptions}
            >
              {loading ? "Calculando..." : "Calcular Longitud"}
            </button>
          </>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {results && results.tipo === "longitud" && (
        <div className="analysis-results">
          <h4>Resultados: {results.ruta}</h4>
          <div className="result-card">
            <div className="result-item-analysis highlight">
              <strong>Longitud Total:</strong>
              <span className="value-big">{results.longitud}</span>
            </div>
            <div className="result-item-analysis">
              <strong>Segmentos:</strong>
              <span>{results.segmentos}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;