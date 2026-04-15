# Manual de Usuario - GineLeq v1.0.0

## 1. Introducción y Conceptos Básicos

### 1.1. ¿Qué es GineLeq y cuál es su objetivo?

GineLeq es el sistema integral diseñado específicamente para optimizar, centralizar y gobernar la Lista de Espera Quirúrgica del Servicio de Obstetricia y Ginecología. Su núcleo es un motor de inteligencia y puntuación que asiste a los coordinadores quirúrgicos sugiriendo a los pacientes más indicados para operar, siempre basándose en criterios clínicos clave (Prioridad, Oncología, Tiempos de Garantía y Antigüedad).

El objetivo principal es reducir significativamente la carga administrativa al programar quirófanos, emitir partes de intervención oficiales en un clic, y asegurar trazabilidad absoluta de todos los movimientos de los pacientes.

### 1.2. Inicio de sesión y tipos de usuario

El acceso a GineLeq se realiza desde cualquier ordenador autorizado a través del navegador web. Para acceder, utilice su usuario y contraseña corporativos.

Existen dos tipos principales de usuarios:

- **Facultativos / Gestores Médicos:** Tienen acceso total a los cuadros de mandos, la lectura de listas de espera, programación de quirófanos y visualizaciones de historiales o alertas.
- **Administrador (Servicios Centrales):** Disponen adicionalmente de todo el bloque de "Administración". Pueden subir los archivos de pacientes (Excel) que sincronizan las bases de datos de pacientes de forma automática, dar de alta a nuevos facultativos y configurar las listas de correo electrónico o alertas institucionales.

### 1.3. Conociendo la Interfaz

La interfaz de GineLeq está dividida principalmente en dos áreas:

1. **La Barra Lateral Izquierda (Menú):** Permite navegar rápidamente entre todas las secciones (Dashboard, Lista de Espera, Alertas, Agenda Quirófanos, Ayuda Programación, etc.).
2. **El Área Principal de Trabajo:** Donde interactuamos con las tablas, vemos las tarjetas de pacientes o completamos cuadros operativos. Siempre dispone de cabeceras claras que te indican en qué sección estás y ofrecen filtros rápidos (por ejemplo, buscar por NHC o RDQ).

<br/>

## 2. Panel de Control (Dashboard)

El Dashboard es la pantalla inicial ("home") y funciona como un cuaderno de mando en tiempo real.

### 2.1. Interpretación de los Indicadores Clave (KPIs)

En la parte superior, verás una red de "tarjetas" o indicadores numéricos diseñados para una fácil lectura rápida:

- **Total de Pacientes en Lista:** Refleja la cuenta viva y activa.
- **Casos Oncológicos / Oncológica Mama:** Avisos directos sobre el volumen de casos críticos priorizables.
- **Garantías Superadas:** Te alerta sobre pacientes cuyos plazos dictados por el Decreto de Garantía Quirúrgica ya han expirado.
- **Decreto de Garantía:** Pacientes globales sujetos a garantías vigentes.
- **Visto Bueno Anestesia:** Volumen de pruebas activas y válidas.

> **💡 Consejo:** Siempre que veas un texto en estas tarjetas avisándote de un número de pacientes "sin asignar fecha", podrás intervenir de manera rápida acudiendo al módulo "Ayuda Programación".

### 2.2. Análisis Gráfico y Tiempos de Demora
Debajo de los indicadores clave, encontrarás un desglose visual importantísimo:
- **Tiempos de Demora Media:** Refleja en días el promedio matemático que los pacientes llevan esperando, subdividido en Global, Oncológico (Mama y Gine) y Estándar.
- **Gráficos de Cumplimiento:** Diversos diagramas circulares y barras de carga que ilustran de un vistazo cuántos pacientes de alta prioridad están cubiertos (con fecha programada) frente al total de pacientes pendientes. Y qué porcentaje de los pacientes superan, o están al borde de superar, los Decretos y normativas de garantía.

---

## 3. Agenda Quirófanos

La vista de Agenda es tu calendario maestro. Aquí puedes crear, visualizar y organizar qué días y turnos (Mañana/Tarde/Noche) tiene habilitado un quirófano tu servicio (Por ejemplo, un "Quirófano Central" o "Quirófano Local").

- **Crear un quirófano:** Podrás dar de alta qué día dispones de un bloque de quirófano en el hospital, detallando su tipo y los cirujanos asignados.
- Solo los quirófanos creados en esta agenda aparecerán luego como "disponibles" para rellenar en la pantalla de Programación.
- Puedes eliminar quirófanos o modificar sus equipos médicos en cualquier momento.

---

## 4. Gestión de la Lista de Espera

El punto neurálgico donde reside todo el censo bruto importado del sistema central.

### 4.1. Visualización de la tabla general
En esta pantalla verás una cuadrícula completa con toda la información sensible: NHC, Nombres, Diagnóstico y Tiempos de cada paciente. Puedes pinchar en las cabeceras para reordenarlos por fecha de registro (descendiente o ascendiente).

### 4.2. Búsqueda rápida de pacientes
Si te llaman por teléfono respecto a una paciente en concreto, tienes una enorme caja de búsqueda rápida (con el icono del buscador web). Puedes teclear el NHC, su RDQ o apellidos, y la tabla filtrará automáticamente para ella.

### 4.3. Filtros Avanzados
En el lateral (o parte superior), tienes botones clave para la toma de decisiones:
- **Onco Mama / Onco Gine:** Separa únicamente pacientes oncológicas.
- **Garantía Institucional:** Visualiza solo a las sujetas al Decreto de garantía.
- **Anestesia Local / CMA:** Listará solo aquellas cirugías catalogables como locales o menores con requisitos livianos de quirófano.

---

## 5. Ayuda a la Programación

La "joya de la corona" del sistema GineLeq. Esta pantalla te permite componer qué paciente va a qué quirófano usando inteligencia en tiempo real. ¡Todo es interactivo!

### 5.1. El Motor de Sugerencias y Puntuación Médica
A la izquierda, en lugar del aburrido Excel estándar, verás tarjetas de colores de pacientes con "Puntos". 
- Es importante entender que el software otorga internamente **cientos de Puntos** extra a los pacientes oncológicos, prioridades absolutas y aquellas que caducarán sus garantías o pruebas, organizándotelos en la lista de mayor prioridad (arriba) a menor prioridad (abajo).

### 5.2. Moviendo pacientes (Drag & Drop) a la Agenda
A la derecha tendrás los Quirófanos que creaste en la sección Agenda (Tema 3).
- Coge la tarjeta de una paciente del panel izquierdo (manteniendo presionado el clic del ratón) y arrástrala literalmente hasta "soltarla" en la caja del quirófano. ¡Quedará guardada y asignada al instante! Si necesitas reorganizar el turno de intervención (quién se opera primera), mueve la tarjeta más arriba o más abajo dentro del mismo bloque.

### 5.3. Generación y Envío de Partes
Una vez rellenada tu agenda del día, todos los quirófanos poseen el icono de una **Impresora 🖨️**.
- Al pulsarlo, el sistema redactará instantáneamente un documento formal de Parte Quirúrgico Médico donde los pacientes aparecerán exactamente en el orden de intervención que fijaste. Puedes imprimirlo en PDF, exportarlo, o mandarlo directamente allí por email con otro clic.

---

## 6. Sistema de Alertas

Esta sección hace el trabajo proactivo por ti. El sistema rastreará cada día tu base de datos y te presentará exclusivamente a aquellos pacientes que requieren de una acción por tu parte.

### 6.1. Monitorización de Preanestesias Caducadas
Por defecto, la pantalla te muestra pacientes cuyo resultado de preanestesia fue "Apto" hace más de 180 días. Esto permite adelantarse al problema y pedir pruebas nuevas antes de programarlas.

### 6.2. Exportación de alertas
Dispones de un botón verde llamado **"📥 Exportar Listado (Excel)"**. Con él podrás descargar exactamente el listado que estés viendo en la pantalla (una vez aplicados los flitros) e incluirá automáticamente las columnas de las fechas críticas (como la fecha de la consulta de preanestesia). Este archivo está optimizado para mandarse al equipo de administración o enfermería para renovaciones.

---

## 7. Historial y Trazabilidad del Paciente

¿Quieres saber qué ocurrió exactamente con una paciente y por qué desapareció de la lista o a qué quirófano fue asignada en el pasado? Tu sección es Historial.

### 7.1. Búsqueda por Historial
Introduce el NHC o nombre de la paciente en la barra de búsqueda y descubrirás su "Patient Journey": una línea temporal (Timeline) interactiva con las veces que fue inscrita, cuándo fue operada y en qué quirófano.

### 7.2. Sesiones Quirúrgicas Anteriores
También puedes usar esta sección para buscar partes de impresión o listados de quirófanos que ocurrieron semanas o meses atrás y volver a emitirlos.

---

## 8. Administración (Solo Administradores)

Este apartado es confidencial y crítico para el mantenimiento técnico.

### 8.1. Gestión de Usuarios
Da de alta a nuevos facultativos, desactiva sus cuentas o cambia contraseñas.
### 8.2. Directorio de Facultativos y Listas de Correo
Mantén la base de datos de Cirujanos Ginecólogos limpia. Estos nombres son los que se seleccionan en la Agenda de Quirófanos. También aquí puedes definir listas de correo globales (ej: "Plantilla Ginecología" o "Anestesia").
### 8.3. Importación desde el SAS
El centro neurálgico que actualiza tu aplicación. Cada cierto tiempo, el hospital te proveerá un Excel con el censo de lista de espera global. Simplemente arrástralo a este apartado y GineLeq actualizará pacientes nuevos, emparejará existentes, y detectará quiénes ya no están en lista de forma automática e inteligente.
