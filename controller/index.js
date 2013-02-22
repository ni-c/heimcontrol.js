/**
 * heimcontrol.js (https://github.com/heimcontroljs/heimcontroljs)
 *
 * @file controller/index.js
 * @author Willi Thiel (ni-c@ni-c.de)
 */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'crypto', 'cookie' ], function(crypto, cookie) {
  var controller = {};

  /**
   * StringBuffer object
   */
  var StringBuffer = function() {
    this.buffer = [];
    this.index = 0;
  };

  StringBuffer.prototype = {
    append: function(s) {
      this.buffer[this.index++] = s;
      return this;
    },

    toString: function() {
      return this.buffer.join("");
    }
  };

  /**
   * Recursive function to build index page from all Plugins
   * 
   * @param app The express app
   * @param plugins The plugin object
   * @param i The iterator
   * @param content The StringBuffer containing the content that has been already rendered 
   * @param callback The callback to call after the iteration of all plugins
   */
  function getIndexFromPlugins(app, plugins, i, content, callback) {
    plugins[i].instance.getIndex(app, function(err, result) {
      content.append(result);
      if (i < plugins.length) {
        getIndexFromPlugins(app, plugins, ++i, content, callback);
      } else {
        callback(null, content);
      }
    });
  }

  /**
   * GET /
   * 
   * @param req The request
   * @param res The response
   */
  controller.index = function(req, res) {
    var content = StringBuffer();
    getIndexFromPlugins(req.app, req.app.get('plugins'), 0, content, function(err, content) {
      res.render('index', {
        title: 'Home',
        content: content.toString()
      });
    });
  };

  /**
   * GET /login
   * 
   * @param req The request
   * @param res The response
   */
  controller.login = function(req, res) {
    // If no user exists, redirect to register
    req.app.get('db').collection('User', function(err, u) {
      u.find({}).toArray(function(err, r) {
        if (r.length == 0) {
          return res.redirect('/register');
        } else {
          var c = cookie.parse(req.headers.cookie);
          if ((!err) && (c.email) && (c.password)) {
            return controller.performlogin(req, res);
          } else {
            return res.render('login', {
              title: 'Login',
              hide_menubar: true
            });
          }
        }
      });
    });
  };

  /**
   * GET /logout
   * 
   * @param req The request
   * @param res The response
   */
  controller.logout = function(req, res) {
    req.session.user = null;
    res.render('login', {
      title: 'Login',
      hide_menubar: true,
      success: 'You are now logged out.'
    });
  };

  /**
   * POST /login
   * 
   * @param req The request
   * @param res The response
   */
  controller.performlogin = function(req, res) {

    var c = cookie.parse(req.headers.cookie);
    var email = req.body.email || c.email || '';
    var password = crypto.createHash('sha256').update(req.body.password || c.password || '').digest("hex");

    req.app.get('db').collection('User', function(err, u) {
      u.find({
        'email': email,
        'password': password
      }).toArray(function(err, r) {
        if (r.length == 0) {
          return res.render('login', {
            title: 'Login',
            error: 'Login failed, wrong email/password combination.',
            hide_menubar: true
          });
        } else {
          req.session.user = r[0];
          return res.redirect('/');
        }
      });
    });
  };

  /**
   * POST /settings
   * 
   * @param req The request
   * @param res The response
   */
  controller.changepassword = function(req, res) {

    var password = crypto.createHash('sha256').update(req.body.oldpassword || '').digest("hex");
    var newpassword = crypto.createHash('sha256').update(req.body.newpassword || '').digest("hex");
    var newpassword2 = crypto.createHash('sha256').update(req.body.repeatnewpassword || '').digest("hex");

    if (newpassword != newpassword2) {
      return res.render('settings', {
        title: 'Settings',
        error: 'New passwords did not match.'
      });
    } else {
      req.app.get('db').collection('User', function(err, u) {
        u.find({
          'email': req.session.user.email,
          'password': password
        }).toArray(function(err, r) {
          if (r.length == 0) {
            return res.render('settings', {
              title: 'Settings',
              error: 'Old password wrong.'
            });
          } else {
            r[0].password = newpassword;
            u.save(r[0], function(err, result) {
              return res.render('settings', {
                title: 'Settings',
                success: 'Your password has been changed.'
              });
            });
          }
        });
      });
    }
  };

  /**
   * GET /register
   * 
   * @param req The request
   * @param res The response
   */
  controller.register = function(req, res) {
    req.app.get('db').collection('User', function(err, u) {
      u.find({}).toArray(function(err, r) {
        if (r.length == 0) {
          return res.render('register', {
            title: "Register",
            hide_menubar: true
          });
        } else {
          return res.redirect('/');
        }
      });
    });
  };

  /**
   * POST /register
   * 
   * @param req The request
   * @param res The response
   */
  controller.performregister = function(req, res) {
    req.app.get('db').collection('User', function(err, u) {
      u.find({}).toArray(function(err, r) {
        if (r.length == 0) {
          var email = req.body.email || '';
          var password = crypto.createHash('sha256').update(req.body.password || '').digest("hex");
          var password2 = crypto.createHash('sha256').update(req.body.repeatpassword || '').digest("hex");

          if (password != password2) {
            return res.render('register', {
              title: 'Register',
              error: 'Passwords did not match.',
              hide_menubar: true
            });
          } else {
            if (email == '') {
              return res.render('register', {
                title: 'Register',
                error: 'Please enter an email address.',
                hide_menubar: true
              });
            } else {
              req.app.get('db').collection('User', function(err, u) {
                u.save({
                  'email': email,
                  'password': password
                }, function(err, result) {
                  return res.render('login', {
                    title: 'Login',
                    success: 'Registration completed. You can now login.',
                    hide_menubar: true
                  });
                });
              });
            }
          }
        }
      });
    });
  };

  /**
   * GET /settings
   * 
   * @param req The request
   * @param res The response
   */
  controller.settings = function(req, res, next) {
    if (req.params.plugin) {
      if (req.app.get('plugin_names').indexOf(req.params.plugin) >= 0) {
        req.app.get('plugins').forEach(function(plugin) {
          if (plugin.name == req.params.plugin) {
            plugin.instance.getSettings(req.app, function(err, result) {
              return res.render('settings-plugin', {
                content: result,
                plugin: req.params.plugin,
                title: req.params.plugin + ' Settings'
              });
            });
          }
        });
      } else {
        return next();
      }
    } else {
      return res.render('settings', {
        title: "Settings"
      });
    }
  };

  /**
   * Error 404
   * 
   * @param req The request
   * @param res The response
   */
  controller.notfound = function(req, res) {
    res.status(404).render('404', {
      title: '404 Not Found',
      hide_menubar: req.session.user
    });
  };

  return controller;

});
