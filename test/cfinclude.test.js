/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var assert = require('assert')
var expect = require('expect.js')
var cfml = require('../index')
describe('The CFINCLUDE tag', function() {

	describe('The including template', function() {

		it('should output the content of the file', function(){
			var str = 'hello <cfinclude template="test/testinclude.cfm">'
			var vars = {}
			var result = cfml.processTemplate(str, '', vars)
			expect(result.trim()).to.be('hello world')
		})

		it('should be passed variables defined in the included template', function(){
			var str = '<cfset test = "hello"><cfinclude template="test/testinclude2.cfm"> <cfoutput>#test2#</cfoutput>'
			var vars = {}
			var result = cfml.processTemplate(str, '', vars)
			expect(result.trim()).to.be('hello world\n\n foo')
		})

	})

	describe('The included template', function() {

		it('should be passed variables defined in the including template', function(){
			var str = '<cfset test = "hello"><cfinclude template="test/testinclude2.cfm">'
			var vars = {}
			var result = cfml.processTemplate(str, '', vars)
			expect(result.trim()).to.be('hello world')
		})

	})

})
