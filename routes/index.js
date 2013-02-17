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

define(['crypto'], function(crypto) {
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
		// Login check
		if(!req.session.user) {
			return res.redirect('/login');
		}

		var content = getIndexFromPlugins(req.app, req.app.get('plugins'), 0, "", function(err, content) {
			res.render('index', {
				title : 'Home',
				content : content
			});
		});
	};
	
	/**
	 * /login
	 */
	routes.login = function(req, res) {
		res.render('login', {
			title : 'Login',
			hide_menubar : true
		});
	};
	
	/**
	 * /login
	 */
	routes.logout = function(req, res) {
		req.session.user = null;
		res.render('login', {
			title : 'Login',
			hide_menubar : true,
			success: 'You are now logged out.'
		});
	};
	
	/**
	 * POST /login
	 */
	routes.performlogin = function(req, res) {
		var email = req.body.email || '';
		var password = crypto.createHash('sha256').update(req.body.password || '').digest("hex");
		req.app.get('db').collection('User', function(err, u) {
			u.find({
				'email' : email,
				'password' : password
			}).toArray(function(err, r) {
				if (r.length==0) {
					return res.render('login', {
						title : 'Login',
						error: 'Login failed, wrong email/password combination.',
						hide_menubar : true
					});
				} else {
					req.session.user = r[0];
					return res.redirect('/');
				}
			});
		});
	}
	
	/**
	 * /settings
	 */
	routes.settings = function(req, res) {
		// Login check
		if(!req.session.user) {
			return res.redirect('/login');
		}

		if(req.params.plugin) {
			req.app.get('plugins').forEach(function(plugin) {
				if(plugin.name == req.params.plugin) {
					plugin.instance.getSettings(req.app, function(err, result) {
						return res.render('settings', {
							content : result,
							plugin : req.params.plugin,
							title : req.params.plugin + ' Settings'
						});
					});
				}
			})
		}
	};
	return routes;

});
