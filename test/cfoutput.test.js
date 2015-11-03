/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var assert = require('assert')
var expect = require('expect.js')
var cfml = require('../index')

describe('The CFOUTPUT tag', function() {

	it('should replace variables in pound signs', function(){
		var str = 'hello <cfoutput>#test#</cfoutput>'
		var vars = {test:'world'}
		var result = cfml.processTemplate(str, '', vars)
		expect(result).to.be('hello world')
	})
	it('pound signs outside cfoutput should not be replaced', function(){
		var str = '#test# <cfoutput>#test2#</cfoutput>'
		var vars = {test2:'world'}
		var result = cfml.processTemplate(str, '', vars)
		expect(result).to.be('#test# world')
	})

})
