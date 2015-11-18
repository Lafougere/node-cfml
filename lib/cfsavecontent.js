/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

exports.hasBody = true
exports.tagMatch = /<[\/]?cfsavecontent[^>]*>/gi
exports.render = function(tag, vars, renderFn){
	if (! tag.attributes.variable) throw 'Variable attribute is required'
	vars[tag.attributes.variable] = renderFn(tag.parsedBody, vars)
	return ''
}
