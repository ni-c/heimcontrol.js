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
	 * Build index page from plugins
	 */
	function getIndexFromPlugins(app, plugins, i, content, callback) {
		plugins[i].instance.getIndex(app, function(err, result) {
			content = content + result;
			i++;
			if(i < plugins.length) {
				getIndexFromPlugins(app, plugins, i, content, callback);
			} else {
				callback(null, content);
			}
		});
	}

	/**
	 * /
	 */
	routes.index = function(req, res) {
		var content = getIndexFromPlugins(req.app, req.app.get('plugins'), 0, "", function(err, content) {
			res.render('index', {
				title : 'Home',
				content : content
			});
		});
	};
	
	/**
	 * /settings
	 */
	routes.settings = function(req, res) {
		if(req.params.plugin) {
			req.app.get('plugins').forEach(function(plugin) {
				if (plugin.name == req.params.plugin) {
					plugin.instance.getSettings(req.app, function(err, result) {
						return res.render('settings', {
							content : result,
							plugin: req.params.plugin,
							title : req.params.plugin + ' Settings'
						});
					});
				}
			})
		}
	};
	return routes;

});
