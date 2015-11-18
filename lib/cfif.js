/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084
var utils = require('../utils'),
	reCfif = /cfif/i,
	reElse = /<(\/?cfif|cfelseif|cfelse)([^>]*)>/gi,
	reCfelse = /<cfelse\s*>/i

exports.hasBody = true
exports.tagMatch = /<\/?cfif[^>]*>/gi

exports.afterBody = function(tag, str, buf, parse){
	//console.log('afterbody')
	var block,
		start = 0,
		hasElseBlock = false,
		current

	tag.if = {
		condition: tag.expression
	}
	tag.elseif = []
	tag.else = {}

	current = tag.if

	while (block = getNextElseBlock(reElse, tag.body)){

		hasElseBlock = true
		current.body = tag.body.slice(start, block.index)
		start = block.index + block[0].length
		if (block[1].toLowerCase() == 'cfelseif'){
			current = {
				condition: block[2]
			}
			tag.elseif.push(current)
		}
		else {
			current = tag.else
		}
	}
	current.body = tag.body.slice(start)
	// parse condition bodies after the getNextElseBlock regexp so that it's not reset
	if (tag.if.body) {
		tag.if.parsedBody = parse(tag.if.body, tag.line, tag.path, tag.evalVars)
		delete tag.if.body
	}
	tag.elseif.forEach(function(cnd){
		cnd.parsedBody = parse(cnd.body, tag.line, tag.path, tag.evalVars)
		delete cnd.body
	})
	if (tag.else.body) {
		tag.else.parsedBody = parse(tag.else.body, tag.line, tag.path, tag.evalVars)
		delete tag.else.body
	}
	delete tag.body
	delete tag.match
	delete tag.expression

}

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

exports.render = function(tag, vars, renderFn){
	if (utils.evaluateRValue(tag.if.condition, vars, tag.path, tag.line)) return renderFn(tag.if.parsedBody, vars)
	for (var i=0, j=tag.elseif.length; i < j; i++){
		if (utils.evaluateRValue(tag.elseif[i].condition, vars, tag.path, tag.line)) return renderFn(tag.elseif[i].parsedBody, vars)
	}
	if (tag.else.parsedBody) return renderFn(tag.else.parsedBody, vars)
	return ''
}
