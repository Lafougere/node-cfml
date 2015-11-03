/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	reAttrib = /(showerror)\s*=(["'])(.*?)([^\2]|\2\2)\2/gi

function parseAttributes(attribString, vars){
	var match, attribs = {}
	reAttrib.lastIndex = 0
	while (match = reAttrib.exec(attribString)){
		var attribValue = match[3] + match[4]
		if (attribValue.indexOf('#') > -1) attribValue = cfUtils.replacePoundSigns(attribValue, vars)
		attribs[match[1].toLowerCase()] = attribValue
	}
	return attribs
}


function execute(attribString, content, vars, execFn){
	var out = "", attribs = parseAttributes(attribString, vars)
	if (attribs.showerror) out = attribs.showerror
	vars.__ABORTRESPONSE = true
	return {
		out: out,
		abort: true
	}
}

exports.execute = execute
