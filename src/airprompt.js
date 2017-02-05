#!/usr/bin/env node
'use strict';

var program = require('commander');
//var cliMd = require("mdy");

var list = require('./libs/list');
// var reader = require('./lib/details');
// var reader = require('./lib/message');

program
	.version('0.0.1')
	.description('cli for teams');

program
	.command('hello')
	.action(function(options){
		list('author', {});
	});

program
	.command('hi')
	.action(function(options){
		list('author', {});
	});


program.parse(process.argv);

if (!process.argv.slice(2).length) {
	// Show help by default
	program.outputHelp();
}