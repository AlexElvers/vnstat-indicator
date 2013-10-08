/*
 * vnStat indicator: Shows current network traffic.
 *
 * Copyright (C) 2012 Alexander Elvers
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Signals = imports.signals;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Config = imports.misc.config;

const CONFIG_FILE = GLib.get_user_config_dir() + '/vnstat-indicator.conf';

let vnstat, box;

function Vnstat() {
	this._init.apply(this, arguments);
}
Vnstat.prototype = {
	_init: function(device) {
		this.button = new PanelMenu.Button(0.0);
		this.button_label = new St.Label({ text: 'no data' });
		this.button.actor.add_actor(this.button_label);

		this.scan_devices();

		for (let d in this.devices) {
			let menu_item = new PopupMenu.PopupBaseMenuItem(null, {reactive: true});
			let val_label = new St.Label({ text: d });
			menu_item.id = d;
			menu_item.actor.add_child(val_label);
			menu_item.connect('activate', Lang.bind(this, function(item) {
				this.devices[this.device].setOrnament(false);
				this.device = item.id;
				this.devices[this.device].setOrnament(true);
				this.check_traffic();

				GLib.file_set_contents(CONFIG_FILE, item.id);
			}));
			this.button.menu.addMenuItem(menu_item);
			this.devices[d] = menu_item;
		}

		if (device in this.devices) {
			this.devices[device].setOrnament(true);
			this.device = device;
		}
		else if (Object.keys(this.devices).length) {
			this.device = Object.keys(this.devices)[0];
			this.devices[this.device].setOrnament(true);;
		}
		else {
			this.device = null;
		}

		this.check_traffic();

		this.timeout = Mainloop.timeout_add(10000, Lang.bind(this, this.check_traffic));
	},

	scan_devices: function() {
		this.devices = {};

		let out = String(GLib.spawn_command_line_sync('vnstat')[1]);
		let lines = out.split('\n');

		let regex = /^\s*([a-zA-Z0-9]+)( \[disabled\])?:/;

		for (let i in lines) {
			let match = regex.exec(lines[i]);

			if (match !== null) {
				this.devices[match[1]] = null;
			}
		}
	},

	check_traffic: function() {
		if (this.device === null) {
			return false;
		}

		let out = String(GLib.spawn_command_line_sync('vnstat -i ' + this.device + ' -s')[1]);
		let lines = out.split('\n');

		let regex = /^\s*today\s*[^\/]+\s*\/s*[^\/]+\s*\/\s*([^\/]+?)\s*\//;

		for (let i in lines) {
			let match = regex.exec(lines[i]);

			if (match !== null) {
				this.button_label.text = match[1];
				return true;
			}
		}
		this.button_label.text = 'no data';
		return true;
	},
};
Signals.addSignalMethods(Vnstat.prototype);

function init() {
}

function enable() {
	let device;
	let file = Gio.file_new_for_path(CONFIG_FILE);
	if (file.query_exists(null)) {
		device = GLib.file_get_contents(CONFIG_FILE)[1];
	}
	else {
		device = null;
	}
	vnstat = new Vnstat(device);
	Main.panel.addToStatusArea("vnstat-indicator", vnstat.button, 0, "right");
	Main.panel.menuManager.addMenu(vnstat.button.menu);
}

function disable() {
	Main.panel._rightBox.remove_actor(vnstat.button.actor);
	Main.panel.menuManager.removeMenu(vnstat.button.menu);
	vnstat.button.actor.destroy();
	vnstat.button.destroy();
	vnstat = null;
}
