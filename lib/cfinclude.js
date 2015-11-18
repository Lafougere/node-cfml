/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061

var fs = require('fs')



exports.afterEnd = function(tag, str, buf, parseFn){
	//console.log('AFTER HOOK')

	if (tag.attributes.template.indexOf('#') === -1){
		// static include -> pre-compile
		tag.parsedBody = parseFn(tag.attributes.template)
		buf.push(tag)
	}
	else {
		// dynamic include -> compile at render time

	}

}
exports.render = function(tag, vars, renderFn){
	//console.log("BIZARRE")
	//process.exit()
	if (! tag.parsedBody) {
		/*console.log('compiling inc')
		var content = fs.readFileSync(attribs.template, 'utf8')
		console.time('include compiled')
		cache[attribs.template] = compileFn(content)
		body = cache[attribs.template]
		console.timeEnd('include compiled')*/
	}
	return renderFn(tag.parsedBody, vars)
}
