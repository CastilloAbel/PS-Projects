# Sistema de Autenticación - PS Project

## Implementación Completada

### Backend
✅ **Instaladas dependencias:**
- `bcrypt` - Para hashear contraseñas
- `jsonwebtoken` - Para generar y verificar JWT
- `dotenv` - Para variables de entorno

✅ **Archivo:** `Backend/src/routes/auth.routes.ts`
- POST `/auth/login` - Login con email/password, retorna JWT y datos del usuario
- POST `/auth/change-password` - Cambiar contraseña (requiere JWT)
- Middleware `verifyJWT` - Para proteger rutas

✅ **Seed actualizado:** `Backend/prisma/seed.ts`
- Crea usuario admin por defecto:
  - Email: `admin@ps-project.local`
  - Contraseña: `ps-project-admin` (hasheada con bcrypt)
  - ID: `admin-user`
- Configura contraseñas para otros usuarios de prueba

✅ **Archivo principal:** `Backend/src/index.ts`
- Registra ruta de autenticación (pública)
- Otras rutas pueden protegerse con middleware JWT

### Frontend
✅ **AuthContext:** `Frontend/src/context/AuthContext.tsx`
- Maneja estado de autenticación
- Persistencia en localStorage
- Funciones `login()` y `logout()`

✅ **LoginPage:** `Frontend/src/components/LoginPage.tsx`
- Componente visual de login
- Campos de email y contraseña
- Mensajes de error
- Indicador de carga

✅ **API Client:** `Frontend/src/api/index.ts`
- Interceptor que agrega JWT en header Authorization
- Funciones `loginUser()` y `changePassword()`
- Token automático en todas las peticiones

✅ **App.tsx actualizado:**
- AuthProvider envuelve toda la app
- Redirección a LoginPage si no está autenticado
- Botón Logout en header
- Carga del estado de autenticación antes de renderizar

## Flujo de Autenticación

1. **Al abrir la app:**
   - Verifica localStorage por authToken
   - Si existe, restaura la sesión
   - Si no, muestra LoginPage

2. **Login:**
   - Usuario ingresa email: `admin@ps-project.local`
   - Usuario ingresa contraseña: `ps-project-admin`
   - Backend valida y retorna JWT + datos del usuario
   - Se guarda en localStorage

3. **Peticiones a la API:**
   - Todas incluyen `Authorization: Bearer {token}`
   - Backend valida el token antes de procesar
   - Token expira en 7 días

4. **Cambiar contraseña:**
   - Usuario autenticado llama a `changePassword(oldPassword, newPassword)`
   - Backend verifica contraseña actual
   - Hashea y guarda la nueva

## Instrucciones de Implementación

### Paso 1: Compilar Backend y Frontend
```bash
cd Backend && npm run build
cd ../Frontend && npm run build
```

### Paso 2: Ejecutar Seed (cuando BD esté lista)
```bash
cd Backend
npx prisma db seed
```

Esto creará el usuario admin con contraseña hasheada en la BD.

### Paso 3: Variables de Entorno
**Backend/.env:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/ps_project"
JWT_SECRET="ps-project-secret-key-change-in-production"
PORT=4000
```

### Paso 4: Iniciar Servidor
```bash
cd Backend
npm run dev
```

### Paso 5: Iniciar Frontend
```bash
cd Frontend
npm run dev
```

## Seguridad

✅ Contraseña hasheada con bcrypt (salt rounds: 10)
✅ JWT con expiración (7 días)
✅ Token en localStorage (considerar usar httpOnly cookies en producción)
✅ Interceptor automático de token en todas las peticiones

## Próximos Pasos Recomendados

1. **Implementar OAuth (Google, GitHub)**
   - Usar librerías: `@react-oauth/google`, `next-auth`

2. **Usar httpOnly Cookies en lugar de localStorage**
   - Más seguro contra XSS

3. **Implementar CSRF protection**

4. **Rate limiting en endpoint de login**
   - Prevenir brute force attacks

5. **Log de actividad de autenticación**

6. **2FA (Two-Factor Authentication)**

7. **Role-based access control (RBAC)**

## Credenciales de Demostración

- **Email:** `admin@ps-project.local`
- **Contraseña:** `ps-project-admin`

⚠️ **IMPORTANTE:** Cambiar estas credenciales después del primer login en producción.
