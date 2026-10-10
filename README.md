# Página de Take Notes

Sitio estático publicado por `.github/workflows/site.yml` en GitHub Pages de TakeNotes-releases al integrar cambios en `main`.

- `index.html`: presentación, funciones y descargas. `app.js` consulta la última release pública.
- `lyrics.html`: guía de anotaciones basada en `docs/LYRICS.md`; mantener ejemplos e instrucciones coherentes al editarlas.
- La guía también viaja dentro de la app en español, inglés y portugués, disponible sin conexión en Configuración › Ayuda.

## Capturas reales

```sh
SITE_SHOTS=/tmp/takenotes-site-shots dotnet test tests/TakeNotes.Desktop.Tests -c Release --filter FullyQualifiedName~SiteShots
```

La prueba usa notas ficticias y una biblioteca en memoria, sin tocar los documentos del usuario. Sin `SITE_SHOTS`, no genera archivos. Los archivos `.crop` indican el rectángulo del editor flotante; convierte las imágenes PNG a WebP antes de copiarlas a `assets/shots/`. Para la lista «Enlazada desde», un recorte de la parte superior evita mostrar demasiado espacio vacío.

## Revisión

Servir esta carpeta por HTTP y comprobar en 390 y 1280 px, en claro y oscuro: enlaces a descargas, guía, imágenes, pestañas con ratón/flechas/Inicio/Fin y ausencia de desbordamiento horizontal. La descarga real requiere la release publicada: las capturas no alteran el número de versión obtenido de GitHub.
