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
		// If no user exists, redirect to register
		req.app.get('db').collection('User', function(err, u) {
			u.find({}).toArray(function(err, r) {
				if(r.length == 0) {
					return res.redirect('/register');
				} else {
					parseCookies(req, function(err, result) {
						if((!err) && (result.email) && (result.password)) {
							return routes.performlogin(req, res);
						} else {
							return res.render('login', {
								title : 'Login',
								hide_menubar : true
							});
						}
					});
				}
			});
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
	 * POST /settings
	 */
	routes.changepassword = function(req, res) {

		var password = crypto.createHash('sha256').update(req.body.oldpassword || '').digest("hex");
		var newpassword = crypto.createHash('sha256').update(req.body.newpassword || '').digest("hex");
		var newpassword2 = crypto.createHash('sha256').update(req.body.repeatnewpassword || '').digest("hex");

		if(newpassword != newpassword2) {
			return res.render('settings', {
				title : 'Settings',
				error : 'New passwords did not match.'
			});
		} else {
			req.app.get('db').collection('User', function(err, u) {
				u.find({
				  'email': req.session.user.email,
					'password' : password
				}).toArray(function(err, r) {
					if(r.length == 0) {
						return res.render('settings', {
							title : 'Settings',
							error : 'Old password wrong.'
						});
					} else {
						r[0].password = newpassword;
						u.save(r[0], function(err, result) {
							return res.render('settings', {
								title : 'Settings',
								success : 'Your password has been changed.'
							});
						})
					}
				});
			});
		}
	}
	
	/**
	 * /register
	 */
	routes.register = function(req, res) {
		req.app.get('db').collection('User', function(err, u) {
			u.find({}).toArray(function(err, r) {
				if(r.length == 0) {
					return res.render('register', {
						title : "Register",
						hide_menubar : true
					});
				} else {
					return res.redirect('/');
				}
			});
		});
	}
	
	/**
	 * POST /register
	 */
	routes.performregister = function(req, res) {
		req.app.get('db').collection('User', function(err, u) {
			u.find({}).toArray(function(err, r) {
				if(r.length == 0) {
					var email = req.body.email || '';
					var password = crypto.createHash('sha256').update(req.body.password || '').digest("hex");
					var password2 = crypto.createHash('sha256').update(req.body.repeatpassword || '').digest("hex");

					if(password != password2) {
						return res.render('register', {
							title : 'Register',
							error : 'Passwords did not match.',
							hide_menubar : true
						});
					} else {
						if(email == '') {
							return res.render('register', {
								title : 'Register',
								error : 'Please enter an email address.',
								hide_menubar : true
							});
						} else {
							req.app.get('db').collection('User', function(err, u) {
								u.save({
									'email' : email,
									'password' : password
								}, function(err, result) {
									return res.render('login', {
										title : 'Login',
										success : 'Registration completed. You can now login.',
										hide_menubar : true
									});
								});
							});
						}
					}
				}
			});
		});
	}
	/**
	 * /settings
	 */
	routes.settings = function(req, res) {
		if(req.params.plugin) {
			req.app.get('plugins').forEach(function(plugin) {
				if(plugin.name == req.params.plugin) {
					plugin.instance.getSettings(req.app, function(err, result) {
						return res.render('settings-plugin', {
							content : result,
							plugin : req.params.plugin,
							title : req.params.plugin + ' Settings'
						});
					});
				}
			})
		} else {
			return res.render('settings', {
				title : "Settings"
			});
		}
	};
	return routes;

});
