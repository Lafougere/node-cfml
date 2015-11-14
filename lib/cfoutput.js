/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061

var utils = require('../utils')

exports.hasBody = true
exports.closeTagMatch = /<\/cfoutput[^>]*>/gi
exports.beforeBody = function(parser){
	parser.evalVars = true
	//console.log(parser.buf)
}
exports.afterBody = function(parser){
	parser.evalVars = false
	//options.out = options.out.concat(options.currentTag.compiledBody)
}

/*exports.execute = function(attribString, body, vars, renderFn, evalVars, path, line){

	if (utils.containsCFTags(body)) {
		out = renderFn(body, vars, true)
	}



}*/

