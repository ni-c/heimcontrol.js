if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ './date_format_helpers.js' ], function() {
  
  var DateHelpers = function() {
    this.now = new Date();
  }

  DateHelpers.prototype.today = function() {
    return this.now;
  }

  DateHelpers.prototype.currentMonth = function() {
    return this.now.format("mm").toLowerCase();
  }

  DateHelpers.prototype.currentHumanMonth = function() {
    return this.now.format("mmm").toLowerCase();
  }

  DateHelpers.prototype.currentYear = function() {
    return this.now.format("yyyy");
  }

  DateHelpers.prototype.currentDay = function() {
    return this.now.format("dd");
  }

  DateHelpers.prototype.applyOffset = function(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  DateHelpers.prototype.is = function(date) {
    return date == this.now;
  }  

  DateHelpers.prototype.sunrise = function(days){
    return new Date(
      this.currentYear(),
      this.currentMonth(),
      this.currentDay(),
      days[this.currentDay()].sunrise.substring(0, 2),
      days[this.currentDay()].sunrise.substring(2, 4),
      0,
      0
    );
  }

  DateHelpers.prototype.sunset = function(days){
    return new Date(
      this.currentYear(),
      this.currentMonth(),
      this.currentDay(),
      days[this.currentDay()].sunset.substring(0, 2),
      days[this.currentDay()].sunset.substring(2, 4),
      0,
      0
    );
  }

  var exports = DateHelpers;

  return exports;
});