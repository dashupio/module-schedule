
import Moment from 'moment'
import { Page, Card } from '@dashup/ui';
import { extendMoment } from 'moment-range';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import * as BigCalendar from 'react-big-calendar';
import React, { useState, useEffect } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

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
    'work_week' : 'Work Week',
  };

  // state
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(props.page.get('data.view') && views[props.page.get('data.view')] ? props.page.get('data.view') : 'week');
  const [data, setData] = useState([]);
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
          by    : groupBy,
          key   : groupBy.name || groupBy.uuid,
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
    if (['week', 'work_week'].includes(view)) {
      // week
      endDate = moment(date).endOf('week').toDate();
      startDate = moment(date).startOf('week').toDate();
    } else if (view === 'day') {
      // units
      endDate = moment(date).endOf('day').toDate();
      startDate = moment(date).startOf('day').toDate();
    }

    // add where
    query = query.or({
      [`${dateField.name || dateField.uuid}.end`] : {
        $lt : endDate,
      },
      [`${dateField.name || dateField.uuid}.start`] : {
        $gt : startDate,
      },
    }, {
      [`${dateField.name || dateField.uuid}.repeat`] : null,
      [`${dateField.name || dateField.uuid}.start`] : {
        $lt : endDate,
      },
    }, {
      [`${dateField.name || dateField.uuid}.repeat.ends`] : 'forever',
      [`${dateField.name || dateField.uuid}.start`]    : {
        $lt : endDate,
      },
    }, {
      [`${dateField.name || dateField.uuid}.repeat.until`] : {
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
  const getItems = () => {
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
    if (['week', 'work_week'].includes(view)) {
      // week
      endDate = moment(date).endOf('week').toDate();
      startDate = moment(date).startOf('week').toDate();
    } else if (view === 'day') {
      // units
      endDate = moment(date).endOf('day').toDate();
      startDate = moment(date).startOf('day').toDate();
    }

    // create range
    const range = moment.range(startDate, endDate);

    // push items
    return data.reduce((subAccum, item) => {
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
              field  : dateField,
              start  : subRange.start.toDate(),
              repeat : item.get(`${dateField.name || dateField.uuid}.repeat`),
            });
          }

          // add
          next.add(item.get(`${dateField.name || dateField.uuid}.repeat.amount`) || 1, item.get(`${dateField.name || dateField.uuid}.repeat.period`) || 'day');
        }
      } else {
        // return item
        mapValues({
          id    : item.get('_id'),
          field : dateField,
          end,
          item,
          start,
        });
      }

      // return sub accum
      return subAccum;
    }, []);
  };

  // on prev
  const onPrev = (e) => {
    // prevent
    e.preventDefault();
    e.stopPropagation();
    
    // check date
    if (['week', 'work_week'].includes(view)) {
      // add one month
      return setDate(moment(date).subtract(1, 'week').toDate());
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
    if (['week', 'work_week'].includes(view)) {
      // add one month
      return setDate(moment(date).add(1, 'week').toDate());
    }
    if (view === 'day') {
      // add one month
      setDate(moment(date).add(1, 'day').toDate());
    }
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
    // find
    loadGroups().then(async (groups) => {
      // load items
      setData(await getQuery().listen());
      setGroups([{
        value : '0',
        label : 'Unassigned',
      }, ...groups]);
    });

    // on update
    const onUpdate = () => {
      setUpdated(new Date());
    };

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
    };
  }, [
    props.page.get('_id'),
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

      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu onConfig={ () => setConfig(true) } onShare>
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
        </Dropdown>
        
      </Page.Menu>
      <Page.Filter onSearch={ setSearch } onTag={ setTag } onFilter={ setFilter } isString />
      <Page.Body>
        <div className="d-flex flex-1 fit-content">
          <Calendar
            view={ view }
            views={['day', 'week', 'work_week']}
            onView={ () => {} }
            

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

            components={ {
              event : (subProps = {}) => {
                // repeat
                const repeat = subProps.event.repeat;

                // return event
                return (
                  <OverlayTrigger
                    overlay={
                      <Tooltip>
                        { moment(subProps.event.start).format('hh:mm a') } - { moment(subProps.event.end).format('hh:mm a') }
                      </Tooltip>
                    }
                    placement="top"
                  >
                    <div className="h-100 w-100">
                      <Card
                        key={ `schedule-item-${subProps.event.item.get('_id')}` }
                        size="sm"
                        item={ subProps.event.item }
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
                      />
                    </div>
                  </OverlayTrigger>
                );
              },
            } }

            events={ getItems() }
            localizer={ localizer }
            resources={ groups }
            endAccessor="end"
            startAccessor="start"
            resourceIdAccessor="value"
            resourceTitleAccessor="label"
          />
        </div>
      </Page.Body>
    </Page>
  );
};

// export default
export default PageSchedule;