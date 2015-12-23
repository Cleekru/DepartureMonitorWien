var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require('request');

// access log module
var morgan = require('morgan');

// module for fuzzy string match 
var clj_fuzzy = require('clj-fuzzy');

var app = express();

// open a logfile in append mode
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})
// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

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
var steige = JSON.parse(fs.readFileSync('steige.json', 'utf8'));


function get_dm (stationid, callback) {
	var rbllist = '';
        for (var i = 0; i<steige.length; i++) {
                if (steige[i].FK_HALTESTELLEN_ID == stationid && parseInt(steige[i].RBL_NUMMER)>0) {
                        rbllist += 'rbl=' + steige[i].RBL_NUMMER + '&';
                }
        }
	if (rbllist == '') {
		callback('Haltestelle ohne Bahnsteige!');
		return;
	}
	var output = [];
	request('http://www.wienerlinien.at/ogd_realtime/monitor?' + rbllist + 'sender=' + config.apikey, function (error, response, body) {
	  	if (!error && response.statusCode == 200) {
			var pody = JSON.parse(body); 
			if (!pody.data.monitors[0]) { callback('Station nicht gefunden!'); return; }
               		var stid = pody.data.monitors[0].locationStop.properties.title;
			for (var i=0; i<pody.data.monitors.length; i++){
				for (var i1=0; i1<pody.data.monitors[i].lines.length; i1++) {
					for (var i2=0; i2<pody.data.monitors[i].lines[i1].departures.departure.length && i2<2; i2++) {
						output.push({countdown:parseInt(pody.data.monitors[i].lines[i1].departures.departure[i2].departureTime.countdown),
							     line:'<div class=line><div class=num>' + pody.data.monitors[i].lines[i1].name + '</div><div class=target>'
							  	  + pody.data.monitors[i].lines[i1].towards + '</div><dic class=time>'
							  	  + pody.data.monitors[i].lines[i1].departures.departure[i2].departureTime.countdown + '</div></div>'
						});
					}
				}
			}
			output.sort(function (a,b){
				return a.countdown-b.countdown;
			});
			var outputstring = '';
			for (var i = 0; i<output.length; i++) {
				outputstring += output[i].line;
			}
			callback(outputstring,stid);
		} else callback('Server nicht erreichbar. Bitte später probieren.');
	});
}

function search_dm (q, callback) {
	var output = '';
	for (var i=0; i<gh.length; i++) gh[i].sort_distance=clj_fuzzy.metrics.dice(q,gh[i].NAME);
	gh.sort(function(a,b) {
		var d1=a.sort_distance;
		var d2=b.sort_distance;
		return d2-d1;
	});
	for (var i = 0; i<20; i++) {
		output += '<a href="dm/' + gh[i].HALTESTELLEN_ID + '">' + gh[i].NAME + '</a><br>\n';
	}
	if (output=='') callback('Server nicht erreichbar. Bitte später probieren.');
	else callback(output);
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

app.get("/api/recStations",function(req,res){
	var output = [];
	if (req.query.east && req.query.north && req.query.south && req.query.west) {
		for (var i = 0; i<gh.length; i++) {
			if (gh[i].WGS84_LAT < req.query.north && gh[i].WGS84_LAT > req.query.south && gh[i].WGS84_LON < req.query.east && gh[i].WGS84_LON > req.query.west) 
			            output.push({loc:{lat: parseFloat(gh[i].WGS84_LAT),lng: parseFloat(gh[i].WGS84_LON)},title: gh[i].NAME,stationid: gh[i].HALTESTELLEN_ID});
		}
        	res.send(output);
	} else res.send('Error! Rec not defiend!');
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
            output.push({loc:{lat: parseFloat(gh[i].WGS84_LAT),lng: parseFloat(gh[i].WGS84_LON)},title: gh[i].NAME,stationid: gh[i].HALTESTELLEN_ID});
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
            output += '<a href="dm/' + gh[i].HALTESTELLEN_ID + '">' + gh[i].NAME + '</a><br>\n';
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
