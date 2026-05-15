# Estructura del Repositorio PS-Projects

```
PS-Projects/
├── Backend/                         # Node.js/Express API Server
│   ├── src/
│   │   ├── index.ts                # Punto de entrada de la aplicación
│   │   ├── prisma.ts               # Cliente singleton de Prisma
│   │   ├── logger.ts               # Configuración de Winston logger ⭐
│   │   ├── middleware.ts           # Middlewares globales (JWT, errors, logging)
│   │   ├── validation.ts           # Middleware de validación Zod
│   │   ├── schemas.ts              # Esquemas de validación Zod
│   │   ├── passport.ts             # Estrategia de Google OAuth 2.0
│   │   │
│   │   └── routes/                 # Rutas API (modular por recurso)
│   │       ├── auth.routes.ts      # Autenticación (login, logout, change password)
│   │       ├── oauth.routes.ts     # OAuth endpoints (Google)
│   │       ├── workspace.routes.ts # Gestión de workspaces
│   │       ├── board.routes.ts     # Kanban boards CRUD
│   │       ├── list.routes.ts      # Columnas/listas
│   │       ├── card.routes.ts      # Tareas/tarjetas
│   │       ├── user.routes.ts      # Perfiles de usuario
│   │       ├── tag.routes.ts       # Etiquetas/tags
│   │       ├── comment.routes.ts   # Comentarios en tareas
│   │       └── activity.routes.ts  # Historial de actividad
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Definición de modelo de datos
│   │   └── seed.ts                 # Script de seeding inicial
│   │
│   ├── logs/                        # Directorio de logs (generado en producción)
│   ├── dist/                        # Código compilado JavaScript (generado)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example                 # Variables de entorno ejemplo
│
├── Frontend/                        # React/Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts            # Cliente HTTP Axios + funciones API
│   │   │
│   │   ├── components/             # Componentes React
│   │   │   ├── App.tsx             # Componente principal
│   │   │   ├── Board.tsx           # Tablero Kanban
│   │   │   ├── List.tsx            # Columna del tablero
│   │   │   ├── Card.tsx            # Tarjeta/tarea
│   │   │   ├── CardModal.tsx       # Modal de edición de tarjeta
│   │   │   ├── LoginPage.tsx       # Página de login + Google OAuth
│   │   │   ├── AuthCallbackPage.tsx # Callback de OAuth
│   │   │   ├── SecurityPage.tsx    # Configuración de seguridad
│   │   │   ├── ErrorModal.tsx      # Modal de errores
│   │   │   └── (otros componentes reutilizables)
│   │   │
│   │   ├── context/                # Context API providers
│   │   │   ├── AuthContext.tsx     # Estado de autenticación
│   │   │   ├── UserContext.tsx     # Usuario actual
│   │   │   ├── ThemeContext.tsx    # Modo oscuro/claro
│   │   │   ├── LanguageContext.tsx # Internacionalización (ES/EN)
│   │   │   └── ErrorContext.tsx    # Manejo global de errores
│   │   │
│   │   ├── types/
│   │   │   └── index.ts            # Tipos TypeScript principales
│   │   │
│   │   ├── main.tsx                # Punto de entrada
│   │   ├── index.css               # Estilos globales Tailwind
│   │   └── App.tsx                 # Componente raíz
│   │
│   ├── dist/                        # Build de producción (generado)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example                 # Variables de entorno ejemplo
│
├── db/                              # Volumen PostgreSQL (generado)
├── docs/                            # Documentación
│   ├── ARCHITECTURE.md              # Arquitectura del proyecto
│   ├── SETUP.md                     # Guía de configuración
│   ├── API.md                       # Documentación de endpoints
│   ├── DEVELOPMENT.md               # Guía de desarrollo
│   └── DEPLOYMENT.md                # Guía de deployment
│
├── docker-compose.yml               # Configuración Docker
├── .gitignore                       # Archivos a ignorar en Git
├── .env.example                     # Ejemplo de variables de entorno
├── README.md                        # Documentación principal
└── CONTRIBUTING.md                  # Guía de contribución
```

## 🔑 Archivos Clave

### Backend
- **logger.ts**: Winston logger centralizado
- **middleware.ts**: Middlewares (JWT, errors, logging)
- **schemas.ts**: Validaciones con Zod
- **passport.ts**: Estrategia OAuth de Google

### Frontend
- **context/**: Manejo centralizado de estado
- **components/**: Componentes reutilizables
- **api/**: Cliente HTTP centralizado

## 📦 Dependencias Instaladas

### Backend
- **express**: Framework web
- **passport**: Autenticación OAuth
- **jsonwebtoken**: JWT
- **bcrypt**: Hash de contraseñas
- **zod**: Validación de esquemas
- **winston**: Logging
- **helmet**: Headers de seguridad
- **express-rate-limit**: Rate limiting
- **prisma**: ORM
- **postgresql**: Base de datos

### Frontend
- **react**: UI library
- **vite**: Build tool
- **tailwindcss**: Styling
- **lucide-react**: Icons
- **axios**: HTTP client

## 🚀 Comandos Útiles

```bash
# Backend
npm run dev        # Desarrollo con nodemon
npm run build      # Compilar TypeScript
npm run start      # Ejecutar producción

# Frontend
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run preview    # Preview del build

# Docker
docker-compose up  # Inicia PostgreSQL
```
