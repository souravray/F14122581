'use strict';
var _ = require('lodash');
var cliWidth = require('cli-width');
var stripAnsi = require('strip-ansi');
var stringWidth = require('string-width');
var space = ' ', separator = '- ', tab = '  ';
var spaceWidth  = stringWidth(space);


var MultilineFormatter = module.exports = function (_rl, _indentSize, _indentfirstLine) {
	this.rl = _rl;
	this.indent  = this.indentation(_indentSize);
	this.indentSize = _indentSize;
	this.indentfirstLine =  _indentfirstLine;
	this.width = this.normalizedCliWidth ();

};

MultilineFormatter.prototype.indentedMultilineSection = function(section) {
	var formatedSection = "";
	var paras = section.split('\n');
	for (var  paraIndx  in  paras) {
    	var para =  paras[paraIndx];
    	formatedSection +=  "\n" + this.indentedMultilineParagraph(para)
    }
	return formatedSection.replace(/^\s+/g, '');
};


MultilineFormatter.prototype.indentedMultilineParagraph = function(paragarph) {
	
	return forceLineReturn(paragarph, this.width, 	this.indent, this.indentSize, this.indentfirstLine)
};

MultilineFormatter.prototype.indentation =  function(indentSize) {
	var indent = ''
	for (var i=0; i<indentSize; i++) {
		indent += space;
	}

	return indent;
}

MultilineFormatter.prototype.normalizedCliWidth = function() {
  var width = cliWidth({
    defaultWidth: 80,
    output: this.rl.output
  });
  if (process.platform === 'win32') {
    return width - 2;
  }
  return width - 1;
};

function breakLines(lines, width, indent, indentSize, indentfirstLine) {
 return lines.map(function (line) {
  var spaceLeft = width
  var words =  line.split(' ');
  var paragarph =  indentfirstLine? indent : "";
  for (var  wordIdx  in  words) {
    var word =  words[wordIdx];
    if( (stringWidth(word) + spaceWidth ) > spaceLeft ) {
      paragarph += "\n" + indent + word;
      spaceLeft = width - (stringWidth(word) + indentSize)
    } else {
      paragarph += " "+ word;
      spaceLeft = spaceLeft - (stringWidth(word) + spaceWidth)
    }
  }
  return paragarph;
 });
}

function forceLineReturn(content, width, indent, indentSize, indentfirstLine) {
  return _.flatten(breakLines(content.split('\n'), width, indent, indentSize, indentfirstLine)).join('\n');
}
