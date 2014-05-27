if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ './DateHelpers.js', './DateFormatHelpers.js' ], function(DateHelpers, DateFormatHelpers) {
  
  var SunriseSunsetHelpers = function(app) {
    this.app = app;
    this.dateHelper = new DateHelpers();
    this.sunriseValue = 0;
    this.sunsetValue = 1;
  }

  SunriseSunsetHelpers.prototype.isSunrise = function(){
    return this.isSunrise();
  }  

  SunriseSunsetHelpers.prototype.isSunset = function(){
    return !this.isSunrise()
  }
  
  SunriseSunsetHelpers.prototype.arduinoParams = function(actionKey){  
    arduinoParams = {};
    arduinoParams[actionKey] = { $exists: true };
    return arduinoParams;
  }

  SunriseSunsetHelpers.prototype.doAction = function(arduino, actionTime){  

    if(this.dateHelper.is(actionTime)){
      
      var actionValue = this.isSunset() ? this.sunriseValue : this.sunsetValue;
      var staticArduino = new Arduino(app);
      
      staticArduino.rcswitch({
        id: arduino._id, 
        value: actionValue
      });
    }
  }

  SunriseSunsetHelpers.prototype.eachArduino = function(actionKey, callback){ 
    this.app.get('db').collection('Arduino').find(this.arduinoParams(actionKey), function(error, arduinos){
      arduinos.each(function(err, arduino){
        if(arduino && eval("arduino." + actionKey) && eval("arduino." + actionKey).length)
          callback(arduino);
      });
    });
  }

  SunriseSunsetHelpers.prototype.currentMonthsDays = function(callback){ 
    this.app.get('db').collection('sunrise_sunset').findOne({ month: this.dateHelper.currentHumanMonth() }, function(error, data){
      callback(error, data);
    });
  }

  SunriseSunsetHelpers.prototype.actionTime = function(action, actionKey, data){ 
    return this.dateHelper.applyOffset(eval("this.dateHelper." + action + "(data.days)"), actionKey);
  }

  SunriseSunsetHelpers.prototype.eachAction = function(callback){ 

    var actions = ["sunrise", "sunset"];
    for(var i = 0; i < actions.length; i++){

      var action = actions[i];
      var actionKey = action + "Offset"

      callback(action, actionKey);
    }
  }

  SunriseSunsetHelpers.prototype.check = function(key){

    var that = this;    
    this.key = key;

    that.currentMonthsDays(function(error, data){

      that.eachAction(function(action, actionKey){
      
        that.eachArduino(actionKey, function(arduino){
      
          that.doAction(arduino, that.actionTime(action, actionKey, data));
        });
      });
    });
  }

  var exports = SunriseSunsetHelpers;

  return exports;
});