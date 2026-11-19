# Ejecutar y publicar VH Masajes

## Desarrollo local

Requisitos: Java 21, Node.js y npm.

1. En PowerShell, iniciar el backend desde la raíz con `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run`. El perfil local usa una base H2 persistente en `./data/masajes`.
2. Iniciar el frontend desde `frontend` con `npm install` y `npm run dev`.
3. Cuenta local inicial: `admin@masajes.local` / `local-only-change-on-first-use`. Solo se crea si no existe y nunca se restablece una cuenta existente. Cambiala desde **Cambiar contraseña** antes de usar datos reales.

Si olvidás la contraseña del administrador local, detené el backend y ejecutá `scripts/ResetLocalAdmin.ps1` desde PowerShell. El script pide una nueva contraseña de al menos 12 caracteres, la guarda con BCrypt en la cuenta administradora local existente y vuelve a iniciar el backend sin borrar los datos.

Las cuentas nuevas usan contraseñas de 12 caracteres como mínimo. Las cuentas existentes conservan su acceso y pueden actualizar su contraseña desde **Cambiar contraseña**.

## Publicar frontend y API en Render con Neon PostgreSQL

El archivo `render.yaml` deja definidos dos recursos: el frontend React como sitio estático y la API desde el `Dockerfile`. Usa la base Neon existente; no crea una base nueva. El costo de referencia actual para mantener activa la API en Render es aproximadamente USD 7/mes; el sitio estático no tiene costo de cómputo. El costo y los límites de Neon dependen de tu plan actual, así que revisalos en su panel.

1. Subí estos cambios a tu rama `main` de GitHub vos mismo.
2. En Render, creá un **Blueprint** conectado a `Lauti00/VhMasajes`, rama `main`, usando el archivo `render.yaml`.
3. Render pedirá `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. Copiá la URL JDBC, usuario y contraseña desde Neon directamente al formulario de Render, sin compartirlos por chat ni guardarlos en GitHub. Ingresá también el correo y una contraseña segura de al menos 12 caracteres para el administrador.
4. Generá `JWT_SECRET` localmente con PowerShell: `$bytes = New-Object byte[] 64; $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); [Convert]::ToBase64String($bytes); $rng.Dispose()`. Pegá el resultado directamente en Render. Tiene 64 bytes aleatorios antes de codificarse en Base64, como exige HS512.
5. Esperá a que los dos recursos aparezcan como listos. La variable `VITE_API_URL` toma automáticamente la URL pública de la API.
6. En `vhmasajes-api`, agregá `CORS_ALLOWED_ORIGINS` con el origen exacto que Render asignó a `vhmasajes-web`, por ejemplo `https://vhmasajes-web.onrender.com` (sin `/reservar`). Guardá el cambio y esperá el redeploy de la API.
7. Abrí `https://<dominio-del-frontend>/reservar` desde un celular usando datos móviles. Registrá un usuario de prueba, reservá y comprobá que el turno aparezca en la agenda administrativa.

La base Neon existente queda separada de los datos de `./data/masajes` local; no se importan automáticamente. El sitio estático y la API tienen HTTPS administrado por Render. PostgreSQL se conecta mediante la URL JDBC privada/pooler de Neon configurada en Render.

No cargues información real de pacientes hasta probar el despliegue, definir copias de seguridad y revisar el tratamiento de datos personales. La configuración actual es para un solo consultorio; todavía no aísla los datos para comercializar la app a varios consultorios.

Render puede desplegar automáticamente cada nuevo push a `main`; como vos querés manejar GitHub, cada actualización del sitio ocurrirá después de un push tuyo.

## Estado para comercializar como SaaS

El proyecto puede desplegarse fuera de una computadora local con un frontend público, una API y PostgreSQL administrado. Eso todavía no lo convierte en un producto seguro para vender a varios consultorios. Hoy los servicios, horarios, reportes y consultas de turnos no están aislados por consultorio; el administrador también es una cuenta global. Antes de incorporar otros masajistas hay que introducir el consultorio como entidad, asignar cada usuario/servicio/horario/turno a ese consultorio y aplicar ese ámbito en **cada** endpoint y consulta. También hacen falta migraciones de esquema, copias de seguridad y pruebas de acceso cruzado entre cuentas.

La URL `/reservar` funciona para el consultorio actual. Para vender el producto, debe evolucionar a una URL por consultorio, como `/r/nombre-del-consultorio`, y resolver servicios y disponibilidad dentro de ese ámbito.
