#!/bin/sh
# This script was adapted from Deno's install.sh script.
#
# Copyright 2019 the Deno authors. All rights reserved. MIT license.
# TODO(everyone): Keep this script simple and easily auditable.

set -e

if ! command -v unzip >/dev/null; then
	echo "Error: unzip is required to install zCLI" 1>&2
	exit 1
fi

if [ "$OS" = "Windows_NT" ]; then
	target="windows"
else
	case $(uname -sm) in
	"Darwin x86_64") target="macos" ;;
	"Darwin arm64") target="macos-arm" ;;
	"Linux aarch64")
		echo "Error: Official zCLI builds for Linux aarch64 are not available." 1>&2
		exit 1
		;;
	*) target="linux" ;;
	esac
fi

if [ $# -eq 0 ]; then
	zcli_uri="https://github.com/jaredLunde/zcli-cli/releases/latest/download/zcli-${target}.zip"
else
	zcli_uri="https://github.com/jaredLunde/zcli-cli/releases/download/${1}/zcli-${target}.zip"
fi

zcli_install="${ZCLI_INSTALL:-$HOME/.zcli}"
bin_dir="$zcli_install/bin"
exe="$bin_dir/zcli"

if [ ! -d "$bin_dir" ]; then
	mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe.zip" "$zcli_uri"
unzip -d "$bin_dir" -o "$exe.zip"
chmod +x "$exe"
rm "$exe.zip"

echo "zCLI was installed successfully to $exe"
if command -v zcli >/dev/null; then
	echo "Run 'zcli --help' to get started"
else
	case $SHELL in
	/bin/zsh) shell_profile=".zshrc" ;;
	*) shell_profile=".bashrc" ;;
	esac
	echo "Manually add the directory to your \$HOME/$shell_profile (or similar)"
	echo "  export ZCLI_INSTALL=\"$zcli_install\""
	echo "  export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""
	echo "Run '$exe --help' to get started"
fi