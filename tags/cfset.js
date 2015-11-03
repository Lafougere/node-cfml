/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061

var cfUtils = require('../functions'),
	reQuoteStart = /^['"]/,
	reQuoteStop = /['"]$/,
	reAttribs = /^\s*([^\s]+)\s*([\+&\-\*\/]?=?)\s*([\s\S]*)\s*/g

function evaluateLValue(lval, vars, path, line){
	lval = lval.trim()
	if (lval.indexOf('"') === 0 || lval.indexOf("'") ===0){
		return cfUtils.replacePoundSigns(lval, vars, path, line).replace(reQuoteStart, '').replace(reQuoteStop, '')
	}
	return lval
}

function execute(attribString, content, vars, fn, evalVars, path, line){
	// parse the attribute string and eval
	reAttribs.lastIndex = 0
	var parsed = reAttribs.exec(attribString);
	if (parsed[2].length){
		// assignment
		var lVal = evaluateLValue(parsed[1].trim(), vars, path, line);
		var rVal = cfUtils.evaluateRValue(parsed[3].trim(), vars, path, line);
		with (vars) eval("vars."+lVal+" " + parsed[2] + " rVal");
		return {};
	}
	try {
		with (vars) eval(parsed[1])
	}
	catch (err){
		var msg = 'Error in file ' + path + ' at line ' + (line) + '\n'
		msg += err.message + '\n\n'

		err.message = msg
		throw err
	}
	return {};
}
exports.execute = execute
