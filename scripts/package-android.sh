#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
sdk="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_HOME="$sdk"
export ANDROID_SDK_ROOT="$sdk"
if [[ ! -x "$sdk/cmdline-tools/latest/bin/sdkmanager" ]]; then
    echo "Android SDK missing at $sdk" >&2
    exit 1
fi
cd "$root"
npx expo prebuild --platform android --no-install
printf 'sdk.dir=%s\n' "$sdk" > android/local.properties
cd android
./gradlew assembleDebug
mkdir -p "$root/release-assets"
cp app/build/outputs/apk/debug/app-debug.apk "$root/release-assets/nextube-allview.apk"
echo "Wrote $root/release-assets/nextube-allview.apk"
