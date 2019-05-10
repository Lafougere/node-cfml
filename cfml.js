/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W061

const fs = require('fs'),
	tags = {
		cfabort: require('./lib/cfabort'),
		cfbreak: require('./lib/cfbreak'),
		cfif: require('./lib/cfif'),
		cfinclude: require('./lib/cfinclude'),
		cfloop: require('./lib/cfloop'),
		cfoutput: require('./lib/cfoutput'),
		cfparam: require('./lib/cfparam'),
		cfsavecontent: require('./lib/cfsavecontent'),
		cfset: require('./lib/cfset')
	},
	cache = {},
	RETagOrPound = /[<#]/,
	RESpaceOrGT = /[\s>]/,
	REComment = /(<!---|--->)/g,
	REQuoteOrGT = /['">]/,
	REAttribNameDelim = /[\s=>]/,
	RESpace = /\s/


function parse(str, line, path, evalVars) {
	const buf = []
	line = line || 1
	processQueue(str, buf, evalVars, line, path)

	return buf
}

function processQueue(str, buf, evalVars, line, path) {
	let pos = evalVars ? str.search(RETagOrPound) : str.indexOf('<') // skip to next interesting character

	if (pos === -1) {
		// nothing found -> string is pure text -> just add to buffer
		buf.push(str)
		str = ''
		return
	}

	if (pos > 0) {
		// it is safe to flush contents up to pos
		const out = str.slice(0, pos)
		line += out.split('\n').length - 1
		buf.push(out)
		str = str.slice(pos)
	}

	if (str.charAt(0) == '#') {
		processValue(str, buf, evalVars, line, path)
	} else if (str.substr(1, 2).toLowerCase() == 'cf') {
		// cf tag found
		processTag(str, buf, evalVars, line, path)
	} else if (str.substr(1, 4) == '!---') {
		// cf comment found
		processComment(str, buf, evalVars, line, path)
	} else {
		// Adding an root element to be replaced with the first '<' tag
		if (buf.length < 1)
			buf.push('')
		// other tag
		buf[buf.length - 1] += '<'
		str = str.slice(1)
		processQueue(str, buf, evalVars, line, path)
	}

}

function processValue(str, buf, evalVars, line, path) {
	const pos = str.indexOf('#', 1)
	buf.push({
		type: 'value',
		value: str.slice(1, pos)
	})
	str = str.slice(pos + 1)

	processQueue(str, buf, evalVars, line, path)
}

function processComment(str, buf, evalVars, line, path) {
	let match, openCount = 0, start = 0
	REComment.lastIndex = 1

	while (match = REComment.exec(str)) {
		if (match[0] == '--->') {
			if (openCount-- === 0) {
				start = match.index + match[0].length
				break
			}
		}
		else {
			start = match.index + match[0].length
			openCount++
		}
	}

	if (start) {
		line += (str.slice(0, start).split('\n').length - 1)
		str = str.slice(start)
		processQueue(str, buf, evalVars, line, path)
	}
	else throw 'Unclosed comment at line ' + line

}

function processTag(str, buf, evalVars, line, path) {
	let nameLen = str.search(RESpaceOrGT),
		tag = {
			name: str.slice(1, nameLen).toLowerCase(),
			line: line,
			path: path,
			evalVars: evalVars
		},
		tagDef
	str = str.slice(nameLen)

	if (tag.name == 'cfset' || tag.name == 'cfif') str = processExpression(tag, str, buf, evalVars, line, path)
	else str = processAttributes(tag, str, buf, evalVars, line, path)

	tagDef = tags[tag.name]

	if (tagDef.afterBegin) tagDef.afterBegin(tag, str, buf)

	if (tagDef.hasBody) {
		tag.match = tagDef.tagMatch
		str = processBody(tag, str, buf, tag.evalVars, line, path)
		if (tagDef.afterBody) tagDef.afterBody(tag, str, buf, parse, tag.evalVars)
		else {
			tag.parsedBody = parse(tag.body, line, path, tag.evalVars)
			delete tag.body
		}
	}

	if (tagDef.afterEnd) tagDef.afterEnd(tag, str, buf, parseFile)
	else buf.push(tag)

	processQueue(str, buf, tag.evalVars, line, path)
}

function processBody(tag, str, buf, evalVars, line, path) {
	let openCount = 0, match
	tag.match.lastIndex = 0

	while (match = tag.match.exec(str)) {
		if (match[0].indexOf('</') > -1) {
			if (openCount-- === 0) break;
		}
		else openCount++
	}

	tag.body = str.substr(0, match.index)
	if (match.index + match[0].length >= str) str = ""
	else str = str.substr(match.index + match[0].length)

	return str
}

function processExpression(tag, str, buf, evalVars, line, path) {
	let endTag = false, inQuotes = false, pos, char, currentQuote
	tag.expression = tag.expression || ''

	while (! endTag) {
		if (! inQuotes) {
			pos = str.search(REQuoteOrGT)
			char = str.charAt(pos)
			if (char == '"' || char == "'") {
				inQuotes = true
				currentQuote = char
				tag.expression += str.slice(0, pos)
				str = str.slice(pos)
				continue
			}
			
			// '>' found
			tag.expression += str.slice(0, pos)
			str = str.slice(pos + 1)
			endTag = true
		} else {
			// in quoted string
			pos = str.indexOf(currentQuote)
			tag.expression += str.slice(0, pos + 1)
			str = str.slice(pos + 1)
			inQuotes = false
		}
	}

	return str
}

function processAttributes(tag, str, buf, evalVars, line, path) {
	let endTag = false, inQuotes = false, pos, char, currentQuote, attribute = {}
	tag.attributes = tag.attributes || {}

	while (! endTag) {
		if (! inQuotes) {
			while (RESpace.test(str.charAt(0))) str = str.slice(1)

			if (str.charAt(0) == '>') {
				endTag = true
				str = str.slice(1)
				break
			}
			if (! attribute.name) {
				pos = str.search(REAttribNameDelim)
				attribute.name = str.slice(0, pos).toLowerCase()
				str = str.slice(pos)
				// value
				while (REAttribNameDelim.test(str.charAt(0))) str = str.slice(1)
				char = str.charAt(0)
				if (char == '"' || char == "'") {
					inQuotes = true
					currentQuote = char
					str = str.slice(1)
					continue
				}
			}

		} else {
			// in quoted string
			pos = str.indexOf(currentQuote)
			inQuotes = false
			attribute.value = str.slice(0, pos)
			tag.attributes[attribute.name] = attribute.value
			str = str.slice(pos + 1)
			delete attribute.name
			delete attribute.value
		}
	}
	return str
}

function render(compiled, vars) {

	return compiled.map(instr => {
		if (typeof instr == 'string') return instr
		else if (instr.name) {
			const tag = tags[instr.name]
			return tag.render(instr, vars, render)
		} else if (instr.value) {
			if (vars[instr.value] !== undefined) return vars[instr.value]
			else {
				let tmp
				eval('tmp = ' + instr.value)
				return tmp
			}
		}
		else if (instr.abort) return instr.error ? instr.error : ''
	}).join('')
}

function optimize(arr) {

	return arr.reduce((accumulator, current) => {
		if (typeof accumulator[accumulator.length - 1] == 'string' && typeof current == 'string') {
			accumulator[accumulator.length - 1] += current
			return accumulator
		}
		if (current.parsedBody) current.parsedBody = optimize(current.parsedBody)
		accumulator.push(current)
		return accumulator
	}, [])
}

function renderFile(path, vars, callback) {
	let error = null, out
	try {
		out = render(parseFile(path), vars)
	} catch (err) {
		error = err
	}

	return callback(error, out)
}

function parseFile(path) {
	if (! cache[path])
		cache[path] = optimize(parse(fs.readFileSync(path, 'utf8'), 1, path))
	
	return cache[path]
}

function renderString(str, vars) {
	return render(parse(str, 1, ''), vars)
}

exports.parse = parse
exports.renderString = renderString
exports.renderFile = renderFile
exports.parseFile = parseFile
