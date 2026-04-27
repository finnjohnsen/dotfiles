
update:
	stow .
	if [ -d "/mnt/c/Users/finn" ]; then make update-wsl; fi

update-wsl:
	cp .config/opencode/opencode.json /mnt/c/Users/finn/.config/opencode/
#	cp -rf .emacs.d/* /mnt/c/Users/finn/AppData/Roaming/.emacs.d/

purge:
	stow -D .

u: update

run: u
