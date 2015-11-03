/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var cfUtils = require('../functions'),
	reCfif = /cfif/i,
	reOpeningOrClosingTag = /<\/?cfif[^>]*>/gi,
	reElse = /<(\/?cfif|cfelseif|cfelse)([^>]*)>/gi,
	reCfelse = /<cfelse\s*>/i

function getNextElseBlock(re, tagBody){
	var openCount = 0, match
	while (match = re.exec(tagBody)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount-- === 0) break;
		}
		else if (reCfif.test(match[1])) openCount++
		else if (!openCount) break;
	}
	return match
}

function getTagBody(content){
	var openCount = 0, match
	reOpeningOrClosingTag.lastIndex = 0
	while (match = reOpeningOrClosingTag.exec(content)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount-- === 0) break;
		}
		else openCount++
	}
	return {
		body: content.substr(0, match.index),
		content: content.substr(match.index + match[0].length)
	}
}
exports.execute = function(attribString, content, vars, execFn, evalVars, path, line){
	// parse the attribute string
	var res = cfUtils.evaluateRValue(attribString, vars, path, line),
		start = 0,
		hasElseBlock = false,
		tmp,
		parsed = getTagBody(content)

	reElse.lastIndex = 0
	while (tmp = getNextElseBlock(reElse, parsed.body)){
		hasElseBlock = true
		if (res){
			parsed.body = parsed.body.substring(start, tmp.index)
			break;
		}
		else if (reCfelse.test(tmp[0])) {
			line = parsed.body.substring(0, tmp.index).split('\n').length
			parsed.body = parsed.body.substr(tmp.index + tmp[0].length)
			res = true
			break;
		}
		else {
			line = parsed.body.substring(0, tmp.index).split('\n').length
			res = cfUtils.evaluateRValue(tmp[2], vars, path, line)
			start = tmp.index + tmp[0].length
			hasElseBlock = false
		}
	}
	if (!res) parsed.body = ""
	else if (start && ! hasElseBlock) parsed.body = parsed.body.substr(start) // elseif
	if (cfUtils.containsCFTags(parsed.body)) parsed.body = execFn(parsed.body, '', vars, evalVars, path, line)
	else if (evalVars) parsed.body = cfUtils.replacePoundSigns(parsed.body, vars, path, line)

	return {
		out: parsed.body,
		remainingContent: parsed.content
	}
}
