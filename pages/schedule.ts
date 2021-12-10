
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
   * data
   */
  get data() {
    // return data
    return {
      default : {
        title : 'The Schedule page requires a Model and form, do you want us to create those pages?',
        check : [
          'data.model',
        ],
        pages : [
          {
            _id  : 'model',
            type : 'model',
            icon : 'calendar-week fas',
            name : 'Entry',
            data : {
              forms : ['{{ form }}'],
            },
            parent : '{{ _id }}',
          },
          {
            _id  : 'form',
            type : 'form',
            icon : 'pencil fas',
            name : 'Create',
            data : {
              model  : '{{ model }}',
              fields : [
                {
                  name   : 'user',
                  type   : 'user',
                  uuid   : 'user',
                  label  : 'User',
                  order  : 0,
                  parent : 'root',
                },
                {
                  name   : 'date',
                  type   : 'date',
                  uuid   : 'date',
                  label  : 'Date',
                  order  : 1,
                  parent : 'root',

                  repeat   : true,
                  duration : true,
                },
              ]
            },
            parent : '{{ model }}',
          },
        ],
        replace : {
          'data.user'  : 'user',
          'data.date'  : 'date',
          'data.model' : '{{ model }}',
          'data.forms' : ['{{ form }}'],
          'data.group' : 'user',
        },
        replaceRaw : {
          'data.display' : '{{date date.start "hh:mm a"}} - {{date date.end "hh:mm a"}}',
        },
      }
    };
  }

  /**
   * returns page type
   */
  get icon() {
    // return page type label
    return 'fad fa-calendar-check text-info';
  }

  /**
   * returns page type
   */
  get title() {
    // return page type label
    return 'Schedule';
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
      view   : 'page/schedule',
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
    return 'Employee and Model scheduling';
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