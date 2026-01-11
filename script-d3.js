// Configuración de dimensiones y márgenes
const margin = {top: 80, right: 150, bottom: 50, left: 150};
const width = window.innerWidth - margin.left - margin.right;
const height = (window.innerHeight - 80) - margin.top - margin.bottom;

// Configuración dinámica que se puede modificar
let CONFIG = {
  columnSpacing: 10, // Porcentaje entre columnas (reducido)
  distances: {
    contDisc: 10, // Distancia Continentes → Disciplinas (% del ancho total)
    discGen: 10,  // Distancia Disciplinas → Generaciones (% del ancho total)
    genProf: 10   // Distancia Generaciones → Profesiones (% del ancho total)
  },
  linkOpacity: 0.3, // Opacidad de las líneas (agregada para guardar configuración)
  color1: "#F556A8", // Color magenta para el primer año
  color2: "#E6E6FA", // Color lavanda para el segundo año
  fontFamily: "'Archivo', sans-serif",
  fontWeight: "400",
  letterSpacing: 0,
  lineHeight: 1.2,
  selectedYears: [], // Años seleccionados para guardar estado
  
  // Configuración de animaciones
  animations: {
    lineDuration: 1200,      // Duración de animación de líneas (ms)
    lineDelayBetweenColumns: 500,  // Delay entre columnas (ms)
    lineDelayBetweenLinks: 30,     // Delay entre enlaces dentro de la misma columna (ms)
    secondYearDelay: 6000,   // Delay adicional para el segundo año (ms)
    interAnimationDelay: 2000, // Tiempo entre finalización primera animación e inicio segunda (ms)
    glowAppearDelay: 500,    // Delay de aparición del glow por columna (ms)
    glowIntensity: 0.9,      // Intensidad del glow (0-1)
    glowPulseDuration: 2,    // Duración del pulso/respiración del glow (segundos)
    glowPulseIntensity: 1.2  // Intensidad del pulso (multiplicador)
  },
  
  continent: {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: 14,
    nodeHeight: 30,
    spacing: 10
  },
  discipline: {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: 11,
    nodeHeight: 20,
    spacing: 5
  },
  generation: {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: 12,
    nodeHeight: 25,
    spacing: 8
  },
  profession: {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: 9,
    nodeHeight: 12,
    spacing: 2
  },
  
  // Configuración de títulos de columnas
  columnTitles: {
    continent: {
      fontSize: 14,
      offsetY: 20, // Distancia desde la parte inferior
      offsetX: 0,  // Desplazamiento horizontal (positivo = derecha, negativo = izquierda)
      fontFamily: "inherit",
      fontWeight: "700"
    },
    discipline: {
      fontSize: 14,
      offsetY: 20,
      offsetX: 0,
      fontFamily: "inherit",
      fontWeight: "700"
    },
    generation: {
      fontSize: 14,
      offsetY: 20,
      offsetX: 0,
      fontFamily: "inherit",
      fontWeight: "700"
    },
    profession: {
      fontSize: 14,
      offsetY: 20,
      offsetX: 0,
      fontFamily: "inherit",
      fontWeight: "700"
    }
  }
};

// Configuración de las 4 columnas fijas (se actualiza dinámicamente)
let COLUMNS = {
  continent: 0,
  discipline: 0,
  generation: 0,
  profession: 0
};

// Variables para selección múltiple de años
let selectedYears = []; // Array que mantiene hasta 2 años seleccionados (SIEMPRE EMPIEZA VACÍO)
let currentYear = null; // Para compatibilidad con código existente

// NOTA IMPORTANTE: La aplicación siempre debe empezar sin años seleccionados.
// Los años se guardan en CONFIG.selectedYears solo para referencia histórica,
// pero la interfaz siempre comienza limpia para que la aplicación padre pueda controlarla.

// Función para obtener el color de los links según el año
function getLinkColor(year) {
  if (selectedYears.length === 1) {
    return CONFIG.color1; // Solo un año, usar color1
  } else {
    // Dos años, asignar colores según el orden de selección
    const yearIndex = selectedYears.indexOf(year);
    return yearIndex === 0 ? CONFIG.color1 : CONFIG.color2;
  }
}

// Función para obtener el color de los nodos/círculos
function getNodeColor() {
  if (selectedYears.length === 1) {
    return CONFIG.color1; // Solo un año, usar color1
  } else {
    return CONFIG.color2; // Dos años, usar color2 (lavanda) para comparación
  }
}

// Función para limpiar el diagrama Sankey
function clearSankey() {
  // Limpiar elementos del diagrama
  svg.selectAll(".links").remove();
  svg.selectAll(".node-circles").remove();
  svg.selectAll(".text-backgrounds").remove();
  svg.selectAll(".node-text").remove(); // Cambiado de .node-texts a .node-text
  svg.selectAll(".debug-text").remove();
  svg.selectAll(".column-label-group").classed("glow-active", false);

  // Marcar que ya no hay diagrama dibujado
  sankeyDrawn = false;

  // Ocultar botón STOP
  d3.select("#stop-button").style("display", "none");

  // Resetear título
  d3.select(".title").text("Selecciona años y presiona Play").style("font-family", CONFIG.fontFamily);
}

// Función para actualizar colores de nodos existentes
function updateNodeColors() {
  if (selectedYears.length === 1) {
    // Un año: todos los círculos magenta
    d3.selectAll(".node-circle")
      .transition()
      .duration(300)
      .attr("fill", CONFIG.color1);
  } else {
    // Dos años: círculos del primer año magenta, segundo año lavanda
    d3.selectAll(".first-year-circle")
      .transition()
      .duration(300)
      .attr("fill", CONFIG.color1);

    d3.selectAll(".second-year-circle")
      .transition()
      .duration(300)
      .attr("fill", CONFIG.color2);
  }
}

// Ancho de los nodos
const NODE_WIDTH = 15;
const NODE_PADDING = 8;

// MASTER: Orden fijo de elementos en cada columna
const MASTER = {
  continent: ["Chile", "África", "América", "Asia", "Europa", "Oceanía"],
  generation: ["Gen silenciosa", "Baby boomers", "Gen X", "Millennials", "Gen Z", "Gen Alpha"],
  discipline: [],
  profession: []
};

// Mapeo de normalización
const NORMALIZATION = {
  continent: {
    "Africa": "África"
  },
  generation: {
    "Millenial": "Millennials",
    "Millenials": "Millennials"
  },
  discipline: {
    "Divulgación científica": "Divulgación Científica",
    "Física cuántica": "Física Cuántica"
  },
  profession: {
    "Divulgación científica": "Divulgación Científica",
    "Física cuántica": "Física Cuántica",
    "Tecnologías de la información": "Tecnologías de la Información"
  }
};

// Colores
const COLORS = {
  continent: {
    "Chile": "#D4A574",
    "América": "#FF6B6B",
    "Europa": "#4ECDC4",
    "Asia": "#FFE66D",
    "África": "#95E1D3",
    "Oceanía": "#C7CEEA"
  },
  generation: {
    "Gen silenciosa": "#2C3E50",
    "Baby boomers": "#E74C3C",
    "Gen X": "#3498DB",
    "Millennials": "#9B59B6",
    "Gen Z": "#1ABC9C",
    "Gen Alpha": "#F39C12"
  }
};

// Función para generar color para disciplinas
function getDisciplineColor(name, index) {
  const hue = (index * 137.5) % 360;
  return `hsl(${hue}, 45%, 55%)`;
}

// Función para generar color para profesiones
function getProfessionColor(name, index) {
  const hue = (index * 137.5 + 30) % 360;
  return `hsl(${hue}, 35%, 60%)`;
}

// Variables globales
let svg;
let allData = [];
let currentOpacity = 0.3; // Se sincroniza con CONFIG.linkOpacity
let textsVisible = false; // Los textos empiezan apagados por defecto
let sankeyDrawn = false; // Indica si hay un diagrama Sankey dibujado actualmente
let globalAllMode = false; // Modo para mostrar TODOS los años de todos los continentes
let chileAllMode = false; // Modo para mostrar TODOS los años solo de Chile

// Función para actualizar el indicador de estado de configuración
function updateConfigStatus(hasConfig = null) {
  const statusEl = document.getElementById("config-status");
  if (!statusEl) return;

  let hasSavedConfig = hasConfig;
  if (hasSavedConfig === null) {
    hasSavedConfig = localStorage.getItem('sankey-config') !== null;
  }

  if (hasSavedConfig) {
    statusEl.textContent = " Configuración guardada";
    statusEl.style.color = "#4CAF50";
  } else {
    statusEl.textContent = "Sin configuración guardada";
    statusEl.style.color = "#666";
  }
}

// Función para actualizar el indicador de versión
function updateVersionIndicator() {
  const versionEl = document.getElementById("version-indicator");
  if (versionEl) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    versionEl.textContent = `v2.1 | ${timeString}`;
    versionEl.style.color = "#4CAF50"; // Verde para indicar actualización
    setTimeout(() => {
      versionEl.style.color = "#999"; // Volver al color normal
    }, 1000);
  }
}

// Función para guardar automáticamente la configuración
function autoSaveConfig() {
  try {
    console.log("Guardando configuración...");

    if (!CONFIG) {
      console.error(" CONFIG no existe");
      return;
    }

    // Copia simple para evitar problemas de referencia
    const configToSave = {
      ...CONFIG,
      selectedYears: [...selectedYears],
      lastSaved: new Date().toISOString()
    };

    const configString = JSON.stringify(configToSave);
    localStorage.setItem('sankey-config', configString);

    console.log(" Guardado:", {
      años_seleccionados: configToSave.selectedYears.length,
      ultima_modif: configToSave.lastSaved.split('T')[1].substring(0, 8)
    });

    // Actualizar indicadores
    updateConfigStatus(true);
    updateVersionIndicator();
    showAutoSaveIndicator();

  } catch (err) {
    console.error(" Error al guardar configuración:", err.message);
  }
}

// Función para actualizar el indicador de estado de guardado
function updateSaveStatus(saved = false) {
  const statusEl = document.getElementById("save-status");
  if (statusEl) {
    if (saved) {
      statusEl.textContent = " Guardado";
      statusEl.style.color = "#4CAF50";
    } else {
      statusEl.textContent = "Sin guardar";
      statusEl.style.color = "#666";
    }
  }
}

// Función para mostrar indicador visual de auto-guardado
function showAutoSaveIndicator() {
  updateSaveStatus(true);

  // Remover indicador anterior si existe
  d3.select("#auto-save-indicator").remove();

  // Crear nuevo indicador
  d3.select("body")
    .append("div")
    .attr("id", "auto-save-indicator")
    .style("position", "fixed")
    .style("top", "50px")
    .style("right", "20px")
    .style("background", "rgba(76, 175, 80, 0.95)")
    .style("color", "white")
    .style("padding", "8px 16px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("z-index", "9999")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
    .text(" Guardado")
    .transition()
    .duration(200)
    .transition()
    .delay(1000)
    .duration(200)
    .style("opacity", "0")
    .remove();
}

// Función para actualizar las posiciones de las columnas
function updateColumnPositions() {
  // Calcular posiciones proporcionales basadas en el ancho disponible
  // Las distancias son porcentajes del ancho total (0-100)
  const totalWidth = width;

  // Posición inicial (continentes siempre en 0)
  COLUMNS.continent = 0;

  // Calcular posiciones acumulativas basadas en las distancias configuradas
  COLUMNS.discipline = totalWidth * (CONFIG.distances.contDisc / 100);
  COLUMNS.generation = totalWidth * ((CONFIG.distances.contDisc + CONFIG.distances.discGen) / 100);
  COLUMNS.profession = totalWidth * ((CONFIG.distances.contDisc + CONFIG.distances.discGen + CONFIG.distances.genProf) / 100);
}

// Inicialización del SVG
function initializeSVG() {
  d3.select("#sankey-container svg").remove();

  const svgElement = d3.select("#sankey-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Grupo principal con transform para elementos del diagrama
  svg = svgElement.append("g")
    .attr("class", "main-group")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Título principal (fuera del grupo transformado)
  svgElement.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", -40 + margin.top)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", CONFIG.fontFamily);
}

// Tooltip
const tooltip = d3.select("#tooltip");

// Función para calcular la posición Y con configuración dinámica
function getNodeY(item, columnType) {
  const index = MASTER[columnType].indexOf(item);
  const total = MASTER[columnType].length;
  
  if (index === -1) {
    console.warn(`Item no encontrado en MASTER.${columnType}:`, item);
    return 0;
  }
  
  const config = CONFIG[columnType];
  const nodeHeight = config.nodeHeight;
  const spacing = config.spacing;
  
  const totalHeight = total * nodeHeight + (total - 1) * spacing;
  const startY = height - totalHeight - 50;
  
  return startY + index * (nodeHeight + spacing) + nodeHeight / 2;
}

// Función para crear un ID único para cada nodo
function getNodeId(item, columnType) {
  return `${columnType}_${item.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// Función para aplicar configuración importada
function applyImportedConfig(importedConfig) {
  // Validar configuración
  if (!importedConfig || typeof importedConfig !== 'object') {
    throw new Error("Formato de configuración inválido");
  }

  console.log("Aplicando configuración importada:", importedConfig);

  // Manejar versiones de configuración
  const configVersion = importedConfig.version || "1.0";
  console.log(`Versión de configuración: ${configVersion}`);

  // Inicializar estructuras que podrían no existir en versiones anteriores
  if (!CONFIG.distances) {
    CONFIG.distances = { contDisc: 10, discGen: 10, genProf: 10 };
  }

  if (!CONFIG.columnTitles) {
    CONFIG.columnTitles = {
      continent: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
      discipline: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
      generation: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
      profession: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" }
    };
  }

  if (!CONFIG.animations) {
    CONFIG.animations = {
      lineDuration: 1200,
      lineDelayBetweenColumns: 500,
      lineDelayBetweenLinks: 30,
      secondYearDelay: 6000,
      interAnimationDelay: 2000,
      glowAppearDelay: 500,
      glowIntensity: 0.9,
      glowPulseDuration: 2,
      glowPulseIntensity: 1.2
    };
  }

  // Aplicar configuración con compatibilidad hacia atrás
  Object.keys(importedConfig).forEach(key => {
    if (key === 'distances' && importedConfig[key]) {
      // Manejar distancias individuales
      Object.assign(CONFIG.distances, importedConfig.distances);
    } else if (key === 'columnTitles' && importedConfig[key]) {
      // Manejar títulos de columnas
      Object.keys(importedConfig.columnTitles).forEach(titleKey => {
        if (CONFIG.columnTitles[titleKey]) {
          Object.assign(CONFIG.columnTitles[titleKey], importedConfig.columnTitles[titleKey]);
        }
      });
    } else if (key === 'animations' && importedConfig[key]) {
      // Manejar configuraciones de animación
      Object.assign(CONFIG.animations, importedConfig.animations);
    } else if (CONFIG.hasOwnProperty(key)) {
      if (typeof importedConfig[key] === 'object' && !Array.isArray(importedConfig[key])) {
        // Para objetos anidados, hacer merge
        if (CONFIG[key] && typeof CONFIG[key] === 'object') {
          Object.assign(CONFIG[key], importedConfig[key]);
        } else {
          CONFIG[key] = importedConfig[key];
        }
      } else {
        CONFIG[key] = importedConfig[key];
      }
    }
  });

  // Asegurar valores por defecto para propiedades nuevas
  if (CONFIG.linkOpacity === undefined) CONFIG.linkOpacity = 0.3;
  if (CONFIG.selectedYears === undefined) CONFIG.selectedYears = [];
  if (CONFIG.columnTitles.continent.offsetX === undefined) CONFIG.columnTitles.continent.offsetX = 0;
  if (CONFIG.columnTitles.discipline.offsetX === undefined) CONFIG.columnTitles.discipline.offsetX = 0;
  if (CONFIG.columnTitles.generation.offsetX === undefined) CONFIG.columnTitles.generation.offsetX = 0;
  if (CONFIG.columnTitles.profession.offsetX === undefined) CONFIG.columnTitles.profession.offsetX = 0;

  // Sincronizar opacidad
  currentOpacity = CONFIG.linkOpacity;

  // Los años seleccionados se guardan en CONFIG.selectedYears para referencia histórica,
  // pero NO se restauran automáticamente - la interfaz SIEMPRE empieza limpia
  if (CONFIG.selectedYears && CONFIG.selectedYears.length > 0) {
    console.log("📋 Años guardados (no restaurados):", CONFIG.selectedYears);
  }

  console.log("Configuración visual aplicada exitosamente");
}

// Función para cargar configuración guardada
function loadSavedConfig() {
  try {
    const savedConfig = localStorage.getItem('sankey-config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      applyImportedConfig(parsedConfig);
      return true;
    }
  } catch (err) {
    console.warn("Error al cargar configuración guardada:", err);
  }
  return false;
}

// Función principal de inicio
function init() {
  console.log("Inicializando Sankey...");

  // Verificar localStorage básico
  const localStorageOK = testLocalStorage();
  if (!localStorageOK) {
    console.warn("⚠️ localStorage no funciona - configuración no se guardará");
  }

  // Intentar cargar configuración guardada
  const configLoaded = loadSavedConfig();

  // Sincronizar opacidad con configuración
  currentOpacity = CONFIG.linkOpacity;

  // Actualizar indicador de estado
  updateConfigStatus(configLoaded);

  if (configLoaded) {
    console.log(" Configuración visual cargada (años se mantienen en CONFIG pero interfaz empieza limpia)");
  } else {
    console.log("📝 Usando configuración por defecto");
  }

  updateColumnPositions();
  initializeSVG();
  createUIControls();
  setupConfigPanel();

  // Variable global para saber si se cargó configuración
  window.configLoadedAtStartup = configLoaded;
  
  d3.csv("sankey_data.csv").then(function(data) {
    console.log("Datos CSV cargados:", data.length, "registros");

    allData = processData(data);
    updateMasterLists();

    console.log("=== VERIFICACIÓN DE DATOS ===");
    console.log("Total de registros procesados:", allData.length);
    console.log("Total disciplinas:", MASTER.discipline.length);
    console.log("Total profesiones:", MASTER.profession.length);

    const years = getUniqueYears(allData);
    createYearButtons(years);

    // Si se cargó configuración al inicio, actualizar posiciones de columnas
    if (window.configLoadedAtStartup) {
      console.log(" Actualizando posiciones de columnas con configuración cargada...");
      updateColumnPositions();
    }

    // Nota: Los años guardados se mantienen en CONFIG.selectedYears para referencia,
    // pero siempre empezamos con la interfaz limpia sin años seleccionados
    console.log("📋 Años guardados disponibles:", CONFIG.selectedYears || []);

    // Mostrar mensaje inicial - siempre empezamos limpios
    svg.select(".title").text("Selecciona años y presiona Play").style("font-family", CONFIG.fontFamily);

    // Limpiar cualquier estado pendiente
    if (window.pendingSelectedYears) {
      delete window.pendingSelectedYears;
    }

  }).catch(function(error) {
    console.error("Error cargando CSV:", error);
    const loadingEl = d3.select("#loading");
    loadingEl.text("Error al cargar los datos: " + error.message);
    loadingEl.style("display", "block");
    loadingEl.style("color", "#f44336");
  });

  // UI oculta por defecto - Touch Designer ready
  console.log("🔇 UI oculta por defecto (Touch Designer ready)");

  // Aplicar clase ui-hidden a todos los elementos de UI
  const elementsToHide = [
    "#year-buttons",
    "#play-button",
    "#stop-button",
    "#toggle-text-color",
    "#toggle-glow",
    "#config-toggle",
    "#version-indicator",
    "#save-status",
    "#opacity-slider-container",
    "#save-config",
    "#export-config",
    "#import-config",
    "#clear-config",
    "#test-save",
    ".title"
  ];

  elementsToHide.forEach(selector => {
    d3.selectAll(selector).classed("ui-hidden", true);
  });
}

// Función para configurar el panel
function setupConfigPanel() {
  // Toggle del panel
  const configToggle = document.getElementById("config-toggle");
  const configPanel = document.getElementById("config-panel");
  const closeConfig = document.getElementById("close-config");
  
  if (configToggle && configPanel) {
    configToggle.addEventListener("click", () => {
      configPanel.classList.toggle("active");
    });
  }
  
  if (closeConfig && configPanel) {
    closeConfig.addEventListener("click", () => {
      configPanel.classList.remove("active");
    });
  }
  
  // Configuración de sliders
  setupSlider("column-spacing", "col-spacing-value", value => {
    CONFIG.columnSpacing = parseFloat(value);
    updateColumnPositions();
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Distancias individuales entre columnas
  setupSlider("distance-cont-disc", "dist-cont-disc-value", value => {
    CONFIG.distances.contDisc = parseFloat(value);
    updateColumnPositions();
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  setupSlider("distance-disc-gen", "dist-disc-gen-value", value => {
    CONFIG.distances.discGen = parseFloat(value);
    updateColumnPositions();
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  setupSlider("distance-gen-prof", "dist-gen-prof-value", value => {
    CONFIG.distances.genProf = parseFloat(value);
    updateColumnPositions();
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Font family global
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      CONFIG.fontFamily = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado - solo guardar manualmente
    });
  }

  // Colores para comparación de años
  const color1Input = document.getElementById("color1");
  if (color1Input) {
    color1Input.addEventListener("change", (e) => {
      CONFIG.color1 = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }

  const color2Input = document.getElementById("color2");
  if (color2Input) {
    color2Input.addEventListener("change", (e) => {
      CONFIG.color2 = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }

  // Opacidad de las líneas
  setupSlider("link-opacity", "link-opacity-value", value => {
    CONFIG.linkOpacity = parseFloat(value);
    currentOpacity = CONFIG.linkOpacity; // Sincronizar con variable global
    if (selectedYears.length > 0) {
      d3.selectAll(".link").style("stroke-opacity", currentOpacity);
    }
  });
  
  // Font weight global
  const fontWeightSelect = document.getElementById("font-weight-global");
  if (fontWeightSelect) {
    fontWeightSelect.addEventListener("change", (e) => {
      CONFIG.fontWeight = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  
  // Continentes
  const continentFontFamily = document.getElementById("continent-font-family");
  if (continentFontFamily) {
    continentFontFamily.addEventListener("change", (e) => {
      CONFIG.continent.fontFamily = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  const continentFontWeight = document.getElementById("continent-font-weight");
  if (continentFontWeight) {
    continentFontWeight.addEventListener("change", (e) => {
      CONFIG.continent.fontWeight = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  setupSlider("continent-font-size", "cont-size-value", value => {
    CONFIG.continent.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("continent-height", "cont-height-value", value => {
    CONFIG.continent.nodeHeight = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("continent-spacing", "cont-spacing-value", value => {
    CONFIG.continent.spacing = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Disciplinas
  const disciplineFontFamily = document.getElementById("discipline-font-family");
  if (disciplineFontFamily) {
    disciplineFontFamily.addEventListener("change", (e) => {
      CONFIG.discipline.fontFamily = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  const disciplineFontWeight = document.getElementById("discipline-font-weight");
  if (disciplineFontWeight) {
    disciplineFontWeight.addEventListener("change", (e) => {
      CONFIG.discipline.fontWeight = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  setupSlider("discipline-font-size", "disc-size-value", value => {
    CONFIG.discipline.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("discipline-height", "disc-height-value", value => {
    CONFIG.discipline.nodeHeight = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("discipline-spacing", "disc-spacing-value", value => {
    CONFIG.discipline.spacing = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Generaciones
  const generationFontFamily = document.getElementById("generation-font-family");
  if (generationFontFamily) {
    generationFontFamily.addEventListener("change", (e) => {
      CONFIG.generation.fontFamily = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  const generationFontWeight = document.getElementById("generation-font-weight");
  if (generationFontWeight) {
    generationFontWeight.addEventListener("change", (e) => {
      CONFIG.generation.fontWeight = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  setupSlider("generation-font-size", "gen-size-value", value => {
    CONFIG.generation.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("generation-height", "gen-height-value", value => {
    CONFIG.generation.nodeHeight = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("generation-spacing", "gen-spacing-value", value => {
    CONFIG.generation.spacing = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Profesiones
  const professionFontFamily = document.getElementById("profession-font-family");
  if (professionFontFamily) {
    professionFontFamily.addEventListener("change", (e) => {
      CONFIG.profession.fontFamily = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  const professionFontWeight = document.getElementById("profession-font-weight");
  if (professionFontWeight) {
    professionFontWeight.addEventListener("change", (e) => {
      CONFIG.profession.fontWeight = e.target.value;
      if (selectedYears.length > 0) drawSankey(selectedYears);
      // Auto-save deshabilitado
    });
  }
  setupSlider("profession-font-size", "prof-size-value", value => {
    CONFIG.profession.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("profession-height", "prof-height-value", value => {
    CONFIG.profession.nodeHeight = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("profession-spacing", "prof-spacing-value", value => {
    CONFIG.profession.spacing = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Títulos de columnas
  setupSlider("title-continent-font-size", "title-cont-size-value", value => {
    CONFIG.columnTitles.continent.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-continent-offsetY", "title-cont-offsetY-value", value => {
    CONFIG.columnTitles.continent.offsetY = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-continent-offsetX", "title-cont-offsetX-value", value => {
    CONFIG.columnTitles.continent.offsetX = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  setupSlider("title-discipline-font-size", "title-disc-size-value", value => {
    CONFIG.columnTitles.discipline.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-discipline-offsetY", "title-disc-offsetY-value", value => {
    CONFIG.columnTitles.discipline.offsetY = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-discipline-offsetX", "title-disc-offsetX-value", value => {
    CONFIG.columnTitles.discipline.offsetX = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  setupSlider("title-generation-font-size", "title-gen-size-value", value => {
    CONFIG.columnTitles.generation.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-generation-offsetY", "title-gen-offsetY-value", value => {
    CONFIG.columnTitles.generation.offsetY = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-generation-offsetX", "title-gen-offsetX-value", value => {
    CONFIG.columnTitles.generation.offsetX = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  setupSlider("title-profession-font-size", "title-prof-size-value", value => {
    CONFIG.columnTitles.profession.fontSize = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-profession-offsetY", "title-prof-offsetY-value", value => {
    CONFIG.columnTitles.profession.offsetY = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("title-profession-offsetX", "title-prof-offsetX-value", value => {
    CONFIG.columnTitles.profession.offsetX = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Espaciado de texto
  setupSlider("letter-spacing", "letter-spacing-value", value => {
    CONFIG.letterSpacing = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("line-height", "line-height-value", value => {
    CONFIG.lineHeight = parseFloat(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Animaciones
  setupSlider("line-duration", "line-duration-value", value => {
    CONFIG.animations.lineDuration = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("line-delay-columns", "line-delay-columns-value", value => {
    CONFIG.animations.lineDelayBetweenColumns = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("line-delay-links", "line-delay-links-value", value => {
    CONFIG.animations.lineDelayBetweenLinks = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("second-year-delay", "second-year-delay-value", value => {
    CONFIG.animations.secondYearDelay = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("inter-animation-delay", "inter-animation-delay-value", value => {
    CONFIG.animations.interAnimationDelay = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  
  // Glow
  setupSlider("glow-appear-delay", "glow-appear-delay-value", value => {
    CONFIG.animations.glowAppearDelay = parseInt(value);
    if (selectedYears.length > 0) drawSankey(selectedYears);
  });
  setupSlider("glow-intensity", "glow-intensity-value", value => {
    CONFIG.animations.glowIntensity = parseFloat(value);
    updateGlowStyles();
  });
  setupSlider("glow-pulse-duration", "glow-pulse-duration-value", value => {
    CONFIG.animations.glowPulseDuration = parseFloat(value);
    updateGlowStyles();
  });
  setupSlider("glow-pulse-intensity", "glow-pulse-intensity-value", value => {
    CONFIG.animations.glowPulseIntensity = parseFloat(value);
    updateGlowStyles();
  });
  
  // Función para actualizar estilos de glow dinámicamente
  function updateGlowStyles() {
    const intensity = CONFIG.animations.glowIntensity;
    const pulseIntensity = CONFIG.animations.glowPulseIntensity;
    const pulseDuration = CONFIG.animations.glowPulseDuration;
    
    // Actualizar CSS dinámicamente
    const style = document.createElement('style');
    style.id = 'dynamic-glow-styles';
    style.textContent = `
      .column-label.glow-active {
        filter: drop-shadow(0 0 ${10 * intensity}px rgba(245, 86, 168, ${0.9 * intensity})) 
                drop-shadow(0 0 ${20 * intensity}px rgba(245, 86, 168, ${0.7 * intensity}))
                drop-shadow(0 0 ${30 * intensity}px rgba(245, 86, 168, ${0.5 * intensity}))
                drop-shadow(0 0 ${40 * intensity}px rgba(245, 86, 168, ${0.3 * intensity}));
        animation: pulseGlow ${pulseDuration}s ease-in-out infinite;
      }
      @keyframes pulseGlow {
        0%, 100% {
          filter: drop-shadow(0 0 ${10 * intensity}px rgba(245, 86, 168, ${0.9 * intensity})) 
                  drop-shadow(0 0 ${20 * intensity}px rgba(245, 86, 168, ${0.7 * intensity}))
                  drop-shadow(0 0 ${30 * intensity}px rgba(245, 86, 168, ${0.5 * intensity}))
                  drop-shadow(0 0 ${40 * intensity}px rgba(245, 86, 168, ${0.3 * intensity}));
        }
        50% {
          filter: drop-shadow(0 0 ${15 * intensity * pulseIntensity}px rgba(245, 86, 168, ${1 * intensity})) 
                  drop-shadow(0 0 ${25 * intensity * pulseIntensity}px rgba(245, 86, 168, ${0.9 * intensity}))
                  drop-shadow(0 0 ${40 * intensity * pulseIntensity}px rgba(245, 86, 168, ${0.7 * intensity}))
                  drop-shadow(0 0 ${55 * intensity * pulseIntensity}px rgba(245, 86, 168, ${0.5 * intensity}));
        }
      }
    `;
    
    // Remover estilo anterior si existe
    const oldStyle = document.getElementById('dynamic-glow-styles');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
  }
  
  // Inicializar estilos de glow
  updateGlowStyles();
  
  // Botón de exportar
  const exportButton = document.getElementById("export-config");
  const configOutput = document.getElementById("config-output");

  if (exportButton && configOutput) {
    exportButton.addEventListener("click", () => {
      // Crear configuración con versión para compatibilidad futura
      const configToExport = {
        version: "2.0", // Versión de la configuración
        ...CONFIG
      };

      const configString = JSON.stringify(configToExport, null, 2);
      configOutput.value = configString;
      configOutput.style.display = "block";
      configOutput.select();

      // Copiar al portapapeles
      try {
        document.execCommand('copy');
        exportButton.textContent = " Copiado al portapapeles!";
        setTimeout(() => {
          exportButton.textContent = "📋 Exportar Configuración";
        }, 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    });
  }
  

  // Botón de importar
  const importButton = document.getElementById("import-config");
  const importInput = document.getElementById("import-input");

  if (importButton && importInput) {
    importButton.addEventListener("click", () => {
      if (importInput.style.display === "none" || importInput.style.display === "") {
        // Mostrar el área de texto
        importInput.style.display = "block";
        importInput.focus();
        importButton.textContent = " Aplicar Importación";
      } else {
        // Aplicar la configuración importada
        try {
          const importedConfig = JSON.parse(importInput.value);
          applyImportedConfig(importedConfig);

          // Actualizar todos los controles UI
          updateUIControls();

          // Actualizar estilos de glow si es necesario
          updateGlowStyles();

          // Redibujar el diagrama si hay años seleccionados o si hay un diagrama dibujado
          // PERO no si estamos en modos globales (TODOS/CHILE) que requieren lógica especial
          updateColumnPositions();
          if (selectedYears.length > 0 && !globalAllMode && !chileAllMode) {
            console.log(" Redibujando diagrama con nueva configuración importada");
            drawSankey(selectedYears);
          } else if (sankeyDrawn && (globalAllMode || chileAllMode)) {
            console.log(" Manteniendo modo global actual tras configuración importada");
            // No redibujar automáticamente en modos globales - el usuario debe hacer clic en Play de nuevo
          }

          importInput.style.display = "none";
          importInput.value = "";
          importButton.textContent = "📥 Importar Configuración";

          alert(" Configuración importada exitosamente!");
        } catch (err) {
          alert(" Error al importar configuración: " + err.message);
          console.error('Error al importar:', err);
        }
      }
    });
  }
  
  // Botón de guardar configuración
  const saveButton = document.getElementById("save-config");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      console.log("🔘 Botón guardar presionado");
      try {
        CONFIG.lastSaved = new Date().toISOString();
        const configString = JSON.stringify(CONFIG, null, 2);
        localStorage.setItem('sankey-config', configString);
        saveButton.textContent = " ¡Guardado manual!";
        saveButton.style.background = "#4CAF50";

        // Actualizar indicadores
        updateConfigStatus(true);
        updateVersionIndicator();
        updateSaveStatus(true);

        console.log(" Configuración guardada manualmente:", {
          selectedYears: CONFIG.selectedYears,
          lastSaved: CONFIG.lastSaved,
          size: configString.length + " chars"
        });

        setTimeout(() => {
          saveButton.textContent = " Guardar Configuración";
          saveButton.style.background = "#FF9800";
        }, 2000);
      } catch (err) {
        alert(" Error al guardar configuración: " + err.message);
        console.error('Error al guardar:', err);
      }
    });
  }

  // Botón de limpiar configuración
  const clearButton = document.getElementById("clear-config");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (confirm("¿Estás seguro de que quieres eliminar la configuración guardada? Esto restaurará todos los valores por defecto.")) {
        try {
          localStorage.removeItem('sankey-config');
          updateConfigStatus(false);
          clearButton.textContent = " ¡Configuración eliminada!";
          clearButton.style.background = "#4CAF50";
          setTimeout(() => {
            clearButton.textContent = "🗑️ Limpiar Configuración";
            clearButton.style.background = "#F44336";
          }, 2000);
          console.log("🗑️ Configuración eliminada");
        } catch (err) {
          alert(" Error al eliminar configuración: " + err.message);
          console.error('Error al eliminar:', err);
        }
      }
    });
  }

  // Botón de prueba de guardado
  const testButton = document.getElementById("test-save");
  if (testButton) {
    testButton.addEventListener("click", () => {
      console.log("🧪 PRUEBA COMPLETA DE GUARDADO");

      // Paso 1: Verificar localStorage básico
      try {
        localStorage.setItem('test-basic', 'works');
        const basic = localStorage.getItem('test-basic');
        if (basic === 'works') {
          console.log(" localStorage básico OK");
          localStorage.removeItem('test-basic');
        } else {
          throw new Error("localStorage no funciona");
        }
      } catch (e) {
        console.error(" localStorage no funciona:", e.message);
        testButton.textContent = " ¡localStorage roto!";
        testButton.style.background = "#F44336";
        setTimeout(() => {
          testButton.textContent = "🧪 Probar Guardado";
          testButton.style.background = "#9C27B0";
        }, 2000);
        return;
      }

      // Paso 2: Verificar que CONFIG existe
      if (!CONFIG) {
        console.error(" CONFIG no existe");
        return;
      }

      // Paso 3: Intentar guardar CONFIG
      try {
        const configToSave = {
          ...CONFIG,
          selectedYears: [...selectedYears],
          testTime: new Date().toISOString()
        };

        const configString = JSON.stringify(configToSave);
        localStorage.setItem('sankey-config', configString);

        // Verificar inmediatamente
        const verify = localStorage.getItem('sankey-config');
        if (verify) {
          const parsed = JSON.parse(verify);
          console.log(" CONFIG guardado y verificado:", {
            size: configString.length,
            selectedYears: parsed.selectedYears?.length || 0,
            testTime: parsed.testTime
          });

          testButton.textContent = " ¡Guardado OK!";
          testButton.style.background = "#4CAF50";
          updateConfigStatus(true);
          updateVersionIndicator();
        } else {
          throw new Error("No se pudo verificar el guardado");
        }

      } catch (err) {
        console.error(" Error guardando CONFIG:", err.message);
        testButton.textContent = " ¡Error guardando!";
        testButton.style.background = "#F44336";
      }

      setTimeout(() => {
        testButton.textContent = "🧪 Probar Guardado";
        testButton.style.background = "#9C27B0";
      }, 3000);
    });
  }

  // Función para actualizar controles UI desde CONFIG
  function updateUIControls() {
    // Asegurar que distances existe
    if (!CONFIG.distances) {
      CONFIG.distances = { contDisc: 10, discGen: 10, genProf: 10 };
    }
    
    // Asegurar que columnTitles existe
    if (!CONFIG.columnTitles) {
      CONFIG.columnTitles = {
        continent: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        discipline: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        generation: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        profession: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" }
      };
    }
    
    // Actualizar sliders y selects según CONFIG
    const sliders = [
      { id: "column-spacing", valueId: "col-spacing-value", value: CONFIG.columnSpacing },
      { id: "distance-cont-disc", valueId: "dist-cont-disc-value", value: CONFIG.distances.contDisc },
      { id: "distance-disc-gen", valueId: "dist-disc-gen-value", value: CONFIG.distances.discGen },
      { id: "distance-gen-prof", valueId: "dist-gen-prof-value", value: CONFIG.distances.genProf },
      { id: "continent-font-size", valueId: "cont-size-value", value: CONFIG.continent.fontSize },
      { id: "continent-height", valueId: "cont-height-value", value: CONFIG.continent.nodeHeight },
      { id: "continent-spacing", valueId: "cont-spacing-value", value: CONFIG.continent.spacing },
      { id: "discipline-font-size", valueId: "disc-size-value", value: CONFIG.discipline.fontSize },
      { id: "discipline-height", valueId: "disc-height-value", value: CONFIG.discipline.nodeHeight },
      { id: "discipline-spacing", valueId: "disc-spacing-value", value: CONFIG.discipline.spacing },
      { id: "generation-font-size", valueId: "gen-size-value", value: CONFIG.generation.fontSize },
      { id: "generation-height", valueId: "gen-height-value", value: CONFIG.generation.nodeHeight },
      { id: "generation-spacing", valueId: "gen-spacing-value", value: CONFIG.generation.spacing },
      { id: "profession-font-size", valueId: "prof-size-value", value: CONFIG.profession.fontSize },
      { id: "profession-height", valueId: "prof-height-value", value: CONFIG.profession.nodeHeight },
      { id: "profession-spacing", valueId: "prof-spacing-value", value: CONFIG.profession.spacing },
      { id: "letter-spacing", valueId: "letter-spacing-value", value: CONFIG.letterSpacing },
      { id: "line-height", valueId: "line-height-value", value: CONFIG.lineHeight },
      { id: "link-opacity", valueId: "link-opacity-value", value: CONFIG.linkOpacity },
      { id: "title-continent-font-size", valueId: "title-cont-size-value", value: CONFIG.columnTitles.continent.fontSize },
      { id: "title-continent-offsetY", valueId: "title-cont-offsetY-value", value: CONFIG.columnTitles.continent.offsetY },
      { id: "title-continent-offsetX", valueId: "title-cont-offsetX-value", value: CONFIG.columnTitles.continent.offsetX },
      { id: "title-discipline-font-size", valueId: "title-disc-size-value", value: CONFIG.columnTitles.discipline.fontSize },
      { id: "title-discipline-offsetY", valueId: "title-disc-offsetY-value", value: CONFIG.columnTitles.discipline.offsetY },
      { id: "title-discipline-offsetX", valueId: "title-disc-offsetX-value", value: CONFIG.columnTitles.discipline.offsetX },
      { id: "title-generation-font-size", valueId: "title-gen-size-value", value: CONFIG.columnTitles.generation.fontSize },
      { id: "title-generation-offsetY", valueId: "title-gen-offsetY-value", value: CONFIG.columnTitles.generation.offsetY },
      { id: "title-generation-offsetX", valueId: "title-gen-offsetX-value", value: CONFIG.columnTitles.generation.offsetX },
      { id: "title-profession-font-size", valueId: "title-prof-size-value", value: CONFIG.columnTitles.profession.fontSize },
      { id: "title-profession-offsetY", valueId: "title-prof-offsetY-value", value: CONFIG.columnTitles.profession.offsetY },
      { id: "title-profession-offsetX", valueId: "title-prof-offsetX-value", value: CONFIG.columnTitles.profession.offsetX },
      { id: "line-duration", valueId: "line-duration-value", value: CONFIG.animations.lineDuration },
      { id: "line-delay-columns", valueId: "line-delay-columns-value", value: CONFIG.animations.lineDelayBetweenColumns },
      { id: "line-delay-links", valueId: "line-delay-links-value", value: CONFIG.animations.lineDelayBetweenLinks },
      { id: "glow-appear-delay", valueId: "glow-appear-delay-value", value: CONFIG.animations.glowAppearDelay },
      { id: "glow-intensity", valueId: "glow-intensity-value", value: CONFIG.animations.glowIntensity },
      { id: "glow-pulse-duration", valueId: "glow-pulse-duration-value", value: CONFIG.animations.glowPulseDuration },
      { id: "glow-pulse-intensity", valueId: "glow-pulse-intensity-value", value: CONFIG.animations.glowPulseIntensity },
      { id: "second-year-delay", valueId: "second-year-delay-value", value: CONFIG.animations.secondYearDelay },
      { id: "inter-animation-delay", valueId: "inter-animation-delay-value", value: CONFIG.animations.interAnimationDelay }
    ];
    
    sliders.forEach(({ id, valueId, value }) => {
      const slider = document.getElementById(id);
      const valueSpan = document.getElementById(valueId);
      if (slider) slider.value = value;
      if (valueSpan) valueSpan.textContent = value;
    });
    
    // Actualizar selects
    const fontFamilySelect = document.getElementById("font-family");
    if (fontFamilySelect) fontFamilySelect.value = CONFIG.fontFamily;

    const fontWeightSelect = document.getElementById("font-weight-global");
    if (fontWeightSelect) fontWeightSelect.value = CONFIG.fontWeight;

    // Actualizar colores
    const color1Input = document.getElementById("color1");
    if (color1Input) color1Input.value = CONFIG.color1;

    const color2Input = document.getElementById("color2");
    if (color2Input) color2Input.value = CONFIG.color2;
    
    const columnFontFamilies = [
      { id: "continent-font-family", value: CONFIG.continent.fontFamily },
      { id: "discipline-font-family", value: CONFIG.discipline.fontFamily },
      { id: "generation-font-family", value: CONFIG.generation.fontFamily },
      { id: "profession-font-family", value: CONFIG.profession.fontFamily }
    ];
    
    columnFontFamilies.forEach(({ id, value }) => {
      const select = document.getElementById(id);
      if (select) select.value = value;
    });
    
    const columnFontWeights = [
      { id: "continent-font-weight", value: CONFIG.continent.fontWeight },
      { id: "discipline-font-weight", value: CONFIG.discipline.fontWeight },
      { id: "generation-font-weight", value: CONFIG.generation.fontWeight },
      { id: "profession-font-weight", value: CONFIG.profession.fontWeight }
    ];
    
    columnFontWeights.forEach(({ id, value }) => {
      const select = document.getElementById(id);
      if (select) select.value = value;
    });
  }
}

// Función auxiliar para configurar sliders
function setupSlider(sliderId, valueId, onChange, formatValue = null) {
  const slider = document.getElementById(sliderId);
  const valueSpan = document.getElementById(valueId);

  if (slider && valueSpan) {
    slider.addEventListener("input", (e) => {
      const value = e.target.value;

      // Si el slider tiene step con decimales, mostrar con 1 decimal
      const step = parseFloat(slider.step);
      if (step < 1) {
        valueSpan.textContent = parseFloat(value).toFixed(1);
      } else {
        valueSpan.textContent = value;
      }
      onChange(value);

      // Auto-save deshabilitado - solo guardar manualmente
    });
  }
}

// Función para crear controles de UI (opacidad)
function createUIControls() {
  const sliderContainer = d3.select("body")
    .append("div")
    .attr("id", "opacity-slider-container")
    .style("position", "absolute")
    .style("top", "60px")
    .style("right", "10px")
    .style("background", "white")
    .style("padding", "10px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    .style("z-index", "200");
  
  sliderContainer.append("label")
    .text("Opacidad líneas: ")
    .style("font-size", "12px");
  
  sliderContainer.append("input")
    .attr("type", "range")
    .attr("id", "opacity-slider")
    .attr("min", "0.1")
    .attr("max", "0.8")
    .attr("step", "0.1")
    .attr("value", "0.3")
    .style("width", "100px")
    .on("input", function() {
      currentOpacity = +this.value;
      d3.selectAll(".link").style("stroke-opacity", currentOpacity);
      d3.select("#opacity-value").text(currentOpacity);
    });
  
  sliderContainer.append("span")
    .attr("id", "opacity-value")
    .text("0.3")
    .style("font-size", "12px")
    .style("margin-left", "5px");
}

// Función para procesar y normalizar datos
function processData(data) {
  const processed = [];
  
  data.forEach(row => {
    if (!row.year || row.year === "#N/A" || row.year === "S/I") return;
    if (!row.continent || row.continent === "#N/A" || row.continent === "S/I") return;
    if (!row.discipline || row.discipline === "#N/A" || row.discipline === "S/I") return;
    if (!row.generation || row.generation === "#N/A" || row.generation === "S/I") return;
    if (!row.profession || row.profession === "#N/A" || row.profession === "S/I") return;
    
    const professions = row.profession.split(/[;,]/).map(p => p.trim()).filter(p => p);
    
    if (row.continent === "Europa; Asia") {
      professions.forEach(prof => {
        processed.push(normalizeRecord({...row, continent: "Europa", profession: prof}));
        processed.push(normalizeRecord({...row, continent: "Asia", profession: prof}));
      });
    } else {
      professions.forEach(prof => {
        processed.push(normalizeRecord({...row, profession: prof}));
      });
    }
  });
  
  return processed;
}

// Función para normalizar un registro
function normalizeRecord(record) {
  const normalized = {...record};
  
  ['continent', 'generation', 'discipline', 'profession'].forEach(field => {
    if (NORMALIZATION[field] && NORMALIZATION[field][record[field]]) {
      normalized[field] = NORMALIZATION[field][record[field]];
    }
  });
  
  return normalized;
}

// Actualizar las listas del MASTER
function updateMasterLists() {
  const disciplines = new Set();
  const professions = new Set();
  
  allData.forEach(d => {
    if (d.discipline) disciplines.add(d.discipline);
    // Incluir las 3 columnas de profesión
    if (d.profession) professions.add(d.profession);
    if (d.Concepto_2) professions.add(d.Concepto_2);
    if (d.Concepto_3) professions.add(d.Concepto_3);
  });

  MASTER.discipline = Array.from(disciplines).sort();

  // Orden específico para profesiones como pidió el usuario
  const professionOrder = [
    "Edición genética",
    "Longevidad activa",
    "Medicina del futuro",
    "Mente y cerebro",
    "Microbioma",
    "Neurociencia",
    "Salud mental",
    "Aprendizaje no humano",
    "Cuerpo y tecnología",
    "Inteligencia artificial",
    "Inteligencia colectiva",
    "Límites de la IA",
    "Agua estratégica",
    "Biodiversidad crítica",
    "Cambio climático",
    "Cosmos",
    "Océanos vivos",
    "Sistemas vivos",
    "Transición energética",
    "Ciudades inteligentes",
    "Computación cuántica",
    "Datos como poder",
    "Riesgo digital",
    "Ciencia y sociedad",
    "Democracia del futuro",
    "Democracia digital",
    "Economía regenerativa",
    "Educación y divulgación científica",
    "Género y diversidad"
  ];

  // Crear array con el orden específico, manteniendo solo los que existen en los datos
  MASTER.profession = professionOrder.filter(prof => professions.has(prof));
  
  updateColumnPositions();
}

// Obtener años únicos
function getUniqueYears(data) {
  return [...new Set(data.map(d => d.year))]
    .filter(year => year && year !== "#N/A" && year !== "S/I")
    .sort();
}

// Crear botones de años
function createYearButtons(years) {
  const container = d3.select("#year-buttons");
  container.selectAll("*").remove();

  // Crear botones de años normales
  console.log(`🏗️ Creando botones de años, selectedYears actual:`, selectedYears);
  years.forEach(year => {
    const isActive = selectedYears.includes(year);
    console.log(`📌 Creando botón ${year}, activo: ${isActive}`);
    const button = container.append("button")
      .attr("class", "year-button")
      .text(year)
      .classed("active", isActive)
      .on("click", function() {
        console.log(`🎯 Clic en año ${year}, selectedYears actual:`, selectedYears);

        // Si el año ya está seleccionado, lo removemos
        if (selectedYears.includes(year)) {
          console.log(`❌ Removiendo año ${year} de selección`);
          selectedYears = selectedYears.filter(y => y !== year);
        } else {
          // Si no está seleccionado, lo agregamos (máximo 2 años)
          if (selectedYears.length < 2) {
            console.log(`➕ Agregando año ${year} a selección`);
            selectedYears.push(year);
          } else {
            // Si ya hay 2 años, reemplazamos el primero
            const removed = selectedYears.shift();
            console.log(`🔄 Reemplazando ${removed} con ${year}`);
            selectedYears.push(year);
          }
        }

        console.log(`📊 selectedYears final:`, selectedYears);

        // Limpiar modos especiales cuando se seleccionan años normales
        globalAllMode = false;
        chileAllMode = false;

        // Actualizar clases activas
        console.log(`🔄 Actualizando clases activas para selectedYears:`, selectedYears);
        container.selectAll("button").classed("active", false);
        selectedYears.forEach(selectedYear => {
          console.log(`✅ Activando botón para año: ${selectedYear}`);
          container.selectAll("button")
            .filter(function() { return d3.select(this).text() === selectedYear; })
            .classed("active", true);
        });
        console.log(`📊 Total botones activos ahora:`, container.selectAll("button.active").size());

        // Auto-save deshabilitado para años - solo guardar manualmente

        // No ejecutar automáticamente - esperar botón Play
        // Limpiar el diagrama actual si no hay años seleccionados
        if (selectedYears.length === 0) {
          clearSankey();
          // Apagar glows cuando no hay años seleccionados
          d3.selectAll(".column-label-group").classed("glow-active", false);
        } else {
          // Actualizar colores de círculos existentes si ya hay un diagrama
          updateNodeColors();
        }
      });
  });

  // Agregar botón "TODOS" (todos los años, todos los continentes)
  const todosButton = container.append("button")
    .attr("class", "year-button special-button")
    .text("TODOS")
    .classed("active", globalAllMode)
    .on("click", function() {
      console.log(`🌍 Activando modo TODOS, selectedYears anterior:`, selectedYears);
      // Limpiar selecciones previas
      selectedYears = [];
      globalAllMode = !globalAllMode; // Toggle
      chileAllMode = false;
      console.log(`🌍 Modo TODOS activado, selectedYears:`, selectedYears);

      // Actualizar clases activas
      container.selectAll("button").classed("active", false);
      if (globalAllMode) {
        d3.select(this).classed("active", true);
      }

      // Limpiar el diagrama si no hay selección
      if (!globalAllMode && !chileAllMode) {
        clearSankey();
        d3.selectAll(".column-label-group").classed("glow-active", false);
      }
    });

  // Agregar botón "CHILE" (todos los años, solo Chile)
  const chileButton = container.append("button")
    .attr("class", "year-button special-button")
    .text("CHILE")
    .classed("active", chileAllMode)
    .on("click", function() {
      console.log(`🇨🇱 Activando modo CHILE, selectedYears anterior:`, selectedYears);
      // Limpiar selecciones previas
      selectedYears = [];
      chileAllMode = !chileAllMode; // Toggle
      globalAllMode = false;
      console.log(`🇨🇱 Modo CHILE activado, selectedYears:`, selectedYears);

      // Actualizar clases activas
      container.selectAll("button").classed("active", false);
      if (chileAllMode) {
        d3.select(this).classed("active", true);
      }

      // Limpiar el diagrama si no hay selección
      if (!globalAllMode && !chileAllMode) {
        clearSankey();
        d3.selectAll(".column-label-group").classed("glow-active", false);
      }
    });
}

// Preparar datos del Sankey
function prepareSankeyData(years, continentFilter = null) {
  // Soporte para años únicos o múltiples
  if (!Array.isArray(years)) {
    years = [years];
  }

  let filteredData = allData.filter(d => years.includes(d.year));

  // Si hay filtro de continente Y múltiples años, o si es filtro GLOBAL, combinar todos en un solo "año" para mostrar como SUMA
  // Esto permite mostrar datos de múltiples años como una sola muestra combinada, no como comparación
  if ((continentFilter && years.length > 1) || (continentFilter === "GLOBAL" && years.length > 1)) {
    console.log(`🔄 Combinando ${years.length} años en uno solo para filtro ${continentFilter} (SUMA)`);
    // Usar el primer año como identificador común para todos los registros
    const commonYear = years[0];
    filteredData = filteredData.map(d => ({ ...d, year: commonYear }));
  }

  // Aplicar filtro de continente si se especifica (GLOBAL incluye todos los continentes)
  if (continentFilter && continentFilter !== "GLOBAL") {
    console.log(`🎯 Filtrando por continente: ${continentFilter}`);
    console.log(`📊 Datos antes del filtro: ${filteredData.length}`);
    filteredData = filteredData.filter(d => d.continent === continentFilter);
    console.log(`📊 Datos después del filtro: ${filteredData.length}`);
    console.log(`🌍 Continentes únicos en datos filtrados:`, [...new Set(filteredData.map(d => d.continent))]);
  } else if (continentFilter === "GLOBAL") {
    console.log(`🌍 Modo GLOBAL: Incluyendo todos los continentes`);
    console.log(`📊 Datos totales: ${filteredData.length}`);
    console.log(`🌍 Continentes incluidos:`, [...new Set(filteredData.map(d => d.continent))]);
  }

  const yearData = filteredData;
  
  if (yearData.length === 0) {
    return { nodes: [], links: [] };
  }
  
  const nodeMap = new Map();
  
  // Agregar TODOS los nodos
  MASTER.continent.forEach(item => {
    const id = getNodeId(item, 'continent');
    nodeMap.set(id, {
      id: id,
      name: item,
      column: 0,
      type: 'continent',
      value: 0,
      x: COLUMNS.continent,
      y: getNodeY(item, 'continent')
    });
  });
  
  MASTER.discipline.forEach((item, index) => {
    const id = getNodeId(item, 'discipline');
    nodeMap.set(id, {
      id: id,
      name: item,
      column: 1,
      type: 'discipline',
      value: 0,
      x: COLUMNS.discipline,
      y: getNodeY(item, 'discipline'),
      color: getDisciplineColor(item, index)
    });
  });
  
  MASTER.generation.forEach(item => {
    const id = getNodeId(item, 'generation');
    nodeMap.set(id, {
      id: id,
      name: item,
      column: 2,
      type: 'generation',
      value: 0,
      x: COLUMNS.generation,
      y: getNodeY(item, 'generation')
    });
  });
  
  MASTER.profession.forEach((item, index) => {
    const id = getNodeId(item, 'profession');
    nodeMap.set(id, {
      id: id,
      name: item,
      column: 3,
      type: 'profession',
      value: 0,
      x: COLUMNS.profession,
      y: getNodeY(item, 'profession'),
      color: getProfessionColor(item, index)
    });
  });
  
  // Crear enlaces
  const linkMap = new Map();

  yearData.forEach(record => {
    const links = [
      {
        source: getNodeId(record.continent, 'continent'),
        target: getNodeId(record.discipline, 'discipline'),
        year: record.year
      },
      {
        source: getNodeId(record.discipline, 'discipline'),
        target: getNodeId(record.generation, 'generation'),
        year: record.year
      },
      {
        source: getNodeId(record.generation, 'generation'),
        target: getNodeId(record.profession, 'profession'),
        year: record.year
      }
    ];

    links.forEach(link => {
      const key = `${link.source}-${link.target}-${link.year}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, {
          source: link.source,
          target: link.target,
          value: 0,
          year: link.year
        });
      }
      linkMap.get(key).value += 1;
    });
    
    nodeMap.get(getNodeId(record.continent, 'continent')).value += 1;
    nodeMap.get(getNodeId(record.discipline, 'discipline')).value += 1;
    nodeMap.get(getNodeId(record.generation, 'generation')).value += 1;
    nodeMap.get(getNodeId(record.profession, 'profession')).value += 1;
  });
  
  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values())
  };
}

// Función para animar una línea progresivamente de izquierda a derecha
function animatePath(selection, delay = 0) {
  selection.each(function() {
    const path = d3.select(this);

    // Animar tanto el dashoffset como la opacidad juntos
    path
      .transition()
      .delay(delay)
      .duration(CONFIG.animations.lineDuration) // Duración configurable
      .ease(d3.easeLinear) // Lineal para movimiento constante
      .attr("stroke-dashoffset", 0)
      .style("stroke-opacity", currentOpacity);
  });
}

// Función principal para dibujar el Sankey
function drawSankey(years, continentFilter = null) {
  console.log("🚀 drawSankey LLAMADO con años:", years, "filtro:", continentFilter);

  // Soporte para años únicos (compatibilidad hacia atrás) o múltiples
  if (!Array.isArray(years)) {
    years = [years];
  }

  // Asignar selectedYears
  if ((continentFilter && years.length > 1) || (continentFilter === "GLOBAL" && years.length > 1)) {
    // Para modos combinados, usar un año común para animaciones (se limpia al final)
    selectedYears = [years[0]];
    console.log("🔄 Modo combinado - usando año común:", years[0]);
  } else {
    selectedYears = years; // Mantener sincronizado para modos normales
  }
  console.log("📊 Dibujando Sankey para los años:", selectedYears, "total:", selectedYears.length);
  console.log("Configuración actual al dibujar:", {
    columnSpacing: CONFIG.columnSpacing,
    distances: CONFIG.distances,
    color1: CONFIG.color1,
    color2: CONFIG.color2,
    linkOpacity: CONFIG.linkOpacity,
    fontSize: CONFIG.continent.fontSize
  });

  // Actualizar posiciones antes de dibujar
  updateColumnPositions();
  console.log("Posiciones de columnas calculadas:", COLUMNS);
  
  // Limpiar y remover glow activo cuando se cambia de año
  svg.selectAll(".links").remove();
  svg.selectAll(".node-circles").remove();
  svg.selectAll(".text-backgrounds").remove();
  svg.selectAll(".node-text").remove(); // Cambiado de .node-texts a .node-text
  svg.selectAll(".debug-text").remove();
  svg.selectAll(".column-label-group").classed("glow-active", false);
  
  // Actualizar título según filtro
  let titleText;
  if (continentFilter === "GLOBAL") {
    titleText = "Global (Todos los años)";
  } else if (continentFilter) {
    if (years.length === 1) {
      titleText = `${continentFilter} - ${years[0]}`;
    } else if (years.length <= 3) {
      // Para pocos años, mostrarlos individualmente
      titleText = `${continentFilter} (${years.join("+")})`;
    } else {
      // Para muchos años, mostrar resumen
      titleText = `${continentFilter} (Todos los años)`;
    }
  } else {
    titleText = years.length === 1 ? `Congreso ${years[0]}` : `Comparación: ${years.join(" vs ")}`;
  }

  d3.select(".title")
    .text(titleText)
    .style("font-family", CONFIG.fontFamily);

  d3.select("#loading").style("display", "block");

  const sankeyData = prepareSankeyData(years, continentFilter);


  // Ocultar mensaje de error si existe
  d3.select("#loading").style("display", "none");

  if (sankeyData.links.length === 0) {
    svg.append("text")
      .attr("class", "debug-text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#666")
      .style("font-family", CONFIG.fontFamily)
      .text(`No hay datos para los años ${years.join(", ")}`);
    return;
  }
  
  // 1. CAPA DE ENLACES
  const linkGroup = svg.append("g").attr("class", "links");
  
  const links = linkGroup.selectAll(".link")
    .data(sankeyData.links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d => {
      const sourceNode = sankeyData.nodes.find(n => n.id === d.source);
      const targetNode = sankeyData.nodes.find(n => n.id === d.target);
      
      const sx = sourceNode.x + NODE_WIDTH;
      const sy = sourceNode.y;
      const tx = targetNode.x;
      const ty = targetNode.y;
      const mx = (sx + tx) / 2;
      
      return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
    })
    .style("stroke", d => getLinkColor(d.year))
    .style("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 1.5))
    .style("fill", "none")
    .style("stroke-opacity", 0) // Iniciar invisible
    .attr("stroke-dasharray", function() { // Configurar dasharray inicialmente
      const totalLength = this.getTotalLength();
      return totalLength + " " + totalLength;
    })
    .attr("stroke-dashoffset", function() { // Configurar dashoffset inicialmente
      return this.getTotalLength();
    })
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke-opacity", 0.8);
      
      const sourceNode = sankeyData.nodes.find(n => n.id === d.source);
      const targetNode = sankeyData.nodes.find(n => n.id === d.target);
      
      tooltip
        .style("opacity", 1)
        .html(`${sourceNode.name} → ${targetNode.name}<br>Cantidad: ${d.value}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke-opacity", currentOpacity);
      tooltip.style("opacity", 0);
    });
  
  // Animar las líneas progresivamente de izquierda a derecha
  // Agrupar enlaces por columna de origen y animarlos secuencialmente
  const linksByColumn = {};
  const linkElements = [];
  
  links.each(function(d, i) {
    const sourceNode = sankeyData.nodes.find(n => n.id === d.source);
    const col = sourceNode.column;
    if (!linksByColumn[col]) linksByColumn[col] = [];
    linksByColumn[col].push({ element: this, link: d });
  });
  
  // Animar enlaces columna por columna, de izquierda a derecha
  let globalIndex = 0;
  const columnTypes = ["continent", "discipline", "generation", "profession"];
  
  [0, 1, 2, 3].forEach(column => {
    if (linksByColumn[column]) {
      linksByColumn[column].forEach(({ element, link }, localIndex) => {
        const path = d3.select(element);

        // Delay progresivo usando configuración
        let delay = column * CONFIG.animations.lineDelayBetweenColumns + localIndex * CONFIG.animations.lineDelayBetweenLinks;

        // Si hay dos años seleccionados Y no hay filtro de continente, agregar delay adicional para el segundo año
        // (Cuando hay filtro de continente, los años están combinados en uno solo)
        if (selectedYears.length === 2 && !continentFilter) {
          const yearIndex = selectedYears.indexOf(link.year);
          if (yearIndex === 1) { // Segundo año seleccionado
            delay += CONFIG.animations.secondYearDelay;
          }
        }

        animatePath(path, delay);
        
        globalIndex++;
      });
    }
  });
  
  // 2. CAPA DE CÍRCULOS (reemplazando rectángulos)
  const nodeCircleGroup = svg.append("g").attr("class", "node-circles");

  if (selectedYears.length === 1) {
    // Un año: círculos simples en magenta
    const nodeCircles = nodeCircleGroup.selectAll(".node-circle")
      .data(sankeyData.nodes)
      .enter()
      .append("circle")
      .attr("class", "node-circle")
      .attr("cx", d => d.x + NODE_WIDTH / 2)
      .attr("cy", d => d.y)
      .attr("r", 0) // Empezar desde radio 0
      .attr("fill", CONFIG.color1)
      .attr("fill-opacity", d => d.value > 0 ? 0.9 : 0.3);

    // Animar círculos creciendo
    nodeCircles.each(function(d, i) {
      const circle = d3.select(this);
      const targetRadius = d.value > 0 ? Math.max(2, Math.sqrt(d.value) * 2.5) : 1.5;
      const delay = d.column * 200;

      circle.transition()
        .delay(delay)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("r", targetRadius);
    });
  } else {
    // Dos años: círculos superpuestos - lavanda detrás, magenta encima
    // Segundo conjunto primero (lavanda, detrás)
    const secondYearCircles = nodeCircleGroup.selectAll(".second-year-circle")
      .data(sankeyData.nodes)
      .enter()
      .append("circle")
      .attr("class", "node-circle second-year-circle")
      .attr("cx", d => d.x + NODE_WIDTH / 2)
      .attr("cy", d => d.y)
      .attr("r", 0)
      .attr("fill", CONFIG.color2)
      .attr("fill-opacity", d => d.value > 0 ? 0.6 : 0.2); // Más tenue como fondo

    // Primer conjunto después (magenta, encima)
    const firstYearCircles = nodeCircleGroup.selectAll(".first-year-circle")
      .data(sankeyData.nodes)
      .enter()
      .append("circle")
      .attr("class", "node-circle first-year-circle")
      .attr("cx", d => d.x + NODE_WIDTH / 2)
      .attr("cy", d => d.y)
      .attr("r", 0)
      .attr("fill", CONFIG.color1)
      .attr("fill-opacity", d => d.value > 0 ? 0.9 : 0.3); // Más prominente encima

    // Animar círculos del segundo año primero (lavanda, fondo)
    secondYearCircles.each(function(d, i) {
      const circle = d3.select(this);
      const targetRadius = d.value > 0 ? Math.max(2, Math.sqrt(d.value) * 2.8) : 1.7; // Más grandes pero sutiles
      const delay = d.column * 200 + CONFIG.animations.secondYearDelay;

      circle.transition()
        .delay(delay)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("r", targetRadius);
    });

    // Animar círculos del primer año después (magenta, encima)
    firstYearCircles.each(function(d, i) {
      const circle = d3.select(this);
      const targetRadius = d.value > 0 ? Math.max(2, Math.sqrt(d.value) * 2.3) : 1.4; // Tamaño intermedio
      const delay = d.column * 200;

      circle.transition()
        .delay(delay)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("r", targetRadius);
    });
  }
  
  // 3. CAPA DE FONDOS BLANCOS (en grupo transformado)
  const textBackgrounds = svg.append("g").attr("class", "text-backgrounds");

  sankeyData.nodes.forEach(d => {
    const fontSize = CONFIG[d.type].fontSize;
    let textWidth;
    if (d.type === 'continent') textWidth = d.name.length * fontSize * 0.6;
    else if (d.type === 'discipline') textWidth = d.name.length * fontSize * 0.55;
    else if (d.type === 'generation') textWidth = d.name.toUpperCase().length * fontSize * 0.6;
    else textWidth = d.name.length * fontSize * 0.5;

    textBackgrounds.append("rect")
      .attr("x", d.column < 2 ? d.x - textWidth - 15 : d.x + NODE_WIDTH + 5)
      .attr("y", d.y - fontSize * 0.7)
      .attr("width", textWidth + 10)
      .attr("height", fontSize * 1.4)
      .attr("fill", "white")
      .attr("fill-opacity", textsVisible ? 0.9 : 0);
  });
  
  // 4. CAPA DE TEXTOS (en grupo transformado) - MÉTODO SIMPLIFICADO
  console.log("Creating node texts manually, sankeyData.nodes length:", sankeyData.nodes.length);

  sankeyData.nodes.forEach((node, index) => {
    const baseX = node.column < 2 ? node.x - 10 : node.x + NODE_WIDTH + 10;
    const textX = baseX;
    const textY = node.y;

    console.log(`Creating text ${index} for ${node.name}: x=${textX}, y=${textY}, column=${node.column}`);

    // Crear texto manualmente
    svg.append("text")
      .attr("class", "node-text")
      .attr("x", textX)
      .attr("y", textY)
      .attr("dy", "0.35em")
      .attr("text-anchor", node.column < 2 ? "end" : "start")
      .style("font-size", CONFIG[node.type].fontSize + "px")
      .style("fill", "#000") // Negro configurable
      .style("font-family", CONFIG[node.type].fontFamily === "inherit" ? CONFIG.fontFamily : CONFIG[node.type].fontFamily)
      .style("font-weight", CONFIG[node.type].fontWeight === "inherit" ? CONFIG.fontWeight : CONFIG[node.type].fontWeight)
      .style("opacity", textsVisible ? 1 : 0)
      .text(node.type === 'generation' ? node.name.toUpperCase() : node.name);
  });

  // Marcar que hay un diagrama dibujado
  sankeyDrawn = true;

  // Mostrar botón STOP cuando hay diagrama
  d3.select("#stop-button").style("display", "block");

  // Para modos combinados, limpiar selectedYears para no interferir con la interfaz
  if ((continentFilter && years.length > 1) || (continentFilter === "GLOBAL" && years.length > 1)) {
    selectedYears = []; // Limpiar para que la interfaz siga funcionando normalmente
    console.log("🧹 selectedYears limpiado después de modo combinado");
  }

  // 5. ETIQUETAS DE COLUMNA - DESACTIVADAS
  // Los títulos de las columnas han sido removidos por solicitud del usuario

  // Asegurar que el loading se oculte
  d3.select("#loading").style("display", "none");

  // Salir temprano para no crear los títulos
  return;
  
  // Limpiar títulos anteriores
  svg.selectAll(".column-label-group").remove();
  
  const columnLabels = [
    {x: COLUMNS.continent, text: "CONTINENTES", type: "continent"},
    {x: COLUMNS.discipline, text: "DISCIPLINAS", type: "discipline"},
    {x: COLUMNS.generation, text: "GENERACIONES", type: "generation"},
    {x: COLUMNS.profession, text: "PROFESIONES", type: "profession"}
  ];
  
  const titleConfigs = columnLabels.map(d => {
    const config = CONFIG.columnTitles[d.type] || CONFIG.columnTitles.continent;
    return {
      ...d,
      config: config
    };
  });
  
  // Crear elementos para el glow usando gradiente radial SVG (más profesional)
  // Primero crear los gradientes radiales en el defs
  const defs = svg.append("defs");
  
  titleConfigs.forEach((d, i) => {
    const gradientId = `glow-gradient-${d.type}`;
    const gradient = defs.append("radialGradient")
      .attr("id", gradientId)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#F556A8")
      .attr("stop-opacity", 0);
    
    gradient.append("stop")
      .attr("offset", "30%")
      .attr("stop-color", "#F556A8")
      .attr("stop-opacity", 0.3);
    
    gradient.append("stop")
      .attr("offset", "60%")
      .attr("stop-color", "#F556A8")
      .attr("stop-opacity", 0.1);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#F556A8")
      .attr("stop-opacity", 0);
  });
  
  // Crear grupos para cada título
  const labelGroup = svg.selectAll(".column-label-group")
    .data(titleConfigs)
    .enter()
    .append("g")
    .attr("class", d => `column-label-group column-label-${d.type}`);
  
  // Crear múltiples elipses concéntricas para un glow suave y profesional
  const glowLayers = [1, 1.5, 2, 2.5, 3]; // Múltiples capas para suavidad
  const glowOpacities = [0.6, 0.4, 0.3, 0.2, 0.1]; // Opacidades decrecientes
  
  glowLayers.forEach((scale, layerIndex) => {
    labelGroup.append("ellipse")
      .attr("class", `glow-layer-${layerIndex}`)
      .attr("cx", d => d.x + margin.left + (d.config.offsetX || 0)) // Añadir margen izquierdo
      .attr("cy", d => height + margin.top - d.config.offsetY - 15) // Subir 15px para evitar que el glow se corte
      .attr("rx", d => (d.text.length * d.config.fontSize * 0.3) * scale)
      .attr("ry", d => (d.config.fontSize * 0.6) * scale)
      .style("fill", "#F556A8")
      .style("fill-opacity", 0) // Inicialmente invisible
      .style("stroke", "none");
  });
  
  // Texto visible temporalmente para debug
  labelGroup.append("text")
    .attr("class", "label-text")
    .attr("x", d => d.x + margin.left + (d.config.offsetX || 0)) // Añadir margen izquierdo
    .attr("y", d => height + margin.top - d.config.offsetY - 15) // Subir 15px para coincidir con glow
    .attr("text-anchor", "middle")
    .style("font-size", d => d.config.fontSize + "px")
    .style("font-weight", d => d.config.fontWeight)
    .style("fill", "#F556A8")
    .style("font-family", d => {
      const fontFamily = d.config.fontFamily === "inherit"
        ? CONFIG.fontFamily
        : d.config.fontFamily;
      return fontFamily;
    })
    .text(d => d.text)
    .style("fill-opacity", 0) // Invisible para glow
    .style("opacity", 1);
  
  // Activar glow después de que se dibujen los elementos y cuando empiecen las líneas
  // Esperar un momento para asegurar que los elementos estén en el DOM
  setTimeout(() => {
    // Activar glow progresivamente para TODAS las columnas en orden correcto
    // Orden explícito: 0=continent, 1=discipline, 2=generation, 3=profession
    const glowOrder = [
      { type: "continent", column: 0 },
      { type: "discipline", column: 1 },
      { type: "generation", column: 2 },
      { type: "profession", column: 3 }
    ];
    
    // Activar glow en orden secuencial correcto
    if (selectedYears.length === 1) {
      // Un año: activar glow normalmente
      glowOrder.forEach((item, index) => {
        const delay = index * CONFIG.animations.glowAppearDelay;
        setTimeout(() => {
          const titleElement = svg.select(`.column-label-${item.type}`);
          if (!titleElement.empty() && titleElement.node()) {
            titleElement.classed("glow-active", true);

            [0, 1, 2, 3, 4].forEach((layerIndex, layerDelay) => {
              setTimeout(() => {
                titleElement.selectAll(`.glow-layer-${layerIndex}`)
                  .transition()
                  .duration(500)
                  .ease(d3.easeCubicOut)
                  .style("fill-opacity", () => {
                    const opacities = [0.6, 0.4, 0.3, 0.2, 0.1];
                    return opacities[layerIndex];
                  });
              }, layerDelay * 50);
            });

            console.log(`Glow activado para ${item.type} (columna ${item.column}) con delay ${delay}ms`);
          } else {
            console.warn(`No se encontró elemento para ${item.type}`);
          }
        }, delay);
      });
    } else {
      // Dos años: activar glow durante ambas fases de animación
      // Primera fase: activar normalmente
      glowOrder.forEach((item, index) => {
        const delay = index * CONFIG.animations.glowAppearDelay;
        setTimeout(() => {
          const titleElement = svg.select(`.column-label-${item.type}`);
          if (!titleElement.empty() && titleElement.node()) {
            titleElement.classed("glow-active", true);

            [0, 1, 2, 3, 4].forEach((layerIndex, layerDelay) => {
              setTimeout(() => {
                titleElement.selectAll(`.glow-layer-${layerIndex}`)
                  .transition()
                  .duration(500)
                  .ease(d3.easeCubicOut)
                  .style("fill-opacity", () => {
                    const opacities = [0.6, 0.4, 0.3, 0.2, 0.1];
                    return opacities[layerIndex];
                  });
              }, layerDelay * 50);
            });

            console.log(`Glow primera fase activado para ${item.type} con delay ${delay}ms`);
          }
        }, delay);
      });

      // Segunda fase: asegurar que los glows se mantengan activos durante la segunda animación
      const secondPhaseDelay = CONFIG.animations.secondYearDelay - 500; // Un poco antes de la segunda animación
      setTimeout(() => {
        glowOrder.forEach((item) => {
          const titleElement = svg.select(`.column-label-${item.type}`);
          if (!titleElement.empty() && titleElement.node()) {
            titleElement.classed("glow-active", true); // Asegurar que esté activo
            console.log(`Glow segunda fase mantenido para ${item.type}`);
          }
        });
      }, Math.max(100, secondPhaseDelay));
    }
    
    d3.select("#loading").style("display", "none");
  }, 100);
}

// Manejar resize - Solo actualizar posiciones, no recargar
window.addEventListener("resize", () => {
  const newWidth = window.innerWidth - margin.left - margin.right;
  const newHeight = (window.innerHeight - 80) - margin.top - margin.bottom;

  // Si el cambio es significativo, actualizar posiciones
  if (Math.abs(newWidth - width) > 50 || Math.abs(newHeight - height) > 50) {
    console.log("📐 Resize detectado - Actualizando dimensiones");
    width = newWidth;
    height = newHeight;

    // Re-inicializar SVG con nuevas dimensiones
    updateColumnPositions();
    initializeSVG();

    // Si hay diagrama dibujado, redibujarlo
    if (sankeyDrawn && selectedYears.length > 0) {
      console.log(" Redibujando diagrama después de resize");
      drawSankey(selectedYears);
    } else {
      // Solo actualizar título
      svg.select(".title").text("Selecciona años y presiona Play").style("font-family", CONFIG.fontFamily);
    }
  }
});

// Función para verificar estado del localStorage
function checkLocalStorageStatus() {
  try {
    const saved = localStorage.getItem('sankey-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log("📦 Config guardada:", {
        size: saved.length + " chars",
        lastSaved: parsed.lastSaved || "Sin fecha",
        selectedYears: parsed.selectedYears?.length || 0,
        linkOpacity: parsed.linkOpacity
      });
      return true;
    } else {
      console.log("📦 Sin configuración guardada");
      return false;
    }
  } catch (err) {
    console.error(" Error localStorage:", err.message);
    return false;
  }
}

// Función de diagnóstico para verificar funcionamiento
function runDiagnostics() {
  console.log("🔍 Diagnóstico:");
  console.log("- CONFIG.linkOpacity:", CONFIG.linkOpacity);
  console.log("- currentOpacity:", currentOpacity);
  console.log("- selectedYears:", selectedYears);
  console.log("- sankeyDrawn:", sankeyDrawn);
  checkLocalStorageStatus();
}

// Función de prueba inmediata
function testLocalStorage() {
  console.log("🧪 Probando localStorage...");
  try {
    const testData = { test: true, time: Date.now() };
    localStorage.setItem('sankey-test', JSON.stringify(testData));

    const retrieved = localStorage.getItem('sankey-test');
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      console.log(" localStorage OK:", parsed);
      localStorage.removeItem('sankey-test');
      return true;
    } else {
      console.error(" localStorage no guarda");
      return false;
    }
  } catch (err) {
    console.error(" localStorage error:", err.message);
    return false;
  }
}

// Función global para probar guardado desde consola
window.testSave = function() {
  console.log("🔧 Test manual desde consola");
  autoSaveConfig();
};

// Función global para verificar estado
window.checkSave = function() {
  checkLocalStorageStatus();
  const saved = localStorage.getItem('sankey-config');
  if (saved) {
    const parsed = JSON.parse(saved);
    console.log("Configuración actual:", parsed);
  }
};

// Función global para verificar estado de años
window.checkYears = function() {
  console.log(" Estado de años:");
  console.log("- selectedYears actual:", selectedYears);
  console.log("- Años en CONFIG:", CONFIG.selectedYears || []);
  console.log("- Botones activos:", d3.selectAll(".year-button.active").size());
};

// Funciones de consola para control manual
window.stopSankey = function() {
  console.log(" Comando consola: Deteniendo Sankey completo");
  touchDesignerAPI.stopSankey();
};

window.toggleUI = function(hide) {
  console.log(" Comando consola: Toggle UI");
  touchDesignerAPI.toggleUI(hide);
};

window.hideUI = function() {
  console.log(" Comando consola: Ocultando UI");
  touchDesignerAPI.toggleUI(true);
};

window.showUI = function() {
  console.log(" Comando consola: Mostrando UI");
  touchDesignerAPI.toggleUI(false);
};

// Función de demo para Touch Designer
window.demoTouchDesigner = function() {
  console.log(" DEMO: Simulando integración TouchDesigner completa");

  // Paso 1: Verificar estado inicial
  console.log("1. Estado inicial:", touchDesignerAPI.getState());

  // Paso 2: Ocultar UI para modo proyección
  setTimeout(() => {
    console.log("2. Ocultando UI...");
    touchDesignerAPI.toggleUI(true);
  }, 500);

  // Paso 3: Seleccionar años
  setTimeout(() => {
    console.log("3. Seleccionando años 2023 y 2024...");
    touchDesignerAPI.selectYears(["2023", "2024"]);
    console.log("   Estado después de selección:", touchDesignerAPI.getState());
  }, 1000);

  // Paso 4: Ejecutar Play
  setTimeout(() => {
    console.log("4. Ejecutando Play...");
    touchDesignerAPI.playSankey();
  }, 2000);

  // Paso 5: Simular STOP temprano (antes de que termine la animación)
  setTimeout(() => {
    console.log("5. Ejecutando STOP temprano (debe cancelar animaciones y ocultar todo)...");
    touchDesignerAPI.stopSankey();
  }, 5000);

  // Paso 6: Reset completo
  setTimeout(() => {
    console.log("6. Reseteando todo...");
    touchDesignerAPI.reset();
    touchDesignerAPI.toggleUI(false); // Mostrar UI de nuevo
    console.log("   Estado final:", touchDesignerAPI.getState());
  }, 6000);
};

// Función global para limpiar años seleccionados (manteniendo configuración visual)
window.clearSelectedYears = function() {
  selectedYears = [];
  globalAllMode = false;
  chileAllMode = false;
  d3.selectAll(".year-button").classed("active", false);
  d3.select(".title").text("Selecciona años y presiona Play").style("font-family", CONFIG.fontFamily);
  if (sankeyDrawn) {
    clearSankey();
  }
  console.log("🧹 Años y modos limpiados - interfaz lista para aplicación padre");
};

// API para Touch Designer - FUNCIONES GLOBALES
window.touchDesignerAPI = {
  // Seleccionar años específicos (máximo 2)
  selectYears: function(yearsArray) {
    console.log(" TouchDesigner: Seleccionando años", yearsArray);

    if (!Array.isArray(yearsArray)) {
      console.error(" selectYears espera un array");
      return;
    }

    // Limpiar selección actual
    selectedYears = [];
    d3.selectAll(".year-button").classed("active", false);

    // Seleccionar años especificados (máximo 2)
    yearsArray.slice(0, 2).forEach(year => {
      selectedYears.push(year.toString());
      // Activar botones visualmente
      d3.selectAll(".year-button")
        .filter(function() { return d3.select(this).text() === year.toString(); })
        .classed("active", true);
    });

    console.log(" Años seleccionados por TouchDesigner:", selectedYears);
  },

  // Ejecutar animación del Sankey
  playSankey: function() {
    console.log(" TouchDesigner: Ejecutando Play");
    if (selectedYears.length > 0) {
      drawSankey(selectedYears);
      console.log(" Animación iniciada con años:", selectedYears);
    } else {
      console.warn("⚠️ TouchDesigner: No hay años seleccionados para reproducir");
    }
  },

  // Detener/ocultar Sankey completo
  stopSankey: function() {
    console.log("TouchDesigner: Deteniendo Sankey completo");

    // Ocultar líneas
    d3.selectAll(".link").style("stroke-opacity", 0);

    // Ocultar círculos/nodos
    d3.selectAll(".node-circle").style("opacity", 0);

    // Ocultar fondos de títulos
    d3.selectAll(".text-backgrounds rect").style("fill-opacity", 0);

    // Ocultar títulos de columna (CONTINENTES, DISCIPLINAS, etc.)
    d3.selectAll(".column-label-group").style("opacity", 0);

    // Ocultar botón STOP
    d3.select("#stop-button").style("display", "none");

    console.log("Sankey ocultado completamente");
  },

  // Toggle UI (ocultar/mostrar interfaz)
  toggleUI: function(hide) {
    const shouldHide = hide !== undefined ? hide : d3.select("#year-buttons").style("display") !== "none";
    console.log(shouldHide ? " TouchDesigner: Ocultando UI" : " TouchDesigner: Mostrando UI");

    const elementsToToggle = [
      "#year-buttons",
      "#play-button",
      "#stop-button", // Se oculta con UI, pero aparece cuando hay diagrama
      "#toggle-text-color",
      "#toggle-glow",
      "#config-toggle",
      "#version-indicator",
      "#save-status",
      "#opacity-slider-container",
      "#tooltip",
      "#save-config",
      "#export-config",
      "#import-config",
      "#clear-config",
      "#test-save",
      ".title"
    ];

    elementsToToggle.forEach(selector => {
      const element = d3.select(selector);
      if (!element.empty()) {
        if (shouldHide) {
          element.classed("ui-hidden", true);
        } else {
          element.classed("ui-hidden", false);
        }
      }
    });

    // Actualizar botón
    const toggleBtn = d3.select("#toggle-ui-button");
    toggleBtn.text(shouldHide ? "Mostrar UI" : "Ocultar UI");
    toggleBtn.style("background", shouldHide ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.9)");

    console.log(shouldHide ? "UI oculta" : "UI visible");
  },

  // Limpiar selección de años
  clearSelection: function() {
    console.log(" TouchDesigner: Limpiando selección");
    selectedYears = [];
    globalAllMode = false;
    chileAllMode = false;
    d3.selectAll(".year-button").classed("active", false);
    d3.select(".title").text("Selecciona años y presiona Play").style("font-family", CONFIG.fontFamily);
    if (sankeyDrawn) {
      clearSankey();
    }
    console.log(" Selección y modos limpiados");
  },

  // Reset completo (limpia años + diagrama)
  reset: function() {
    console.log(" TouchDesigner: Reset completo");
    this.clearSelection();
    console.log(" Reset completo terminado");
  },

  // Obtener estado actual
  getState: function() {
    return {
      selectedYears: [...selectedYears],
      availableYears: getUniqueYears(allData),
      globalAllMode: globalAllMode,
      chileAllMode: chileAllMode,
      isDrawn: sankeyDrawn,
      uiHidden: d3.select("#year-buttons").style("display") === "none",
      configLoaded: localStorage.getItem('sankey-config') !== null
    };
  },

  // Activar modo TODOS (todos los años, todos los continentes)
  selectAllYearsMode: function() {
    console.log(" TouchDesigner: Activando modo TODOS");
    selectedYears = [];
    globalAllMode = true;
    chileAllMode = false;
    d3.selectAll(".year-button").classed("active", false);
    d3.selectAll(".special-button").classed("active", false);
    d3.selectAll(".year-button").filter(function() { return d3.select(this).text() === "TODOS"; }).classed("active", true);
    d3.select(".title").text("TODOS: Presiona Play").style("font-family", CONFIG.fontFamily);
    console.log(" Modo TODOS activado");
  },

  // Activar modo CHILE (todos los años, solo Chile)
  selectChileAllYearsMode: function() {
    console.log(" TouchDesigner: Activando modo CHILE");
    selectedYears = [];
    globalAllMode = false;
    chileAllMode = true;
    d3.selectAll(".year-button").classed("active", false);
    d3.selectAll(".special-button").classed("active", false);
    d3.selectAll(".year-button").filter(function() { return d3.select(this).text() === "CHILE"; }).classed("active", true);
    d3.select(".title").text("CHILE: Presiona Play").style("font-family", CONFIG.fontFamily);
    console.log(" Modo CHILE activado");
  },

  // Ejecutar animación con filtro de continente
  playSankeyWithFilter: function(continentFilter) {
    console.log(" TouchDesigner: Ejecutando Play con filtro", continentFilter);
    if (selectedYears.length > 0) {
      drawSankey(selectedYears, continentFilter);
      console.log(" Animación iniciada con años:", selectedYears, "y filtro:", continentFilter);
    } else {
      console.warn("⚠️ TouchDesigner: No hay años seleccionados para reproducir");
    }
  },

  // Verificar si está listo
  isReady: function() {
    return allData && allData.length > 0;
  }
};

// Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM cargado, iniciando aplicación...");
  testLocalStorage();
  init();

  // Inicializar indicador de estado
  updateSaveStatus(false);

  // Ejecutar diagnóstico después de un breve delay
  setTimeout(runDiagnostics, 1000);

  // Avisar que TouchDesigner API está lista
  console.log("TouchDesigner API v2.4 lista - Funciones disponibles:");
  console.log("Control:");
  console.log("- touchDesignerAPI.selectYears([2023, 2024])");
  console.log("- touchDesignerAPI.playSankey()");
  console.log("- touchDesignerAPI.stopSankey()");
  console.log("- touchDesignerAPI.toggleUI(true/false)");
  console.log("- touchDesignerAPI.clearSelection()");
  console.log("- touchDesignerAPI.reset()");
  console.log("- touchDesignerAPI.getState()");
  console.log("Consola:");
  console.log("- stopSankey(), toggleUI(), hideUI(), showUI()");
  console.log("- demoTouchDesigner() // Demo completo");
});

// Toggle de visibilidad de texto
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-text-color");
  if (toggleButton) {
    // Actualizar texto inicial del botón
    toggleButton.textContent = textsVisible ? " Ocultar Textos" : " Mostrar Textos";

    toggleButton.addEventListener("click", () => {
      textsVisible = !textsVisible;
      toggleButton.textContent = textsVisible ? " Ocultar Textos" : " Mostrar Textos";

      d3.selectAll(".node-text")
        .transition()
        .duration(300)
        .style("opacity", textsVisible ? 1 : 0);

      // Los glows son independientes de los textos
      // Los glows siempre permanecen visibles (no se ocultan con los textos)
      // No hacer nada con los column-label ya que solo contienen glow sin texto

      d3.select(".title")
        .transition()
        .duration(300)
        .style("opacity", textsVisible ? 1 : 0);

      d3.selectAll(".text-backgrounds rect")
        .transition()
        .duration(300)
        .style("fill-opacity", textsVisible ? 0.9 : 0);
    });
  }

  // Botón Play para ejecutar animación
  const playButton = document.getElementById("play-button");
  if (playButton) {
    playButton.addEventListener("click", () => {
      // Verificar si hay un modo especial activo
      if (globalAllMode) {
        const allYears = getUniqueYears(allData);
        console.log("🎯 Ejecutando modo TODOS con todos los años combinados:", allYears.length, "años");
        console.log("📊 Años disponibles:", allYears);
        // Para TODOS, combinar todos los años en uno solo para mostrar como suma total global
        drawSankey(allYears, "GLOBAL");
        console.log("✅ Modo TODOS ejecutado");
        return;
      }

      if (chileAllMode) {
        // Usar TODOS los años disponibles que tienen datos de Chile
        const allYears = getUniqueYears(allData);
        console.log("🎯 Ejecutando modo CHILE con TODOS los años disponibles:", allYears);
        console.log("📊 Años disponibles:", allYears);
        drawSankey(allYears, "Chile");
        console.log("✅ Modo CHILE ejecutado");
        return;
      }

      // Modo normal: verificar años seleccionados
      if (selectedYears.length > 0) {
        drawSankey(selectedYears);
      } else {
        alert("Selecciona al menos un año o un modo especial antes de presionar Play");
      }
    });
  }


  // Toggle de glow en títulos
  const toggleGlowButton = document.getElementById("toggle-glow");
  if (toggleGlowButton) {
    let glowActive = true;
    toggleGlowButton.addEventListener("click", () => {
      glowActive = !glowActive;
      d3.selectAll(".column-label-group").classed("glow-active", glowActive);
      toggleGlowButton.textContent = glowActive ? "✨ Apagar Glow" : "✨ Encender Glow";
    });
  }

  // Botón STOP - Oculta líneas, círculos, fondos y títulos del Sankey
  const stopButton = document.getElementById("stop-button");
  if (stopButton) {
    stopButton.addEventListener("click", () => {
      console.log("STOP: Ocultando Sankey completo");

      // Ocultar líneas
      d3.selectAll(".link").style("stroke-opacity", 0);

      // Ocultar círculos/nodos
      d3.selectAll(".node-circle").style("opacity", 0);

      // Ocultar fondos de títulos
      d3.selectAll(".text-backgrounds rect").style("fill-opacity", 0);

      // Ocultar títulos de columna (CONTINENTES, DISCIPLINAS, etc.)
      d3.selectAll(".column-label-group").style("opacity", 0);

      // Ocultar el botón STOP
      stopButton.style.display = "none";

      console.log("Sankey ocultado completamente");
    });
  }

  // Botón Toggle UI - Usa la misma función que TouchDesigner API
  const toggleUIButton = document.getElementById("toggle-ui-button");
  if (toggleUIButton) {
    toggleUIButton.addEventListener("click", () => {
      // Usar la misma función que TouchDesigner API para mantener consistencia
      touchDesignerAPI.toggleUI();
    });
  }
});