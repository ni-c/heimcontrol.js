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
		return res.render('index');
	};
	
	return routes;
});
