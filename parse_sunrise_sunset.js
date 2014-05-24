// Months without certain days mark those times with...
var nullTime = "xxxx";

// Map a human readable month to it's index
var monthMappings = {
  "0":"jan",
  "1":"feb",
  "2":"mar",
  "3":"apr",
  "4":"may",
  "5":"jun",
  "6":"jul",
  "7":"aug",
  "8":"sep",
  "9":"oct",
  "10":"nov",
  "11":"dec"
}

// An array of documents holding sunrise sunset times
var months = {
  'jan':{},
  'feb':{},
  'mar':{},
  'apr':{},
  'may':{},
  'jun':{},
  'jul':{},
  'aug':{},
  'sep':{},
  'oct':{},
  'nov':{},
  'dec':{},
};

var monthDoc = function(month){
  return {
    "month": month,
    "days": months[month]
  };
}

// Type can be "sunrise" or "sunset"
var parseTime = function(tokens, type){
  var time = tokens[type == "sunrise" ? 0 : 1];
  return (time == nullTime) ? null : time;
}

var handleRead = function(line){

  var tokens = line.split("  ");
  var day = tokens[0];

  // Skip the first token (the day value)
  for(var j = 1; j <= tokens.length - 2; j++){

    var dayTokens = tokens[j].split(" ");

    var sunrise = parseTime(dayTokens, "sunrise");
    var sunset = parseTime(dayTokens, "sunset"); 

    if(sunrise && sunset) {
      months[monthMappings[j - 1]][day] = {
        "sunrise": sunrise,
        "sunset": sunset
      }
    }    
  }
}

var handleClose = function(db){
  db.createCollection('sunrise_sunset', function(err, data){});
  var sunrise_sunset = db.collection('sunrise_sunset');

  for (var month in months) {
    sunrise_sunset.update({"month": month}, monthDoc(month), {upsert: true}, function(err,data){});
  }
}

var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

requirejs([ 'readline', 'fs', 'connect', 'mongodb', 'path', 'express', 'node-conf', './libs/PluginHelper.js' ], function(readline, fs, Connect, Mongo, Path, Express, Conf, Events, PluginHelper) {
  Mongo.MongoClient.connect("mongodb://localhost:27017/heimcontroljs", function(errors, db) {    
    if(!errors) {

      var rd = readline.createInterface({
        input: fs.createReadStream('/home/pi/heimcontrol.js/raw_sunrise_sunset_data.txt'),
        output: process.stdout,
        terminal: false
      });    

      rd.on('line', function(line) {
        handleRead(line);
      });

      rd.on('close', function() {
        handleClose(db);
      });

    }
  });
});
