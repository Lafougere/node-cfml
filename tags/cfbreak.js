/* globals require, exports */
// jshint devel:true, curly: false, asi:true

function execute(){
	this.vars.__BREAKLOOP = true
	return {
		out: '',
		abort: true
	}
}
exports.execute = execute
