alias emacs="emacs -nw $@"
alias magit="emacs -nw --magit"
export EDITOR="emacs -nw"
export VISUAL="emacs"
 
PATH=$PATH:$HOME/bin
PATH=$PATH:$HOME/miniforge/bin
PATH=$PATH:$HOME/.local/bin
export PATH=~/.opencode/bin:$PATH
 
if [[ $(uname) == "Darwin" ]]; then
   export PATH=$PATH:/opt/homebrew/bin
fi
 
export ZSH="$HOME/.oh-my-zsh"
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="bira"
plugins=(git)
source $ZSH/oh-my-zsh.sh
# source $HOME/.local/bin/env
alias zshconfig="emacs ~/.zshrc &"
alias ohmyzsh="emacs ~/.oh-my-zsh &"
alias alaconfig="emacs ~/.config/alacritty/alacritty.yml &"
alias icat="kitty +kitten icat"

. "$HOME/.local/bin/env"
