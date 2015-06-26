if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'ds18x20' ], function(ds18x20) {

  /**
   * ds18x20 Temperature Sensor Plugin
   *
   * @class DS18X20
   * @param {Object} app The express application
   * @constructor 
   */
  var DS18X20 = function(app) {

    this.name = 'DS18X20 Temperature';
    this.collection = 'DS18X20';
    this.icon = 'icon-umbrella';

    this.app = app;
    this.id = 'ds18x20';
    this.pluginHelper = app.get('plugin helper');

    this.values = {};
    this.sensorList = [];

    this.init();
  };

  DS18X20.prototype.init = function() {
    var that = this;

    this.sensorList.forEach(function(sensor) {
      clearInterval(sensor);
    });

    this.sensorList = [];

    return this.app.get('db').collection(that.collection, function(err, collection) {
      collection.find().toArray(function(err, result) {
        if ((!err) && (result.length > 0)) {
          result.forEach(function(item) {
            function read() {
              item.value = ds18x20.get(item.input);
              that.values[item._id] = item.value;
              that.app.get('sockets').emit('ds18x20-sensor', {
                id: item._id,
                value: item.value
              });
            };

            var intervalId = setInterval(read, parseInt(item.interval)*1000);
            that.sensorList.push(intervalId);
            read();
          });
        };
      });
    });
  };

  DS18X20.prototype.beforeRender = function(items, callback) {
    var that = this;
    var deviceList = ds18x20.list();

    items.forEach(function(item) {
      if (deviceList.indexOf(item.input)==-1) {
        console.log('DS18X20 Plugin: Device "' + item.input + '" not found.');
        var i = items.indexOf(item);
        items.splice(i,1);
      }
    });

    return callback(null, items, {'devices': deviceList});
  };

  DS18X20.prototype.api = function(req, res, next) {
    if (req.method == 'GET') {
      var that = this;
      this.app.get('db').collection(this.collection, function(err, collection) {
        collection.find({}).toArray(function(err, items) {
          if (!err) {
            that.beforeRender(items, function() {
              res.send(200, items);
            });
          } else {
            res.send(500, '[]');
          }
        });
      });
    } else {
      next();
    }
  };

  var exports = DS18X20;

  return exports;
});
