
/*

Run this with node and it will mock responses from the live environment.

Just set up something to use it as a reverse proxy on <path>/ts/

*/

var http = require('http'),
    fs = require('fs'),
    urllib = require('url');

http.createServer(function (req, res) {

    var respond = function (data, header) {
	res.writeHead(200, header);
	res.write(data);
	res.end();
    }

    var query = urllib.parse(req.url);
    //var remote_path = '/ts/';
    var remote = query.pathname.indexOf(".") == -1; //  query.pathname.substr(0, remote_path.length) === remote_path

    if (remote) {
	var body = '';
	req.addListener('data', function (chunk) {
            body += chunk;
	});
	req.addListener('end', function () {
	    var pathquery = query.pathname;
	    if (query.search){
		pathquery += query.search;
	    }

	    var cookie = { cookie : req.headers.cookie };
	    var options = {host: '127.0.0.1', 
			   port: 8000, 
			   method: req.method, 
			   path: pathquery, 
			   headers: {cookie: req.headers.cookie,
				     'Content-Length': body.length}
			  };
	    
	    //options.host = '127.0.0.1';
	    //options.port = 8000;

	    //options.host = 'theexchangery.com';
	    //options.port = 80;

	    console.log('making request: ' + JSON.stringify(options));
	    var request = http.request(options, 
				       function (res) {
					   var raw = '';
					   res.on('data', function (chunk) {
					       raw += chunk;					      
					   });
					   res.on('end', function () {	
					       var response_header = res.headers;
					       console.log('remote response: ' + raw);
					       respond(raw, response_header);
					   });
				       });

	    console.log('request body: '+body.length+' ' + body+"\n");
	    request.write(body);
	    request.end();
	});
    }
    else {
	var filename = query.pathname.substr(1);
	if (filename == ''){
	    filename = 'index.html';
	}
	console.log('reading file: ' + filename);
	fs.readFile(filename, function (err, data) {
	    if (!err){
		res.writeHead(200);
		res.write(data);
		res.end();
	    }
	});
    }

}).listen(8124, '127.0.0.1');

console.log('server started at http://localhost:8124/');
