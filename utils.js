/* globals require, exports, tmp, r */
// jshint devel:true, curly: false, asi:true, -W084, -W085, -W061

var util = require('util')
var reNumber = /([0-9]{3})?([0-9]{3})$/,
	reAmp = /&/g,
	reIsNotNeq = /\s(IS\s+NOT|NEQ)\s/gi,
	reIsNot = /\sIS\s+NOT\s/gi, // to be removed
	reNot = /\sNOT\s/gi,
	reNeq = /\sNEQ\s/gi,
	reOr = /\sOR\s/gi,
	reAnd = /\sAND\s/gi,
	reEqIS = /\s(EQ|IS)\s/gi,
	reEq = /\sEQ\s/gi,
	reIs = /\sIS\s/gi,
	reLt = /\sLT\s/gi,
	reGt = /\sGT\s/gi,
	reLte = /\s(LTE|LE)\s/gi,
	reGte = /\s(GTE|GE)\s/gi,
	rePound = /#(.*?)#/g,
	reCFOperators = /(&|\sIS\s+NOT\s|\sNOT\s|\sOR\s|\sAND\s|\sNEQ\s|\sEQ\s|\sIS\s|\sLTE\s|\sLT\s|\sLE\s|\sGTE\s|\sGT\s|\sGE\s)/gi,
	reQuotedString = /(["'])(.*?)([^\\\1]?)\1/g,
	reCF = /<cf/gi,
	reComment = /(<!---|--->)/g

function poundSignReplacer(vars, path, line){
	return function(match, p1, offset, string){
		if (!p1) return '#'
		if (vars[p1]) return vars[p1]
		with (vars) {
			try {
				eval("var tmp = " + p1)
				//if (typeof tmp =='undefined') tmp = '' // why did i do this?
				return tmp
			}
			catch (err){
				var lines = string.substr(0, offset+match.length).split('\n')
				var msg = 'Error in file ' + path + ' at line ' + (line + lines.length) + '\n'
				msg += err.message + '\n\n'
				lines.slice(-3).forEach(function(l, i){
					msg += (i + line + lines.length - 2) + ': ' + (l) + '\n'
				})
				err.message = msg
				return err
				//msg += lines.slice(-3).join('\n') + '\n\n'
				//console.log(msg)
				//throw new ReferenceError("Error evaluating expression in file "+path+" at line:" + (line + string.substr(0, offset).split('\n').length))
			}
		}
	}
}
function operatorReplacer(match, p1, offset, string){
	if (match === '&') return '+'
	reIsNotNeq.lastIndex = 0
	if (reIsNotNeq.test(match)) return ' != '
	reNot.lastIndex = 0
	if (reNot.test(match)) return ' ! '
	reOr.lastIndex = 0
	if (reOr.test(match)) return ' || '
	reAnd.lastIndex = 0
	if (reAnd.test(match)) return ' && '
	reEqIS.lastIndex = 0
	if (reEqIS.test(match)) return ' == '
	reLte.lastIndex = 0
	if (reLte.test(match)) return ' <= '
	reGte.lastIndex = 0
	if (reGte.test(match)) return ' >= '
	reLt.lastIndex = 0
	if (reLt.test(match)) return ' < '
	reGt.lastIndex = 0
	if (reGt.test(match)) return ' > '
}

function containsCFTags(str){
	reCF.lastIndex = 0
	return reCF.test(str)
}

function replacePoundSigns(str, vars, path, line){
	rePound.lastIndex = 0
	return str.replace(rePound, poundSignReplacer(vars, path, line))
}

function replaceOperators(str){
	// first we need to escape quoted strings
	var placeHolders = [], charVal = 55296, buf = '', lastIndex = 0, char, match
	reQuotedString.lastIndex = lastIndex
	while (match = reQuotedString.exec(str)){
		char = String.fromCharCode(charVal++)
		placeHolders.push({
			content: match[2] + match[3],
			delim: match[1],
			char: char
		})
		buf += str.slice(lastIndex, match.index) + char
		lastIndex = match.index + match[0].length
	}
	buf += str.substr(lastIndex)
	// replace the operators with their javascript counterpart
	buf = buf.replace(reCFOperators, operatorReplacer)
	// replace the placeholders with their original string
	placeHolders.forEach(function(p){
		buf = buf.replace(p.char, p.delim + p.content + p.delim).replace(p.delim+p.delim, '\\'+p.delim)
	})
	//console.log(buf)
	return buf;
}

function evaluateRValue(rval, vars, path, line){
	rval = replaceOperators(replacePoundSigns(rval, vars, path, line))
	//console.log( rval)
	if (vars[rval]) return vars[rval]
	/*var str = 'var r = ' + rval
	console.log(str)*/
	with (vars) {
		try {
			eval('var r = ' + rval)
			return r
		}
		catch (err){
			//var lines = string.substr(0, offset+match.length).split('\n')
			var msg = 'Error in file ' + path + ' at line ' + (line) + '\n'
			msg += err.message + '\n\n'

			err.message = msg
			return err
		}
	}
}


exports.containsCFTags = containsCFTags
exports.replacePoundSigns = replacePoundSigns
exports.evaluateRValue = evaluateRValue
