/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

exports.afterEnd = (tag, str, buf) => {
	tag.abort = true
	tag.error = tag.attributes.showerror
	delete tag.name
	buf.push(tag)
}
