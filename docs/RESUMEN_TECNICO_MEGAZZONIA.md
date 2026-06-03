# Resumen tecnico de continuidad

Fecha de referencia: 2026-06-03.

## Objetivo alcanzado

Se profesionalizo el workspace `Laboratorio Megazzonia` mediante:

- repositorios Git independientes por proyecto;
- repositorio padre con submodulos;
- publicacion remota en GitHub;
- cambio de visibilidad a publica;
- integracion OAuth con LinkedIn;
- scaffold funcional de `megazzonia-social-ops`.

No se incluyen secretos en este documento.

## Repositorios GitHub

Repositorio padre:

```text
https://github.com/juanfranco1985/laboratorio-megazzonia
```

El repositorio padre usa `.gitmodules` para referenciar los proyectos como submodulos.

Comando de clonacion completa:

```powershell
git clone --recurse-submodules https://github.com/juanfranco1985/laboratorio-megazzonia.git
```

Verificacion realizada tras publicar:

```text
TOTAL=30
PUBLIC=30
NON_PUBLIC=0
```

Incluye:

- `laboratorio-megazzonia`;
- todos los repos `megazzonia-*`;
- `megazzonia-social-ops`.

Antes de hacer publica la coleccion se ejecuto un escaneo conservador de archivos versionados para patrones comunes:

- tokens GitHub tipo `ghp_`, `gho_`, etc.;
- claves OpenAI tipo `sk-`;
- Google API keys tipo `AIza`;
- AWS access keys tipo `AKIA`;
- bloques `BEGIN PRIVATE KEY`;
- archivos sensibles trackeados como `.env`, `linkedin-token.json`, `linkedin-profile.json`.

Resultado:

```text
NO_HIGH_CONFIDENCE_SECRETS_FOUND
```

Nota: esto no reemplaza una auditoria profunda de seguridad, pero cubre riesgos comunes de alta confianza.

## Scripts creados

### Preparacion Git

```text
scripts/preparar_git_laboratorio.ps1
```

Responsabilidades:

- definir mapa carpeta local -> repo GitHub;
- crear `.gitignore` por proyecto;
- inicializar Git en cada proyecto;
- configurar `origin`;
- generar `.gitmodules`;
- generar `GITHUB_REPOS.md`;
- crear commits iniciales;
- preparar el repo padre.

### Publicacion GitHub

```text
scripts/publicar_repos_github.ps1
```

Responsabilidades:

- detectar `gh.exe`;
- validar `gh auth status`;
- crear repos remotos si no existen;
- subir cada submodulo;
- subir el repo padre;
- admitir visibilidad `private` o `public`.

Uso:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\publicar_repos_github.ps1
```

## LinkedIn Developer

Se configuro una app de LinkedIn asociada a la Page:

```text
Megazzonia Lab
https://www.linkedin.com/company/megazzonia-lab/
```

Productos habilitados:

```text
Share on LinkedIn
Sign In with LinkedIn using OpenID Connect
```

Scopes obtenidos correctamente:

```text
email,openid,profile,w_member_social
```

`w_member_social` permite publicar en nombre del miembro autenticado.

El backend obtuvo identidad:

```text
name: Juan Franco
personUrn: urn:li:person:u17wp2IKe3
```

La politica de privacidad temporal esta en:

```text
https://github.com/juanfranco1985/DataOrchestra-AI/blob/main/privacy-policy.html
```

## Megazzonia Social Ops

Proyecto:

```text
megazzonia-social-ops
```

Repositorio:

```text
https://github.com/juanfranco1985/megazzonia-social-ops
```

Estructura inicial:

```text
megazzonia-social-ops/
  android/
  backend/
    .env
    .env.example
    package.json
    src/
      config.js
      http-utils.js
      linkedin.js
      server.js
      storage.js
  docs/
    linkedin-setup.md
```

El archivo `.env` existe solo localmente y esta ignorado por Git.

Variables relevantes:

```env
PORT=8787
APP_BASE_URL=http://localhost:8787
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:8787/auth/linkedin/callback
LINKEDIN_SCOPES=openid profile email w_member_social
ALLOW_LINKEDIN_PUBLISH=false
LINKEDIN_PERSON_URN=
```

Validacion realizada:

```powershell
cd megazzonia-social-ops/backend
npm run check
```

Endpoint de salud verificado:

```text
GET http://localhost:8787/health
```

Endpoint de estado LinkedIn:

```text
GET http://localhost:8787/linkedin/status
```

Estado confirmado:

```json
{
  "connected": true,
  "scopes": "email,openid,profile,w_member_social",
  "publishEnabled": false
}
```

## Publicacion LinkedIn

El backend ya contiene endpoint:

```text
POST /linkedin/publish
```

Actualmente requiere:

- token LinkedIn valido;
- `personUrn`;
- `ALLOW_LINKEDIN_PUBLISH=true`;
- `confirmPublish: true` en el body;
- texto no vacio.

La publicacion esta desactivada intencionalmente:

```env
ALLOW_LINKEDIN_PUBLISH=false
```

Esto evita publicaciones accidentales durante el desarrollo.

## Modelo recomendado de automatizacion

Fase 1:

```text
GitHub activity -> draft -> revision humana -> publish
```

Fase 2:

```text
GitHub activity -> reglas de filtrado -> draft tecnico -> notificacion Android
```

Fase 3:

```text
eventos de alta confianza -> publicacion automatica limitada
```

Controles recomendados antes de automatizar sin revision:

- maximo de publicaciones por dia;
- lista de repos habilitados;
- tipos de eventos permitidos;
- bloqueo de posts duplicados;
- modo dry-run;
- registro de auditoria;
- ventana horaria de publicacion;
- aprobacion manual para posts con imagen o links externos.

## Proximos pasos tecnicos

1. Crear generador de borradores desde commits recientes.
2. Agregar endpoint `POST /drafts/from-github`.
3. Agregar lectura GitHub API o `gh` local.
4. Agregar vista simple local para aprobar borradores.
5. Implementar publicacion de prueba en LinkedIn con texto controlado.
6. Agregar soporte de imagen/captura.
7. Planificar app Android y notificaciones.

