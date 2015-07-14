var request = require('request');
var parseString = require('xml2js').parseString;

function get_dm (stationid, callback) {
	request('http://www.wienerlinien.at/ogd_routing/XML_DM_REQUEST?sessionID=0&locationServerActive=1&type_dm=any&name_dm='+stationid+'&limit=20', function (error, response, body) {
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
			    output += departure.itdServingLine[0].$.symbol + ' ' + end + ' ' + departure.$.countdown + '\n';
			}
			callback(output);
	//		console.log(JSON.stringify(result.itdRequest.itdDepartureMonitorRequest[0].itdDepartureList[0].itdDeparture[0],false,2));
		    });
		});
	    });
	  }
	});
}



get_dm('60201071', function(result){
	console.log(result);
});
