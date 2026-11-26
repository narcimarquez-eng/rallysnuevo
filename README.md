# Rallys divertidos

Juego 3D de rallys en JavaScript sin compilación (módulos ES + Three.js 0.186.1 por `importmap`) que reutiliza directamente los escenarios generados en **`Mundos-`** y carga coches `.glb` exportados desde **`Hacer-coches-`**.

## Cómo arrancarlo

Necesita servirse por HTTP (por los módulos ES e `importmap`):

```bash
npm run servir
# o con cualquier servidor estático:
npx serve .
```

También admite parámetros en la URL:
- `?escenario=https://.../mi-circuito.escenario.json`
- `?coche=https://.../mi-coche.glb`

## Controles

- **Teclado**: `W/A/S/D` o flechas para conducir · `Espacio` freno de mano · `C` cambiar cámara (Persecución, Capó, Cabina) · `R` recolocar en pista · `Esc`/`P` menú.
- **Mando (Gamepad API)**: gatillos `RT/LT` acelerar y frenar · stick izquierdo girar · `A/X` freno de mano · `Y` cámara · `B` recolocar.
- **Móvil / Táctil**: botones táctiles en pantalla (se activan automáticamente en pantallas táctiles o desde el menú).

## Reutilización de `Mundos-`

Los módulos del motor de escenarios viven en `vendor/mundos/js/` y se actualizan desde la rama `claude/world-generator-viewer-kk0hn3` con:

```bash
npm run actualizar-mundos
```

Por defecto cargan las texturas y modelos `.glb` desde GitHub Pages de `Mundos-` (con CORS habilitado) para no duplicar ~27 MB de assets. Si quieres una copia 100 % offline, ejecuta:

```bash
node scripts/actualizar-mundos.mjs --con-assets
```

## Compatibilidad con `Hacer-coches-`

Cualquier `.glb` exportado desde `narcimarquez-eng/Hacer-coches-` usa metros reales, `+Z` hacia delante, `+Y` arriba, `Y = 0` en la base de los neumáticos y el grupo `Wheels` con 4 nodos `Wheel`. El juego detecta las 4 ruedas, las envuelve con pivotes independientes de dirección, suspensión y rodadura, y coloca automáticamente las cámaras de **capó** y **cabina** frente al parabrisas y volante.
