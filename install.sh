#!/bin/sh
# Instala Take Notes en Linux, sin sudo, para el usuario actual:
#   curl -fsSL https://oriontheprogrammer.github.io/TakeNotes-releases/install.sh | sh
# Desinstalar (tus notas no se tocan):
#   curl -fsSL https://oriontheprogrammer.github.io/TakeNotes-releases/install.sh | sh -s -- --uninstall
#
# Deja la AppImage en ~/.local/share/TakeNotes, un acceso en el menú de aplicaciones y el comando
# «takenotes». La carpeta es tuya, así que Take Notes se sigue actualizando solo.
set -eu

REPO="OrionTheProgrammer/TakeNotes-releases"
SITE="https://oriontheprogrammer.github.io/TakeNotes-releases"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_DIR="$DATA/TakeNotes"
APPIMAGE="$APP_DIR/TakeNotes.AppImage"
BIN_DIR="$HOME/.local/bin"
DESKTOP="$DATA/applications/takenotes.desktop"
ICON="$DATA/icons/hicolor/256x256/apps/takenotes.png"

say() { printf '%s\n' "$*"; }
fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }

download() { # download <url> <file>
  if command -v curl >/dev/null 2>&1; then curl -fL --progress-bar "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then wget -q --show-progress -O "$2" "$1"
  else fail "hace falta curl o wget para descargar Take Notes."
  fi
}

refresh_menu() {
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DATA/applications" >/dev/null 2>&1 || true
  command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t "$DATA/icons/hicolor" >/dev/null 2>&1 || true
}

if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$APPIMAGE" "$BIN_DIR/takenotes" "$DESKTOP" "$ICON"
  rmdir "$APP_DIR" 2>/dev/null || true
  refresh_menu
  say "Take Notes se desinstaló. Tus notas no se tocaron: siguen en $DATA/TakeNotes/Notes."
  exit 0
fi

[ "$(uname -s)" = "Linux" ] || fail "este instalador es para Linux. En Windows usa el instalador de $SITE"
case "$(uname -m)" in
  x86_64|amd64) ;;
  *) fail "Take Notes por ahora está disponible para equipos de 64 bits x86 (tu equipo es $(uname -m))." ;;
esac

say "Descargando Take Notes…"
mkdir -p "$APP_DIR" "$BIN_DIR" "$(dirname "$DESKTOP")" "$(dirname "$ICON")"
TMP="$(mktemp "$APP_DIR/.descarga.XXXXXX")"
trap 'rm -f "$TMP"' EXIT
download "https://github.com/$REPO/releases/latest/download/TakeNotes.AppImage" "$TMP"
chmod +x "$TMP"
mv -f "$TMP" "$APPIMAGE"
trap - EXIT

if download "$SITE/assets/icon-256.png" "$ICON.tmp" 2>/dev/null; then mv -f "$ICON.tmp" "$ICON"; else rm -f "$ICON.tmp"; fi
ln -sf "$APPIMAGE" "$BIN_DIR/takenotes"

# Without fusermount the AppImage cannot mount itself; it can still unpack and run.
EXEC="\"$APPIMAGE\" %F"
if ! command -v fusermount3 >/dev/null 2>&1 && ! command -v fusermount >/dev/null 2>&1; then
  EXEC="env APPIMAGE_EXTRACT_AND_RUN=1 \"$APPIMAGE\" %F"
fi

cat > "$DESKTOP" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Take Notes
GenericName=Notas
Comment=Un lugar tranquilo para tus ideas, tus listas y tus canciones
Exec=$EXEC
Icon=takenotes
Terminal=false
Categories=Office;TextEditor;
Keywords=notas;notes;letras;lyrics;
DESKTOP
refresh_menu

say ""
say "Take Notes quedó instalado."
say "  · Ábrelo desde el menú de aplicaciones, o escribe: takenotes"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) say "  · Para usar «takenotes» en la terminal, agrega $BIN_DIR a tu PATH." ;; esac

# The AppImage carries its own FUSE library and only needs the fusermount program. Without it,
# Take Notes still opens (it unpacks itself first), and installing fuse3 makes it start faster.
if ! command -v fusermount3 >/dev/null 2>&1 && ! command -v fusermount >/dev/null 2>&1; then
  say ""
  say "Aviso: falta fusermount (paquete fuse3). Take Notes abrirá igual, pero más lento."
  say "  Para que abra más rápido:"
  say "  Arch / CachyOS:  sudo pacman -S fuse3"
  say "  Debian / Ubuntu: sudo apt install fuse3"
  say "  Fedora:          sudo dnf install fuse3"
fi
