/**
 * heimcontrol.js (https://github.com/heimcontroljs/heimcontrol.js)
 *
 * @file heimcontrol.js
 * @brief heimcontrol.js - Homeautomation in node.js with the Raspberry PI
 * @author Willi Thiel (ni-c@ni-c.de)
 */

/**
 * RequireJS
 * @see http://requirejs.org/docs/node.html
 */
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

/**
 * Express
 * @see http://expressjs.com/guide.html
 */
requirejs([ 'http', 'connect', 'mongodb', 'path', 'express', 'node-conf', 'socket.io', 'jade', 'cookie', 'fs', './routes', './libs/PluginHelper.js' ], function(http, connect, mongo, path, express, conf, socketio, jade, cookie, fs, routes, PluginHelper) {

  // Load configuration
  var node_env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  var config = conf.load(node_env);

  if (!config.port || !config.secret || !config.mongo || !config.mongo.name || !config.mongo.host || !config.mongo.port || !config.mongo.user) {
    return console.log('\u001b[31mMissing configuration file \u001b[33mconfig/' + node_env + '.json\u001b[31m. Create configuration file or start with `NODE_ENV=development node heimcontrol.js` to use another configuration file.\033[0m');
  }

  // Initiate express
  var app = express();

  // Load database
  var db = new mongo.Db(config.mongo.name, new mongo.Server(config.mongo.host, config.mongo.port, config.mongo.user, {
    native_parser: false
  }));

  var cookieParser = express.cookieParser(config.secret);
  var sessionStore = new connect.middleware.session.MemoryStore();

  // MongoDB
  db.open(function(err, db) {
    if (err) {
      return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
    } else {
      var server = http.createServer(app).listen(config.port, function() {
        console.log('\u001b[32mheimcontrol.js listening on port \u001b[33m%d\033[0m', config.port);
      });

      // socket.io
      var io = socketio.listen(server);
      io.configure(function() {
        io.set('log level', 0);
        // Permission check
        io.set('authorization', function(data, callback) {
          if (data.headers.cookie) {
            var c = cookie.parse(data.headers.cookie);
            sessionStore.get(c['heimcontrol.js'].substring(2, 26), function(err, session) {
              if (err || !session) {
                callback('Error', false);
              } else {
                data.session = session;
                callback(null, true);
              }
            });
          } else {
            callback('Unauthorized', false);
          }
        });
      });

      // Express
      app.configure(function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('jade', jade);
        app.set('server', server);
        app.set('sockets', io.sockets);
        app.set('mongo', mongo);
        app.set('db', db);
        app.set('config', config);
        app.set('pluginHelper', new PluginHelper(app));
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(cookieParser);
        app.use(express.session({
          store: sessionStore,
          key: 'heimcontrol.js'
        }));
        app.use(express.favicon(__dirname + '/public/heimcontrol.ico'));
        app.use(express.static(path.join(__dirname, 'public')));
        app.use(app.router);
      });

      // Permission check
      var isAuthorized = function(req, res, next) {
        if (!req.session.user) {
          return res.redirect('/login');
        } else {
          next();
        }
      };
      
      // Routes
      app.get('/register', routes.showRegister);
      app.post('/register', routes.doRegister);

      app.get('/login', routes.showLogin);
      app.post('/login', routes.doLogin);

      app.get('/', isAuthorized, routes.index);

      app.get('/settings', isAuthorized, routes.settings);
      app.post('/settings', isAuthorized, routes.changePassword);

      app.get('/settings/:plugin', isAuthorized, routes.settings, routes.notFound);
      app.post('/settings/:plugin', isAuthorized, routes.saveSettings, routes.notFound);

      app.get('/logout', routes.logout);

      // Parse plugins
      var plugins = [];
      var pluginFolder = __dirname + '/plugins';
      fs.readdir(pluginFolder, function(err, files) {
        files.forEach(function(file) {
          requirejs([pluginFolder + '/' + file + '/index.js'], function(Plugin) {
            plugins.push(new Plugin(app));
          });
        });
      });
      app.set('plugins', plugins);
      app.locals.plugins = plugins;

      // Plugin JS and CSS
      app.get('/plugin/:file', function(req, res) {
        var file = req.params.file;
        if (file.indexOf('.css', file.length - 4) !== -1) {
          res.sendfile(__dirname + '/plugins/' + file.substr(0, file.length - 4) + '/public/css/' + file);
        }
        if (file.indexOf('.js', file.length - 3) !== -1) {
          res.sendfile(__dirname + '/plugins/' + file.substr(0, file.length - 3) + '/public/js/' + file);
        }
      });      
      
      // 404 Not found
      app.all('*', routes.notFound);

    }
  });
});
