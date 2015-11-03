/* globals require, describe, it */
// jshint devel:true, curly: false, asi:true

var assert = require('assert')
var expect = require('expect.js')
var cfml = require('../index')

describe('The CFSET tag', function() {
	it('should assign a number literal', function(){
		var str = '<cfset a = 123>'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.a).to.be.a('number')
		expect(vars.a).to.be(123)
	})
	it('should assign a string literal', function(){
		var str = '<cfset a = "test">'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.a).to.be.a('string')
		expect(vars.a).to.be("test")
	})
	it('should assign an object literal', function(){
		var str = '<cfset a = {foo:"hello", bar:"world"}>'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.a).to.be.an('object')
		expect(vars.a).to.eql({foo:"hello", bar:"world"})
	})
	it('should assign an array literal', function(){
		var str = '<cfset a = [1,2,3]>'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.a).to.be.an('array')
		expect(vars.a).to.have.length(3)
		expect(vars.a).to.contain(1)
		expect(vars.a).to.contain(2)
		expect(vars.a).to.contain(3)
	})
	it('should evaluate pound signs in a string', function(){
		var str = '<cfset foo = "test"><cfset a = "a #foo# string">'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.a).to.be.a('string')
		expect(vars.a).to.be("a test string")
	})
	it('should evaluate pound signs in a variable name', function(){
		var str = '<cfset test = "foo"><cfset "#test#bar" = "hello">'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.foobar).to.be.a('string')
		expect(vars.foobar).to.be("hello")
	})
	it('should execute a function call', function(){
		var str = '<cfset test = [1,2,3]><cfset test.push(4)>'
		var vars = {}
		var result = cfml.processTemplate(str, '', vars)
		expect(vars.test).to.be.an('array')
		expect(vars.test).to.have.length(4)
		expect(vars.test).to.contain(4)
	})
})
