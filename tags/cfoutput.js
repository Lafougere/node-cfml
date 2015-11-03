/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	reOpeningOrClosingTag = /<[\/]?cfoutput[^>]*>/gi

function getTagBody(content){
	var openCount = 0, match
	reOpeningOrClosingTag.lastIndex = 0
	while (match = reOpeningOrClosingTag.exec(content)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount-- === 0) break;
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
exports.execute = function(attribString, content, vars, execFn, evalVars, path, line){
	// parse the attribute string
	// TODO: implement cfoutput query
	// get the tag body
	var parsed = getTagBody(content)
	if (cfUtils.containsCFTags(parsed.body)) parsed.body = execFn(parsed.body, '', vars, true)
	else parsed.body = cfUtils.replacePoundSigns(parsed.body, vars, path, line)
	return {
		out: parsed.body,
		remainingContent: parsed.content
	}
}
