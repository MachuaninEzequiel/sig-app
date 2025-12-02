// src/config.js
export const CONFIG = {
  geoserverUrl: "/geoserver", // ← Usa ruta relativa (proxy de Vite lo redirigirá)
  workspace: "tpigis",
  center: [-60.0, -27.0],
  zoom: 7,

  layers: [
    // --- TRANSPORTE ---
    {
      title: "Red Vial",
      name: "RedVial",
      visible: true,
      category: "Transporte",
    },
    {
      title: "Red Ferroviaria",
      name: "Redferroviaria",
      visible: false,
      category: "Transporte",
    },
    {
      title: "Puentes (Puntos)",
      name: "PuenteRedVialPuntos",
      visible: false,
      category: "Transporte",
    },
    {
      title: "Vías Secundarias",
      name: "ViasSecundarias",
      visible: false,
      category: "Transporte",
    },
    {
      title: "Infra. Aeroportuaria",
      name: "InfraestructuraAeroportuariaPunto",
      visible: false,
      category: "Transporte",
    },
    {
      title: "Obras Portuarias",
      name: "ObraPortuaria",
      visible: false,
      category: "Transporte",
    },
    {
      title: "Estructuras Portuarias",
      name: "Estructurasportuarias",
      visible: false,
      category: "Transporte",
    },

    // --- HIDROGRAFÍA ---
    {
      title: "Cursos de Agua",
      name: "CursodeAguaHid",
      visible: false,
      category: "Hidrografía",
    },
    {
      title: "Espejos de Agua",
      name: "EspejodeAguaHid",
      visible: false,
      category: "Hidrografía",
    },
    {
      title: "Infraestructura Hidro",
      name: "InfraestructuraHidro",
      visible: false,
      category: "Hidrografía",
    },
    {
      title: "Muro Embalse",
      name: "MuroEmbalse",
      visible: false,
      category: "Hidrografía",
    },
    { title: "Islas", name: "Isla", visible: false, category: "Hidrografía" },
    {
      title: "Veg. Hidrófila",
      name: "vegHidrofila",
      visible: false,
      category: "Hidrografía",
    },

    // --- INFRAESTRUCTURA Y EDIFICIOS ---
    {
      title: "Ejido Urbano",
      name: "Ejido",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Localidades",
      name: "Localidades",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Centros de Salud (IPS)",
      name: "EdificiodeSaludIPS",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Educación",
      name: "EdifEducacion",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Seguridad (IPS)",
      name: "EdificiodeSeguridadIPS",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Públicos (IPS)",
      name: "EdificioPublicoIPS",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Religiosos",
      name: "EdifReligiosos",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Turísticos",
      name: "EdifConstruccionesTuristicas",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Depor. y Esparcimiento",
      name: "EdifDeporyEsparcimiento",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Edif. Ferroviarios",
      name: "EdificiosFerroviarios",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Otras Edificaciones",
      name: "OtrasEdificaciones",
      visible: false,
      category: "Infraestructura",
    },
    {
      title: "Obras de Comunicación",
      name: "ObradeComunicación",
      visible: false,
      category: "Infraestructura",
    },

    // --- ENERGÍA E INDUSTRIA ---
    {
      title: "Complejo Energía",
      name: "ComplejodeEnergiaEne",
      visible: false,
      category: "Energía e Industria",
    },
    {
      title: "Líneas Conducción",
      name: "LíneasdeConducciónEne",
      visible: false,
      category: "Energía e Industria",
    },
    {
      title: "Actividades Económicas",
      name: "ActividadesEconomicas",
      visible: false,
      category: "Energía e Industria",
    },
    {
      title: "Activ. Agropecuarias",
      name: "ActividadesAgropecuarias",
      visible: false,
      category: "Energía e Industria",
    },

    // --- SUELO Y VEGETACIÓN ---
    {
      title: "Veg. Arbórea",
      name: "VegArborea",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Veg. Arbustiva",
      name: "VegArbustiva",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Veg. Cultivos",
      name: "VegCultivos",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo Desnudo",
      name: "VegSueloDesnudo",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo Costero",
      name: "SueCostero",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo Congelado",
      name: "Suecongelado",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo Consolidado",
      name: "Sueconsolidado",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo No Consolidado",
      name: "SueNoConsolidado",
      visible: false,
      category: "Suelo y Vegetación",
    },
    {
      title: "Suelo Hidromorfológico",
      name: "SueHidromorfologico",
      visible: false,
      category: "Suelo y Vegetación",
    },

    // --- TOPOGRAFÍA Y LÍMITES ---
    {
      title: "Curvas de Nivel",
      name: "CurvasdeNivel",
      visible: false,
      category: "Topografía",
    },
    {
      title: "Puntos Altura Topo.",
      name: "PuntosdeAlturasTopograficas",
      visible: false,
      category: "Topografía",
    },
    {
      title: "Puntos del Terreno",
      name: "PuntosdelTerreno",
      visible: false,
      category: "Topografía",
    },
    {
      title: "Provincias",
      name: "Provincias",
      visible: false,
      category: "Límites",
    },
    {
      title: "País Limítrofe",
      name: "PaisLim",
      visible: false,
      category: "Límites",
    },
    {
      title: "Límite Político Adm.",
      name: "LimitePoliticoAdministrativoLim",
      visible: false,
      category: "Límites",
    },

    // --- OTROS ---
    {
      title: "Marcas y Señales",
      name: "MarcasySeñales",
      visible: false,
      category: "Otros",
    },
    {
      title: "Señalizaciones",
      name: "Señalizaciones",
      visible: false,
      category: "Otros",
    },
    {
      title: "Salvado de Obstáculo",
      name: "SalvadodeObstaculo",
      visible: false,
      category: "Otros",
    },
    {
      title: "Nuevos Elementos",
      name: "nuevos_elementos",
      visible: false,
      category: "Otros",
    },
  ],

  editLayer: {
    name: "nuevos_elementos",
    geomField: "geom",
    featureNS: "tpigis",
  },
};
