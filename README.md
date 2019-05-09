# node-cfml
A simple cfml template engine for node.js/express

# Quick-Start Guide

- [Introduction](#introduction)
- [Support](#support)
- [Installation](#installation)
- [Usage](#usage)
- [Tests](#tests)

## Introduction
Version 1.0 is out! It's a complete rewrite of what started out as a few regexps quickly thrown together. It is now a decently fast template engine. It uses a static cache, it supports tag nesting, comments, dynamic variable names, etc. It behaves mostly like Coldfusion but it interprets javascript code. (eg: arrays start at 0). Just use it like you would any other express template engine. Enjoy the clean views, the tag completion and color coding ... Using tags for view logic in HTML actually kicks ass.

## Support
Only a few CFML tags have been implemented. It wouldn't make sense to use most other CF tags in a view.
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
  
The implemented CF operators are:

  * EQ, IS
  * NEQ, IS NOT
  * LT
  * GT
  * LTE, LE
  * GTE, GE
  * NOT
  * AND, OR
  * MOD
  * &

You can also use javascript operators directly. The parser will not like the > operator in tags so use GT or GTE in a CFIF tag.

## Installation
```sh
npm install node-cfml --save
```

> You're now setup

## Usage
```
var express = require('express')
var app = express()
var cfml = require('node-cfml')

app.engine('cfm', cfml.renderFile)
app.set('view engine', 'cfm')
app.get('/', function (req, res) {
  res.render('test.cfm')
})

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
```
	
## Tests
Run the following command to run the project tests
```sh
mocha
```
