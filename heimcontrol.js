/**
 * heimcontrol.js (https://ni-c.github.com/heimcontrol.js)
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
requirejs([ 'http', 'connect', 'mongodb', 'path', 'express', 'node-conf', 'socket.io', 'jade', 'cookie', 'events', './routes', './libs/PluginHelper.js' ], function(Http, Connect, Mongo, Path, Express, Conf, Socketio, Jade, Cookie, Events, Routes, PluginHelper) {

  // Load configuration
  var node_env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  var config = Conf.load(node_env);

  if (!config.port || !config.secret || !config.mongo || !config.mongo.name || !config.mongo.host || !config.mongo.port || !config.mongo.user) {
    return console.log('\u001b[31mMissing configuration file \u001b[33mconfig/' + node_env + '.json\u001b[31m. Create configuration file or start with `NODE_ENV=development node heimcontrol.js` to use another configuration file.\033[0m');
  }
  
  // Initiate express
  var app = Express();

  // Load database
  var db = new Mongo.Db(config.mongo.name, new Mongo.Server(config.mongo.host, config.mongo.port, config.mongo.user, {
    native_parser: false
  }));

  var cookieParser = Express.cookieParser(config.secret);
  var sessionStore = new Connect.middleware.session.MemoryStore();

  // MongoDB
  db.open(function(err, db) {
    if (err) {
      return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
    } else {
      var server = Http.createServer(app).listen(config.port, function() {
        console.log('\u001b[32mheimcontrol.js listening on port \u001b[33m%d\033[0m', config.port);
      });
      
      // socket.io
      var io = Socketio.listen(server);
      io.configure(function() {
        io.set('log level', 0);
        // Permission check
        io.set('authorization', function(data, callback) {
          if (data.headers.cookie) {
            var c = Cookie.parse(data.headers.cookie);
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
        app.set('events', new Events.EventEmitter());
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('jade', Jade);
        app.set('server', server);
        app.set('sockets', io.sockets);
        app.set('mongo', Mongo);
        app.set('db', db);
        app.set('config', config);
        app.set('plugin folder', __dirname + '/plugins');
        app.set('plugin helper', new PluginHelper(app));
        app.use(Express.favicon());
        app.use(Express.logger('dev'));
        app.use(Express.bodyParser());
        app.use(Express.methodOverride());
        app.use(cookieParser);
        app.use(Express.session({
          store: sessionStore,
          key: 'heimcontrol.js'
        }));
        app.use(Express.favicon(__dirname + '/public/heimcontrol.ico'));
        app.use(Express.static(Path.join(__dirname, 'public')));
        app.use(app.router);
      });

      app.get('plugin helper').getPluginList(function(err, plugins) {
        console.log('init');
        app.locals.plugins = plugins;
        app.set('plugins', plugins);
      });

      // Routes
      app.get('/register', Routes.showRegister);
      app.post('/register', Routes.doRegister);

      app.get('/login', Routes.showLogin);
      app.post('/login', Routes.doLogin);

      app.get('/', Routes.isAuthorized, Routes.index);

      app.get('/settings', Routes.isAuthorized, Routes.settings);
      app.post('/settings', Routes.isAuthorized, Routes.changePassword);

      app.get('/settings/:plugin', Routes.isAuthorized, Routes.settings, Routes.notFound);
      app.post('/settings/:plugin', Routes.isAuthorized, Routes.saveSettings, Routes.notFound);

      app.get('/logout', Routes.logout);

      app.get('/js/plugins.js', Routes.pluginsJs);
      app.get('/css/plugins.css', Routes.pluginsCss);
      
      // 404 Not found
      app.all('*', Routes.notFound);
    }
  });
});
