/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061
const fs = require('fs')



exports.afterEnd = (tag, str, buf, parseFn) => {
	if (tag.attributes.template.indexOf('#') === -1) {
		// static include -> pre-compile
		tag.parsedBody = parseFn(tag.attributes.template)
		buf.push(tag)
	}
}

exports.render = (tag, vars, renderFn) => renderFn(tag.parsedBody, vars)