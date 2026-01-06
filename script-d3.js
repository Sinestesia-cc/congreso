// Configuración de dimensiones y márgenes
const margin = {top: 80, right: 150, bottom: 50, left: 150};
const width = window.innerWidth - margin.left - margin.right;
const height = (window.innerHeight - 80) - margin.top - margin.bottom;

// Configuración dinámica que se puede modificar
let CONFIG = {
  columnSpacing: 10, // Porcentaje entre columnas (reducido)
  distances: {
    contDisc: 10, // Distancia Continentes → Disciplinas
    discGen: 10,  // Distancia Disciplinas → Generaciones
    genProf: 10   // Distancia Generaciones → Profesiones
  },
  fontFamily: "'Archivo', sans-serif",
  fontWeight: "400",
  letterSpacing: 0,
  lineHeight: 1.2,
  
  // Configuración de animaciones
  animations: {
    lineDuration: 1200,      // Duración de animación de líneas (ms)
    lineDelayBetweenColumns: 500,  // Delay entre columnas (ms)
    lineDelayBetweenLinks: 30,     // Delay entre enlaces dentro de la misma columna (ms)
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
  discipline: width * 0.25,
  generation: width * 0.50,
  profession: width * 0.75
};

// Ancho de los nodos
const NODE_WIDTH = 15;
const NODE_PADDING = 8;

// MASTER: Orden fijo de elementos en cada columna
const MASTER = {
  continent: ["Chile", "América", "Europa", "Asia", "África", "Oceanía"],
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
let currentYear = null;
let currentOpacity = 0.3;
let textsVisible = true;

// Función para actualizar las posiciones de las columnas
function updateColumnPositions() {
  // Usar distancias individuales si están configuradas, sino usar el espaciado base
  const baseSpacing = CONFIG.columnSpacing / 100;
  const dist1 = (CONFIG.distances.contDisc / 100) || baseSpacing;
  const dist2 = (CONFIG.distances.discGen / 100) || baseSpacing;
  const dist3 = (CONFIG.distances.genProf / 100) || baseSpacing;
  
  COLUMNS.continent = 0;
  COLUMNS.discipline = width * dist1;
  COLUMNS.generation = width * (dist1 + dist2);
  COLUMNS.profession = width * (dist1 + dist2 + dist3);
}

// Inicialización del SVG
function initializeSVG() {
  d3.select("#sankey-container svg").remove();
  
  svg = d3.select("#sankey-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -40)
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

// Función principal de inicio
function init() {
  console.log("Inicializando Sankey con D3.js...");
  
  updateColumnPositions();
  initializeSVG();
  createUIControls();
  setupConfigPanel();
  
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
    
    if (years.length > 0) {
      drawSankey(years[0]);
    }
  }).catch(function(error) {
    console.error("Error cargando CSV:", error);
    const loadingEl = d3.select("#loading");
    loadingEl.text("Error al cargar los datos: " + error.message);
    loadingEl.style("display", "block");
    loadingEl.style("color", "#f44336");
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
    if (currentYear) drawSankey(currentYear);
  });
  
  // Distancias individuales entre columnas
  setupSlider("distance-cont-disc", "dist-cont-disc-value", value => {
    CONFIG.distances.contDisc = parseFloat(value);
    updateColumnPositions();
    if (currentYear) drawSankey(currentYear);
  });
  
  setupSlider("distance-disc-gen", "dist-disc-gen-value", value => {
    CONFIG.distances.discGen = parseFloat(value);
    updateColumnPositions();
    if (currentYear) drawSankey(currentYear);
  });
  
  setupSlider("distance-gen-prof", "dist-gen-prof-value", value => {
    CONFIG.distances.genProf = parseFloat(value);
    updateColumnPositions();
    if (currentYear) drawSankey(currentYear);
  });
  
  // Font family global
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      CONFIG.fontFamily = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  
  // Font weight global
  const fontWeightSelect = document.getElementById("font-weight-global");
  if (fontWeightSelect) {
    fontWeightSelect.addEventListener("change", (e) => {
      CONFIG.fontWeight = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  
  // Continentes
  const continentFontFamily = document.getElementById("continent-font-family");
  if (continentFontFamily) {
    continentFontFamily.addEventListener("change", (e) => {
      CONFIG.continent.fontFamily = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  const continentFontWeight = document.getElementById("continent-font-weight");
  if (continentFontWeight) {
    continentFontWeight.addEventListener("change", (e) => {
      CONFIG.continent.fontWeight = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  setupSlider("continent-font-size", "cont-size-value", value => {
    CONFIG.continent.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("continent-height", "cont-height-value", value => {
    CONFIG.continent.nodeHeight = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("continent-spacing", "cont-spacing-value", value => {
    CONFIG.continent.spacing = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Disciplinas
  const disciplineFontFamily = document.getElementById("discipline-font-family");
  if (disciplineFontFamily) {
    disciplineFontFamily.addEventListener("change", (e) => {
      CONFIG.discipline.fontFamily = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  const disciplineFontWeight = document.getElementById("discipline-font-weight");
  if (disciplineFontWeight) {
    disciplineFontWeight.addEventListener("change", (e) => {
      CONFIG.discipline.fontWeight = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  setupSlider("discipline-font-size", "disc-size-value", value => {
    CONFIG.discipline.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("discipline-height", "disc-height-value", value => {
    CONFIG.discipline.nodeHeight = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("discipline-spacing", "disc-spacing-value", value => {
    CONFIG.discipline.spacing = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Generaciones
  const generationFontFamily = document.getElementById("generation-font-family");
  if (generationFontFamily) {
    generationFontFamily.addEventListener("change", (e) => {
      CONFIG.generation.fontFamily = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  const generationFontWeight = document.getElementById("generation-font-weight");
  if (generationFontWeight) {
    generationFontWeight.addEventListener("change", (e) => {
      CONFIG.generation.fontWeight = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  setupSlider("generation-font-size", "gen-size-value", value => {
    CONFIG.generation.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("generation-height", "gen-height-value", value => {
    CONFIG.generation.nodeHeight = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("generation-spacing", "gen-spacing-value", value => {
    CONFIG.generation.spacing = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Profesiones
  const professionFontFamily = document.getElementById("profession-font-family");
  if (professionFontFamily) {
    professionFontFamily.addEventListener("change", (e) => {
      CONFIG.profession.fontFamily = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  const professionFontWeight = document.getElementById("profession-font-weight");
  if (professionFontWeight) {
    professionFontWeight.addEventListener("change", (e) => {
      CONFIG.profession.fontWeight = e.target.value;
      if (currentYear) drawSankey(currentYear);
    });
  }
  setupSlider("profession-font-size", "prof-size-value", value => {
    CONFIG.profession.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("profession-height", "prof-height-value", value => {
    CONFIG.profession.nodeHeight = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("profession-spacing", "prof-spacing-value", value => {
    CONFIG.profession.spacing = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Títulos de columnas
  setupSlider("title-continent-font-size", "title-cont-size-value", value => {
    CONFIG.columnTitles.continent.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-continent-offsetY", "title-cont-offsetY-value", value => {
    CONFIG.columnTitles.continent.offsetY = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-continent-offsetX", "title-cont-offsetX-value", value => {
    CONFIG.columnTitles.continent.offsetX = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  setupSlider("title-discipline-font-size", "title-disc-size-value", value => {
    CONFIG.columnTitles.discipline.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-discipline-offsetY", "title-disc-offsetY-value", value => {
    CONFIG.columnTitles.discipline.offsetY = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-discipline-offsetX", "title-disc-offsetX-value", value => {
    CONFIG.columnTitles.discipline.offsetX = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  setupSlider("title-generation-font-size", "title-gen-size-value", value => {
    CONFIG.columnTitles.generation.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-generation-offsetY", "title-gen-offsetY-value", value => {
    CONFIG.columnTitles.generation.offsetY = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-generation-offsetX", "title-gen-offsetX-value", value => {
    CONFIG.columnTitles.generation.offsetX = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  setupSlider("title-profession-font-size", "title-prof-size-value", value => {
    CONFIG.columnTitles.profession.fontSize = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-profession-offsetY", "title-prof-offsetY-value", value => {
    CONFIG.columnTitles.profession.offsetY = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("title-profession-offsetX", "title-prof-offsetX-value", value => {
    CONFIG.columnTitles.profession.offsetX = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Espaciado de texto
  setupSlider("letter-spacing", "letter-spacing-value", value => {
    CONFIG.letterSpacing = parseFloat(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("line-height", "line-height-value", value => {
    CONFIG.lineHeight = parseFloat(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Animaciones
  setupSlider("line-duration", "line-duration-value", value => {
    CONFIG.animations.lineDuration = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("line-delay-columns", "line-delay-columns-value", value => {
    CONFIG.animations.lineDelayBetweenColumns = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  setupSlider("line-delay-links", "line-delay-links-value", value => {
    CONFIG.animations.lineDelayBetweenLinks = parseInt(value);
    if (currentYear) drawSankey(currentYear);
  });
  
  // Glow
  setupSlider("glow-appear-delay", "glow-appear-delay-value", value => {
    CONFIG.animations.glowAppearDelay = parseInt(value);
    if (currentYear) drawSankey(currentYear);
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
      const configString = JSON.stringify(CONFIG, null, 2);
      configOutput.value = configString;
      configOutput.style.display = "block";
      configOutput.select();
      
      // Copiar al portapapeles
      try {
        document.execCommand('copy');
        exportButton.textContent = "✅ Copiado al portapapeles!";
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
        importButton.textContent = "✅ Aplicar Importación";
      } else {
        // Aplicar la configuración importada
        try {
          const importedConfig = JSON.parse(importInput.value);
          
          // Validar y aplicar configuración
          if (importedConfig && typeof importedConfig === 'object') {
            // Inicializar distances si no existe
            if (!CONFIG.distances) {
              CONFIG.distances = { contDisc: 10, discGen: 10, genProf: 10 };
            }
            
            // Inicializar columnTitles si no existe
            if (!CONFIG.columnTitles) {
              CONFIG.columnTitles = {
                continent: { fontSize: 14, offsetY: 20, fontFamily: "inherit", fontWeight: "700" },
                discipline: { fontSize: 14, offsetY: 20, fontFamily: "inherit", fontWeight: "700" },
                generation: { fontSize: 14, offsetY: 20, fontFamily: "inherit", fontWeight: "700" },
                profession: { fontSize: 14, offsetY: 20, fontFamily: "inherit", fontWeight: "700" }
              };
            }
            
            // Actualizar CONFIG con los valores importados
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
              } else if (CONFIG.hasOwnProperty(key)) {
                if (typeof importedConfig[key] === 'object' && !Array.isArray(importedConfig[key])) {
                  Object.assign(CONFIG[key], importedConfig[key]);
                } else {
                  CONFIG[key] = importedConfig[key];
                }
              }
            });
            
            // Actualizar todos los controles UI
            updateUIControls();
            
            // Redibujar el diagrama
            updateColumnPositions();
            if (currentYear) drawSankey(currentYear);
            
            importInput.style.display = "none";
            importInput.value = "";
            importButton.textContent = "📥 Importar Configuración";
            
            alert("✅ Configuración importada exitosamente!");
          } else {
            throw new Error("Formato de configuración inválido");
          }
        } catch (err) {
          alert("❌ Error al importar configuración: " + err.message);
          console.error('Error al importar:', err);
        }
      }
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
      { id: "glow-pulse-intensity", valueId: "glow-pulse-intensity-value", value: CONFIG.animations.glowPulseIntensity }
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
function setupSlider(sliderId, valueId, onChange) {
  const slider = document.getElementById(sliderId);
  const valueSpan = document.getElementById(valueId);
  
  if (slider && valueSpan) {
    slider.addEventListener("input", (e) => {
      valueSpan.textContent = e.target.value;
      onChange(e.target.value);
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
    if (d.profession) professions.add(d.profession);
  });
  
  MASTER.discipline = Array.from(disciplines).sort();
  MASTER.profession = Array.from(professions).sort();
  
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
  
  years.forEach(year => {
    container.append("button")
      .text(year)
      .on("click", function() {
        container.selectAll("button").classed("active", false);
        d3.select(this).classed("active", true);
        drawSankey(year);
      });
  });
}

// Preparar datos del Sankey
function prepareSankeyData(year) {
  const yearData = allData.filter(d => d.year === year);
  
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
        target: getNodeId(record.discipline, 'discipline')
      },
      {
        source: getNodeId(record.discipline, 'discipline'),
        target: getNodeId(record.generation, 'generation')
      },
      {
        source: getNodeId(record.generation, 'generation'),
        target: getNodeId(record.profession, 'profession')
      }
    ];
    
    links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, {
          source: link.source,
          target: link.target,
          value: 0
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
    const totalLength = path.node().getTotalLength();
    
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .delay(delay)
      .duration(CONFIG.animations.lineDuration) // Duración configurable
      .ease(d3.easeLinear) // Lineal para movimiento constante
      .attr("stroke-dashoffset", 0);
  });
}

// Función principal para dibujar el Sankey
function drawSankey(year) {
  currentYear = year;
  console.log("Dibujando Sankey para el año:", year);
  
  // Actualizar posiciones antes de dibujar
  updateColumnPositions();
  
  // Limpiar y remover glow activo cuando se cambia de año
  svg.selectAll(".links").remove();
  svg.selectAll(".node-circles").remove();
  svg.selectAll(".text-backgrounds").remove();
  svg.selectAll(".node-texts").remove();
  svg.selectAll(".debug-text").remove();
  svg.selectAll(".column-label").classed("glow-active", false);
  
  svg.select(".title")
    .text(`Congreso ${year}`)
    .style("font-family", CONFIG.fontFamily);
  
  d3.select("#loading").style("display", "block");
  
  const sankeyData = prepareSankeyData(year);
  
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
      .text(`No hay datos para el año ${year}`);
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
    .style("stroke", "#F556A8")
    .style("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 1.5))
    .style("fill", "none")
    .style("stroke-opacity", 0)
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
        const delay = column * CONFIG.animations.lineDelayBetweenColumns + localIndex * CONFIG.animations.lineDelayBetweenLinks;
        
        animatePath(path, delay);
        
        path.transition()
          .delay(delay + CONFIG.animations.lineDuration) // Después de que termine la animación del trazo
          .duration(200)
          .style("stroke-opacity", currentOpacity);
        
        globalIndex++;
      });
    }
  });
  
  // 2. CAPA DE CÍRCULOS (reemplazando rectángulos)
  const nodeCircleGroup = svg.append("g").attr("class", "node-circles");
  
  const nodeCircles = nodeCircleGroup.selectAll(".node-circle")
    .data(sankeyData.nodes)
    .enter()
    .append("circle")
    .attr("class", "node-circle")
    .attr("cx", d => d.x + NODE_WIDTH / 2)
    .attr("cy", d => d.y)
    .attr("r", 0) // Empezar desde radio 0
    .attr("fill", "#F556A8") // Color magenta igual que las líneas
    .attr("fill-opacity", d => d.value > 0 ? 0.9 : 0.3);
  
  // Animar círculos creciendo
  nodeCircles.each(function(d, i) {
    const circle = d3.select(this);
    const targetRadius = d.value > 0 ? Math.max(2, Math.sqrt(d.value) * 2.5) : 1.5;
    const delay = d.column * 200; // Delay basado en la columna
    
    circle.transition()
      .delay(delay)
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("r", targetRadius);
  });
  
  // 3. CAPA DE FONDOS BLANCOS
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
  
  // 4. CAPA DE TEXTOS
  const nodeTextGroup = svg.append("g").attr("class", "node-texts");
  
  const nodeTexts = nodeTextGroup.selectAll(".node-text")
    .data(sankeyData.nodes)
    .enter()
    .append("text")
    .attr("class", "node-text")
    .attr("x", d => d.column < 2 ? d.x - 10 : d.x + NODE_WIDTH + 10)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.column < 2 ? "end" : "start")
    .text(d => {
      if (d.type === 'generation') {
        return d.name.toUpperCase();
      }
      return d.name;
    })
    .style("font-size", d => CONFIG[d.type].fontSize + "px")
    .style("font-family", d => {
      const fontFamily = CONFIG[d.type].fontFamily === "inherit" 
        ? CONFIG.fontFamily 
        : CONFIG[d.type].fontFamily;
      return fontFamily;
    })
    .style("font-weight", d => {
      const fontWeight = CONFIG[d.type].fontWeight === "inherit"
        ? CONFIG.fontWeight
        : CONFIG[d.type].fontWeight;
      // Si no hay peso específico, usar el comportamiento anterior
      if (fontWeight === "inherit" && (d.type === 'continent' || d.type === 'generation')) {
        return "bold";
      }
      return fontWeight;
    })
    .style("letter-spacing", CONFIG.letterSpacing + "px")
    .style("line-height", CONFIG.lineHeight)
    .style("fill", d => d.value > 0 ? "#000" : "#999")
    .style("opacity", textsVisible ? 1 : 0);
  
  // 5. ETIQUETAS DE COLUMNA (en la parte inferior)
    // Asegurar que columnTitles existe
    if (!CONFIG.columnTitles) {
      CONFIG.columnTitles = {
        continent: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        discipline: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        generation: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" },
        profession: { fontSize: 14, offsetY: 20, offsetX: 0, fontFamily: "inherit", fontWeight: "700" }
      };
    }
  
  // Limpiar títulos anteriores (el glow se removerá automáticamente al remover los elementos)
  svg.selectAll(".column-label").remove();
  
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
  
  svg.selectAll(".column-label")
    .data(titleConfigs)
    .enter()
    .append("text")
    .attr("class", d => `column-label column-label-${d.type}`)
    .attr("x", d => d.x + (d.config.offsetX || 0))
    .attr("y", d => {
      // Posición desde la parte inferior del área de dibujo
      // Como el SVG está transformado con translate(margin.left, margin.top),
      // la posición Y es relativa a ese grupo
      // height - offsetY coloca el texto offsetY píxeles desde el borde inferior
      return height - d.config.offsetY;
    })
    .attr("text-anchor", "middle")
    .style("font-size", d => d.config.fontSize + "px")
    .style("font-weight", d => d.config.fontWeight)
    .style("fill", "#000000") // Color negro
    .style("font-family", d => {
      const fontFamily = d.config.fontFamily === "inherit" 
        ? CONFIG.fontFamily 
        : d.config.fontFamily;
      return fontFamily;
    })
    .text("") // Sin texto, solo el glow
    .style("fill-opacity", 0); // Texto siempre invisible
  
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
    glowOrder.forEach((item, index) => {
      const delay = index * CONFIG.animations.glowAppearDelay;
      setTimeout(() => {
        const titleElement = svg.select(`.column-label-${item.type}`);
        if (!titleElement.empty() && titleElement.node()) {
          titleElement.classed("glow-active", true);
          console.log(`Glow activado para ${item.type} (columna ${item.column}) con delay ${delay}ms`);
        } else {
          console.warn(`No se encontró elemento para ${item.type}`);
        }
      }, delay);
    });
    
    d3.select("#loading").style("display", "none");
  }, 100);
}

// Manejar resize
window.addEventListener("resize", () => {
  const newWidth = window.innerWidth - margin.left - margin.right;
  const newHeight = (window.innerHeight - 80) - margin.top - margin.bottom;
  
  if (Math.abs(newWidth - width) > 50 || Math.abs(newHeight - height) > 50) {
    location.reload();
  }
});

// Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", init);

// Toggle de visibilidad de texto
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-text-color");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      textsVisible = !textsVisible;
      
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
  
  // Toggle de glow en títulos
  const toggleGlowButton = document.getElementById("toggle-glow");
  if (toggleGlowButton) {
    let glowActive = true;
    toggleGlowButton.addEventListener("click", () => {
      glowActive = !glowActive;
      d3.selectAll(".column-label").classed("glow-active", glowActive);
      toggleGlowButton.textContent = glowActive ? "✨ Apagar Glow" : "✨ Encender Glow";
    });
  }
});
