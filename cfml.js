var fs = require('fs'),
	extend = require('util')._extend,
	PROCESSQUEUE = 0,
	PROCESSTAG = 1,
	PROCESSCOMMENT = 2,
	PROCESSVALUE = 3,
	PROCESSBODY= 4,
	PROCESSATTRIBS = 5,
	PROCESSEXPRESSION = 6,
	reComment = /(<!---|--->)/g,
	reTag = /\<(cf[^\s\>]+)([\s\S]*?)\>/gi,
	chunkSize = 500,
	tags = {
		cfabort: require('./tags/cfabort'),
		cfbreak: require('./tags/cfbreak'),
		cfif: require('./tags/cfif'),
		cfinclude: require('./lib/cfinclude'),
		cfloop: require('./tags/cfloop'),
		cfoutput: require('./lib/cfoutput'),
		cfparam: require('./tags/cfparam'),
		cfsavecontent: require('./tags/cfsavecontent'),
		cfset: require('./lib/cfset')
	},
	cache = {}

var util = require('util');
var stream = require('stream'),
	Transform = stream.Transform,
	RETagOrPound = /[<#]/,
	RESpaceOrGT = /[\s>]/,
	REComment = /(<!---|--->)/g,
	REQuoteOrGT = /['">]/,
	REAttribNameDelim = /[\s=>]/
	REAttribs = /([a-z][a-z0-9_])\s*=\s*(["'])(.*?)([^\2]|\2\2)\2/gi



util.inherits(CFParser, Transform)
util.inherits(ChunkedReader, Transform)

function CFParser(options){

	options = options || {}
	options.highWaterMark = options.highWaterMark || 128
	options.encoding = options.encoding || 'utf8'
	options.objectMode = true
	options.chunkSize = 128

	Transform.call(this, options)

	this.buf = ''
	this.mode = PROCESSQUEUE
	this.line = 1
	this.stop = options.stop
	this.evalVars = options.evalVars
	this.path = options.path

}
CFParser.prototype._flush = function(cb){
	console.timeEnd('file '+this.path+ ' parsed')
	//console.log('to flush')
	//console.log(this.buf)

	cb(null, this.buf)
}

function chunkString(str, size) {
	var numChunks = str.length / size + .5 | 0,
		chunks = new Array(numChunks)

	for(var i = 0, o = 0; i < numChunks; ++i, o += size) {
		chunks[i] = str.substr(o, size)
	}
	chunks[i] = str.slice(o)
	return chunks
}
CFParser.prototype._transform = function(chunk, encoding, done) {

	this.buf += chunk

	if (this.mode === PROCESSTAG) this.processTag(done)
	else if (this.mode === PROCESSCOMMENT) this.processComment(done)
	else if (this.mode === PROCESSVALUE) this.processValue(done)
	else if (this.mode === PROCESSBODY) this.processBody(done)
	else if (this.mode === PROCESSATTRIBS) this.processAttributes(done)
	else if (this.mode === PROCESSEXPRESSION) this.processExpression(done)
	else this.processQueue(done)
}
CFParser.prototype.processTag = function(done){
	this.mode = PROCESSTAG
	if (! this.tag){
		var nameLen = this.buf.search(RESpaceOrGT)

		if (nameLen === -1) return done()
		this.tag = {
			name: this.buf.slice(1, nameLen).toLowerCase(),
			attributes: [],
			compiledBody: [],
			line: this.line
		}
		//console.log('in tag:'+this.tag.name)
		this.buf = this.buf.slice(nameLen)

		if (this.tag.name == 'cfset' || this.tag.name == 'cfif'){
			this.processExpression(done)
		}
		else {
			this.processAttributes(done)
		}
	}
	else {
		var tag = tags[this.tag.name]
			//console.log(tag.afterCompile)
		if (tag.afterCompile) tag.afterCompile(this, compileFile, cache, this.tag)
		if (tag.hasBody) {
			// get tag body
			this.tag.endMatch = tag.closeTagMatch
			if (tag.beforeBody) tag.beforeBody(this)
			this.paused = true
			this.processBody(done)
		}
		else {
			this.push(this.tag)
			delete this.tag
			this.processQueue(done)
		}
	}
}
CFParser.prototype.processAttributes = function(done){

	var pos

	this.mode = PROCESSATTRIBS
	//console.log('in attribs')
	//console.log(this.buf)
	this.tagEndReached = false
	this.attribute = this.attribute || {}
	this.tag.attributes = this.tag.attributes || {}
	while (! this.tagEndReached){
		if (! this.inQuotes){
			if (this.buf.charAt(0) == '>'){
				this.tagEndReached = true
				this.buf = this.buf.slice(1)
				//this.push(this.tag)
			}
			else {
				if (! this.attribute.name){
					pos = this.buf.search(REAttribNameDelim)
					if (pos === -1) return done()
					this.attribute.name = this.buf.slice(0, pos)
					this.buf = this.buf.slice(pos)
				}
				if (! this.attribute.value){
					while (REAttribNameDelim.test(this.buf.charAt(0))) this.buf = this.buf.slice(1)
					var firstChar = this.buf.charAt(0)
					if (firstChar == '"' || firstChar == "'"){
						this.inQuotes = true
						this.currentQuote = firstChar
						this.buf = this.buf.slice(1)
						continue
					}
				}
			}
		}
		else {
			pos = this.buf.indexOf(this.currentQuote)
			if (pos === -1) return done()

			this.inQuotes = false
			this.attribute.value = this.buf.slice(0, pos)
			this.tag.attributes[this.attribute.name] = this.attribute.value
			//console.log(this.attribute)
			this.buf = this.buf.slice(pos + 1)
			delete this.attribute
		}

	}
	this.processTag(done)
}
CFParser.prototype.processExpression = function(done){

	var pos

	this.mode = PROCESSEXPRESSION
	this.tag.expression = this.tag.expression || ''

	//console.log('in expression')
	if (! this.inQuotes){
		pos = this.buf.search(REQuoteOrGT)
		if (pos === -1) return done()
		var char = this.buf.charAt(pos)
		if (char == '"' || char == "'"){
			this.inQuotes = true
			this.currentQuote = char
			this.tag.expression += this.buf.slice(0, pos)
			this.buf = this.buf.slice(pos)
			this.processExpression(done)
		}
		else {
			// '>' found
			this.tag.expression += this.buf.slice(0, pos)
			this.buf = this.buf.slice(pos + 1)

			this.processTag(done)
		}
	}
	else {
		// in quoted string
		pos = this.buf.indexOf(this.currentQuote)
		if (pos === -1) return done() // let the queue fill up
		this.tag.expression += this.buf.slice(0, pos + 1)
		this.buf = this.buf.slice(pos + 1)
		this.inQuotes = false
		this.processExpression(done)
	}
}
CFParser.prototype.processBody = function(done){
	//console.log('in body')
	var that = this

	this.mode = PROCESSBODY
	this.tag.parsedBody = this.tag.parsedBody || []
	if (! this.bodyParser){
		this.bodyParser = new CFParser({stop: this.tag.endMatch})
		this.bodyParser.on('data', function(data){
			that.tag.parsedBody.push(data)
		})
		this.bodyParser.on('hungry', function(data){
			//console.log('HUNGRY')
			done()
		})
		this.bodyParser.on('end', function(data){
			//console.log('BODY PARSED')
			//console.log(that.bodyParser.buf)
			//that.tag.parsedBody.push(data)
			//console.log(that.tag.parsedBody)
			that.buf = that.bodyParser.buf
			that.push(that.tag)
			delete that.bodyParser
			delete that.bodyStream
			delete that.tag
			that.paused = false
			that.processQueue(done)
		})
	}

	if (! this.bodyStream){
		this.bodyStream = new stream.Readable()
		this.bodyStream._read = function noop() {}
		this.bodyStream.pipe(this.bodyParser)
	}
	this.bodyStream.push(this.buf)
	this.buf = ''
	//done()


}

function processBody(options){
	var bodyOptions = {
		mode: PROCESSQUEUE,
		q: options.q,
		out: [],
		evalVars: options.evalVars,
		endBodyMatch: options.currentTag.matcher,
		fillQueue: false,
		eof: options.eof
	}
	//console.log("bodyOptions.q")
	//console.log(bodyOptions.q)
	processChunk(bodyOptions)
	//console.log("bodyOptions.q")
	//console.log(bodyOptions.q)
	//processQueue(bodyOptions)
	//console.log(bodyOptions.out)
	//console.log(bodyOptions.q)
	//process.exit()


	options.currentTag.compiledBody = options.currentTag.compiledBody.concat(bodyOptions.out)
	options.q = bodyOptions.q
	if (bodyOptions.endReached){
		var tag = tags[options.currentTag.name]
		if (tag.afterBody) tag.afterBody(options)
		else {
			options.currentTag.index = options.out.length
			options.out.push(options.currentTag)
		}
		options.mode = PROCESSQUEUE
		delete options.currentTag

	}
	else {
		//options.q = bodyOptions.q
		options.fillQueue = true
	}
}

CFParser.prototype.processComment = function(done){
	var match, openCount = 0, start = 0, out
	REComment.lastIndex = 1
	while (match = REComment.exec(this.buf)) {
		if (match[0] == '--->') {
			if (openCount-- === 0) {
				start = match.index + match[0].length
			}
		}
		else {
			start = match.index
			openCount++
		}
	}
	if (start) {
		this.line += (this.buf.slice(0, start).split('\n').length - 1)
		this.buf = this.buf.slice(start)
		this.processQueue(done)
	}
	else done() // fill buffer
}

CFParser.prototype.processQueue = function(done){
	//console.log('in queue')
	this.mode = PROCESSQUEUE
	var pos = this.evalVars ? this.buf.search(RETagOrPound) : this.buf.indexOf('<') // skip to next interesting character
	//console.log(pos)
	//console.log(this.buf)
	if (pos === -1){
		// nothing found -> string is pure text -> pass through
		this.line += (this.buf.split('\n').length - 1)
		this.push(this.buf)
		this.buf = ''
		this.emit('hungry')
		done()
	}
	else {
		if (pos > 0){
			// it is safe to flush contents up to pos
			var out = this.buf.slice(0, pos)
			this.line += (out.split('\n').length - 1)
			this.push(out)
			this.buf = this.buf.slice(pos)
		}
		if (this.buf.length < 5 && !this.eof && !this.paused) {
			//this.read() // fill buffer
			this.emit('hungry')
			return done()
		}
		if (this.stop){
			var pos2 = this.buf.search(this.stop)
			//console.log(pos2)
			if (pos2  === 0){
				var match = this.buf.match(this.stop)
				this.buf = this.buf.slice(match[0].length)
				return this.push(null)
			}
			else if (pos2 === -1) {
				this.emit('hungry')
				//console.log('HUNGRYYYY')
			}
		}

		if (this.buf.charAt(0) == '#'){
			this.processValue(done)
		}
		else if (this.buf.substr(1, 2).toLowerCase() == 'cf'){
			// cf tag found
			this.processTag(done)
		}
		else if (this.buf.substr(1, 4) == '!---'){
			// cf comment found
			this.processComment(done)
		}
		else {
			// other tag
			this.push('<')
			this.buf = this.buf.slice(1)
			this.processQueue(done)
		}
	}
}

function ChunkedReader(options){
	options = options || {}
	options.encoding = options.encoding || 'utf8'
	Transform.call(this, options)
	this.chunkSize = 256
}
ChunkedReader.prototype._transform = function(chunk, encoding, done) {
	var chunks = chunkString(chunk.toString(), this.chunkSize),
		that= this
	chunks.forEach(function(chunk){
		that.push(chunk)
	})
	chunks = null
	done()
}


function processQueue(options){
	if (options.q.length < 20 && !options.eof) return (options.fillQueue = true)
	var pos = options.evalVars ? options.q.search(/[<#]/) : options.q.indexOf('<'), tmpOut
	//console.log(pos)
	//console.log(options.q.charAt(0))
	//console.log(options.q.search(/[<#]/))
	//if (options.evalVars) console.log(options.q.charAt(0))
	if (pos > -1) {
		if (pos > 0){
			tmpOut = options.q.slice(0, pos)
			options.line += tmpOut.split('\n').length
			options.out.push(tmpOut)
			options.q = options.q.slice(pos)
		}
		// console.log(options.q.substr(1, 2).toLowerCase())
		if (options.endBodyMatch && options.q.search(options.endBodyMatch) === 0){
			options.endReached = true
			options.q = options.q.slice(options.q.indexOf('>') + 1)

		}
		else if (options.q.charAt(0) == '#'){
			options.mode = PROCESSVALUE
		}
		else if (options.q.substr(1, 2).toLowerCase() == 'cf'){
			// cf tag found
			options.mode = PROCESSTAG
		}
		else if (options.q.substr(1, 4) == '!---'){
			// cf comment found
			options.mode = PROCESSCOMMENT
		}
		else {
			options.out.push(options.q.slice(0, 1))
			options.q = options.q.slice(1)
		}

	}
	else {
		options.line += options.q.split('\n').length
		options.out.push(options.q)
		options.q = ''
		//options.fillQueue = true
	}

}
function processValue(options){
	var pos = options.q.indexOf('#', 1)
	//console.log('VALUE')
	//console.log(options.q)
	//console.log(pos)
	if (pos === -1) return (options.fillQueue = true)
	options.out.push({
		type: 'value',
		value: options.q.slice(1, pos)
	})
	options.q = options.q.slice(pos + 1)
	options.mode = PROCESSQUEUE
}
function processComment(options){
	var match, openCount = 0, start = 0
	reComment.lastIndex = 1
	while (match = reComment.exec(options.q)) {
		if (match[0] == '--->') {
			if (openCount-- === 0) {
				options.line += options.q.substring(start, match.index + match[0].length).split('\n').length
				start = match.index + match[0].length
			}
		}
		else {
			start = match.index
			openCount++
		}
	}
	if (start) {
		options.q = options.q.slice(start)
		options.mode = PROCESSQUEUE
	}
	else (options.fillQueue = true)
	//console.log(options.q)
	//process.exit()
}

function processTag(options){
	var nameLen, pos
	// get tag name
	if (! options.currentTag){
		nameLen = options.q.search(/(\s|>)/)
		//console.log("nameLen:"+nameLen)
		if (nameLen === -1) return (options.fillQueue = true)// let the queue fill up
		options.currentTag = {
			name: options.q.slice(1, nameLen),
			attribString: '',
			inQuotes: false,
			currentQuote: null,
			compiledBody: []
		}
		options.q = options.q.slice(nameLen)
	}

	if (! options.currentTag.inQuotes){
		pos = options.q.search(/['">]/)
		if (pos === -1) return (options.fillQueue = true)// let the queue fill up
		var char = options.q.charAt(pos)
		if (char == '"' || char == "'"){
			options.currentTag.inQuotes = true
			options.currentTag.currentQuote = char
			options.currentTag.attribString += options.q.slice(0, pos)
			options.q = options.q.slice(pos)
		}
		else {
			// '>' found
			options.currentTag.attribString += options.q.slice(0, pos)
			options.q = options.q.slice(pos + 1)
			var tag = tags[options.currentTag.name]
			//console.log(tag.afterCompile)
			if (tag.afterCompile) tag.afterCompile(options, compileFile, cache, options.currentTag)
			if (tag.hasBody) {
				// get tag body
				//options.currentTag.getBody = true
				options.currentTag.matcher = tag.closeTagMatch
				options.mode = PROCESSBODY
				if (tag.beforeBody) tag.beforeBody(options)
				processBody(options)
			}
			else {
				options.currentTag.index = options.out.length
				options.out.push(options.currentTag)
				options.mode = PROCESSQUEUE
				delete options.currentTag
			}
			return
		}
	}
	else {
		// in quoted string
		pos = options.q.indexOf(options.currentTag.currentQuote)
		if (pos === -1) return (options.fillQueue = true)// let the queue fill up
		options.currentTag.attribString += options.q.slice(0, pos + 1)
		options.q = options.q.slice(pos + 1)
		options.currentTag.inQuotes = false

	}

}

function processChunk(options){
	while (options.q.length && !options.fillQueue){
		if (options.mode === PROCESSTAG) processTag(options)
		else if (options.mode === PROCESSCOMMENT) processComment(options)
		else if (options.mode === PROCESSVALUE) processValue(options)
		else if (options.mode === PROCESSBODY) processBody(options)
		else processQueue(options)
	}
}

function compileString(str, evalVars){
	var options = {
		mode: PROCESSQUEUE,
		q: str,
		out: [],
		evalVars: evalVars,
		eof: true // needed so that the queue is processed to the end
	}
	processChunk(options)
	return options.out
}
function compileFile(path, callback){

	var stream = fs.createReadStream(path, 'utf8'),
		chunk,
		options = {
			chunkSize: chunkSize,
			mode: PROCESSQUEUE,
			q: '',
			out: [],
			path: path,
			line: 1,
			fillQueue: false,
			childProcesses: 0,
			onEnd: function(){
				if (! options.childProcesses) callback(null, options.out)
			}
		}

	console.log(path)
	if (path == 'inc.cfm') console.log(options)
	//stream.resume()
	stream.on('readable', function(){
		console.log('READABLE')
		console.log(path)
		if (path == 'inc.cfm') console.log(options)
		while (chunk = this.read(options.chunkSize)){
			options.q += chunk
			options.fillQueue = false
			processChunk(options)
		}
	})
	stream.on('error', function(err){
		throw err
	})

	stream.on('end', function(){
		options.eof = true
		console.log("options.q")
		console.log(options.q)
		if (options.q.length) {
			options.fillQueue = false
			processChunk(options)
			console.log('process remainaing queue')
		}
		// process remaining queue
		/* if (options.mode === PROCESSTAG) processTag(options)
		else if (options.mode === PROCESSCOMMENT) processComment(options)
		else if (options.mode === PROCESSVALUE) processValue(options)
		else if (options.mode === PROCESSBODY) processBody(options)
		else processQueue(options) */
		options.onEnd()



	})


}

function render(compiled, vars, callback){
	console.log(compiled)
	var out = ''

	//process.exit()
	compiled.forEach(function(instr){
		if (typeof instr == 'string') out += instr
		else if (instr.name) {
			var tag = tags[instr.name]
			out += tag.execute(instr.attribString, instr.compiledBody, vars, render, compileString, cache)
		}
		else if (instr.value) {
			if (vars[instr.value]) out += vars[instr.value]
			else {
				eval('tmp = ' + instr.value)
				out += tmp
			}
		}
	})
	console.log(out)
	return out
}
function renderString(str, vars, evalVars){
	return render(compileString(str, vars), vars, evalVars)
}

function compile(){
	var parser = new CFParser({path:path})
	var reader = new ChunkedReader()
	var s = fs.createReadStream(path)
	console.time('file '+path+' parsed')
	s.pipe(reader).pipe(parser)
	return parser
}

function renderFile(path, vars, callback){

	/*cache = cache || {}
	if (! cache[path]) {
		console.time('compiled')
		compileFile(path, function(err, compiled){
			//console.log(compiled)
			console.timeEnd('compiled')
			cache[path] = compiled
			console.time('file rendered')
			render(cache[path], vars, callback)
			console.timeEnd('file rendered')
		})
	}
	else render(cache[path], vars, callback)*/
	var parser = new CFParser({path:path})
	var reader = new ChunkedReader()
	var s = fs.createReadStream(path)
	console.time('file '+path+' parsed')
	s.pipe(reader).pipe(parser)//.pipe(process.stdout)

}

exports.renderString = renderString
exports.renderFile = renderFile
exports.compileFile = compileFile
