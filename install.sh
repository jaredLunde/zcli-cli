#!/bin/sh
# Copyright 2023 zCLI. All rights reserved. MIT license.
set -e

if ! command -v unzip >/dev/null; then
  echo "Error: unzip is required to install zCLI." 1>&2
  exit 1
fi

if [ "$OS" = "Windows_NT" ]; then
  target="windows"
else
  case $(uname -sm) in
  "Darwin x86_64") target="macos" ;;
  "Darwin arm64") target="macos-arm" ;;
  "Linux aarch64")
    echo "Error: Official builds for Linux aarch64 are not yet available." 1>&2
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

# Reset
Color_Off=''

# Regular Colors
Red=''
Green=''
Dim='' # White

# Bold
Bold_White=''
Bold_Green=''

if [ -t 1 ]; then
  # Reset
  Color_Off='\033[0m' # Text Reset

  # Regular Colors
  Red='\033[0;31m'   # Red
  Green='\033[0;32m' # Green
  Dim='\033[0;2m'    # White

  # Bold
  Bold_Green='\033[1;32m' # Bold Green
  Bold_White='\033[1m'    # Bold White
fi

error() {
  echo "${Red}error${Color_Off}:" "$@" >&2
  exit 1
}

info() {
  echo "${Dim}$@ ${Color_Off}"
}

info_bold() {
  echo "${Bold_White}$@ ${Color_Off}"
}

success() {
  echo "${Green}$@ ${Color_Off}"
}

tildify() {
  echo $1 | sed "s|$HOME|\~|g"
}

install_dir="${ZCLI_INSTALL:-$HOME/.zcli}"
bin_dir=$install_dir/bin
exe="$bin_dir/zcli"

tilde_bin_dir=$(tildify "$bin_dir")
quoted_install_dir=\"${install_dir}\"

if [ $quoted_install_dir = \"$HOME/* ]; then
  quoted_install_dir=${quoted_install_dir/$HOME\//\$HOME/}
fi

if [ ! -d "$bin_dir" ]; then
  mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe.zip" "$zcli_uri"
unzip -q -d "$bin_dir" -o "$exe.zip"
chmod +x "$exe"
rm "$exe.zip"

success "✨ zCLI was installed successfully to $Bold_Green$(tildify "$exe")"

refresh_command=''
shell_basename=$(basename "$SHELL")

if command -v zcli >/dev/null; then
  echo
else
  echo
  case $shell_basename in
  fish)
    fish_config=$HOME/.config/fish/config.fish
    tilde_fish_config=$(tildify "$fish_config")

    if [ -w $fish_config ]; then
      {
        echo '\n# zCLI'
        echo "set --export ZCLI_INSTALL $quoted_install_dir"
        echo "set --export PATH \$ZCLI_INSTALL/bin \$PATH"
      } >>"$fish_config"

      info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_fish_config\""

      refresh_command="source $tilde_fish_config"
    else
      echo "Manually add the directory to $tilde_fish_config (or similar):"
      info_bold "  set --export ZCLI_INSTALL $quoted_install_dir"
      info_bold "  set --export PATH \$ZCLI_INSTALL/bin \$PATH"
    fi
    ;;

  zsh)
    zsh_config=$HOME/.zshrc
    tilde_zsh_config=$(tildify "$zsh_config")

    if [ -w $zsh_config ]; then
      {
        echo '\n# zCLI'
        echo "export ZCLI_INSTALL=$quoted_install_dir" 
        echo "export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""
      } >>"$zsh_config"

      info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_zsh_config\""

      refresh_command="exec $SHELL"
    else
      echo "Manually add the directory to $tilde_zsh_config (or similar):"
      info_bold "  export ZCLI_INSTALL=$quoted_install_dir" 
      info_bold "  export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""

    fi
    ;;

  bash)
    set -- "$HOME/.bashrc" "$HOME/.bash_profile"

    if [ ${XDG_CONFIG_HOME:-} ]; then
      set -- "$@" "$XDG_CONFIG_HOME/.bash_profile" "$XDG_CONFIG_HOME/.bashrc" "$XDG_CONFIG_HOME/bashrc" "$XDG_CONFIG_HOME/bash_profile"
    fi

    set_manually=true

    for bash_config in "$@"; do
      tilde_bash_config=$(tildify "$bash_config")

      if [ -w $bash_config ]; then
        {
          echo '\n# zCLI'
          echo "export ZCLI_INSTALL=$quoted_install_dir" 
          echo "export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""
          echo "source <(zcli completion bash)"
        } >>"$bash_config"

        info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_bash_config\""

        refresh_command="source $bash_config"
        set_manually=false
        break
      fi
    done

    if [ $set_manually = true ]; then
      echo "Manually add the directory to $tilde_bash_config (or similar):"
      info_bold "  export ZCLI_INSTALL=$quoted_install_dir" 
      info_bold "  export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""
    fi
    ;;

  *)
    echo "Manually add the directory to your ~/.bashrc (or similar)"
    info_bold "  export ZCLI_INSTALL=$quoted_install_dir"
    info_bold "  export PATH=\"\$ZCLI_INSTALL/bin:\$PATH\""
    ;;
  esac
fi

case $shell_basename in
fish)
  $exe completion fish > $HOME/.config/fish/completions/zcli.fish &> /dev/null || true
  ;;
zsh)
  set -- "$HOME/.oh-my-zsh/functions" "$HOME/.oh-my-zsh/completions" "$HOME/.oh-my-zsh/cache/completions" "/usr/local/share/zsh/site-functions" "/usr/share/zsh/site-functions" "/usr/share/zsh/vendor-completions" "$HOME/.zsh"
    
  for compdir in "$@"; do
    if [ -w $compdir ]; then
    $exe completion zsh > "${compdir}/_zcli" &> /dev/null || true
      break
    fi
  done
esac

info "To get started, run:"

if [ ! -z "$refresh_command" ]
then
  info_bold "  $refresh_command"
fi

info_bold "  zcli --help"