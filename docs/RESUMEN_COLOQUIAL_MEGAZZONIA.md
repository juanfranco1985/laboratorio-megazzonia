# Resumen coloquial de lo logrado

Fecha de referencia: 3 de junio de 2026.

## En pocas palabras

Ordenamos el Laboratorio Megazzonia para que deje de ser solo una carpeta grande con muchos proyectos mezclados y pase a tener una estructura profesional:

- cada proyecto tiene su propio repositorio Git;
- todos esos proyectos siguen unidos dentro de un repositorio padre;
- los repositorios ya estan publicados en GitHub;
- quedaron publicos;
- LinkedIn ya quedo conectado mediante permisos oficiales;
- empezamos una app nueva para administrar publicaciones tecnicas.

## GitHub y los repositorios

Primero creamos un Git separado para cada proyecto del laboratorio. Eso significa que cada carpeta importante puede evolucionar como proyecto independiente, con su propio historial, commits y repositorio.

Despues creamos un repositorio padre llamado:

```text
laboratorio-megazzonia
```

Ese repo padre apunta a todos los proyectos usando submodulos. En la practica, esto permite tener dos formas de trabajar:

- entrar a un proyecto concreto y manejarlo como repo propio;
- clonar todo el laboratorio junto cuando se necesita la vision completa.

Luego autenticamos GitHub CLI con tu cuenta y publicamos todo en GitHub.

Resultado:

```text
30 repositorios publicados
30 repositorios publicos
0 repositorios pendientes
```

Repositorio principal:

```text
https://github.com/juanfranco1985/laboratorio-megazzonia
```

Tambien hicimos un escaneo simple antes de hacerlos publicos para evitar publicar cosas obvias como tokens, claves privadas o archivos `.env`. No aparecieron secretos de alta confianza en archivos versionados.

## LinkedIn

Despues empezamos a preparar una app para manejar publicaciones tecnicas en LinkedIn.

La idea fue hacerlo bien: no guardar contrasenas, no automatizar el navegador como si fuera una persona, y no depender de trucos fragiles. En vez de eso usamos OAuth, que es el sistema oficial donde LinkedIn te pregunta si autorizas una app.

Creamos o configuramos:

- una LinkedIn Page llamada `Megazzonia Lab`;
- una app en LinkedIn Developer;
- el producto `Share on LinkedIn`;
- el producto `Sign In with LinkedIn using OpenID Connect`;
- una politica de privacidad publica;
- un logo para Megazzonia Lab.

Con eso la app obtuvo permisos para:

- identificar tu cuenta;
- publicar en tu perfil personal de LinkedIn;
- hacerlo sin conocer ni guardar tu contrasena.

El backend ya logro conectarse como:

```text
Juan Franco
```

Y ya tiene el identificador tecnico que LinkedIn necesita para publicar en tu perfil.

## Megazzonia Social Ops

Creamos un proyecto nuevo dentro del laboratorio:

```text
megazzonia-social-ops
```

Ese proyecto sera la base de la aplicacion que conecte GitHub, LinkedIn y futuras notificaciones.

Por ahora tiene un backend local que puede:

- cargar tus credenciales desde un archivo local `.env`;
- iniciar sesion con LinkedIn mediante OAuth;
- guardar el token localmente;
- confirmar si LinkedIn esta conectado;
- preparar borradores;
- publicar en LinkedIn cuando se active explicitamente.

Importante: la publicacion real esta bloqueada por seguridad con:

```env
ALLOW_LINKEDIN_PUBLISH=false
```

Eso significa que aunque ya tengamos permiso de LinkedIn, la app no va a publicar accidentalmente.

## Sobre automatizar publicaciones

Si, las publicaciones se pueden automatizar.

Pero hay dos niveles:

### Recomendado al principio

```text
GitHub detecta actividad -> se genera un borrador -> lo revisas -> se publica
```

Este enfoque es mas seguro porque evita publicar cosas flojas, repetidas o fuera de contexto.

### Mas automatico, para despues

```text
GitHub detecta actividad -> genera texto -> publica sin revisar
```

Tambien se puede hacer, pero conviene esperar hasta tener buenas reglas: frecuencia maxima, tipos de eventos, estilo de redaccion, temas permitidos y bloqueo de publicaciones repetidas.

## Donde estamos parados ahora

El laboratorio ya tiene base profesional en GitHub.

LinkedIn ya esta conectado.

La app social ya existe como proyecto.

Lo siguiente natural seria:

1. generar el primer borrador de publicacion;
2. revisarlo manualmente;
3. activar publicacion;
4. hacer una primera publicacion controlada en LinkedIn;
5. despues agregar generacion automatica desde actividad de GitHub.

