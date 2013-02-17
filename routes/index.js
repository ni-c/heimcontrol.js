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
	 * Parse cookies in header
	 */
	function parseCookies(req, callback) {
		var cookies = {};
		if(req.headers.cookie) {
			req.headers.cookie.split(';').forEach(function(cookie) {
				var parts = cookie.split('=');
				cookies[parts[0].trim()] = decodeURIComponent((parts[1] || '' ).trim());
			});
			callback(false, cookies);
		} else {
			callback(true, {});
		}
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
		
		parseCookies(req, function(err, result) {
			if ((!err) && (result.email) && (result.password)) {
				return routes.performlogin(req, res);
			} else {
				return res.render('login', {
					title : 'Login',
					hide_menubar : true
				});
			}
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
			success : 'You are now logged out.'
		});
	};
	
	/**
	 * POST /login
	 */
	routes.performlogin = function(req, res) {
		
		parseCookies(req, function(err, cookies) {
			var email = req.body.email || cookies.email || '';
			var password = crypto.createHash('sha256').update(req.body.password || cookies.password || '').digest("hex");
			
			req.app.get('db').collection('User', function(err, u) {
				u.find({
					'email' : email,
					'password' : password
				}).toArray(function(err, r) {
					if(r.length == 0) {
						return res.render('login', {
							title : 'Login',
							error : 'Login failed, wrong email/password combination.',
							hide_menubar : true
						});
					} else {
						req.session.user = r[0];
						return res.redirect('/');
					}
				});
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
