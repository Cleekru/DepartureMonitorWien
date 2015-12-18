var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require('request');
var parseString = require('xml2js').parseString;

var app = express();

var config={
   httpport:3000,
   httpsport:-1
};

try {
    configfile=fs.readFileSync("config.js");
    if (configfile.length>=2)
    {
	config=JSON.parse(configfile);
    }
} catch(e) { console.log("error reading config file \"config.js\" ("+e+"). Using default config.\n"); }

if (config.httpsport>0)
{
    var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
    var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
    var credentials = {key: privateKey, cert: certificate};
}

var gh = JSON.parse(fs.readFileSync('halt.json', 'utf8'));

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

function distance (x1,y1,x2,y2) {
	//console.log(x1+' '+y1+' '+x2+' '+y2);
	return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}

//get_dm('60201071', function(result){
//	console.log(result);
//});

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/homepage.html');
});

app.get("/api/nearestStations",function(req,res){
  //res.send([{loc:{lat: 48.206759,lng: 16.393374},title: 'Home',stationid: '60201071'}]);  
     if (req.query.lat && req.query.lng) {
        gh.sort(function (a,b){
                var d1= distance(parseFloat(a.WGS84_LAT),parseFloat(a.WGS84_LON),parseFloat(req.query.lat),parseFloat(req.query.lng));
                var d2= distance(parseFloat(b.WGS84_LAT),parseFloat(b.WGS84_LON),parseFloat(req.query.lat),parseFloat(req.query.lng));
                //console.log ('It is: ' + (d1-d2));
                return d1-d2;
        });
//      res.send(JSON.stringify(gh[0]));
        var output = [];
        for(var i = 0; i<5;i++) {
            output.push({loc:{lat: parseFloat(gh[i].WGS84_LAT),lng: parseFloat(gh[i].WGS84_LON)},title: gh[i].NAME,stationid: gh[i].DIVA});
        }
        res.send(output);
 
    } else res.send('Error lat lng missing!');

});

app.get('/search', function (req, res) {
    if (req.query.q && req.query.se==1) {
  	search_dm(req.query.q, function (result) {
  		res.render('searchresult',{erg:result,st:''});
  	});
    } else if (req.query.la && req.query.lo && req.query.ac && req.query.gps==2) {
	gh.sort(function (a,b){
		var d1= distance(parseFloat(a.WGS84_LAT),parseFloat(a.WGS84_LON),parseFloat(req.query.la),parseFloat(req.query.lo));
		var d2= distance(parseFloat(b.WGS84_LAT),parseFloat(b.WGS84_LON),parseFloat(req.query.la),parseFloat(req.query.lo));
		//console.log ('It is: ' + (d1-d2));
		return d1-d2;
	});
//	res.send(JSON.stringify(gh[0]));
        var output = '';
        for(var i = 0; i<5;i++) {
            output += '<a href="dm/' + gh[i].DIVA + '">' + gh[i].NAME + '</a><br>\n';
        }
        res.render('searchresult',{erg:output,st:''});
    } else res.send('Falscher Aufruf');
});

app.get('/dm/:stationid', function (req, res) {
  get_dm(req.params.stationid, function (result,sti) {
        res.render('home',{erg:result,st:sti});
  });
});

app.use('/static', express.static('static'));


var httpServer = http.createServer(app);

httpServer.listen(config.httpport, function () {
  var host = httpServer.address().address;
  var port = httpServer.address().port;

  console.log('HTTP server listening at http://%s:%s', host, port);
});

if (config.httpsport>0)
{
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.httpsport, function () {
  	var host = httpsServer.address().address;
  	var port = httpsServer.address().port;

  	console.log('HTTPS server listening at https://%s:%s', host, port);
    });
}
