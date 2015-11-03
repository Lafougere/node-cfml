/* globals require, exports, console */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	fs = require('fs'),
	path = require('path'),
	reAttrib = /(template|once)\s*=(["'])(.*?)([^\2]|\2\2)\2/gi

function parseAttributes(attribString, vars){
	var match, attribs={}
	reAttrib.lastIndex = 0
	while (match = reAttrib.exec(attribString)){
		var attribValue = match[3] + match[4]
		if (attribValue.indexOf('#') > -1) attribValue = cfUtils.replacePoundSigns(attribValue, vars)
		attribs[match[1].toLowerCase()] = attribValue
	}
	return attribs
}

exports.execute = function(attribString, c, vars, execFn, evalVars, path, line){

	var attribs = parseAttributes(attribString, vars), cache = {}, filePath, content, included

	if (! attribs.template) throw 'Template attribute is required'
    vars._cfincludedtemplates = vars._cfincludedtemplates || {}
	filePath = cfUtils.replacePoundSigns(attribs.template, vars, path, line)
	included = vars._cfincludedtemplates[filePath] ? true : false
	if (attribs.once && included) return {}
	if (filePath in cache) content = cache[filePath]
	else {
		content = cfUtils.removeCFMLComments(fs.readFileSync(filePath, 'utf-8'))
		while (content.charCodeAt(0) > 65000) content = content.substr(1)
		cache[filePath] = content
	}
	vars._cfincludedtemplates[filePath] = true
	console.time('include rendered: ' + filePath)
	var out = execFn(content, '', vars, false, filePath, 0)
	console.timeEnd('include rendered: ' + filePath)
	return {
		out: out
	}

}
