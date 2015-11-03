// jshint devel:true, curly: false, asi:true,-W049
/* globals require,console,module */

var fs = require('fs'),
	cfUtils = require('./functions'),
	tags = {
		cfabort: require('./tags/cfabort'),
		cfbreak: require('./tags/cfbreak'),
		cfif: require('./tags/cfif'),
		cfinclude: require('./tags/cfinclude'),
		cfloop: require('./tags/cfloop'),
		cfoutput: require('./tags/cfoutput'),
		cfparam: require('./tags/cfparam'),
		cfsavecontent: require('./tags/cfsavecontent'),
		cfset: require('./tags/cfset')
	},
	cache = {},
	reTag = /\<(cf[^\s\>]+)([\s\S]*?)\>/gi

function read(path, options, fn) {
	var str = cache[path]
	if (options.cache && str) return fn(null, str)
	return fs.readFile(path, 'utf-8', function(err, str) {
		if (err) return fn(err)
		if (options.cache) cache[path] = str
		return fn(null, str)
	})
}
function executeTag(tag, tagAttribString, content, vars, evalVars, path, line){
	var Tag = tags[tag.toLowerCase()];
	return Tag.execute(tagAttribString, content, vars, processTemplate, evalVars, path, line);
}

function processTemplate(str, out, vars, evalVars, path, line){
	reTag.lastIndex = 0
	out = out || ""
	if (vars.__ABORTRESPONSE || vars.__BREAKLOOP) return out
	var nextTagMatch = reTag.exec(str)

	if (nextTagMatch) {
		//line = out.split('\n').length
		// fill output buffer
		out += evalVars ? cfUtils.replacePoundSigns(str.substr(0, nextTagMatch.index), vars, path, line) : str.substr(0, nextTagMatch.index)
		line = out.split('\n').length
		// remove parsed content
		str = str.substr(nextTagMatch.index + nextTagMatch[0].length)
		// execute tag
		var tag = executeTag(nextTagMatch[1], nextTagMatch[2], str, vars, evalVars, path, line)
		if (tag.out) out += tag.out
		if (typeof tag.remainingContent != 'undefined') str = tag.remainingContent
		if (tag.abort) return out
		out = processTemplate(str, out, vars, evalVars, path, line)
	}
	else out += evalVars ? cfUtils.replacePoundSigns(str, vars, path, line) : str
	return out
}
function render(path, vars, callback){
	//console.log("CFML:"+path)
	//console.log(opts)
	read(path, {cache:false}, function(err, strContent){
		console.time('remove-comments')
		strContent = cfUtils.removeCFMLComments(strContent)
		console.timeEnd('remove-comments')
		//console.log(strContent.length)
		//process.exit()
		//console.time('exec-template');
		/*try {
			var result = executeTemplate(strContent, '', opts, false);
			while (result.charCodeAt(0)>65000) result = result.substr(1);
			callback(null, result);
		}
		catch (e){
			console.log('error in template ' + path)
			console.log(e)
		}*/
		console.log(strContent.split('\n'))
        var result = processTemplate(strContent, '', vars, false, path, 0);
		while (result.charCodeAt(0)>65000) result = result.substr(1)
		callback(err, result, vars)

		//console.timeEnd('exec-template');
		//console.timeEnd('total time');
		//console.log("CONTENT:"+result)
		//console.log("CHAR"+result.charCodeAt(0))

	})

}
exports.processTemplate = processTemplate
exports.render = render
