/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	reAttrib = /(name|default|type|max|min|pattern)\s*=\s*(["'])(.*?)([^\2]|\2\2)?\2/gi

function parseAttributes(attribString, vars, path, line){
	var match, attribs={}
	reAttrib.lastIndex = 0
	while (match = reAttrib.exec(attribString)){
		var attribValue = match[3] + match[4]
		if (attribValue.indexOf('#') > -1) attribValue = cfUtils.replacePoundSigns(attribValue, vars, path, line)
		attribs[match[1].toLowerCase()] = attribValue
	}
	return attribs
}
function execute(attribString, content, vars, path, line){
	// parse the attribute string
	var attribs = parseAttributes(attribString, vars, path, line)

	if (attribs.name && 'default' in attribs && typeof vars[attribs.name] == 'undefined') {
		// set default
		if (attribs['default']=="false") attribs['default'] = false
		else if (attribs['default']=="true") attribs['default'] = true
		vars[attribs.name] = attribs['default'] || ""
	}
	else if (attribs.name && typeof attribs['default'] == 'undefined' && typeof vars[attribs.name]=='undefined'){
		return {out:"Parameter " + attribs.name + " is required",abort:true}
	}
	// TODO : implement type min max and pattern
	return {};
}
exports.execute = execute
