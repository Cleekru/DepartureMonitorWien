var express = require('express');
var app = express();
var request = require('request');
var parseString = require('xml2js').parseString;


function get_dm (stationid, callback) {
	request('http://www.wienerlinien.at/ogd_routing/XML_DM_REQUEST?sessionID=0&locationServerActive=1&type_dm=any&name_dm='+stationid+'&limit=8', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    parseString(body, function (err,result) {
//		console.log(result.itdRequest.$.sessionID);
//		console.log(JSON.stringify(result,false,2));
		if (!result.itdRequest || !result.itdRequest.$.sessionID) { callback("API Error 1"); return; }
		if (!result.itdRequest.itdDepartureMonitorRequest[0].itdServingLines) { callback("Unbekannte Station"); return; }
		if (result.itdRequest.itdDepartureMonitorRequest[0].itdServingLines[0]=="") { callback("Keine Linien an dieser Station gefunden"); return; }
		var stid = result.itdRequest.itdDepartureMonitorRequest[0].itdOdv[0].itdOdvName[0].odvNameElem[0]._;
		request('http://www.wienerlinien.at/ogd_routing/XML_DM_REQUEST?sessionID='+result.itdRequest.$.sessionID+'&requestID=1&dmLineSelectionAll=1', function (error, response, body) {
		    if (!error && response.statusCode == 200) {
  			    parseString(body, function (err,result) {
				var output = '';
				if (!result.itdRequest || !result.itdRequest.itdDepartureMonitorRequest || !result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList ||
				    !result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture) { callback('error'); return; }
				for(var i = 0; i<result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture.length;i++) {
				    var departure = result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture[i];
				    var end = departure.itdServingLine[0].$.direction;
				    end = end.replace('Wien ', '');
				    output += '<div class=line><div class=num>' + departure.itdServingLine[0].$.symbol + 
					      '</div><div class=target>' + end + '</div><div class=time>' + departure.$.countdown + '</div></div>';
				}
				callback(output,stid);
// 				console.log(JSON.stringify(result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture[0],false,2));
		    	});
		     } else callback('Server nicht erreichbar. Bitte später probieren.');
		});
	    });
	  } else callback('Server nicht erreichbar. Bitte später probieren.');
	});
}

function search_dm (q, callback) {
        request('http://www.wienerlinien.at/ogd_routing/XML_STOPFINDER_REQUEST?locationServerActive=1&outputFormat=JSON&type_sf=stop&name_sf=' + q, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var output = '';
			result = JSON.parse(body);
			if (result.stopFinder.length == 0) output = 'Keine oder zu viele Suchergebnisse';
                       	for(var i = 0; i<result.stopFinder.length;i++) {
				var station = result.stopFinder[i];
				output += '<a href="dm/' + station.ref.id + '">' + station.name + '</a><br>\n';
                       	}
                       	callback(output);
		} else callback('Server nicht erreichbar. Bitte später probieren.');
	});	
}

//get_dm('60201071', function(result){
//	console.log(result);
//});

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/homepage.html');
});


app.get('/search', function (req, res) {
  search_dm(req.query.q, function (result) {
  	res.render('home',{erg:result,st:''});
  });
});

app.get('/dm/:stationid', function (req, res) {
  get_dm(req.params.stationid, function (result,sti) {
        res.render('home',{erg:result,st:sti});
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
