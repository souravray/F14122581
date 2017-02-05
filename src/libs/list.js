'use strict';

var chalk = require('chalk');
var inquirer = require('inquirer');
var extendedList = require('./prompts/extendedList')
const util = require('util')

// Option to disable Chalk colors
// chalk = new chalk.constructor({enabled: false});

let stdin = process.stdin;

inquirer.registerPrompt('exList', extendedList);


function constructChoices() {
	var choices = [];
	var space = ' ', separator = '- ';
	for(var i=0; i<10; i++) {
		var line = '';
		var number =  ' '+ i,
			command = 'recipe refresh',
			description = "command is dummmy, command is dummmy, command is dummmy! command is dummmy, command is dummmy, command is dummmy? ";

		// construct article message
		line += chalk.gray(number) + space;
		line += chalk.yellow(command) + space;
		line += '\n   ' + description + '\n'

		// line += number + space;
		// line +=  command + space;
		// line += '  ' + description + '\n'

		var choice = {
			'name': line,
			'short': line,
			'value': i + "abc"
		};
		choices.push(choice);
		new inquirer.Separator();
	};
	return choices;
}

function listTrendingPosts() {
	var choices = constructChoices();
	
	var pmt = inquirer.prompt([{
		type: 'exList',
		name: 'url',
		// message: 'Medium - Top Stories',
		message: 'Select the article to read :',
		choices: choices,
		pageSize: 20,
		input: stdin,
	}]);

	pmt.then(function (answers) {
		console.error ( "\n\n Got selected" + util.inspect(answers, false, null))
	});
}

function ls(modifier, options) {
	//post.getStories(modifier, options).then(function (posts) {
		listTrendingPosts();
	// }, function (err) {
	// 	console.log('Oops! Something went wrong! %s', err);
	// });
}

module.exports = ls;
