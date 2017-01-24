#!/usr/bin/env node
'use strict';

var program = require('commander');
//var cliMd = require("mdy");

// var list = require('./lib/list');
// var reader = require('./lib/details');
// var reader = require('./lib/message');

program
	.version('0.0.1')
	.description('cli for teams');

program
	.command('hello')
	.action(function(options){
		console.log("hey!")
	});