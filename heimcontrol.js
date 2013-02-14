/**
 * heimcontrol.js (https://github.com/ni-c/heimcontrol.js)
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
requirejs(['http', 'path', 'express', 'socket.io', './routes', './plugins/wakeonlan'], function(http, path, express, socketio, routes, wakeonlan) {
	var app = express();
	
	var server = http.createServer(app).listen(80, function() {
		console.log('\u001b[32mheimcontrol.js listening on port \u001b[33m%d\033[0m', 80);
	});
	
	var io = socketio.listen(server);

	app.configure(function() {
		app.set('views', __dirname + '/views');
		app.set('view engine', 'jade');
		app.set('server', server);
		app.set('sockets', io.sockets);
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

	app.get('/js/socket.io.min.js', function(req, res) {
		res.sendfile(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js');
	});
	
	
	console.log(wakeonlan);
	
	wakeonlan.init(app);
	
});
