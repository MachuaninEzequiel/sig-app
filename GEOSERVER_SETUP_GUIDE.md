# 📘 Guía de Configuración de GeoServer para GIS-2025

## 📑 Índice
1. [Prerequisitos](#prerequisitos)
2. [Configuración de CORS](#configuración-de-cors)
3. [Creación del Workspace](#creación-del-workspace)
4. [Configuración del Data Store (PostGIS)](#configuración-del-data-store-postgis)
5. [Publicación de Capas](#publicación-de-capas)
6. [Creación de Capa de Edición](#creación-de-capa-de-edición)
7. [Configuración de Servicios WMS/WFS](#configuración-de-servicios-wmswfs)
8. [Verificación y Testing](#verificación-y-testing)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisitos

### Servicios en ejecución:
- ✅ PostgreSQL + PostGIS (puerto 5433)
- ✅ GeoServer (puerto 8080)
- ✅ Frontend React (desarrollo)

### Datos confirmados:
```
Base de datos: tpigis
Usuario: tpigis
Password: tpigis
Host: localhost
Puerto: 5433
```

---

## 🌐 1. Configuración de CORS

**CRÍTICO**: Sin CORS, el frontend no podrá comunicarse con GeoServer.

### Opción A: Configuración por archivo (Recomendado)

1. Localiza el archivo `web.xml` en tu contenedor Docker de GeoServer:
   ```
   /opt/geoserver/webapps/geoserver/WEB-INF/web.xml
   ```

2. Ejecuta desde tu terminal (Windows):
   ```bash
   docker exec -it <nombre-contenedor-geoserver> bash
   ```

3. Edita el archivo (necesitarás instalar un editor o hacerlo desde fuera):
   ```bash
   # Opción 1: Copiar el archivo, editarlo y volverlo a copiar
   docker cp <nombre-contenedor>:/opt/geoserver/webapps/geoserver/WEB-INF/web.xml ./web.xml
   ```

4. Agrega este filtro ANTES del tag `</web-app>`:
   ```xml
   <!-- CORS Configuration -->
   <filter>
       <filter-name>CorsFilter</filter-name>
       <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
       <init-param>
           <param-name>cors.allowed.origins</param-name>
           <param-value>http://localhost:5173,http://localhost:3000</param-value>
       </init-param>
       <init-param>
           <param-name>cors.allowed.methods</param-name>
           <param-value>GET,POST,PUT,DELETE,OPTIONS,HEAD</param-value>
       </init-param>
       <init-param>
           <param-name>cors.allowed.headers</param-name>
           <param-value>Content-Type,X-Requested-With,accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization</param-value>
       </init-param>
       <init-param>
           <param-name>cors.exposed.headers</param-name>
           <param-value>Access-Control-Allow-Origin,Access-Control-Allow-Credentials</param-value>
       </init-param>
       <init-param>
           <param-name>cors.support.credentials</param-name>
           <param-value>true</param-value>
       </init-param>
   </filter>
   <filter-mapping>
       <filter-name>CorsFilter</filter-name>
       <url-pattern>/*</url-pattern>
   </filter-mapping>
   ```

5. Copiar de vuelta y reiniciar:
   ```bash
   docker cp ./web.xml <nombre-contenedor>:/opt/geoserver/webapps/geoserver/WEB-INF/web.xml
   docker restart <nombre-contenedor-geoserver>
   ```

### Opción B: Configuración vía Nginx/Apache Proxy (Alternativa)

Si tienes problemas con la Opción A, puedes usar un proxy reverso.

---

## 📁 2. Creación del Workspace

1. Accede a GeoServer Admin:
   ```
   http://localhost:8080/geoserver
   Usuario: admin
   Password: geoserver
   ```

2. Ve a **Workspaces** → **Add new workspace**

3. Completa los campos:
   - **Name**: `tpigis`
   - **Namespace URI**: `http://tpigis` (IMPORTANTE: debe coincidir con config1.js)
   - ✅ Marca "Default Workspace"
   - ✅ Habilita WMS, WFS, WCS

4. Click **Save**

---

## 🗄️ 3. Configuración del Data Store (PostGIS)

### 3.1 Crear Store

1. Ve a **Stores** → **Add new Store** → **PostGIS**

2. Selecciona workspace: `tpigis`

3. Completa la configuración:

```
Data Source Name: tpigis_postgis
Description: Conexión a base de datos PostGIS del proyecto

Connection Parameters:
┌─────────────────────────────────────┐
│ host: localhost                     │
│ port: 5433                          │
│ database: tpigis                    │
│ schema: public                      │
│ user: tpigis                        │
│ passwd: tpigis                      │
│ validate connections: ✅             │
│ max connections: 10                 │
│ min connections: 1                  │
│ fetch size: 1000                    │
│ Expose primary keys: ✅             │
│ Estimated extends: ✅               │
└─────────────────────────────────────┘
```

4. Click **Save**

### 3.2 Verificar Conexión

Deberías ver el mensaje: "Connection to 'tpigis_postgis' successful"

---

## 🗺️ 4. Publicación de Capas

Tu frontend requiere **48 capas**. Aquí tienes las opciones:

### Opción A: Publicación Manual (Educativo pero lento)

1. Ve a **Layers** → **Add a new layer**
2. Selecciona Store: `tpigis:tpigis_postgis`
3. Click **Publish** en cada tabla
4. Para CADA capa:
   - **Data** tab:
     - Native SRS: EPSG:4326 (o el que corresponda)
     - Declared SRS: EPSG:4326
     - SRS handling: Force declared
   - **Publishing** tab:
     - Habilita WMS, WFS
   - **Tile Caching** tab:
     - Habilita tile caching para mejor performance
   - Click **Compute from data** para bbox
   - Click **Compute from native bounds** para lat/lon bounds

### Opción B: Publicación Automatizada vía REST API (RECOMENDADO)

Ver sección **Scripts de Automatización** más abajo.

### Lista de capas requeridas (48 total):

```
1. Ejido
2. RedVial
3. CursodeAguaHid
4. EdificiodeSaludIPS
5. ActividadesEconomicas
6. ComplejodeEnergiaEne
7. ActividadesAgropecuarias
8. CurvasdeNivel
9. EdifConstruccionesTuristicas
10. EdifDeporyEsparcimiento
11. EdifEducacion
12. EdifReligiosos
13. EdificioPublicoIPS
14. EdificiodeSeguridadIPS
15. EdificiosFerroviarios
16. Estructurasportuarias
17. EspejodeAguaHid
18. InfraestructuraAeroportuariaPunto
19. InfraestructuraHidro
20. Isla
21. LimitePoliticoAdministrativoLim
22. Localidades
23. LíneasdeConducciónEne
24. MarcasySeñales
25. MuroEmbalse
26. ObraPortuaria
27. ObradeComunicación
28. OtrasEdificaciones
29. PaisLim
30. Provincias
31. PuenteRedVialPuntos
32. PuntosdeAlturasTopograficas
33. PuntosdelTerreno
34. RedVial
35. Redferroviaria
36. SalvadodeObstaculo
37. Señalizaciones
38. SueCostero
39. SueHidromorfologico
40. SueNoConsolidado
41. Suecongelado
42. Sueconsolidado
43. VegArborea
44. VegArbustiva
45. VegCultivos
46. VegSueloDesnudo
47. ViasSecundarias
48. vegHidrofila
```

---

## ✏️ 5. Creación de Capa de Edición

Tu frontend necesita una capa especial llamada `nuevos_puntos` para WFS-T (edición).

### 5.1 Crear tabla en PostGIS

Conecta a tu base de datos y ejecuta:

```sql
-- Conectar a la base de datos
-- psql -h localhost -p 5433 -U tpigis -d tpigis

-- Crear tabla para nuevos puntos
CREATE TABLE public.nuevos_puntos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    geom GEOMETRY(Point, 4326),
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Crear índice espacial para mejor performance
CREATE INDEX idx_nuevos_puntos_geom
ON public.nuevos_puntos
USING GIST(geom);

-- Otorgar permisos
GRANT ALL ON public.nuevos_puntos TO tpigis;
GRANT USAGE, SELECT ON SEQUENCE nuevos_puntos_id_seq TO tpigis;
```

### 5.2 Publicar la capa en GeoServer

1. Ve a **Layers** → **Add a new layer**
2. Store: `tpigis:tpigis_postgis`
3. Busca `nuevos_puntos` y click **Publish**
4. Configuración:
   - **Name**: `nuevos_puntos`
   - **Title**: Nuevos Puntos (Edición)
   - **Native SRS**: EPSG:4326
   - **Declared SRS**: EPSG:4326
   - Habilita **WFS** (CRÍTICO para edición)
   - Click **Compute from data** y **Compute from native bounds**

5. **IMPORTANTE - Habilitar transacciones WFS**:
   - Ve a **Services** → **WFS**
   - Marca ✅ **Enable transactions**
   - Service Level: COMPLETE o TRANSACTIONAL
   - Click **Save**

---

## ⚙️ 6. Configuración de Servicios WMS/WFS

### 6.1 Configurar WMS

1. Ve a **Services** → **WMS**
2. Configuración recomendada:
   ```
   ✅ Enable WMS
   Service Metadata:
     - Title: Servicio WMS TPI GIS
     - Online Resource: http://localhost:8080/geoserver/wms

   Limited SRS list:
     - EPSG:4326
     - EPSG:3857
     - EPSG:32720 (si usas UTM Zone 20S para Argentina)

   Resource Consumption Limits:
     - Max rendering memory (KB): 131072
     - Max rendering time (s): 60
     - Max rendering errors: 1000
   ```

3. Click **Save**

### 6.2 Configurar WFS

1. Ve a **Services** → **WFS**
2. Configuración crítica:
   ```
   ✅ Enable WFS
   ✅ Enable transactions (CRÍTICO para edición)

   Service Level: COMPLETE

   GML:
     - ✅ GML2
     - ✅ GML3
     - ✅ GML3.2

   Service Metadata:
     - Title: Servicio WFS TPI GIS
     - Online Resource: http://localhost:8080/geoserver/wfs

   Features:
     - Maximum number of features: 1000000
     - Maximum number of features for preview: 50

   SRS:
     - EPSG:4326
     - EPSG:3857
   ```

3. **IMPORTANTE**: Marca ✅ **Enable transactions** (para WFS-T)

4. Click **Save**

### 6.3 Configurar Tile Caching (Opcional pero recomendado)

1. Ve a **Tile Caching** → **Gridsets**
2. Verifica que existan:
   - EPSG:4326 (Geographic)
   - EPSG:3857 (Web Mercator) - USADO POR TU FRONTEND

3. Ve a **Tile Caching** → **Layers**
4. Para capas frecuentes (RedVial, Provincias, etc.):
   - Habilita tile caching
   - Gridset: EPSG:3857
   - Image formats: image/png, image/jpeg

---

## ✅ 7. Verificación y Testing

### 7.1 URLs Finales que usa el Frontend

Tu aplicación consume estas URLs (desde [config1.js](src/config1.js)):

```javascript
// WMS (Visualización)
WMS_URL = "http://localhost:8080/geoserver/tpigis/wms"

// WFS (Consultas)
WFS_URL = "http://localhost:8080/geoserver/tpigis/wfs"
WFS_OWS_URL = "http://localhost:8080/geoserver/tpigis/ows"
```

### 7.2 Pruebas manuales

#### Test 1: GetCapabilities WMS
```bash
curl "http://localhost:8080/geoserver/tpigis/wms?service=WMS&version=1.1.1&request=GetCapabilities"
```
✅ Deberías ver XML con todas las capas listadas

#### Test 2: GetMap WMS (Prueba una capa)
```
http://localhost:8080/geoserver/tpigis/wms?service=WMS&version=1.1.0&request=GetMap&layers=tpigis:RedVial&bbox=-62,-30,-58,-24&width=768&height=768&srs=EPSG:4326&format=image/png
```
✅ Deberías ver una imagen PNG con la red vial

#### Test 3: GetCapabilities WFS
```bash
curl "http://localhost:8080/geoserver/tpigis/wfs?service=WFS&version=1.0.0&request=GetCapabilities"
```
✅ Deberías ver XML con feature types

#### Test 4: GetFeature WFS (formato GeoJSON)
```bash
curl "http://localhost:8080/geoserver/tpigis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tpigis:Localidades&maxFeatures=10&outputFormat=application/json"
```
✅ Deberías recibir un GeoJSON con features

#### Test 5: Transacción WFS-T (Crear punto)
```bash
curl -X POST "http://localhost:8080/geoserver/tpigis/wfs" \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<wfs:Transaction service="WFS" version="1.0.0"
  xmlns:wfs="http://www.opengis.net/wfs"
  xmlns:gml="http://www.opengis.net/gml"
  xmlns:tpigis="http://tpigis">
  <wfs:Insert>
    <tpigis:nuevos_puntos>
      <tpigis:nombre>Punto de prueba</tpigis:nombre>
      <tpigis:geom>
        <gml:Point srsName="EPSG:4326">
          <gml:coordinates>-60.0,-27.0</gml:coordinates>
        </gml:Point>
      </tpigis:geom>
    </tpigis:nuevos_puntos>
  </wfs:Insert>
</wfs:Transaction>'
```
✅ Deberías recibir un `TransactionResponse` exitoso

### 7.3 Test desde el Frontend

1. Inicia tu aplicación React:
   ```bash
   cd d:\GitRepo\GIS-2025
   npm run dev
   ```

2. Abre el navegador en `http://localhost:5173`

3. Abre DevTools (F12) → Console

4. Deberías ver el mapa cargado con la capa base OSM

5. Prueba activar capas desde el panel de control:
   - ✅ RedVial (debería aparecer visible por defecto)
   - ✅ Provincias
   - ✅ Localidades

6. Prueba las herramientas:
   - 🔍 Consulta por bbox (Tools component)
   - ✏️ Crear nuevo punto (Editor component)

### 7.4 Verificación de CORS

Si ves errores como:
```
Access to fetch at 'http://localhost:8080/geoserver/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

👉 Revisa la sección de CORS y asegúrate de incluir `http://localhost:5173` en allowed origins.

---

## 🔧 8. Scripts de Automatización

He creado scripts para automatizar la publicación de capas. Ver archivo `geoserver-setup-scripts.md`.

---

## 🐛 9. Troubleshooting

### Problema 1: "Layer not found"
**Causa**: La capa no está publicada o el nombre no coincide.
**Solución**:
- Verifica que la capa exista: `http://localhost:8080/geoserver/tpigis/wms?request=GetCapabilities`
- Revisa que el nombre en config1.js coincida exactamente

### Problema 2: "Could not connect to PostGIS"
**Causa**: Credenciales incorrectas o servicio caído.
**Solución**:
```bash
# Verifica que PostGIS esté corriendo
docker ps | grep postgres

# Prueba conexión manual
psql -h localhost -p 5433 -U tpigis -d tpigis
```

### Problema 3: "Transaction failed" en WFS-T
**Causa**: Transacciones WFS no habilitadas o permisos de BD insuficientes.
**Solución**:
- Ve a Services → WFS → ✅ Enable transactions
- Verifica permisos en PostGIS:
  ```sql
  GRANT ALL ON TABLE public.nuevos_puntos TO tpigis;
  GRANT USAGE, SELECT ON SEQUENCE nuevos_puntos_id_seq TO tpigis;
  ```

### Problema 4: Mapa en blanco o sin capas
**Causa**: Sistemas de referencia incompatibles.
**Solución**:
- Verifica que las capas usen EPSG:4326 o EPSG:3857
- En GeoServer Layer config → Force declared SRS
- Recomputa bounding boxes

### Problema 5: CORS errors
**Solución rápida**:
```bash
# Opción temporal para desarrollo (NO USAR EN PRODUCCIÓN)
# Inicia Chrome con CORS deshabilitado:
# Windows:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\tmp\chrome_dev"
```

---

## 📊 Resumen de URLs

| Servicio | URL | Uso |
|----------|-----|-----|
| Admin Panel | http://localhost:8080/geoserver | Configuración |
| WMS GetCapabilities | http://localhost:8080/geoserver/tpigis/wms?request=GetCapabilities | Lista de capas WMS |
| WMS GetMap | http://localhost:8080/geoserver/tpigis/wms | Tiles de mapa |
| WFS GetCapabilities | http://localhost:8080/geoserver/tpigis/wfs?request=GetCapabilities | Lista de feature types |
| WFS GetFeature | http://localhost:8080/geoserver/tpigis/ows | Consultas espaciales |
| WFS Transaction | http://localhost:8080/geoserver/tpigis/wfs | Edición (POST) |
| Preview Layer | http://localhost:8080/geoserver/tpigis/wms?service=WMS&request=GetMap&layers=tpigis:RedVial | Vista previa |

---

## 🎯 Checklist Final

- [ ] GeoServer corriendo en puerto 8080
- [ ] PostGIS corriendo en puerto 5433
- [ ] CORS configurado correctamente
- [ ] Workspace `tpigis` creado con namespace `http://tpigis`
- [ ] Data Store `tpigis_postgis` configurado y conectado
- [ ] 48 capas publicadas con WMS y WFS habilitados
- [ ] Tabla `nuevos_puntos` creada en PostGIS
- [ ] Capa `nuevos_puntos` publicada con WFS-T habilitado
- [ ] WMS Service configurado (EPSG:3857, EPSG:4326)
- [ ] WFS Service configurado con transactions habilitadas
- [ ] GetCapabilities WMS funciona
- [ ] GetCapabilities WFS funciona
- [ ] GetMap retorna imagen PNG
- [ ] GetFeature retorna GeoJSON
- [ ] Frontend React carga sin errores CORS
- [ ] Panel de capas muestra todas las capas
- [ ] Activar/desactivar capas funciona
- [ ] Herramienta de edición crea puntos exitosamente

---

## 📞 Siguiente Paso

Una vez completada esta guía, tu aplicación debería estar completamente funcional.

Si encuentras problemas, revisa:
1. Logs de GeoServer: `docker logs <contenedor-geoserver>`
2. Logs del navegador: DevTools → Console
3. Network tab: Verifica las peticiones HTTP

¡Buena suerte con tu proyecto GIS! 🗺️
