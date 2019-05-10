/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061
// const utils = require('../utils')

exports.hasBody = true
exports.tagMatch = /<[\/]?cfoutput[^>]*>/gi
exports.afterBegin = (tag, str, buf) => {
	tag.evalVars = true
}
exports.afterEnd = (tag, str, buf) => {
	tag.parsedBody.forEach((instr) => buf.push(instr))
	tag.evalVars = false
}
