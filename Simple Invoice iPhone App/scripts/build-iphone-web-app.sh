#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

node "$SCRIPT_DIR/build-iphone-web-app.mjs"
/usr/bin/swift "$SCRIPT_DIR/make-icons.swift" "$PACKAGE_DIR/app/icons"

NATIVE_DIR="$PACKAGE_DIR/native-ios/SimpleInvoiceiPhone"
if [[ -d "$NATIVE_DIR" ]]; then
  rm -rf "$NATIVE_DIR/App"
  mkdir -p "$NATIVE_DIR/App"
  cp -R "$PACKAGE_DIR/app/." "$NATIVE_DIR/App/"

  ASSET_DIR="$NATIVE_DIR/Assets.xcassets/AppIcon.appiconset"
  BASE_ICON="$PACKAGE_DIR/app/icons/icon-1024.png"

  make_native_icon() {
    local output="$1"
    local pixels="$2"
    /usr/bin/sips -z "$pixels" "$pixels" "$BASE_ICON" --out "$ASSET_DIR/$output" >/dev/null
  }

  make_native_icon "Icon-20@2x.png" 40
  make_native_icon "Icon-20@3x.png" 60
  make_native_icon "Icon-29@2x.png" 58
  make_native_icon "Icon-29@3x.png" 87
  make_native_icon "Icon-40@2x.png" 80
  make_native_icon "Icon-40@3x.png" 120
  make_native_icon "Icon-60@2x.png" 120
  make_native_icon "Icon-60@3x.png" 180
  cp "$BASE_ICON" "$ASSET_DIR/Icon-1024.png"
fi

echo "Built $PACKAGE_DIR/app"
