/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061
var utils = require('../utils'),
	reQuoteStart = /^['"]/,
	reQuoteStop = /['"]$/,
	reAssignment = /^\s*([^\s]+)\s*([\+&\-\*\/]?=?)\s*([\s\S]*)\s*/g

function evaluateLValue(lval, vars, path, line){
	lval = lval.trim()
	if (lval.indexOf('"') === 0 || lval.indexOf("'") ===0){
		return utils.replacePoundSigns(lval, vars, path, line).replace(reQuoteStart, '').replace(reQuoteStop, '')
	}
	return lval
}

exports.render = function(tag, vars, body){
	// check if assignment
	reAssignment.lastIndex = 0
	var parsed = reAssignment.exec(tag.expression)
	if (parsed[2].length){
		// assignment
		var lVal = evaluateLValue(parsed[1].trim(), vars, tag.path, tag.line)
		var rVal = utils.evaluateRValue(parsed[3].trim(), vars, tag.path, tag.line)
		with (vars) eval("vars." + lVal + " " + parsed[2] + " rVal")
		return ''
	}
	try {
		with (vars) eval(tag.expression)
		//console.log(vars)
		return ''
	}
	catch (err){
		var msg = 'Error in file ' + tag.path + ' at line ' + (tag.line) + '\n'
		msg += 'An error occured while evaluating a CFSET expression'
		msg += err.message + '\n\n'

		err.message = msg
		throw err
	}
}
