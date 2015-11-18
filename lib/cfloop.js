/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084, -W061
var utils = require('../utils')

exports.hasBody = true
exports.tagMatch = /<[\/]?cfloop[^>]*>/gi
exports.render = function(tag, vars, renderFn){
	var out = ''
	if (typeof tag.attributes.from != 'undefined' && typeof tag.attributes.to != 'undefined' && typeof tag.attributes.index != 'undefined'){
		// index loop
		tag.attributes.step = parseInt(tag.attributes.step) || 1
		for (var i=parseInt(tag.attributes.from), j=parseInt(tag.attributes.to); i < j + 1; i += tag.attributes.step){
			vars[tag.attributes.index] = i
			out += renderFn(tag.parsedBody, vars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	else if (tag.attributes.collection && tag.attributes.item){
		var collection = utils.evaluateRValue(tag.attributes.collection.replace(/#/g,''), vars, tag.path, tag.line) // TODO: improve this
		for (var k in collection){
			vars[tag.attributes.item] = k
			out += renderFn(tag.parsedBody, vars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	else if (tag.attributes.array && tag.attributes.index){
		var array = vars[tag.attributes.array.replace(/#/g, '')]
		if (! array) eval ("array = vars." + tag.attributes.array.replace(/#/g,''))
		for (var l=0,m=array.length; l < m; l++){
			vars[tag.attributes.index] = array[l];
			out += renderFn(tag.parsedBody, vars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP;
				break;
			}
		}
	}
	else if (tag.attributes.list && tag.attributes.index){
		tag.attributes.delimiter = tag.attributes.delimiter || ','
		var list = tag.attributes.list.indexOf('#')>-1 ? utils.replacePoundSigns(tag.attributes.list, vars) : tag.attributes.list
		var array = list.split(tag.attributes.delimiter)
		for (var n in array){
			vars[tag.attributes.index] = array[n]
			out += renderFn(tag.parsedBody, vars)
			if (vars.__BREAKLOOP){
				delete vars.__BREAKLOOP
				break;
			}
		}
	}
	// TODO: condition loop
	// TODO: query loop
	return out
}
