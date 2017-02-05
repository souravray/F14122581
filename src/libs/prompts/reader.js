
var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var figures = require('figures');
var cliCursor = require('cli-cursor');
var runAsync = require('run-async');
var Base = require("inquirer/lib/prompts/base");
var observe = require("inquirer/lib/utils/events");
var Paginator = require("./utils/paginator");
var MultilineFormatter = require('./utils/multiline-formator');
var Choices = require('inquirer/lib/objects/choices');
var Separator = require('inquirer/lib/objects/separator');
var Clipboard  =  require("copy-paste");

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  if (!this.opt.message) {
    this.throwParamError('message');
  }

  this.firstRender = true;
  this.selected = 0;

  var def = this.opt.default;

  // Make sure no default is set (so it won't be printed)
  this.opt.default = null;

  this.paginator = new Paginator();
}

util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function (cb) {
  this.done = cb;

  var self = this;

  var events = observe(this.rl);

  this.formator =  new MultilineFormatter(this.rl, 4, false)
  // extending the key events
  _.assign( events, {
     copyKey: events.keypress.filter(function (e) {
        return e.key.name === 'c';
      }).share(),
     escKey : events.keypress.filter(function (e) {
        return e.key.name === "escape" || (e.key.name === 'c' && e.key.ctrl) || (e.key.name === 'z' && e.key.ctrl);
      }).share(),
  });

  events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
  events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
  events.escKey.takeUntil(events.line).forEach(this.onEsc.bind(this));
  events.copyKey.takeUntil(events.line).forEach(this.onCopy.bind(this));
  events.line
    .take(1)
    .map(this.getCurrentValue.bind(this))
    .flatMap(function (value) {
      return runAsync(self.opt.filter)(value).catch(function (err) {
        return err;
      });
    })
    .forEach(this.onSubmit.bind(this));

  // Init the prompt
  cliCursor.hide();
  this.render();
  return this;
};

/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.getQuestion = function () {
  var message = chalk.green('?') + ' ' + chalk.bold(this.opt.message) + ' ';

  // Append the default if available, and if question isn't answered
  if (this.opt.default != null && this.status !== 'answered') {
    message += chalk.dim('(' + this.opt.default + ') ');
  }

  return message;
};