/**
 * heimcontrol.js (https://github.com/heimcontroljs/heimcontrol.js)
 *
 * @file heimcontrol.js
 * @brief Heimcontrol.js - Homeautomation in node.js
 * @author Willi Thiel (ni-c@ni-c.de)
 *
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
requirejs([ 'http', 'connect', 'mongodb', 'path', 'express', 'node-conf', 'socket.io', 'jade', 'fs', './routes' ], function(http, connect, mongo, path, express, conf, socketio, jade, fs, routes) {

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

  db.open(function(err, db) {
    if (err) {
      return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
    } else {
      var server = http.createServer(app).listen(config.port, function() {
        console.log('\u001b[32mheimcontrol.js listening on port \u001b[33m%d\033[0m', config.port);
      });

      // Socket.io
      var io = socketio.listen(server);
      io.configure(function() {
        io.set('log level', 0);
        io.set('authorization', function(data, callback) {
          if (data.headers.cookie) {
            var cookie = parseCookie(data.headers.cookie);
            sessionStore.get(cookie['connect.sid'], function(err, session) {
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

      // express
      app.configure(function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('jade', jade);
        app.set('server', server);
        app.set('sockets', io.sockets);
        app.set('mongo', mongo);
        app.set('db', db);
        app.set('config', config);
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(cookieParser);
        app.use(express.session({
          store: sessionStore,
          key: 'heimcontrol.js'
        }));
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
        app.use(express.favicon(__dirname + '/public/favicon.ico'));
      });

      app.configure('development', function() {
        app.use(express.errorHandler());
      });

      // Permission check
      is_authorized = function(req, res) {
        if (!req.session.user) {
          return res.redirect('/login');
        } else {
          next();
        }
      }

      // Routes
      app.get('/register', routes.register);
      app.post('/register', routes.performregister);

      app.get('/login', routes.login);
      app.post('/login', routes.performlogin);

      app.get('/', is_authorized, routes.index);

      app.get('/settings', is_authorized, routes.settings);
      app.post('/settings', is_authorized, routes.changepassword);

      app.get('/settings/:plugin', is_authorized, routes.settings);

      app.get('/logout', routes.logout);

      // Plugin JS and CSS
      app.get('/plugin/:file', function(req, res) {
        var file = req.params.file;
        if (file.indexOf('.css', file.length - 4) !== -1) {
          res.sendfile(__dirname + '/node_modules/heimcontrol-' + file.substr(0, file.length - 4) + '/css/' + file);
        }
        if (file.indexOf('.js', file.length - 3) !== -1) {
          res.sendfile(__dirname + '/node_modules/heimcontrol-' + file.substr(0, file.length - 3) + '/js/' + file);
        }
      });

      // Get socket.io file
      app.get('/js/socket.io.min.js', function(req, res) {
        res.sendfile(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js');
      });

      // Read plugins
      var plugins = [];
      fs.readdir(__dirname + '/node_modules', function(err, files) {
        files.forEach(function(file) {
          if (file.indexOf('heimcontrol-') == 0) {
            var plugin = {
              id: file,
              name: file.replace('heimcontrol-', '')
            }
            // Initialize
            requirejs([ plugin.id ], function(p) {
              p.init(app);
              plugin.instance = p;
              plugin.icon = p.icon;
            });
            plugins.push(plugin);
          }
        });
        app.locals.plugins = plugins;
        app.set('plugins', plugins);
      });
    }
  });
});
