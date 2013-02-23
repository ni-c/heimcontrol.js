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
   * Render the plugin items
   */
  function renderPluginItems(app, type, i, html, callback) {
    var plugins = app.get('plugins');
    var plugin = plugins[i];
    app.get('db').collection(plugin.collection, function(err, collection) {
      if (err) {
        return callback(err);
      }
      collection.find({}).toArray(function(err, items) {
        if (err) {
          return callback(err);
        }
        if (items.length > 0) {
          app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/' + type + '.jade', {
            items: items
          }, function(err, result) {
            if (!err) {
              html.append(result);
            } else {
              console.log(err);
            }
          });
        }
        if (++i < plugins.length) {
          renderPluginItems(app, type, i, html, callback);
        } else {
          return callback(null, html);
        }
      });
    });
  }

  /**
   * GET /
   * 
   * @param req The request
   * @param res The response
   */
  controller.index = function(req, res) {
    var html = new StringBuffer();
    renderPluginItems(req.app, 'item', 0, html, function(err, html) {
      if (!err) {
        return res.render('index', {
          title: 'Home',
          content: html.toString()
        });
      } else {
        return res.render(500, '500');
      }
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
      var pluginList = [];
      req.app.get('plugins').forEach(function(plugin) {
        pluginList.push(plugin.id);
      });
      if (pluginList.indexOf(req.params.plugin) >= 0) {
        req.app.get('plugins').forEach(function(plugin) {
          if (plugin.id == req.params.plugin) {
            req.app.get('db').collection(plugin.collection, function(err, collection) {
              collection.find({}).toArray(function(err, items) {
                req.app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/settings.jade', {
                  items: items
                }, function(err, html) {
                  if (!err) {
                    return res.render('plugin-settings', {
                      content: html,
                      plugin: plugin.id,
                      title: plugin.name + ' Settings'
                    });
                  } else {
                    console.log(err);
                    return res.render(500, '500', {
                      title: '500 Internal Server Error'
                    });
                  }
                });
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
   * POST /settings
   * 
   * @param req The request
   * @param res The response
   */
  controller.saveSettings = function(req, res, next) {
    if (req.params.plugin) {
      var pluginList = [];
      req.app.get('plugins').forEach(function(plugin) {
        pluginList.push(plugin.id);
      });
      if (pluginList.indexOf(req.params.plugin) >= 0) {
        req.app.get('plugins').forEach(function(plugin) {
          if (plugin.id == req.params.plugin) {
            var items = [];
            for (key in req.body.data) {
              var i = 0;
              req.body.data[key].forEach(function(e) {
                if (!items[i]) {
                  items[i] = {};
                }
                if (key == '_id') {
                  var ObjectID = req.app.get('mongo').ObjectID;
                  items[i][key] = new ObjectID(e);
                } else {
                  items[i][key] = e;
                }
                i++;
              });
            }

            /**
             * Recursive function to save items to collections
             */
            function saveMultiple(collection, items, callback) {
              if (items.length) {
                collection.save(items.shift(), function(err, result) {
                  if (items.length > 0) {
                    saveMultiple(collection, items, callback);
                  } else {
                    callback(null, true);
                  }
                });
              } else {
                callback(null, true);
              }
            }

            // TODO: Each plugin should have a "validate()" method to check if the items-data is valid

            req.app.get('db').collection(plugin.collection, function(err, collection) {
              collection.remove({}, function(err, result) {
                saveMultiple(collection, items, function(err, result) {
                  collection.find({}).toArray(function(err, items) {
                    req.app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/settings.jade', {
                      items: items,
                      success: 'Settings have been updated'
                    }, function(err, html) {
                      if (!err) {
                        return res.render('plugin-settings', {
                          content: html,
                          plugin: plugin.id,
                          title: plugin.name + ' Settings'
                        });
                      } else {
                        console.log(err);
                        return res.render(500, '500', {
                          title: '500 Internal Server Error'
                        });
                      }
                    });
                  });
                });
              });
            });
          }
        });
      } else {
        return next();
      }
    } else {
      return next();
    }
  };

  /**
   * GET /register
   * 
   * @param req The request
   * @param res The response
   */
  controller.showRegister = function(req, res) {
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
  controller.doRegister = function(req, res) {
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
   * GET /login
   * 
   * @param req The request
   * @param res The response
   */
  controller.showLogin = function(req, res) {
    // If no user exists, redirect to register
    req.app.get('db').collection('User', function(err, u) {
      u.find({}).toArray(function(err, r) {
        if (r.length == 0) {
          return res.redirect('/register');
        } else {
          var c = cookie.parse(req.headers.cookie);
          if ((!err) && (c.email) && (c.password)) {
            return controller.doLogin(req, res);
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
   * POST /login
   * 
   * @param req The request
   * @param res The response
   */
  controller.doLogin = function(req, res) {

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
   * POST /settings
   * 
   * @param req The request
   * @param res The response
   */
  controller.changePassword = function(req, res) {

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
   * Error 404
   * 
   * @param req The request
   * @param res The response
   */
  controller.notFound = function(req, res) {
    res.status(404).render('404', {
      title: '404 Not Found',
      hide_menubar: req.session.user
    });
  };

  return controller;

});
