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
		res.render('settings', {
			title : 'Settings'
		});
	};
	return routes;
});
