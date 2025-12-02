#!/usr/bin/env python3
"""
Script para cargar estilos SLD a GeoServer y aplicarlos a las capas
Proyecto: GIS-2025
"""

import requests
from requests.auth import HTTPBasicAuth
import os
import time
from pathlib import Path

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

GEOSERVER_URL = "http://localhost:8080/geoserver"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"
WORKSPACE = "tpigis"

# ============================================================================
# FUNCIONES
# ============================================================================

def create_style(style_name):
    """Crea un estilo vacío en GeoServer"""
    url = f"{GEOSERVER_URL}/rest/workspaces/{WORKSPACE}/styles"
    headers = {"Content-Type": "application/json"}

    data = {
        "style": {
            "name": style_name,
            "filename": f"{style_name}.sld"
        }
    }

    response = requests.post(
        url,
        auth=HTTPBasicAuth(GEOSERVER_USER, GEOSERVER_PASSWORD),
        headers=headers,
        json=data
    )

    return response

def upload_sld_content(style_name, sld_content):
    """Sube el contenido SLD al estilo"""
    url = f"{GEOSERVER_URL}/rest/workspaces/{WORKSPACE}/styles/{style_name}"

    # Detectar si es SLD 1.1.0 (usa namespace se:) o SLD 1.0.0 (usa namespace sld:)
    is_sld_11 = 'xmlns:se="http://www.opengis.net/se"' in sld_content or 'version="1.1' in sld_content

    # Usar el Content-Type correcto según la versión
    if is_sld_11:
        headers = {"Content-Type": "application/vnd.ogc.se+xml; charset=UTF-8"}
    else:
        headers = {"Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8"}

    # Convertir a UTF-8 si es string, o enviar como bytes
    if isinstance(sld_content, str):
        sld_bytes = sld_content.encode('utf-8')
    else:
        sld_bytes = sld_content

    response = requests.put(
        url,
        auth=HTTPBasicAuth(GEOSERVER_USER, GEOSERVER_PASSWORD),
        headers=headers,
        data=sld_bytes
    )

    return response

def apply_style_to_layer(layer_name, style_name):
    """Aplica el estilo como default a una capa"""
    url = f"{GEOSERVER_URL}/rest/layers/{WORKSPACE}:{layer_name}"
    headers = {"Content-Type": "application/json"}

    data = {
        "layer": {
            "defaultStyle": {
                "name": style_name,
                "workspace": WORKSPACE
            }
        }
    }

    response = requests.put(
        url,
        auth=HTTPBasicAuth(GEOSERVER_USER, GEOSERVER_PASSWORD),
        headers=headers,
        json=data
    )

    return response

def process_style_file(sld_file):
    """Procesa un archivo SLD y lo aplica a su capa correspondiente"""
    style_name = sld_file.stem  # Nombre sin extensión
    layer_name = style_name  # Asumimos que el nombre del archivo coincide con el nombre de la capa

    print(f"\n{'='*70}")
    print(f"Procesando: {style_name}")
    print(f"{'='*70}")

    try:
        # Intentar leer el archivo con diferentes codificaciones
        sld_content = None
        encodings = ['utf-8', 'latin-1', 'windows-1252', 'iso-8859-1']

        for encoding in encodings:
            try:
                with open(sld_file, 'r', encoding=encoding) as f:
                    sld_content = f.read()
                print(f"✓ Archivo SLD leído: {sld_file.name} (encoding: {encoding})")
                break
            except UnicodeDecodeError:
                continue

        if sld_content is None:
            print(f"✗ No se pudo leer el archivo con ninguna codificación conocida")
            return False

        # Paso 1: Crear el estilo en GeoServer
        print(f"→ Creando estilo '{style_name}'...")
        response = create_style(style_name)

        style_exists = False
        if response.status_code == 201:
            print(f"  ✓ Estilo creado exitosamente")
        elif response.status_code == 409 or (response.status_code == 500 and "already exists" in response.text):
            print(f"  ⚠ Estilo ya existe, actualizando contenido...")
            style_exists = True
        else:
            print(f"  ✗ Error al crear estilo: HTTP {response.status_code}")
            print(f"    {response.text[:200]}")
            return False

        # Pequeña pausa
        time.sleep(0.5)

        # Paso 2: Subir el contenido SLD
        # Detectar versión
        is_sld_11 = 'xmlns:se="http://www.opengis.net/se"' in sld_content or 'version="1.1' in sld_content
        sld_version = "1.1.0 (SE)" if is_sld_11 else "1.0.0"

        print(f"→ Subiendo contenido SLD (versión {sld_version})...")
        response = upload_sld_content(style_name, sld_content)

        if response.status_code == 200:
            print(f"  ✓ Contenido SLD subido exitosamente")
            # Verificar tamaño
            content_size = len(sld_content.encode('utf-8') if isinstance(sld_content, str) else sld_content)
            print(f"    Tamaño: {content_size} bytes")
        else:
            print(f"  ✗ Error al subir SLD: HTTP {response.status_code}")
            print(f"    {response.text[:200]}")
            return False

        # Pequeña pausa
        time.sleep(0.5)

        # Paso 3: Aplicar el estilo a la capa
        print(f"→ Aplicando estilo a la capa '{layer_name}'...")
        response = apply_style_to_layer(layer_name, style_name)

        if response.status_code == 200:
            print(f"  ✓ Estilo aplicado exitosamente a la capa")
            return True
        elif response.status_code == 404:
            print(f"  ⚠ Capa '{layer_name}' no encontrada en GeoServer")
            print(f"    El estilo fue creado pero no aplicado a ninguna capa")
            return True
        elif response.status_code == 500:
            # Error 500 generalmente significa que la capa no existe
            if "LayerInfo" in response.text or "original" in response.text:
                print(f"  ⚠ Capa '{layer_name}' no encontrada en GeoServer")
                print(f"    El estilo fue creado pero no aplicado a ninguna capa")
                print(f"    Verifica que el nombre de la capa coincida exactamente")
                return True
            else:
                print(f"  ✗ Error interno de GeoServer: HTTP 500")
                print(f"    {response.text[:200]}")
                return False
        else:
            print(f"  ✗ Error al aplicar estilo: HTTP {response.status_code}")
            print(f"    {response.text[:200]}")
            return False

    except Exception as e:
        print(f"✗ Error al procesar {style_name}: {str(e)}")
        return False

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "="*70)
    print("CARGA AUTOMÁTICA DE ESTILOS SLD A GEOSERVER")
    print("="*70)
    print(f"GeoServer: {GEOSERVER_URL}")
    print(f"Workspace: {WORKSPACE}")
    print("="*70)

    # Solicitar ruta del directorio de estilos
    print("\nIngrese la ruta completa del directorio donde están los archivos .sld")
    print("Ejemplo: C:\\Users\\samu\\Desktop\\Gis\\styles")
    print("\nRuta: ", end="")

    styles_path = input().strip().strip('"').strip("'")

    if not styles_path:
        print("\n✗ ERROR: Debe ingresar una ruta")
        return

    styles_dir = Path(styles_path)

    # Verificar que el directorio existe
    if not styles_dir.exists():
        print(f"\n✗ ERROR: El directorio no existe: {styles_dir}")
        return

    if not styles_dir.is_dir():
        print(f"\n✗ ERROR: La ruta no es un directorio: {styles_dir}")
        return

    print(f"\n✓ Directorio encontrado: {styles_dir}")

    # Buscar todos los archivos .sld
    sld_files = list(styles_dir.glob("*.sld"))

    if not sld_files:
        print(f"\n✗ ERROR: No se encontraron archivos .sld en {styles_dir}")
        return

    print(f"\nSe encontraron {len(sld_files)} archivos SLD:")
    for sld_file in sorted(sld_files)[:5]:
        print(f"  - {sld_file.name}")
    if len(sld_files) > 5:
        print(f"  ... y {len(sld_files) - 5} más")

    print("\n¿Desea continuar? (s/n): ", end="")

    respuesta = input().lower()
    if respuesta != 's':
        print("Operación cancelada")
        return

    # Contadores
    success_count = 0
    error_count = 0

    # Procesar cada archivo SLD
    for sld_file in sorted(sld_files):
        if process_style_file(sld_file):
            success_count += 1
        else:
            error_count += 1

        # Pausa entre archivos
        time.sleep(0.5)

    # Resumen final
    print("\n" + "="*70)
    print("RESUMEN")
    print("="*70)
    print(f"Total de archivos procesados: {len(sld_files)}")
    print(f"✓ Exitosos: {success_count}")
    print(f"✗ Errores: {error_count}")
    print("="*70)

    if error_count == 0:
        print("\n🎉 ¡Todos los estilos fueron cargados exitosamente!")
    else:
        print(f"\n⚠ Algunos estilos no pudieron ser cargados. Revisa los mensajes anteriores.")

if __name__ == "__main__":
    main()
