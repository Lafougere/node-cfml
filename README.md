# node-cfml
a simple cfml view engine for node.js/express

## Introduction
I always appreciated Coldfusion for its ease of use. One of its great advantages is that CFML markup blends in very well with HTML markup. It has IMHO the cleanest views of any technology I used. node-cfml is a templating engine for Node.js/Express that implements the few CFML tags that make sense in a view.

## Support
Only a few CFML tags have been implemented. Most CFML tags wouldn't make sense in a view. 
The implemented tags are:
  * CFSET
  * CFOUTPUT
  * CFIF
  * CFLOOP
  * CFPARAM
  * CFSAVECONTENT
  * CFINCLUDE
  * CFBREAK
  * CFABORT
  
## Installation
npm install node-cfml --save

## Usage
	var express = require('express');
	var app = express();
	var cfml = require('node-cfml')

	app.engine('cfm', cfml.render)
	app.set('view engine', 'cfm')
	app.get('/', function (req, res) {
		res.render('test.cfm')
	})
	
	var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);
	})
	
## Tests
Just run
	mocha
to run the tests