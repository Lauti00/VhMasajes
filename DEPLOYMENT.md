# Ejecutar y publicar VH Masajes

## Desarrollo local

Requisitos: Java 21, Node.js y npm.

1. En PowerShell, iniciar el backend desde la raíz con `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run`. El perfil local usa una base H2 persistente en `./data/masajes`.
2. Iniciar el frontend desde `frontend` con `npm install` y `npm run dev`.
3. Cuenta local inicial: `admin@masajes.local` / `local-only-change-on-first-use`. Solo se crea si no existe y nunca se restablece una cuenta existente. Cambiala desde **Cambiar contraseña** antes de usar datos reales.

Si olvidás la contraseña del administrador local, detené el backend y ejecutá `scripts/ResetLocalAdmin.ps1` desde PowerShell. El script pide una nueva contraseña de al menos 12 caracteres, la guarda con BCrypt en la cuenta administradora local existente y vuelve a iniciar el backend sin borrar los datos.

Las cuentas nuevas usan contraseñas de 12 caracteres como mínimo. Las cuentas existentes conservan su acceso y pueden actualizar su contraseña desde **Cambiar contraseña**.

## Publicar el backend

El `Dockerfile` construye y ejecuta el backend con Java 21. Configurá estas variables en el proveedor de hosting:

| Variable | Uso |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | URL JDBC de PostgreSQL administrado, incluyendo SSL si el proveedor lo requiere |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciales de la base, guardadas como secretos del proveedor |
| `JWT_SECRET` | Secreto aleatorio de al menos 64 caracteres; el código no trae un secreto de producción |
| `CORS_ALLOWED_ORIGINS` | Origen exacto del frontend, por ejemplo `https://turnos.tudominio.com` |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Opcionales: crean el administrador solo si ese correo todavía no existe |
| `INITIAL_ADMIN_NAME` | Nombre opcional para la cuenta inicial |

No uses H2 para producción: es la base local de desarrollo y no está pensada como almacenamiento administrado multiusuario.

## Publicar el frontend

Publicá `frontend` como sitio Vite/React. En el proveedor definí `VITE_API_URL` con el origen del backend, sin barra final, por ejemplo `https://api.tudominio.com`. El archivo `.env.example` deja el valor vacío para que en desarrollo funcione el proxy de Vite.

El frontend incluye `public/_redirects` para que Netlify devuelva `index.html` al abrir directamente rutas como `/reservar`.

## Estado para comercializar como SaaS

El proyecto puede desplegarse fuera de una computadora local con un frontend público, una API y PostgreSQL administrado. Eso todavía no lo convierte en un producto seguro para vender a varios consultorios. Hoy los servicios, horarios, reportes y consultas de turnos no están aislados por consultorio; el administrador también es una cuenta global. Antes de incorporar otros masajistas hay que introducir el consultorio como entidad, asignar cada usuario/servicio/horario/turno a ese consultorio y aplicar ese ámbito en **cada** endpoint y consulta. También hacen falta migraciones de esquema, copias de seguridad y pruebas de acceso cruzado entre cuentas.

La URL `/reservar` funciona para el consultorio actual. Para vender el producto, debe evolucionar a una URL por consultorio, como `/r/nombre-del-consultorio`, y resolver servicios y disponibilidad dentro de ese ámbito.
