var express = require('express');
var app = express();
var request = require('request');
var parseString = require('xml2js').parseString;

function get_dm (stationid, callback) {
	request('http://www.wienerlinien.at/ogd_routing/XML_DM_REQUEST?sessionID=0&locationServerActive=1&type_dm=any&name_dm='+stationid+'&limit=8', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    parseString(body, function (err,result) {
//		console.log(result.itdRequest.$.sessionID);
	//	console.log(JSON.stringify(result,false,2));
		request('http://www.wienerlinien.at/ogd_routing/XML_DM_REQUEST?sessionID='+result.itdRequest.$.sessionID+'&requestID=1&dmLineSelectionAll=1', function (error, response, body) {
		    parseString(body, function (err,result) {
			var output = '';
			for(var i = 0; i<result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture.length;i++) {
			    var departure = result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture[i];
			    var end = departure.itdServingLine[0].$.direction;
			    end = end.replace('Wien ', '');
			    output += '<div class=line><div class=num>' + departure.itdServingLine[0].$.symbol + 
				      '</div><div class=target>' + end + '</div><div class=time>' + departure.$.countdown + '</div></div>';
			}
			callback(output);
	//		console.log(JSON.stringify(result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture[0],false,2));
		    });
		});
	    });
	  }
	});
}



//get_dm('60201071', function(result){
//	console.log(result);
//});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var head ='<!DOCTYPE html> <html> <head> <meta http-equiv="refresh" content="15;"><meta charset="UTF-8"> <link href=\'http://fonts.googleapis.com/css?family=Squada+One\' rel=\'stylesheet\' type=\'text/css\'> '+
'<style> body {margin:0;} .line { font-size:3em; font-family: \'Squada One\', sans-serif; padding:0.2em; background-color:#000; color: yellow; } .num { display: inline-block; font-variant: small-caps; text-transform: lowercase; width:1.8em; font-size: 2em; } .target { display: inline-block; width:8em; vertical-align:top; } .time { display: inline-block; font-size: 2em; width:1em; text-align:right; } </style> </head> <body>'; 
var foot = '</body></html>'; 

app.get('/dm/:stationid', function (req, res) {
  get_dm(req.params.stationid, function (result) {
  	res.send(head+result+foot);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
