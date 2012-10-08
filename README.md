vnStat indicator
================

Shows network traffic in GNOME Shell.


Requirements
------------

* vnStat


Installation
------------

For per-user installation, move or copy the directory `vnstat-indicator@alex.kandru.de` to your GNOME Shell extensions folder. It should be `~/.local/share/gnome-shell/extensions/`.

For system-wide installation, move or copy the directory `vnstat-indicator@alex.kandru.de` to the global GNOME Shell extensions folder. It should be `/usr/share/gnome-shell/extensions/`.

Now you need to reload the extensions. Press `Alt`+`F2`, type `r` and press `Enter`.


Usage
-----

### Enabling

    gnome-shell-extension-tool -e vnstat-indicator@alex.kandru.de

### Disabling

    gnome-shell-extension-tool -d vnstat-indicator@alex.kandru.de
