/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W061
var cfUtils = require('../functions'),
	reAttrib = /(from|to|index|list|collection|item|array|query|step|startrow|endrow)\s*=(["'])(.*?)([^\2]|\2\2)\2/gi,
	reOpeningOrClosingTag = /<[\/]?cfloop[^>]*>/gi

function parseAttributes(attribString){
	var match, attribs={}
	reAttrib.lastIndex = 0
	while (match = reAttrib.exec(attribString)){
		attribs[match[1].toLowerCase()] = match[3] + match[4]
	}
	return attribs
}
function getTagBody(content){
	var openCount = 0, match
	reOpeningOrClosingTag.lastIndex = 0
	while (match = reOpeningOrClosingTag.exec(content)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount-- === 0) break
		}
		else openCount++
	}
	return {
		body: content.substr(0, match.index),
		content: content.substr(match.index + match[0].length)
	}
}
exports.execute = function(attribString, content, vars, execFn, evalVars){
	console.time('loop executed')
	var out = "",
		attribs = parseAttributes(attribString, vars),
		parsed = getTagBody(content),
		__LOOPINDEX,
		array
	// execute loop
	if (attribs.from && attribs.to && attribs.index){
		attribs.step = attribs.step || 1
		for (__LOOPINDEX = cfUtils.evaluateRValue(attribs.from, vars); __LOOPINDEX < cfUtils.evaluateRValue(attribs.to, vars)+1; __LOOPINDEX += attribs.step){
			vars[attribs.index] = __LOOPINDEX
			out += execFn(parsed.body, '', vars, evalVars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	else if (attribs.collection && attribs.item){
		var collection = cfUtils.evaluateRValue(attribs.collection.replace(/#/g,''), vars)
		for (__LOOPINDEX in collection){
			vars[attribs.item] = __LOOPINDEX
			out += execFn(parsed.body, '', vars, evalVars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	else if (attribs.array && attribs.index){
		array = vars[attribs.array.replace(/#/g,'')]
		if (! array) eval ("array = vars." + attribs.array.replace(/#/g,''));
		var parseBody = cfUtils.containsCFTags(parsed.body)
		if (array && array.length){
			//console.log(array)
			for (__LOOPINDEX=0; __LOOPINDEX < array.length; __LOOPINDEX++){
				vars[attribs.index] = array[__LOOPINDEX];
				out += (parseBody) ? execFn(parsed.body, '', vars, evalVars) : cfUtils.replacePoundSigns(parsed.body, vars)
				if (vars.__BREAKLOOP){
					delete vars.__BREAKLOOP;
					break;
				}
			}
		}
	}
	else if (attribs.list && attribs.index){
		attribs.delimiter = attribs.delimiter || ','
		var list = attribs.list.indexOf('#')>-1 ? cfUtils.replacePoundSigns(attribs.list, vars) : attribs.list
		array = list.split(attribs.delimiter)
		for (__LOOPINDEX in array){
			vars[attribs.index] = array[__LOOPINDEX]
			out += execFn(parsed.body, '', vars, evalVars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	// TODO: condition loop
	// TODO: query loop
	console.timeEnd('loop executed')
	return {
		out: out,
		remainingContent: parsed.content
	}
}
