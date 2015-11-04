/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var assert = require('assert')
var expect = require('expect.js')
var cfml = require('../index')
describe('The CFLOOP tags', function() {

	describe('The FROM/TO/INDEX LOOP', function() {

		it('should loop a number of times', function(){
			var str = '<cfoutput><cfloop from="0" to="2" index="i">#i#-</cfloop></cfoutput>'
			var vars = {}
			var result = cfml.processTemplate(str, '', vars)
			console.log(result)
			expect(result).to.be('0-1-2-')
		})


	})

	describe('The ARRAY LOOP', function() {

		it('should loop once per array item', function(){
			var str = '<cfoutput><cfloop array="test", index="i">#i#-</cfloop></cfoutput>'
			var vars = {test:[0,2,3]}
			var result = cfml.processTemplate(str, '', vars)
			console.log(result)
			expect(result).to.be('0-2-3-')
		})


	})


})
