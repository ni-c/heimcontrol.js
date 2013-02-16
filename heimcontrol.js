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
	nodeRequire : require
});

/**
 * Express
 * @see http://expressjs.com/guide.html
 */
requirejs(['http', 'mongodb', 'path', 'express', 'socket.io', 'jade', 'fs', './routes'], function(http, mongo, path, express, socketio, jade, fs, routes) {
	var app = express();

	var db = new mongo.Db('heimcontroljs', new mongo.Server('127.0.0.1', 27017, {}, {
		native_parser : false
	}));

	db.open(function(err, db) {
		if(err) {
			return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
		} else {
			var server = http.createServer(app).listen(8080, function() {
				console.log('\u001b[32mheimcontrol.js listening on port \u001b[33m%d\033[0m', 8080);
			});
			var io = socketio.listen(server);
			io.set('log level', 0);

			app.configure(function() {
				app.set('views', __dirname + '/views');
				app.set('view engine', 'jade');
				app.set('jade', jade);
				app.set('server', server);
				app.set('sockets', io.sockets);
				app.set('mongo', mongo);
				app.set('db', db);
				app.use(express.favicon());
				app.use(express.logger('dev'));
				app.use(express.bodyParser());
				app.use(express.methodOverride());
				app.use(app.router);
				app.use(express.static(path.join(__dirname, 'public')));
				app.use(express.favicon(__dirname + '/public/favicon.ico'));
			});

			app.configure('development', function() {
				app.use(express.errorHandler());
			});

			app.get('/', routes.index);
			app.get('/settings', routes.settings);
			app.get('/settings/:plugin', routes.settings);

			// Plugin JS and CSS
			app.get('/plugin/:file', function(req, res) {
				var file = req.params.file;
				if(file.indexOf('.css', file.length - 4) !== -1) {
					res.sendfile(__dirname + '/node_modules/heimcontrol-' + file.substr(0, file.length - 4) + '/css/' + file);
				}
				if(file.indexOf('.js', file.length - 3) !== -1) {
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
						requirejs([plugin.id], function(p) {
							p.init(app);
							plugin.instance = p;
						});
						
		  			plugins.push(plugin);
		  		}
		  	});
		  	app.set('plugins', plugins);
		  });

		}
	});
});
