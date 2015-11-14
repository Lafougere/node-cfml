/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061

var fs = require('fs'),
	reAttrib = /(template|once)\s*=(["'])(.*?)([^\2]|\2\2)\2/gi,
	cfml = require('../cfml')



exports.afterCompile = function(ctx, compileFn, cache, tag){
	//console.log('AFTER HOOK')

	if (tag.attributes.template.indexOf('#') === -1){
		// static include -> pre-compile
		//console.log(tag.attributes)

		cache = cache || {}
		cfml.renderFile(tag.attributes.template)
		//console.log(cache[attribs.template])
		/*if (! cache[attribs.template]) {
			console.time('include compiled')
			//cache[attribs.template] = [""]
			console.log('compiling')
			compileFn(attribs.template, function(err, compiled){
				console.log('compiled')
				//console.log(options)
				console.log(tag)
				console.timeEnd('include compiled')
				cache[attribs.template] = compiled
				tag.compiledBody = cache[attribs.template]
				//options.out.splice.apply(options.out, [tag.index, 1].concat(compiled)) // replace cfinclude tag by compiled body
				options.childProcesses--
				console.log(options)
				options.onEnd()
			})
		}
		else {
			tag.compiledBody = cache[attribs.template]
			//options.out.splice.apply(options.out, [tag.index, 1].concat(cache[attribs.template]))
			options.childProcesses--
			options.onEnd()
		}*/

	}
	else {
		// dynamic include -> compile at render time

	}

}
exports.execute = function(attribString, body, vars, renderFn, compileFn, cache, evalVars, path, line){
	//console.log("BIZARRE")
	//process.exit()
	var attribs = parseAttributes(attribString, vars)
	if (! body) {
		console.log('compiling inc')
		var content = fs.readFileSync(attribs.template, 'utf8')
		console.time('include compiled')
		cache[attribs.template] = compileFn(content)
		body = cache[attribs.template]
		console.timeEnd('include compiled')
	}
	return renderFn(body, vars)
}
