
// import page interface
import { Struct } from '@dashup/module';

/**
 * build address helper
 */
export default class SchedulePage extends Struct {
  /**
   * constructor
   *
   * @param args 
   */
  constructor(...args) {
    // run super
    super(...args);

    // sanitise
    this.keyAction = this.keyAction.bind(this);
  }

  /**
   * returns page type
   */
  get type() {
    // return page type label
    return 'schedule';
  }

  /**
   * returns page type
   */
  get icon() {
    // return page type label
    return 'fa fa-calendar-check';
  }

  /**
   * returns page type
   */
  get title() {
    // return page type label
    return 'Schedule Page';
  }

  /**
   * returns page data
   */
  get actions() {
    // return page data
    return {
      key : this.keyAction,
    };
  }

  /**
   * returns object of views
   */
  get views() {
    // return object of views
    return {
      view   : 'page/schedule/view',
      menu   : 'page/schedule/menu',
      config : 'page/schedule/config',
    };
  }

  /**
   * returns category list for page
   */
  get categories() {
    // return array of categories
    return ['View'];
  }

  /**
   * returns page descripton for list
   */
  get description() {
    // return description string
    return 'Scheduleation view page';
  }

  /**
   * schedule key
   *
   * @param args 
   */
  async keyAction(opts, page) {
    // load key
    const key = await this.dashup.connection.rpc(opts, 'page.key', page);

    // return key
    return key;
  }
}