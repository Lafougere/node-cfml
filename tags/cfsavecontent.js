/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	reOpeningOrClosingTag = /<[\/]?cfsavecontent[^>]*>/gi,
	reAttrib = /(variable)\s*=(["'])(.*?)([^\2]|\2\2)\2/gi

function getTagBody(content){
	var openCount = 0, match
	reOpeningOrClosingTag.lastIndex = 0
	while (match = reOpeningOrClosingTag.exec(content)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount === 0) break;
			else openCount--
		}
		else openCount++
	}
	var body = content.substr(0, match.index)
	if (match.index + match[0].length >= content.length) content = ""
	else content = content.substr(match.index + match[0].length)
	return {
		body: body,
		content: content
	}
}
function parseAttributes(attribString, vars, path, line){
	var match, attribs = {}
	reAttrib.lastIndex = 0
	while (match = reAttrib.exec(attribString)){
		var attribValue = match[3] + match[4]
		if (attribValue.indexOf('#') > -1) attribValue = cfUtils.replacePoundSigns(attribValue, vars, path, line)
		attribs[match[1].toLowerCase()] = attribValue
	}
	return attribs
}
function execute(attribString, content, vars, execFn, evalVars, path, line){
	// parse the attribute string
	var attribs = parseAttributes(attribString, vars, path, line), parsed = getTagBody(content)
	if (! attribs.variable) throw 'Variable attribute is required'
	if (cfUtils.containsCFTags(parsed.body)) parsed.body = execFn(parsed.body, '', vars, evalVars)
	else if (evalVars) parsed.body = cfUtils.replacePoundSigns(parsed.body, vars, path, line)
	vars[attribs.variable] = parsed.body
	return {
		out: "",
		remainingContent: parsed.content
	}
}
exports.execute = execute
