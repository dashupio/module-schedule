// require first
const { Module } = require('@dashup/module');

// import base
const SchedulePage = require('./pages/schedule');

/**
 * export module
 */
class ScheduleModule extends Module {

  /**
   * construct discord module
   */
  constructor() {
    // run super
    super();
  }
  
  /**
   * registers dashup structs
   *
   * @param {*} register 
   */
  register(fn) {
    // register pages
    fn('page', SchedulePage);
  }
}

// create new
module.exports = new ScheduleModule();
