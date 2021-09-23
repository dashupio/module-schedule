
import Moment from 'moment'
import dotProp from 'dot-prop';
import Simplebar from 'simplebar-react';
import { extendMoment } from 'moment-range';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import * as BigCalendar from 'react-big-calendar';
import React, { useState, useEffect } from 'react';
import { Page, Card, Dropdown, OverlayTrigger, Tooltip } from '@dashup/ui';

// calendar
const Calendar = withDragAndDrop(BigCalendar.Calendar);

// extend
const moment = extendMoment(Moment);

// calendar
import './schedule.scss';

// to the correct localizer.
const localizer = BigCalendar.momentLocalizer(moment);

// calendar page
const PageSchedule = (props = {}) => {
  // required
  const required = [{
    key   : 'data.model',
    label : 'Model',
  }, {
    key   : 'data.forms.0',
    label : 'Form',
  }, {
    key   : 'data.date',
    label : 'Date',
  }, {
    key   : 'data.group',
    label : 'Group',
  }];

  // views
  const views = {
    'day'       : 'Day',
    'week'      : 'Week',
    'schedule'  : 'Schedule',
    'work_week' : 'Work Week',
    'month'     : 'Month',
  };

  // state
  const [date, setDate] = useState(new Date());
  const [form, setForm] = useState(null);
  const [view, setView] = useState(props.page.get('data.view') && views[props.page.get('data.view')] ? props.page.get('data.view') : 'work_week');
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [share, setShare] = useState(false);
  const [groups, setGroups] = useState([]);
  const [config, setConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  
  // load groups
  const loadGroups = async () => {
    // check groupBy
    if (!props.page.get('data.group')) return;

    // get groupBy field
    const groupBy = props.getFields().find((f) => f.uuid === props.page.get('data.group'));

    // check groupBy field
    if (!groupBy) return;

    // check if groupBy field has config options
    if (groupBy.options) {
      // return options
      return [...(groupBy.options || [])].map((option) => {
        // check option
        return {
          ...option,

          key : groupBy.name || groupBy.uuid,
        };
      });
    }

    // check if groupBy field is a user field
    if (groupBy.type === 'user') {
      // members
      const members = await eden.router.get(`/app/${props.dashup.get('_id')}/member/query`);

      // return members
      return members.map((member) => {
        // return key
        return {
          ...member,

          by    : groupBy,
          key   : groupBy.name || groupBy.uuid,
          type  : 'member',
          label : member.label,
          value : member.value,
        };
      });
    }

    // load other groupBy field by unique in db
    const uniqueGroups = await props.getQuery().count(groupBy.name || groupBy.uuid, true);

    // check counts
    if (uniqueGroups && Object.keys(uniqueGroups).length < 20) {
      // return map
      return Object.keys(uniqueGroups).map((key) => {
        // return key
        return {
          key   : groupBy.name || groupBy.uuid,
          label : key,
          value : key,
        };
      });
    }

    // return nothing
    return null;
  };

  // get query
  const getQuery = () => {
    // get data
    const { tag, user, forms, model, date : field, filter } = props.page.get('data');

    // check form/model
    if (!forms || !model || !field) return null;

    // get model
    const modelPage = props.dashup.page(model);

    // check page
    if (!modelPage) return null;

    // get form
    const actualForms = props.getForms([modelPage]);
    const fields = props.getFields(actualForms);
    const dateField = props.getField(field, fields);

    // get query
    let query = props.getQuery(modelPage, actualForms, { tag, user, filter });

    // date field
    if (!dateField) return null;

    // start end date
    let endDate   = null;
    let startDate = null;

    // calendar
    if (['week', 'work_week', 'schedule'].includes(view)) {
      // week
      endDate = moment(date).endOf('week').toDate();
      startDate = moment(date).startOf('week').toDate();
    } else if (view === 'month') {
      // units
      endDate = moment(date).endOf('month').toDate();
      startDate = moment(date).startOf('month').toDate();
    }else if (view === 'day') {
      // units
      endDate = moment(date).endOf('day').toDate();
      startDate = moment(date).startOf('day').toDate();
    }

    // add where
    query = query.or({
      // range included in date
      [`${dateField.name || dateField.uuid}.end`] : {
        $ne : null,
        $gt : startDate,
      },
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
      },
    }, {
      // single date included in date
      [`${dateField.name || dateField.uuid}.end`]   : null,
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
        $gt : startDate,
      },
    }, {
      // repeated forever
      [`${dateField.name || dateField.uuid}.repeat.ends`] : 'forever',
      [`${dateField.name || dateField.uuid}.start`]    : {
        $lt : endDate,
      },
    }, {
      // repeated until
      [`${dateField.name || dateField.uuid}.repeat.until`] : {
        $ne : null,
        $gt : startDate,
      },
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
      },
    });

    // return query
    return query;
  };

  // get items
  const getItems = (localItems = data) => {
    // get items
    const forms = props.getForms([props.page.get('data.model')]);
    const fields = props.getFields(forms);
    const dateField = props.getField(props.page.get('data.date'), fields);

    // get groupBy field
    const groupBy = props.getFields().find((f) => f.uuid === props.page.get('data.group'));

    // check gorup
    if (!groupBy) return [];

    // check field
    if (!dateField) return [];

    // start end date
    let endDate   = null;
    let startDate = null;

    // calendar
    if (['week', 'work_week', 'schedule'].includes(view)) {
      // week
      endDate = moment(date).endOf('week').toDate();
      startDate = moment(date).startOf('week').toDate();
    } else if (view === 'month') {
      // units
      endDate = moment(date).endOf('month').toDate();
      startDate = moment(date).startOf('month').toDate();
    } else if (view === 'day') {
      // units
      endDate = moment(date).endOf('day').toDate();
      startDate = moment(date).startOf('day').toDate();
    }

    // create range
    const range = moment.range(startDate, endDate);

    // push items
    return localItems.reduce((subAccum, item) => {
      // get start
      const start = new Date(item.get(`${dateField.name || dateField.uuid}.start`));
      const end   = item.get(`${dateField.name || dateField.uuid}.end`) ?
        new Date(item.get(`${dateField.name || dateField.uuid}.end`)) :
        moment(start).add(30, 'minutes').toDate();

      // key
      let key = item.get(`${groupBy.name || groupBy.uuid}`);

      // check array
      if (!Array.isArray(key)) key = key ? [key] : [];

      // map
      key = key.map((k) => k?.get ? k?.get('_id') : (k?.id || k)).filter((k) => k);

      // create map
      const mapValues = (data) => {
        // key length
        if (key.length) {
          // loop keys
          key.map((k) => {
            // push item
            subAccum.push({
              ...data,

              resourceId : k,
            });
          });
        } else {
          // push item
          subAccum.push({
            ...data,

            resourceId : '0',
          });
        }
      };

      // get repeat
      if (item.get(`${dateField.name || dateField.uuid}.repeat`)) {
        // loop repeat
        let next = moment(start);

        // chech while
        while (next.toDate() < endDate) {
          // get end
          const nextEnd = new Date(next.toDate().getTime() + item.get(`${dateField.name || dateField.uuid}.duration`));
          const subRange = moment.range(next.toDate(), nextEnd);

          // check ends within or starts within
          if (range.overlaps(subRange)) {
            // return accum
            mapValues({
              item,
              id     : `${item.get('_id')}-${subRange.end.format('LL')}`,
              end    : subRange.end.toDate(),
              range  : subRange,
              field  : dateField,
              start  : subRange.start.toDate(),
              allDay : dateField.date === 'date',
              repeat : item.get(`${dateField.name || dateField.uuid}.repeat`),
            });
          }

          // add
          next.add(item.get(`${dateField.name || dateField.uuid}.repeat.amount`) || 1, item.get(`${dateField.name || dateField.uuid}.repeat.period`) || 'day');
        }
      } else {
        // return item
        mapValues({
          id     : item.get('_id'),
          field  : dateField,
          range  : moment.range(start, end),
          allDay : dateField.date === 'date',
          end,
          item,
          start,
        });
      }

      // return sub accum
      return subAccum;
    }, []);
  };

  // get dates
  const getDates = () => {
    // start of week
    const ends = moment(date).endOf('week').add(1, 'day').toDate().getTime();
    const dates = [];
    let newDate = moment(date).startOf('week').add(1, 'day').toDate();

    // while
    while (newDate.getTime() <= ends) {
      dates.push(moment(newDate).startOf('day'));
      newDate = moment(newDate).add(1, 'day').toDate();
    }

    // return dates
    return dates;
  };

  // on prev
  const onPrev = (e) => {
    // prevent
    e.preventDefault();
    e.stopPropagation();
    
    // check date
    if (['week', 'work_week', 'schedule'].includes(view)) {
      // add one month
      return setDate(moment(date).subtract(1, 'week').toDate());
    }
    if (view === 'month') {
      // add one month
      return setDate(moment(date).subtract(1, 'month').toDate());
    }
    if (view === 'day') {
      // add one month
      return setDate(moment(date).subtract(1, 'day').toDate());
    }
  };

  // on next
  const onNext = (e) => {
    // prevent
    e.preventDefault();
    e.stopPropagation();
    
    // check date
    if (['week', 'work_week', 'schedule'].includes(view)) {
      // add one month
      return setDate(moment(date).add(1, 'week').toDate());
    }
    if (view === 'month') {
      // add one month
      setDate(moment(date).add(1, 'month').toDate());
    }
    if (view === 'day') {
      // add one month
      setDate(moment(date).add(1, 'day').toDate());
    }
  };

  // on create
  const onCreate = (data) => {
    // get items
    const forms = props.getForms([props.page.get('data.model')]);
    const fields = props.getFields(forms);
    const dateField = props.getField(props.page.get('data.date'), fields);
    const groupField = props.getField(props.page.get('data.group'), fields);

    // group
    const group = groups.find((g) => g.value === data.resourceId);
    
    // set item
    setForm(props.getForms()[0].get('_id'));
    props.setItem(new props.dashup.Model({
      [dateField.name || dateField.uuid] : {
        end      : data.end,
        type     : 'date',
        start    : data.start,
        duration : (data.end.getTime() - data.start.getTime()),
      },
      [groupField.name || groupField.uuid] : group?.data,
    }, props.dashup));
  };

  // is today
  const isToday = () => {
    // check day
    return moment().format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD');
  };

  // set tag
  const setTag = async (field, value) => {
    // set tag
    let tags = (props.page.get('user.filter.tags') || []).filter((t) => typeof t === 'object');

    // check tag
    if (tags.find((t) => t.field === field.uuid && t.value === (value?.value || value))) {
      // exists
      tags = tags.filter((t) => t.field !== field.uuid || t.value !== (value?.value || value));
    } else {
      // push tag
      tags.push({
        field : field.uuid,
        value : (value?.value || value),
      });
    }

    // set data
    await props.setUser('filter.tags', tags);
  };

  // set search
  const setSearch = (search = '') => {
    // set page data
    props.page.set('user.search', search.length ? search : null);
  };

  // set filter
  const setFilter = async (filter) => {
    // set data
    props.setUser('query', filter, true);
  };

  // use effect
  useEffect(() => {
    // let items
    let localItems = null;

    // on update
    const onUpdate = () => {
      setUpdated(new Date());
    };
    const onItems = () => {
      setItems(getItems(localItems));
    };

    // find
    loadGroups().then(async (groups) => {
      // items
      localItems = await getQuery().listen();

      // load items
      setData(localItems);
      setGroups([{
        type  : 'unassigned',
        value : '0',
        label : 'Unassigned',
      }, ...groups]);
      setItems(getItems(localItems));

      // on update
      localItems.on('update', onItems);
      localItems.on('update', onUpdate);
    });

    // add listener
    props.page.on('data.group', onUpdate);
    props.page.on('data.filter', onUpdate);
    props.page.on('user.search', onUpdate);
    props.page.on('user.filter.me', onUpdate);
    props.page.on('user.filter.tags', onUpdate);

    // return fn
    return () => {
      // remove listener
      props.page.removeListener('data.group', onUpdate);
      props.page.removeListener('data.filter', onUpdate);
      props.page.removeListener('user.search', onUpdate);
      props.page.removeListener('user.filter.me', onUpdate);
      props.page.removeListener('user.filter.tags', onUpdate);

      // if
      if (localItems) {
        localItems.deafen();
        localItems.removeListener('update', onItems);
        localItems.removeListener('update', onUpdate);
      }
    };
  }, [
    view,
    props.page.get('type'),
    props.page.get('data.group'),
    props.page.get('data.filter'),
    props.page.get('user.search'),
    props.page.get('user.filter.me'),
    props.page.get('user.filter.tags'),
  ]);

  // return jsx
  return (
    <Page { ...props } loading={ loading } require={ required } bodyClass="flex-column">

      <Page.Share show={ share } onHide={ (e) => setShare(false) } />
      { !!props.item && <Page.Item show item={ props.item } form={ form } setItem={ props.setItem } onHide={ (e) => props.setItem(null) } /> }
      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu onConfig={ () => setConfig(true) } presence={ props.presence } onShare={ () => setShare(true) }>
        <Dropdown>
          <Dropdown.Toggle variant="light" id="dropdown-limit" className="me-2">
            View:
            <b className="ms-1">{ views[props.page.get('data.view') || 'week'] }</b>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            { Object.keys(views).map((key, i) => {
              // return jsx
              return (
                <Dropdown.Item key={ `view-${key}` } onClick={ (e) => !setView(key) && props.setData('view', key) }>
                  { views[key] }
                </Dropdown.Item>
              );
            }) }
          </Dropdown.Menu>
        </Dropdown>

        <button className={ `btn me-1 btn-primary${isToday() ? ' disabled' : ''}` } onClick={ (e) => setDate(new Date()) }>
          { isToday() ? 'Today' : moment(date).format('LL') }
        </button>
        <div className="btn-group me-2">
          <button className="btn btn-primary" onClick={ (e) => onPrev(e) } data-toggle="tooltip" title="Previous">
            <i className="fa fa-chevron-left" />
          </button>
          <button className="btn btn-primary" onClick={ (e) => onNext(e) } data-toggle="tooltip" title="Next">
            <i className="fa fa-chevron-right" />
          </button>
        </div>
        { props.dashup.can(props.page, 'submit') && !!props.getForms().length && (
          props.getForms().length > 1 ? (
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-create" className="me-2">
                <i className="fat fa-plus me-2" />
                Create
              </Dropdown.Toggle>
  
              <Dropdown.Menu>
                { props.getForms().map((form) => {
  
                  // return jsx
                  return (
                    <Dropdown.Item key={ `create-${form.get('_id')}` } onClick={ (e) => !setForm(form.get('_id')) && props.setItem(new props.dashup.Model({}, props.dashup)) }>
                      <i className={ `me-2 fa-${form.get('icon') || 'pencil fas'}` } />
                      { form.get('name') }
                    </Dropdown.Item>
                  );
                }) }
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <button className="btn btn-primary me-2" onClick={ (e) => !setForm(props.getForms()[0].get('_id')) && props.setItem(new props.dashup.Model({}, props.dashup)) }>
              <i className={ `me-2 fa-${props.getForms()[0].get('icon') || 'pencil fas'}` } />
              { props.getForms()[0].get('name') }
            </button>
          )
        ) }
      </Page.Menu>
      <Page.Filter onSearch={ setSearch } onTag={ setTag } onFilter={ setFilter } isString />
      <Page.Body>
        <div className="d-flex flex-1 fit-content">
          { view === 'schedule' ? (
            <Simplebar className="ox-hidden shift-wrapper">
              <div className="row g-0">
                <div className="shift-column">
                  <div className="shift-header">
                    &nbsp;
                  </div>
                  { groups.map((group) => {
                    // group
                    return (
                      <div key={ group.value } className="shift-slot">
                        { group.type !== 'unassigned' && (
                          <>
                            { group.type === 'member' && (
                              <img src={ dotProp.get(group, 'data.avatar.0.thumbs.2x-sq.url') || '/public/assets/images/avatar.png' } className="img-avatar rounded-circle me-3" />
                            ) }
                            { group.label }
                          </>
                        ) }
                      </div>
                    );
                  }) }
                </div>
                <div className="flex-1 shift-columns">
                  <Simplebar className="w-100">
                    { getDates().map((date) => {
                      // return jsx
                      return (
                        <div key={ `${date.toISOString()}`.toLowerCase() } className="shift-column">
                          <div className="shift-header">
                            { moment(date).format('dddd') }
                            <span className="ms-auto">
                              { moment(date).format('Do MMM') }
                            </span>
                          </div>
                          { groups.map((group) => {
                            // range
                            const range = moment.range(date, moment(date).add(1, 'day').toDate());

                            // get sub items
                            const filteredItems = [...items].filter((item) => item.resourceId === group.value).filter((item) => {
                              // check date
                              return range.overlaps(item.range);
                            });

                            // group
                            return (
                              <div key={ `${date.toISOString()}-${group.value}` } className="shift-slot">
                                { filteredItems.map((event) => {
                                  // repeat
                                  const repeat = event.repeat;

                                  return (
                                    <OverlayTrigger
                                      key={ `${date.toISOString()}-${group.value}-${event.id}` }
                                      overlay={
                                        <Tooltip>
                                          { event.allDay ? (
                                            moment(event.start).format('MMM DD YYYY')
                                          ) : (
                                            `${moment(event.start).format('hh:mm a')} - ${moment(event.end).format('hh:mm a')}`
                                          ) }
                                        </Tooltip>
                                      }
                                      placement="top"
                                    >
                                      <div className="h-100 w-100">
                                        <Card
                                          key={ `schedule-item-${event.item.get('_id')}` }
                                          size="sm"
                                          item={ event.item }
                                          page={ props.page }
                                          group={ 'schedule' }
                                          dashup={ props.dashup }
                                          template={ props.page.get('data.display') }
                                          getField={ props.getField }
                                          repeat={ !!repeat && (
                                            <Tooltip>
                                              Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                                              { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                                            </Tooltip>
                                          ) }
                                          onClick={ () => !setForm(event.item.get('_meta.form') || props.getForms()[0].get('_id')) && props.setItem(event.item) }
                                        />
                                      </div>
                                    </OverlayTrigger>
                                  )
                                }) }
                              </div>
                            );
                          }) }
                        </div>
                      )
                    }) }
                  </Simplebar>
                </div>
              </div>
            </Simplebar>
          ) : (
            <Calendar
              view={ view }
              step={ 30 }
              views={ ['day', 'week', 'work_week', 'month'] }
              onView={ () => {} }
              selectable

              date={ date }
              onNavigate={ () => {} }
              onEventDrop={ ({ start, end, event, resourceId }) => {
                // get groupBy field
                const groupBy = props.getFields().find((f) => f.uuid === props.page.get('data.group'));
                
                // set item
                event.item.set(`${groupBy.name || groupBy.uuid}`, resourceId === '0' ? null : resourceId);
                event.item.set(`${event.field.name || event.field.uuid}.end`, end);
                event.item.set(`${event.field.name || event.field.uuid}.start`, start);
                event.item.save();
                setUpdated(new Date());
              } }
              onEventResize={ ({ start, end, event, resourceId }) => {
                // get groupBy field
                const groupBy = props.getFields().find((f) => f.uuid === props.page.get('data.group'));

                // set item
                event.item.set(`${groupBy.name || groupBy.uuid}`, resourceId === '0' ? null : resourceId);
                event.item.set(`${event.field.name || event.field.uuid}.end`, end);
                event.item.set(`${event.field.name || event.field.uuid}.start`, start);
                event.item.save();
                setUpdated(new Date());
              } }
              onSelectSlot={ onCreate }

              components={ {
                event : ({ event }) => {
                  // repeat
                  const repeat = event.repeat;

                  // return event
                  return (
                    <OverlayTrigger
                      overlay={
                        <Tooltip>
                          { moment(event.start).format('hh:mm a') } - { moment(event.end).format('hh:mm a') }
                        </Tooltip>
                      }
                      placement="top"
                    >
                      <div className="h-100 w-100">
                        <Card
                          key={ `schedule-item-${event.item.get('_id')}` }
                          size="sm"
                          item={ event.item }
                          page={ props.page }
                          group={ 'schedule' }
                          dashup={ props.dashup }
                          template={ props.page.get('data.display') }
                          getField={ props.getField }
                          repeat={ !!repeat && (
                            <Tooltip>
                              Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                              { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                            </Tooltip>
                          ) }
                          onClick={ () => !setForm(event.item.get('_meta.form') || props.getForms()[0].get('_id')) && props.setItem(event.item) }
                        />
                      </div>
                    </OverlayTrigger>
                  );
                },
                
              } }

              events={ items }
              localizer={ localizer }
              resources={ groups }
              endAccessor="end"
              startAccessor="start"
              resourceIdAccessor="value"
              resourceTitleAccessor="label"
            />
          ) }
        </div>
      </Page.Body>
    </Page>
  );
};

// export default
export default PageSchedule;