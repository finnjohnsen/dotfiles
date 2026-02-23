(require 'package)

(setq package-archives '(("gnu" . "https://elpa.gnu.org/packages/")
                         ("melpa" . "https://melpa.org/packages/")))

(package-initialize)

(unless (file-exists-p "~/.emacs.d/elpa/archives/melpa")
  (package-refresh-contents))

(when (not (package-installed-p 'xclip)) (package-install 'xclip))
(when (not (package-installed-p 'clipetty)) (package-install 'clipetty))
(when (not (package-installed-p 'magit)) (package-install 'magit))
(when (not (package-installed-p 'yaml-mode)) (package-install 'yaml-mode))
(when (not (package-installed-p 'clojure-mode)) (package-install 'clojure-mode))
(when (not (package-installed-p 'org)) (package-install 'org))
(when (not (package-installed-p 'simple-httpd)) (package-install 'simple-httpd))

(if (fboundp 'tool-bar-mode) (tool-bar-mode -1))
(if (fboundp 'scroll-bar-mode) (scroll-bar-mode -1))
(setq inhibit-startup-message t)

(setq initial-scratch-message "")

(setq make-backup-files nil)

(line-number-mode)

(column-number-mode)

(display-line-numbers-mode)

(setq blink-matching-paren-distance nil) ; Blinking parenthesis

(setq undo-limit 100000)                       ; Increase number of undo

(defalias 'yes-or-no-p 'y-or-n-p)              ; y/n instead of yes/noh

(setq mouse-yank-at-point t)                   ; Paste at cursor position

(setq-default indent-tabs-mode nil) ;Use spaces instead of tabs

(setq tab-width 4) ; Length of tab is 4 SPC

; magit log vis ekte tidspunkt

(set-default 'magit-log-margin '(t "%Y-%m-%d %H:%M " magit-log-margin-width t 18))

(if (member "--magit" command-line-args)
    (progn 
      (magit-status "./")
      (delete-other-windows)))

(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(custom-safe-themes
   '("b23f3067e27a9940a563f1fb3bf455aabd0450cb02c3fa4ad43f75a583311216"
     default))
 '(package-selected-packages
   '(clipetty cljsbuild-mode clojure-mode magit nordic-night-theme xclip
              yaml-mode zig-mode)))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 )

(xterm-mouse-mode)

; Keybinds

(global-set-key (kbd "C-c /") 'comment-region)
(global-set-key (kbd "C-c ?") 'uncomment-region)

;; check OS type
(cond
 ((string-equal system-type "windows-nt") ; Microsoft Windows
  (progn
    (message "Microsoft Windows")))
 ((string-equal system-type "darwin") ; Mac OS X
  (progn
    (xclip-mode 1)
    (setq mac-option-key-is-meta nil)
    (setq mac-command-key-is-meta t)
    (setq mac-command-modifier 'meta)
    (setq mac-option-modifier nil)
    (message "Mac OS X")))
 ((string-match-p "WSL2\\'" operating-system-release)
  (progn
    (xclip-mode 0) ; Gets rid of error because of missing powershell. 
    (message "WSL2")))
 ((string-equal system-type "gnu/linux") ; linux
  (progn
    (xclip-mode 1)
    (message "Linux"))))

(use-package nordic-night-theme
  :ensure t
  :config
  (load-theme 'nordic-night t))

(mapc 'load (file-expand-wildcards "~/.emacs.d/package-configs/*.el"))



