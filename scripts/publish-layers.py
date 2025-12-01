#!/usr/bin/env python3
"""
Script para publicar capas automáticamente en GeoServer
Proyecto: GIS-2025
"""

import requests
from requests.auth import HTTPBasicAuth
import json
import time

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

GEOSERVER_URL = "http://localhost:8080/geoserver"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"
WORKSPACE = "tpigis"
DATASTORE = "tpigis_postgis"

# Lista completa de capas desde config1.js
LAYERS_TO_PUBLISH = [
    "Ejido",
    "RedVial",
    "CursodeAguaHid",
    "EdificiodeSaludIPS",
    "ComplejodeEnergiaEne",
    "CurvasdeNivel",
    "EdifConstruccionesTuristicas",
    "EdifDeporyEsparcimiento",
    "EdifEducacion",
    "EdifReligiosos",
    "EdificioPublicoIPS",
    "EdificiodeSeguridadIPS",
    "EdificiosFerroviarios",
    "Estructurasportuarias",
    "EspejodeAguaHid",
    "InfraestructuraAeroportuariaPunto",
    "InfraestructuraHidro",
    "Isla",
    "LimitePoliticoAdministrativoLim",
    "Localidades",
    "LíneasdeConducciónEne",
    "MarcasySeñales",
    "MuroEmbalse",
    "ObraPortuaria",
    "ObradeComunicación",
    "OtrasEdificaciones",
    "PaisLim",
    "Provincias",
    "PuenteRedVialPuntos",
    "PuntosdeAlturasTopograficas",
    "PuntosdelTerreno",
    "Redferroviaria",
    "SalvadodeObstaculo",
    "Señalizaciones",
    "SueCostero",
    "SueHidromorfologico",
    "SueNoConsolidado",
    "Suecongelado",
    "Sueconsolidado",
    "VegArborea",
    "VegArbustiva",
    "VegCultivos",
    "VegSueloDesnudo",
    "ViasSecundarias",
    "vegHidrofila",
]

# ============================================================================
# FUNCIONES
# ============================================================================

def check_layer_exists(layer_name):
    """Verifica si una capa ya está publicada"""
    url = f"{GEOSERVER_URL}/rest/workspaces/{WORKSPACE}/datastores/{DATASTORE}/featuretypes/{layer_name}.json"
    response = requests.get(
        url,
        auth=HTTPBasicAuth(GEOSERVER_USER, GEOSERVER_PASSWORD)
    )
    return response.status_code == 200


def publish_layer(layer_name):
    """Publica una capa individual en GeoServer"""

    # Verificar si ya existe
    if check_layer_exists(layer_name):
        return "EXISTS"

    # Preparar el payload
    featuretype_data = {
        "featureType": {
            "name": layer_name,
            "nativeName": layer_name,
            "title": layer_name.replace("_", " "),
            "abstract": f"Capa {layer_name} - Proyecto GIS-2025",
            "enabled": True,
            "srs": "EPSG:4326",
            "projectionPolicy": "FORCE_DECLARED",
            "store": {
                "@class": "dataStore",
                "name": f"{WORKSPACE}:{DATASTORE}"
            }
        }
    }

    # Publicar la capa
    url = f"{GEOSERVER_URL}/rest/workspaces/{WORKSPACE}/datastores/{DATASTORE}/featuretypes"
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(
            url,
            auth=HTTPBasicAuth(GEOSERVER_USER, GEOSERVER_PASSWORD),
            headers=headers,
            data=json.dumps(featuretype_data)
        )

        if response.status_code == 201:
            return "SUCCESS"
        elif response.status_code == 500:
            # Puede ser que la tabla no exista en PostGIS
            return "ERROR_NOT_FOUND"
        else:
            return f"ERROR_{response.status_code}"

    except Exception as e:
        return f"EXCEPTION: {str(e)}"


def main():
    """Función principal"""
    print("=" * 70)
    print("  🗺️  PUBLICACIÓN AUTOMÁTICA DE CAPAS EN GEOSERVER")
    print("  Proyecto: GIS-2025")
    print("=" * 70)
    print(f"\nWorkspace: {WORKSPACE}")
    print(f"DataStore: {DATASTORE}")
    print(f"Capas a procesar: {len(LAYERS_TO_PUBLISH)}\n")

    results = {
        "success": [],
        "exists": [],
        "not_found": [],
        "errors": []
    }

    for i, layer_name in enumerate(LAYERS_TO_PUBLISH, 1):
        print(f"[{i:2d}/{len(LAYERS_TO_PUBLISH)}] {layer_name:45s} ", end="")

        result = publish_layer(layer_name)

        if result == "SUCCESS":
            print("✅ Publicada")
            results["success"].append(layer_name)
        elif result == "EXISTS":
            print("⚠️  Ya existe")
            results["exists"].append(layer_name)
        elif result == "ERROR_NOT_FOUND":
            print("❌ No existe en PostGIS")
            results["not_found"].append(layer_name)
        else:
            print(f"❌ Error: {result}")
            results["errors"].append((layer_name, result))

        # Pequeña pausa para no saturar el servidor
        time.sleep(0.3)

    # Resumen
    print("\n" + "=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"✅ Publicadas exitosamente: {len(results['success'])}")
    print(f"⚠️  Ya existían: {len(results['exists'])}")
    print(f"❌ No encontradas en PostGIS: {len(results['not_found'])}")
    print(f"❌ Errores: {len(results['errors'])}")

    if results['not_found']:
        print("\n⚠️  Capas no encontradas en PostGIS:")
        for layer in results['not_found']:
            print(f"   - {layer}")
        print("\n💡 Verifica que estas tablas existan en tu base de datos PostGIS")

    if results['errors']:
        print("\n❌ Errores:")
        for layer, error in results['errors']:
            print(f"   - {layer}: {error}")

    print("\n" + "=" * 70)
    total_published = len(results['success']) + len(results['exists'])
    print(f"🎉 Total de capas disponibles: {total_published}/{len(LAYERS_TO_PUBLISH)}")
    print("=" * 70)

    # URLs útiles
    print("\n📍 URLs de verificación:")
    print(f"   GetCapabilities WMS: {GEOSERVER_URL}/{WORKSPACE}/wms?request=GetCapabilities")
    print(f"   GetCapabilities WFS: {GEOSERVER_URL}/{WORKSPACE}/wfs?request=GetCapabilities")
    print(f"   Layer Preview: {GEOSERVER_URL}/web/wicket/bookmarkable/org.geoserver.web.demo.MapPreviewPage")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
