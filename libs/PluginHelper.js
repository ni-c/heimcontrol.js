if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 *  The PluginHelper provides helper function for handling plugins.
 *
 * @class PluginHelper
 * @constructor 
 */

define([], function() {

  var PluginHelper = function(app) {
    this.app = app;
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
        if ((!err) && (result.length == 1)) {
          var item = result[0];
          callback(null, item, collection);
        } else {
          callback((err) ? err : 'Item not found');
        }
      });
    });
  };

  return PluginHelper;

});
