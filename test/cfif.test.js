/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var expect = require('expect.js')
var cfml = require('../cfml')
describe('The CFIF/CFELSE/CFELSEIF tags', function() {
	describe('The CFIF tag', function() {

		it('should output the tag content if the expression is truthy', function(){
			var str = '<cfif true>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('hello world')
		})
		it('should not output the tag content if the expression is falsy', function(){
			var str = '<cfif false>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('')
		})
		it('should support nesting', function(){
			var str = '<cfif true>hello <cfif true>world</cfif></cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('hello world')
		})

	})
	describe('The CFELSEIF tag', function() {

		it('should output the tag content if the expression is truthy and the cfif expression is falsy', function(){
			var str = '<cfif false>foo<cfelseif true>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('hello world')
		})
		it('should not output the tag content if the expression is truthy and the cfif expression is truthy', function(){
			var str = '<cfif true>foo<cfelseif true>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('foo')
		})
		it('should not output the tag content if the expression is falsey', function(){
			var str = '<cfif false>foo<cfelseif false>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('')
		})
	})

	describe('The CFELSE tag', function() {

		it('should output the tag content if the cfif expression is falsy and there is no cfelseif', function(){
			var str = '<cfif false>foo<cfelse>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('hello world')
		})
		it('should output the tag content if the cfif expression is falsy and all cfelseifs are falsey', function(){
			var str = '<cfif false>foo<cfelseif false>bar<cfelseif false>baz<cfelse>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('hello world')
		})
		it('should not output the tag content if the cfif expression is truthy', function(){
			var str = '<cfif true>foo<cfelse>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('foo')
		})
		it('should not output the tag content if any cfelseif is truthy', function(){
			var str = '<cfif false>foo<cfelseif false>bar<cfelseif true>baz<cfelse>hello world</cfif>'
			var vars = {}
			var result = cfml.renderString(str, vars)
			expect(result).to.be('baz')
		})
	})

})
