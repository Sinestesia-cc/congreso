Necesario:
# Iniciar servidor desde el CMD en la raiz de la carpeta el comando: python -m http.server 8000
# Archivos: index.html, script-d3.js, sankey_data.csv
# Web DAT Parameters: URL = http://localhost:8000
#Enable Javascript: ON
#Se pueden exportar las modificaciones que uno haga para importarlas en otro pc. Si aprietas el botón de Guardar se guarda definitivamente en tus archivos de la carpeta.
—-------------------------------------------------------------------------------------------------------------------
Descripción de comandos para touchdesigner.

# webDAT = op('tu_web_dat')

# Verifica si está listo para iniciar
ready = webDAT.runScript('return window.touchDesignerAPI.isReady()')

# Selecciona años para comparar(O puede ser uno no más)
webDAT.runScript('window.touchDesignerAPI.selectYears(["2023", "2024"])')

# Iniciar animación
webDAT.runScript('window.touchDesignerAPI.playSankey()')

# Detener y ocultar diagrama  
webDAT.runScript('window.touchDesignerAPI.stopSankey()')

# Mostrar/ocultar controles 
webDAT.runScript('window.touchDesignerAPI.toggleUI(false)')  # Mostrar
webDAT.runScript('window.touchDesignerAPI.toggleUI(true)')   # Ocultar

# Estado actual
state = webDAT.runScript('return JSON.stringify(window.touchDesignerAPI.getState())')

# Reset completo
webDAT.runScript('window.touchDesignerAPI.reset()')

—-------------------------------------------------------------------------------------------------------------------

Resumen de posible funcionamiento para el congreso:

//Verificar readiness
if webDAT.runScript('return window.touchDesignerAPI.isReady()'):
//Configurar years
    webDAT.runScript('window.touchDesignerAPI.selectYears(["2023", "2024"])')
    
 // Play (UI sigue oculta)
    webDAT.runScript('window.touchDesignerAPI.playSankey()')

// Después de 20 segundos, detener
run('op("webDAT").runScript("window.touchDesignerAPI.stopSankey()")', delayFrames=600)
