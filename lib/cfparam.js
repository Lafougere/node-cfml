/* globals require, exports */
// jshint devel:true, curly: false, asi:true, -W084

var utils = require('../utils')

exports.render = function(tag, vars){
	if (tag.attributes.name && 'default' in tag.attributes && typeof vars[tag.attributes.name] == 'undefined'){
		// set default value
		if (/false/i.test(tag.attributes.default)) tag.attributes.default = false
		else if (/true/i.test(tag.attributes.default)) tag.attributes.default = true
		vars[tag.attributes.name] = utils.replacePoundSigns(tag.attributes.default, vars, tag.path, tag.line)
	}
	else if (tag.attributes.name && typeof tag.attributes.default == 'undefined' && typeof vars[tag.attributes.name] == 'undefined'){
		throw {message:"Parameter " + tag.attributes.name + " is required", abort:true}
	}
	return ''
}
