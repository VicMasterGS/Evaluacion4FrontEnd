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

- No se almacenan datos sensibles como contraseñas, tarjetas o datos bancarios.
- Sólo se guardan preferencias locales de la interfaz: favoritos, menú semanal y estado de la lista de compras.
- Antes de mostrar cualquier texto introducido por el usuario, se aplica una sanitización básica para evitar caracteres que puedan afectar a la interfaz.
- El contenido renderizado por React se maneja de forma segura y no se inserta HTML dinámico desde entradas de usuario.
- El almacenamiento en Local Storage se usa únicamente para datos no sensibles y de contexto de la aplicación, por lo que es seguro para este caso de uso.

## Manejo de errores y validaciones

- Se capturan errores de red, respuestas inválidas y estructuras inesperadas antes de renderizar.
- La app cuenta con fallback visual para evitar pantallas en blanco.
- Sugerencia de IA aplicada: se consideró usar una estrategia de recuperación por fallback y mensajes de estado claros. Se aceptó la propuesta porque mejora la experiencia y evita que la interfaz quede rota si la API falla.
