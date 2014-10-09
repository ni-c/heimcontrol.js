if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 *  The PluginHelper provides helper function for handling plugins.
 *
 * @class PluginHelper
 * @constructor 
 */
define([ 'fs' ], function( fs ) {

  var PluginHelper = function(app) {
    this.app = app;
    this.pluginFolder = app.get('plugin folder');
  };

  /**
   * Gets the plugin item from the database
   * 
   * @method findItem
   * @param {String} plugin The id of the plugin
   * @param {String} id The id of the item to find
   * @param {Function} callback The callback function to execute after find
   */
  PluginHelper.prototype.findItem = function(plugin, id, callback) {
    var ObjectID = this.app.get('mongo').ObjectID;
    this.app.get('db').collection(plugin, function(err, collection) {
      collection.find({
        _id: new ObjectID(id + '')
      }).toArray(function(err, result) {
        if ((!err) && (result.length != 0)) {
          var item = result[0];
          callback(null, item, collection);
        } else {
          callback((err) ? err : 'Item not found (ID: "' + id + '")');
        }
      });
    });
  };

  /**
   * Parse all plugins into an array
   * 
   * @method getPluginList
   * @param {Function} callback The callback method to execute after parsing
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result An array containing the plugins
   */
  PluginHelper.prototype.getPluginList = function(callback) {
    var pluginList = [];
    var that = this;
    var files = fs.readdirSync(that.pluginFolder);
    var requirejs = require('requirejs');

    function requireRecursive(files) {
      var file = files.shift(); // results in alphabetical order
      requirejs([that.pluginFolder + '/' + file + '/index.js'], function(Plugin) {
        pluginList.push(new Plugin(that.app));
        if (files.length>0) {
          requireRecursive(files);
        } else {
          return callback(null, pluginList);
        }
      });
    }

    requireRecursive(files);
  };

  var exports = PluginHelper;

  return exports;

});
