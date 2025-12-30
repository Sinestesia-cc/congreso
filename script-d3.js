// Configuración de dimensiones y márgenes
const margin = {top: 80, right: 150, bottom: 50, left: 150};
const width = window.innerWidth - margin.left - margin.right;
const height = (window.innerHeight - 80) - margin.top - margin.bottom;

// Configuración de las 4 columnas fijas (posiciones X)
const COLUMNS = {
  continent: 0,
  discipline: width * 0.25,
  generation: width * 0.50,
  profession: width * 0.75
};

// Ancho de los nodos
const NODE_WIDTH = 15;
const NODE_PADDING = 8;

// Configuración de espaciado por tipo de columna
const COLUMN_SPACING = {
  continent: { nodeHeight: 30, spacing: 10 },    // Más grandes
  discipline: { nodeHeight: 20, spacing: 5 },     // Medianos
  generation: { nodeHeight: 25, spacing: 8 },     // Medianos-grandes
  profession: { nodeHeight: 12, spacing: 2 }      // Pequeños y juntos
};

// MASTER: Orden fijo de elementos en cada columna
const MASTER = {
  continent: ["Chile", "América", "Europa", "Asia", "África", "Oceanía"],
  generation: ["Gen silenciosa", "Baby boomers", "Gen X", "Millennials", "Gen Z"],
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

// Colores con paletas más ricas para disciplinas y profesiones
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
    "Gen Z": "#1ABC9C"
  }
};

// Función para generar color para disciplinas
function getDisciplineColor(name, index) {
  const hue = (index * 137.5) % 360; // Golden angle para distribución uniforme
  return `hsl(${hue}, 45%, 55%)`;
}

// Función para generar color para profesiones
function getProfessionColor(name, index) {
  const hue = (index * 137.5 + 30) % 360; // Offset para diferenciar de disciplinas
  return `hsl(${hue}, 35%, 60%)`;
}

// Variables globales
let svg;
let allData = [];
let currentYear = null;
let currentOpacity = 0.3;

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
    .style("font-weight", "bold");
}

// Tooltip
const tooltip = d3.select("#tooltip");

// Función para calcular la posición Y (alineado abajo)
function getNodeY(item, columnType) {
  const index = MASTER[columnType].indexOf(item);
  const total = MASTER[columnType].length;
  
  if (index === -1) {
    console.warn(`Item no encontrado en MASTER.${columnType}:`, item);
    return 0;
  }
  
  const config = COLUMN_SPACING[columnType];
  const nodeHeight = config.nodeHeight;
  const spacing = config.spacing;
  
  const totalHeight = total * nodeHeight + (total - 1) * spacing;
  const startY = height - totalHeight - 50;
  
  return startY + index * (nodeHeight + spacing) + nodeHeight / 2;
}

// Función para calcular Y cuando mostramos solo una muestra
function getNodeYSample(item, items, columnType = 'discipline') {
  const index = items.indexOf(item);
  const total = items.length;
  
  if (index === -1) return 0;
  
  const config = COLUMN_SPACING[columnType];
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
  
  initializeSVG();
  
  // Crear controles de UI
  createUIControls();
  
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
    d3.select("#loading").text("Error al cargar los datos");
  });
}

// Función para crear controles de UI
function createUIControls() {
  // Crear slider de opacidad
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
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");
  
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
    });
  
  sliderContainer.append("span")
    .attr("id", "opacity-value")
    .text("0.3")
    .style("font-size", "12px")
    .style("margin-left", "5px");
  
  // Actualizar valor mostrado
  d3.select("#opacity-slider").on("input", function() {
    currentOpacity = +this.value;
    d3.select("#opacity-value").text(currentOpacity);
    d3.selectAll(".link").style("stroke-opacity", currentOpacity);
  });
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
    
    if (row.continent === "Europa; Asia") {
      processed.push(normalizeRecord({...row, continent: "Europa"}));
      processed.push(normalizeRecord({...row, continent: "Asia"}));
    } else {
      processed.push(normalizeRecord(row));
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
  
  COLUMNS.continent = 0;
  COLUMNS.discipline = width * 0.25;
  COLUMNS.generation = width * 0.50;
  COLUMNS.profession = width * 0.75;
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
    // Enlaces entre columnas
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
    
    // Actualizar valores de nodos
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

// Función principal para dibujar el Sankey
function drawSankey(year) {
  currentYear = year;
  console.log("Dibujando Sankey para el año:", year);
  
  // Limpiar
  svg.selectAll(".links").remove();
  svg.selectAll(".node-rectangles").remove();
  svg.selectAll(".node-texts").remove();
  svg.selectAll(".column-label").remove();
  svg.selectAll(".debug-text").remove();
  
  svg.select(".title").text(`Congreso ${year}`);
  
  d3.select("#loading").style("display", "block");
  
  const sankeyData = prepareSankeyData(year);
  
  if (sankeyData.links.length === 0) {
    svg.append("text")
      .attr("class", "debug-text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#666")
      .text(`No hay datos para el año ${year}`);
    d3.select("#loading").style("display", "none");
    return;
  }
  
  // 1. CAPA DE ENLACES (más atrás)
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
    .style("stroke", d => {
      const sourceNode = sankeyData.nodes.find(n => n.id === d.source);
      if (sourceNode.type === 'continent' && COLORS.continent[sourceNode.name]) {
        return COLORS.continent[sourceNode.name];
      } else if (sourceNode.type === 'generation' && COLORS.generation[sourceNode.name]) {
        return COLORS.generation[sourceNode.name];
      } else if (sourceNode.color) {
        return sourceNode.color;
      }
      return "#bbb";
    })
    .style("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 1.5))
    .style("fill", "none")
    .style("stroke-opacity", currentOpacity)
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
  
  // 2. CAPA DE RECTÁNGULOS
  const nodeRectGroup = svg.append("g").attr("class", "node-rectangles");
  
  const nodeRects = nodeRectGroup.selectAll(".node-rect")
    .data(sankeyData.nodes)
    .enter()
    .append("rect")
    .attr("class", "node-rect")
    .attr("x", d => d.x)
    .attr("y", d => {
      const height = d.value > 0 ? Math.max(3, Math.sqrt(d.value) * 3) : 2;
      return d.y - height / 2;
    })
    .attr("width", NODE_WIDTH)
    .attr("height", d => d.value > 0 ? Math.max(3, Math.sqrt(d.value) * 3) : 2)
    .attr("fill", d => {
      if (d.type === 'continent') return COLORS.continent[d.name] || "#999";
      if (d.type === 'generation') return COLORS.generation[d.name] || "#999";
      if (d.type === 'discipline') return d.value > 0 ? d.color : "#e5e5e5";
      if (d.type === 'profession') return d.value > 0 ? d.color : "#e5e5e5";
      return "#999";
    })
    .attr("fill-opacity", d => d.value > 0 ? 0.9 : 0.3);
  
  // 3. CAPA DE TEXTOS (más al frente)
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
    .style("font-size", d => {
      if (d.type === 'continent') return "14px";
      if (d.type === 'discipline') return "11px";
      if (d.type === 'generation') return "12px";
      if (d.type === 'profession') return "9px";
      return "10px";
    })
    .style("fill", d => d.value > 0 ? "#000" : "#999")
    .style("font-weight", d => {
      if (d.type === 'continent' || d.type === 'generation') return "bold";
      return d.value > 0 ? "normal" : "lighter";
    });
  
  // 4. ETIQUETAS DE COLUMNA (más al frente)
  const columnLabels = [
    {x: COLUMNS.continent, text: "CONTINENTES"},
    {x: COLUMNS.discipline, text: "DISCIPLINAS"},
    {x: COLUMNS.generation, text: "GENERACIONES"},
    {x: COLUMNS.profession, text: "PROFESIONES"}
  ];
  
  svg.selectAll(".column-label")
    .data(columnLabels)
    .enter()
    .append("text")
    .attr("class", "column-label")
    .attr("x", d => d.x)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text(d => d.text);
  
  setTimeout(() => {
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

// Toggle de color de texto
let textIsWhite = false;
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-text-color");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      textIsWhite = !textIsWhite;
      
      d3.selectAll(".node-text")
        .style("fill", function(d) {
          if (textIsWhite) return "#fff";
          return d && d.value > 0 ? "#000" : "#999";
        });
      
      d3.selectAll(".column-label")
        .style("fill", textIsWhite ? "#fff" : "#333");
      
      d3.select(".title")
        .style("fill", textIsWhite ? "#fff" : "#000");
      
      d3.select("body")
        .style("background-color", textIsWhite ? "#1a1a1a" : "#f5f5f5");
      
      d3.select("#sankey-container")
        .style("background-color", textIsWhite ? "#1a1a1a" : "transparent");
    });
  }
});