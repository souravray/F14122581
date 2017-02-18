
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

  if (!this.opt.choices) {
    this.throwParamError('choices');
  }

  this.firstRender = true;
  this.selected = 0;

  var def = this.opt.default;

  // Default being a Number
  if (_.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
    this.selected = def;
  }

  // Default being a String
  if (_.isString(def)) {
    this.selected = this.opt.choices.pluck('value').indexOf(def);
  }

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
      unvindedKey : events.keypress.filter(function (e) {
        if( !( e.key.name === 'c' || 
          e.key.name === "escape" || 
          (e.key.name === 'c' && e.key.ctrl) || 
          (e.key.name === 'z' && e.key.ctrl)  || 
          e.key.name === 'a' ||
          e.key.name === 'i' ||
          e.key.name === 'space' ||
          e.key.name === 'up' || e.key.name === 'k' || (e.key.name === 'p' && e.key.ctrl) ||
          e.key.name === 'down' || e.key.name === 'j' || (e.key.name === 'n' && e.key.ctrl) ||
          (e.value && '123456789'.indexOf(e.value) >= 0) ) ) {
          return false;
        }
      }).share(),
  });

  events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
  events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
  events.numberKey.takeUntil(events.line).forEach(this.onNumberKey.bind(this));
  events.escKey.takeUntil(events.line).forEach(this.onEsc.bind(this));

  events.copyKey
    .take(1)
    .map(this.getCurrentValue.bind(this))
    .flatMap(function (value) {
      return runAsync(self.opt.filter)(value).catch(function (err) {
        return err;
      });
    })
    .forEach(this.onCopy.bind(this));

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
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function () {
  // Render question
  var message = this.getQuestion();
  
  if (this.firstRender) {
    message += chalk.dim('(Use arrow keys)');
  }

  // Render choices or answer depending on the state
  if (this.status === 'answered') {
    message = chalk.green("    Opening ...");
  } else if (this.status === 'terminated') {
    message = chalk.red("    Exiting ...")
  } else {
    var choicesStr = listRender(this.formator, this.opt.choices, this.selected);
    var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
    message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    message += "\n\n  "+chalk.bgCyan.bold(" ↑ ") +" / " +chalk.bgCyan.bold(" ↓ ") +" Scroll \t" +chalk.bgCyan.bold(" C ") +" Quick Copy \t" + chalk.bgCyan.bold(" Enter ")+ " Expand \t" + chalk.bgRed.bold(" Esc ") + " Abort"
  }

  // message = message.replace(/\(Move up and down to reveal more choices\)/,"")

  this.firstRender = false;

  this.screen.render(message);
  cliCursor.hide();
};

/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function (value) {
  this.status = 'answered';

  // Rerender prompt
  this.render();

  this.screen.done();
  cliCursor.show();
  console.error ( this.done.toString())
  console.error(value)
  this.done(value);
};

Prompt.prototype.getCurrentValue = function () {
  return this.opt.choices.getChoice(this.selected).value;
};

/**
 * When user press a key
 */
Prompt.prototype.onUpKey = function () {
  var len = this.opt.choices.realLength;
  this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
  this.render();
};

Prompt.prototype.onDownKey = function () {
  var len = this.opt.choices.realLength;
  this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
  this.render();
};

Prompt.prototype.onNumberKey = function (input) {
  if (input <= this.opt.choices.realLength) {
    this.selected = input - 1;
  }
  this.render();
};

Prompt.prototype.onCopy = function (value) {
  this.status = 'answered';

  // Rerender prompt
  this.render();
  this.screen.done();
  cliCursor.show();
  this.done({val: value, option: "copy"});
  Clipboard.copy("Dymmy text here")
};


Prompt.prototype.onEsc = function (value) {
  this.status = 'terminated';

  // Rerender prompt
  this.render();
  this.screen.done();
  this.done();
};

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(formator, choices, pointer) {
  var output = '';
  var separatorOffset = 0;
 
  choices.forEach(function (choice, i) {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' +  choice + '\n';
      return;
    }

    if (choice.disabled) {
      separatorOffset++;
      output += '  - ' + choice.name;
      output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
      output += '\n';
      return;
    }

    var isSelected = (i - separatorOffset === pointer);
    var line = (isSelected ? figures.pointer + ' ' : '  ') + formator.indentedMultilineSection(choice.name);

    if (isSelected) {
      line = chalk.cyan(line);
    }
    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}