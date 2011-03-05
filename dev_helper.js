
/*

Run this with node and it will mock responses from the live environment.

Just set up something to use it as a reverse proxy on <path>/ts/

*/

var http = require('http'),
    urllib = require('url');

http.createServer(function (req, res) {
    
    var respond = function (s) {
	res.writeHead(200);
	res.write(s);
	res.end();
    }

    var query = urllib.parse(req.url);

    if (query.pathname == '/ts/login') {
	respond(JSON.stringify({success: 'yes'}));
    }else if (query.pathname == '/ts/market_snapshot') {
	http.get({host: 'theexchangery.com',
		  path: '/ts/market_snapshot?key=A8b04F3&market_id=123'},
		 function (res) {
		     var raw = '';
		     res.on('data', function (chunk) {
			 raw += chunk;
		     });
		     res.on('end', function () {
			 respond(raw);
		     });
		 });
    }

}).listen(8124, '127.0.0.1');
