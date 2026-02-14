title: "Documento de Requerimientos de Software (ERS)"
subtitle: "Sistema de Gestión de Lista de Espera Quirúrgica - Ginecología"
author: "Análisis de Requerimientos"
date: "2026-02-14"
output:
pdf_document: default
html_document:
theme: cosmo
highlight: tango

1. Introducción

Este documento detalla los requerimientos para el desarrollo de una aplicación web destinada a la explotación y gestión de la lista de espera quirúrgica del servicio de Ginecología. El sistema permite la importación de datos externos, el seguimiento de plazos legales/clínicos, la planificación de la agenda quirúrgica y la generación de partes oficiales de intervención.

1. Arquitectura Técnica y Despliegue

IDE de Desarrollo: Project IDX (Google).

Control de Versiones: GitHub (Repositorio privado).

Frontend/Backend: Node.js con Next.js (App Router).

Base de Datos: Supabase (PostgreSQL).

Infraestructura de Despliegue: VPS en Hostinger gestionado mediante Dokploy.

1. Modelo de Datos y Seguridad

3.1. Identificador Único (RDQ)

El campo RDQ (Registro de Demanda Quirúrgica) es la clave primaria y única para cada intervención.

3.2. Cifrado de Datos Sensibles

Campos Cifrados (AES-256-GCM): paciente y NHC.

Búsqueda sobre Datos Cifrados: Uso de Blind Indices (Hashes deterministas para búsquedas exactas).

3.3. Campos de Gestión Manual (Persistentes)

estado: (Activo/Pasivo).

comentarios: (Texto libre).

priorizable: (Booleano Sí/No).

1. Lógica de Sincronización (Importación Excel)

Identificación: Basada en RDQ.

Upsert: Actualiza datos clínicos, preserva campos manuales.

Bajas: Si un RDQ activo desaparece del Excel, pasa a estado "Pasivo".

1. Módulos y Navegación

Interfaz con menú lateral: Dashboard, Lista de Espera, Alertas, Agenda Quirófanos, Ayuda Programación, Importación e Historial.

1. Lógica de Alertas y Plazos

Monitorización del campo T. registro:

Oncológica (Mama y Ginecología): 30 días (Alerta a los 23 días).

Garantía: Plazo variable según decreto (Alerta 30 días antes).

Estándar: 365 días (Alerta 30 días antes).

1. Módulo: AGENDA DE QUIRÓFANOS

Registro manual de sesiones con fecha, tipo de quirófano y equipo médico. Visualización en calendario mensual.

1. Módulo: AYUDA A LA PROGRAMACIÓN (Selección Inteligente)

Ranking basado en Urgencia Clínica (priorizable y oncológicas), Antigüedad (T. registro) y Validación de Equipo Médico.

1. Módulo: GENERACIÓN DE PARTES DE QUIRÓFANO

Generación de PDF basado en el formato oficial: Cabecera de sesión, tabla de filiación descifrada, diagnóstico e intervención.

1. Módulo: DASHBOARD (Panel de Control)

Este módulo proporciona una visión analítica e inmediata del estado de la unidad.

10.1. Indicadores Clave (KPIs)

El panel superior mostrará los siguientes indicadores numéricos en tiempo real:

Censo Total: Total de pacientes con estado == "Activo".

Censo Oncológico Total: Diagnóstico comienza por "NEOPLASIA MALIGNA".

Censo Onco-Mama: Diagnóstico comienza por "NEOPLASIA MALIGNA MAMA".

Censo Onco-Ginecología: Diagnóstico comienza por "NEOPLASIA MALIGNA" pero NO por "NEOPLASIA MALIGNA MAMA".

Visto Bueno Anestesia: Pacientes con Rdo. Preanestesia == "Apto".

Cirugía Local/Sin Anestesia: Campo T. Anestesia contiene "Local" o "Sin anestesia".

Tiempo de Demora Medio: Promedio de días transcurridos desde *T. registro* hasta la fecha actual, segmentado por:

Global (Toda la lista).

Onco-Mama.

Onco-Ginecología.

Estándar (365 días).

10.2. Listados de Seguimiento Crítico

Listados dinámicos con resaltado visual:

Fila Verde Claro (#ECFDF5): Pacientes con Rdo. Preanestesia == "Apto".

Fondo Violeta Claro (#F5F3FF): Pacientes marcadas como priorizable.

Listados incluidos:

Próximas Estándar: $T. registro \ge 335$ días.

Próximas Decreto de Garantía: $T. registro \ge (Plazo\_Garantía - 30)$ días.

Próximas Onco-Mama: $T. registro \ge 23$ días.

Próximas Onco-Ginecología: $T. registro \ge 23$ días.

Casos Priorizables: Pacientes con el marcador manual activo.

1. Estética y Estilos

Colores: Azul Quirúrgico (#0F4C5C), Rojo Crítico (#EF4444), Ámbar de Aviso (#F59E0B).

Tipografía: Inter o Geist.

1. Flujo de Trabajo

Sincronización vía GitHub y despliegue continuo en VPS Hostinger mediante Dokploy.

1. Stack Tecnológico Detallado

* **Estilos:** Vanilla CSS con Variables CSS (Custom Properties) y CSS Modules para encapsulamiento.
* **Autenticación:** Supabase Auth (Email/Password con política de seguridad estricta).
* **Gestión de Estado:** React Server Components / Server Actions (nativo Next.js) minimizando estado global en cliente.
