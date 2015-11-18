/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var expect = require('expect.js')
var cfml = require('../cfml')

describe('The CFPARAM tag', function() {

	it("should set the value of the default attribute if the variable doesn't exist", function(){
		var str = '<cfparam name="test" default="hello">'
		var vars = {}
		var result = cfml.renderString(str, vars)
		expect(vars.test).to.be('hello')
	})

	it("should not set the value of the default attribute if the variable exists", function(){
		var str = '<cfparam name="test" default="bar">'
		var vars = {test:"foo"}
		var result = cfml.renderString(str, vars)
		expect(vars.test).to.be('foo')
	})

	it("should throw an error if there is no default attribute and the variable is undefined", function(){
		var str = '<cfparam name="test">'
		var vars = {}
		expect(cfml.renderString).withArgs(str, vars).to.throwException();
	})

	it("should throw an error if there is no default attribute and the variable is undefined", function(){
		var str = '<cfparam name="test">'
		var vars = {test:"foo"}
		expect(cfml.renderString).withArgs(str, vars).to.not.throwException();
	})

})
