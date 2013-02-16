/**
 * heimcontrol.js (https://github.com/heimcontroljs/heimcontroljs)
 *
 * @file routes/index.js
 * @brief heimcontrol.js
 * @author Willi Thiel (ni-c@ni-c.de)
 *
 */

if( typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(function() {
	var routes = {};

	/**
	 * /
	 */
	routes.index = function(req, res) {
		res.render('index', {
			title : 'Home'
		});
	};
	/**
	 * /settings
	 */
	routes.settings = function(req, res) {
		if (req.params.plugin) {
			res.render('settings-plugin', {
				plugin: req.params.plugin,
				title : 'Settings'
			});
		} else {
			res.render('settings', {
				plugins: req.app.get('plugins'),
				title : 'Settings'
			});
		}
	};
	return routes;
});
