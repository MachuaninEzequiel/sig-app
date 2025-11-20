// src/config.js
export const CONFIG = {
  // Configuración del Servidor
  geoserverUrl: "http://localhost:8080/geoserver",
  workspace: "tpigis", // Tu workspace real visto en la imagen

  // Configuración visual del Mapa (Centrado en Chaco)
  center: [-60.0, -27.0],
  zoom: 7,

  // LISTA DE CAPAS WMS (Para ver en el mapa)
  // El campo 'name' es EXACTAMENTE lo que aparece después de "tpigis:" en tu imagen.
  layers: [
    {
      title: "Ejido Urbano (Localidades)",
      name: "Ejido",
      visible: false,
    },
    {
      title: "Red Vial",
      name: "RedVial", // Esta la confirmamos con tu link anterior
      visible: false,
    },
    {
      title: "Cursos de Agua",
      name: "CursodeAguaHid",
      visible: false,
    },
    {
      title: "Centros de Salud (IPS)",
      name: "EdificiodeSaludIPS",
      visible: false,
    },
    {
      title: "Actividades Económicas",
      name: "ActividadesEconomicas",
      visible: false,
    },
    {
      title: "ComplejodeEnergiaEne",
      name: "ComplejodeEnergiaEne",
      visible: false,
    },
    {
      title: "ActividadesAgropecuarias",
      name: "ActividadesAgropecuarias",
      visible: false,
    },
    {
      title: "CurvasdeNivel",
      name: "CurvasdeNivel",
      visible: false,
    },
    {
      title: "EdifConstruccionesTuristicas",
      name: "EdifConstruccionesTuristicas",
      visible: false,
    },
    {
      title: "EdifDeporyEsparcimiento",
      name: "EdifDeporyEsparcimiento",
      visible: false,
    },
    {
      title: "EdifEducacion",
      name: "EdifEducacion",
      visible: false,
    },
    {
      title: "EdifReligiosos",
      name: "EdifReligiosos",
      visible: false,
    },
    {
      title: "EdificioPublicoIPS",
      name: "EdificioPublicoIPS",
      visible: false,
    },
    {
      title: "EdificiodeSeguridadIPS",
      name: "EdificiodeSeguridadIPS",
      visible: false,
    },
    {
      title: "EdificiosFerroviarios",
      name: "EdificiosFerroviarios",
      visible: false,
    },
    {
      title: "Estructurasportuarias",
      name: "Estructurasportuarias",
      visible: false,
    },
    {
      title: "EspejodeAguaHid",
      name: "EspejodeAguaHid",
      visible: false,
    },
    {
      title: "InfraestructuraAeroportuariaPunto",
      name: "InfraestructuraAeroportuariaPunto",
      visible: false,
    },
    {
      title: "InfraestructuraHidro",
      name: "InfraestructuraHidro",
      visible: false,
    },
    {
      title: "Isla",
      name: "Isla",
      visible: false,
    },
    {
      title: "LimitePoliticoAdministrativoLim",
      name: "LimitePoliticoAdministrativoLim",
      visible: false,
    },
    {
      title: "Localidades",
      name: "Localidades",
      visible: false,
    },
    {
      title: "LíneasdeConducciónEne",
      name: "LíneasdeConducciónEne",
      visible: false,
    },
    {
      title: "MarcasySeñales",
      name: "MarcasySeñales",
      visible: false,
    },
    {
      title: "MuroEmbalse",
      name: "MuroEmbalse",
      visible: false,
    },
    {
      title: "ObraPortuaria",
      name: "ObraPortuaria",
      visible: false,
    },
    {
      title: "ObradeComunicación",
      name: "ObradeComunicación",
      visible: false,
    },
    {
      title: "OtrasEdificaciones",
      name: "OtrasEdificaciones",
      visible: false,
    },
    {
      title: "PaisLim",
      name: "PaisLim",
      visible: false,
    },
    {
      title: "Provincias",
      name: "Provincias",
      visible: false,
    },
    {
      title: "PuenteRedVialPuntos",
      name: "PuenteRedVialPuntos",
      visible: false,
    },
    {
      title: "PuntosdeAlturasTopograficas",
      name: "PuntosdeAlturasTopograficas",
      visible: false,
    },
    {
      title: "PuntosdelTerreno",
      name: "PuntosdelTerreno",
      visible: false,
    },
    {
      title: "RedVial",
      name: "RedVial",
      visible: true, // Lo puse en true porque es importante para tu TP
    },
    {
      title: "Redferroviaria",
      name: "Redferroviaria",
      visible: false,
    },
    {
      title: "SalvadodeObstaculo",
      name: "SalvadodeObstaculo",
      visible: false,
    },
    {
      title: "Señalizaciones",
      name: "Señalizaciones",
      visible: false,
    },
    {
      title: "SueCostero",
      name: "SueCostero",
      visible: false,
    },
    {
      title: "SueHidromorfologico",
      name: "SueHidromorfologico",
      visible: false,
    },
    {
      title: "SueNoConsolidado",
      name: "SueNoConsolidado",
      visible: false,
    },
    {
      title: "Suecongelado",
      name: "Suecongelado",
      visible: false,
    },
    {
      title: "Sueconsolidado",
      name: "Sueconsolidado",
      visible: false,
    },
    {
      title: "VegArborea",
      name: "VegArborea",
      visible: false,
    },
    {
      title: "VegArbustiva",
      name: "VegArbustiva",
      visible: false,
    },
    {
      title: "VegCultivos",
      name: "VegCultivos",
      visible: false,
    },
    {
      title: "VegSueloDesnudo",
      name: "VegSueloDesnudo",
      visible: false,
    },
    {
      title: "ViasSecundarias",
      name: "ViasSecundarias",
      visible: false,
    },
    {
      title: "vegHidrofila",
      name: "vegHidrofila",
      visible: false,
    },
  ],

  // CAPA PARA EDICIÓN (Punto 3 - WFS-T)
  // ATENCIÓN: Debes crear esta capa en PostGIS/GeoServer si no existe.
  // Si quieres probar la edición YA MISMO sobre una capa existente (cuidado, ensuciarás datos),
  // cambia 'nuevos_puntos' por 'ActividadesAgropecuarias' o similar.
  editLayer: {
    name: "nuevos_puntos", // Lo ideal es crear una capa vacía con este nombre
    geomField: "geom", // Nombre de la columna de geometría en PostGIS
    featureNS: "http://tpigis", // El Namespace URI de tu workspace
  },
};
