# SaborBiobío

SaborBiobío es una SPA en React para planificar menús semanales y generar listas de compras a partir de recetas obtenidas desde la API pública de DummyJSON.

## Características principales

- Catálogo de recetas consumido desde la API real de DummyJSON
- Búsqueda por nombre, filtros por etiqueta y por tipo de comida
- Tarjetas reutilizables para mostrar información de cada receta
- Favoritos y menú semanal gestionados en el navegador
- Lista de compras generada automáticamente desde el menú semanal
- Persistencia local mediante Local Storage con validación de datos
- Manejo robusto de errores para que la app nunca quede en blanco

## Tecnologías utilizadas

- React
- TypeScript
- Vite
- Fetch API
- Local Storage

## Requisitos

- Node.js 18 o superior
- npm o pnpm

## Instalación

```bash
npm install
```

## Ejecución en desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

## Estructura del proyecto

- src/components: componentes reutilizables como catálogo, tarjeta, menú semanal y lista de compras
- src/App.tsx: lógica principal de la aplicación
- src/types.ts: modelos de datos

## Seguridad y calidad

- No se almacenan datos sensibles
- Los datos recibidos se sanitizan antes de guardarse
- React renderiza el contenido de forma segura, evitando inyección de HTML en la interfaz
