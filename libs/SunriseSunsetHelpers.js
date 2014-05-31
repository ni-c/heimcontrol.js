if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ './DateHelpers.js', './DateFormatHelpers.js' ], function(DateHelpers, DateFormatHelpers) {
  
  var SunriseSunsetHelpers = function(app) {
    this.app = app;
    this.sunriseSunsetLogger = app.get('sunriseSunsetLogger');
    this.dateHelper = new DateHelpers(app);
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

    this.sunriseSunsetLogger.info("...calculated action time = " + actionTime)

    if(this.dateHelper.is(actionTime)){
      
      this.sunriseSunsetLogger.info("...which is NOW!");

      var actionValue = this.isSunset() ? this.sunriseValue : this.sunsetValue;
      var staticArduino = new Arduino(app);
      
      staticArduino.rcswitch({
        id: arduino._id, 
        value: actionValue
      });
    }
    else
      this.sunriseSunsetLogger.info("...which is not now :(");
  }

  SunriseSunsetHelpers.prototype.eachArduino = function(actionKey, callback){ 
    var that = this;
    this.app.get('db').collection('Arduino').find(this.arduinoParams(actionKey), function(error, arduinos){
      arduinos.each(function(err, arduino){
        if(arduino && eval("arduino." + actionKey) && eval("arduino." + actionKey).length){
          that.sunriseSunsetLogger.info("Found an arduino with desc = '" + arduino.description + "' and " + actionKey + " = " + eval("arduino." + actionKey))
          callback(arduino);
        }
      });
    });
  }

  SunriseSunsetHelpers.prototype.currentMonthsDays = function(callback){ 
    this.app.get('db').collection('sunrise_sunset').findOne({ month: this.dateHelper.currentHumanMonth() }, function(error, data){
      callback(error, data);
    });
  }

  SunriseSunsetHelpers.prototype.offset = function(arduino, actionKey){
    return eval("arduino." + actionKey);
  }

  SunriseSunsetHelpers.prototype.grossActionTime = function(action, data){
    return eval("this.dateHelper." + action + "(data.days)");
  }

  SunriseSunsetHelpers.prototype.eachAction = function(callback){ 

    var actions = ["sunrise", "sunset"];
    for(var i = 0; i < actions.length; i++){

      var action = actions[i];
      var actionKey = action + "Offset"

      this.sunriseSunsetLogger.info(" >>> Processing " + action);

      callback(action, actionKey);
    }
  }

  SunriseSunsetHelpers.prototype.check = function(key){

    var that = this;    
    this.key = key;

    that.currentMonthsDays(function(error, data){

      that.sunriseSunsetLogger.info("--------------")
      that.sunriseSunsetLogger.info("Sunrise today = " + that.dateHelper.sunrise(data.days));
      that.sunriseSunsetLogger.info("Sunset today = " + that.dateHelper.sunset(data.days));

      that.eachAction(function(action, actionKey){
      
        that.eachArduino(actionKey, function(arduino){
      
          var actionTime = that.dateHelper.applyOffset(
            that.grossActionTime(action, data), 
            that.offset(arduino, actionKey)
          );

          that.doAction(arduino, actionTime);
        });
      });
    });
  }

  var exports = SunriseSunsetHelpers;

  return exports;
});