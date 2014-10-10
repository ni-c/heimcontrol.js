if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'crypto', 'cookie', 'fs' ], function(crypto, cookie, fs) {

  /**
   * Helper class to concat strings
   *
   * @class StringBuffer
   * @constructor 
   */
  var StringBuffer = function() {
    this.buffer = [];
    this.index = 0;
  };

  StringBuffer.prototype = {
    /** 
     * Append a string at the end of the StringBuffer 
     * 
     * @method append
     * @param {String} s The string to append
     */
    append: function(s) {
      this.buffer[this.index++] = s;
      return this;
    },

    /**
     * Return the string representation of the StringBuffer
     * 
     * @method toString
     */
    toString: function() {
      return this.buffer.join("");
    }
  };
  
  /**
   * Route-Controller
   *
   * @class Controller
   * @constructor 
   */
  var Controller = {};

  /** 
   * Recursive function to render all plugin items to on page to show them on the startpage. 
   * 
   * @method renderPluginItems
   * @param {Object} app The express app
   * @param {String} res The type to render ('settings' or 'view')
   * @param {Integer} i The iterator for the plugins
   * @paran {String} html A string containing the already rendered plugin items
   * @param {Function} callback The callback method to execute after rendering
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {String} callback.result The rendered HTML string
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

          function render(items, meta) {
            var meta = meta || {};
            app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/' + type + '.jade', {
              items: items,
              meta: meta
            }, function(err, result) {
              if (!err) {
                html.append(result);
              } else {
                console.log(err);
              }
            });
          }

          // If the plugin has a beforeRender() method, call it
          if (plugin.beforeRender) {
            plugin.beforeRender(items, function(err, result, meta) {
              render(result, meta);
            });
          } else {
            render(items);
          }

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
   * Render the settings page
   * 
   * @method renderSettings
   * @param {Object} req The Request
   * @param {Object} res The Reponse
   * @param {Object options Additional vars for the settings view
   */
  function renderSettings(req, res, options) {
    req.app.get('db').collection('User', function(err, collection) {
       collection.find({}).toArray(function(err, users) {
         var vars = {
          title: 'Settings',
           themes: fs.readdirSync(req.app.get('theme folder')),
           users: users
         };
     
         if (options) {
           for(var key in options) {
             vars[key] = options[key];
           }
         }
     
        return res.render('settings', vars);
      });
    });
  }
  
  /** 
   * Recursive function to combine javascript and css files from the plugins
   * 
   * @method combinePluginFiles
   * @param {Object} fileList An array containing the files to combine
   * @param {String} fileList.name The name of the file to combine
   * @param {String} fileList.type The type of the file (e.g. 'js' or 'css')
   * @param {Function} callback The callback method to execute after rendering
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {String} callback.result The rendered HTML string
   * @param {Object} sb *optional* StringBuffer containing the already combined files
   */
  function combinePluginFiles(fileList, callback, sb) {
    if (!sb) {
      sb = new StringBuffer();
    }
    var file = fileList.pop();
    var filename = __dirname + '/../plugins/' + file.name + '/public/' + file.type + '/' + file.name + '.' + file.type;
    fs.readFile(filename, 'utf8', function(err, data) {
      if (!err) {
        sb.append(data);
      } else {
        console.log(err);
      }
      if (fileList.length > 0) {
        combinePluginFiles(fileList, callback, sb);
      } else {
        return callback(null, sb.toString());
      }
    });
  }

  /**
   * GET /
   * 
   * @method index
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.index = function(req, res) {
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
   * GET /api
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   * @param {Object} next Next route
   */
  Controller.api = function(req, res, next) {
    if (req.params.plugin) {
      var pluginList = [];
      req.app.get('plugins').forEach(function(plugin) {
        pluginList.push(plugin.id);
      });
      if (pluginList.indexOf(req.params.plugin) >= 0) {
        req.app.get('plugins').forEach(function(plugin) {
          if (plugin.id == req.params.plugin) {
            if (plugin.api) {
              plugin.api(req, res, next);
            } else {
              return next();
            }
          }
        });
      } else {
        return next();
      }
    } else {
      renderSettings(req, res);
    }
  };

  /**
   * GET /settings
   * 
   * @method settings
   * @param {Object} req The request
   * @param {Object} res The response
   * @param {Object} next Next route
   */
  Controller.settings = function(req, res, next) {
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
                function render(items, meta) {
                  var meta = meta || {};
                  req.app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/settings.jade', {
                    items: items,
                    meta: meta
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
                }
                // If the plugin has a beforeRender() method, call it
                if (plugin.beforeRender) {
                  plugin.beforeRender(items, function(err, result, meta) {
                    render(result, meta);
                  });
                } else {
                  render(items);
                }
              });
            });
          }
        });
      } else {
        return next();
      }
    } else {
      renderSettings(req, res);
    }
  };

  /**
   * POST /settings
   * 
   * @method saveSettings
   * @param {Object} req The request
   * @param {Object} res The response
   * @param {Object} next Next route
   */
  Controller.saveSettings = function(req, res, next) {
    if (req.params.plugin) {
      var pluginList = [];
      req.app.get('plugins').forEach(function(plugin) {
        pluginList.push(plugin.id);
      });
      if (pluginList.indexOf(req.params.plugin) >= 0) {
        req.app.get('plugins').forEach(function(plugin) {
          if (plugin.id == req.params.plugin) {
            var items = req.body.data;

            /**
             * Recursive function to save items to collections
             */
            function saveMultiple(app, collection, items, callback) {
              if ((items) && (items.length > 0)) {
                var item = items.shift();
                if (item._id) {
                  var ObjectID = app.get('mongo').ObjectID;
                  item._id = new ObjectID(item._id + '');
                }
                collection.save(item, function(err, result) {
                  if (items.length > 0) {
                    saveMultiple(app, collection, items, callback);
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
                saveMultiple(req.app, collection, items, function(err, result) {
                  req.app.get('events').emit('settings-saved');
                  collection.find({}).toArray(function(err, items) {
                    function render(items, meta) {
                      var meta = meta || {};
                      req.app.get('jade').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/settings.jade', {
                        items: items,
                        meta: meta,
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
                    }
                    // If the plugin has a beforeRender() method, call it
                    if (plugin.beforeRender) {
                      plugin.beforeRender(items, function(err, result, meta) {
                        render(result, meta);
                      });
                    } else {
                      render(items);
                    }
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
   * @method register
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.showRegister = function(req, res) {
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
   * @method doRegister
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.doRegister = function(req, res) {
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
   * @method showLogin
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.showLogin = function(req, res) {
    // If no user exists, redirect to register
    req.app.get('db').collection('User', function(err, u) {
      u.find({}).toArray(function(err, r) {
        if (r.length == 0) {
          return res.redirect('/register');
        } else {
	  var c = null;
	  if (typeof req.headers.cookie !== 'undefined') {
            c = cookie.parse(req.headers.cookie);
          }
          if ((!err) && c && c.email && c.password) {
            return Controller.doLogin(req, res);
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
   * @method doLogin
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.doLogin = function(req, res) {

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
   * POST /api/login
   * 
   * @method createAuthToken
   * @param {Object} req The request
   * @param {Object} res The response 
   */
  Controller.createAuthToken = function(req, res) {
    var email = req.body.email || '';
    var password = crypto.createHash('sha256').update(req.body.password || '').digest("hex");
    req.app.get('db').collection('User', function(err, u) {
      u.find({
        'email': email,
        'password': password
      }).toArray(function(err, r) {
        if ((err) || (r.length > 0)) {
          var token = crypto.createHash('sha256').update(r[0].email + r[0].password).digest("hex");
          req.app.get('db').collection('User', function(err, u){
            u.update({email: r[0].email},
                     { $set: {'token': token}},
                     function (err, result) {
                       if (err) {
                         console.log(err);
                       }
                     });
          });
          res.send(200, {'token': token});
        } else {
          res.send(401, {error: "Wrong credentials"});
        }
      });
    });
  };

  /**
   * GET /logout
   * 
   * @method logout
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.logout = function(req, res) {
    req.session.user = null;
    res.render('login', {
      title: 'Login',
      hide_menubar: true,
      success: 'You are now logged out.'
    });
  };

  /**
   * POST /settings/password
   * 
   * @method changePassword
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.changePassword = function(req, res) {

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
              renderSettings(req, res, {success: 'Your password has been changed.'});
            });
          }
        });
      });
    };
  };

  /**
   * POST /settings/user/create
   * 
   * @method createUser
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.createUser = function(req, res) {

    var password = crypto.createHash('sha256').update(req.body.password || '').digest("hex");
    var email = req.body.email || '';

    if(!email || !password) {
      renderSettings(req, res, {error: 'Error adding user: Check whether you have entered a valid email'});
    } else {
      req.app.get('db').collection('User', function(err, collection) {
        collection.find({email: email}).toArray(function(err, users) {
           if (users.length>0) {
            renderSettings(req, res, {error: 'Error adding user: Email already exist'});
           } else {
             collection.save({
               'email' : email,
               'password' : password
             }, function(err, result) {
               renderSettings(req, res, {success: 'The user has been created'});
             });
           }
         });
      });
    }
  };
  
  /**
   * GET /settings/user/delete/:id
   * 
   * @method deleteUser
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.deleteUser = function(req, res) {
    req.app.get('db').collection('User', function(err, users) {
      users.remove({email: req.params.email}, function(err, user){
        renderSettings(req, res, {success: 'The user has been deleted'});
      });
    });
  };
  
  /**
   * POST /settings/theme
   * 
   * @method changeTheme
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.changeTheme = function(req, res) {
    req.app.get('db').collection('Settings', function(err, s) {
      s.find({
        'key': 'theme'
      }).toArray(function(err, result) {
           var item = {};
        if (result.length == 0) {
          item.key = 'theme';
        } else {
           item = result[0];
        }
        item.value = req.body.theme || 'default';
        if (item.value=='default') {
          req.app.locals.theme = '/css/bootstrap.min.css';
        } else {
          req.app.locals.theme = '/css/themes/' + item.value;
        }
        s.save(item, function(err, result) {
          renderSettings(req, res, {success: 'The theme has been changed.'});
        });
      });
    });
  };

  /**
   * GET /js/plugins.js
   * 
   * Load the plugin javascripts into one file and returns it
   *
   * @method pluginsJs
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.pluginsJs = function(req, res) {
    var fileList = [];
    req.app.get('plugins').forEach(function(plugin) {
      fileList.push(
        {
          name: plugin.id,
          type: 'js'
        }
      );
    });
    if (fileList.length > 0) {
      combinePluginFiles(fileList, function(err, result) {
        res.charset = 'utf-8';
        res.setHeader('Content-Type', 'text/javascript');
        return res.send(200, result);
      });
    } else {
      return res.send(200, '');
    }
  };

  /**
   * GET /js/plugins.css
   * 
   * Load the plugin css into one file and returns it
   *
   * @method pluginsCss
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.pluginsCss = function(req, res) {
    var fileList = [];
    req.app.get('plugins').forEach(function(plugin) {
      fileList.push(
        {
          name: plugin.id,
          type: 'css'
        }
      );
    });
    if (fileList.length > 0) {
      combinePluginFiles(fileList, function(err, result) {
        res.charset = 'utf-8';
        res.setHeader('Content-Type', 'text/css');
        return res.send(200, result);
      });
    } else {
      return res.send(200, '');
    };
  };

  /**
   * Error 404
   *
   * @method notFound
   * @param {Object} req The request
   * @param {Object} res The response
   */
  Controller.notFound = function(req, res) {
    res.status(404).render('404', {
      title: '404 Not Found',
      hide_menubar: ((req.session) && (req.session.user))
    });
  };

  /**
   * Authorization check
   *
   * @method isAuthorized
   * @param {Object} req The request
   * @param {Object} res The response
   * @param {Object} next The next route
   */
  Controller.isAuthorized = function(req, res, next) {
     if (req.headers['authorization']) {
        req.app.get('db').collection('User', function(err, u) {
          u.find({
            token: req.headers['authorization']
          }).toArray(function(err, r) {
            if ((err) || (r.length == 0)) {
              return res.send(401, {error: "Wrong acccess token"});
            } else {
              next();
            }
          });
        });
    } else if (!req.session.user) {
      return res.redirect('/login');
    } else {
      next();
    }
  };

  var exports = Controller;

  return exports;

});
