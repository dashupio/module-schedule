
import Moment from 'moment'
import Simplebar from 'simplebar-react';
import { extendMoment } from 'moment-range';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import * as BigCalendar from 'react-big-calendar';
import React, { useRef, useState, useEffect } from 'react';
import { Box, Page, Avatar, Item, Stack, useTheme, Typography, Button, MenuItem, IconButton, Icon, Menu, Tooltip } from '@dashup/ui';

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
  // theme
  const theme = useTheme();

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
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(props.page.get('user.view') && views[props.page.get('user.view')] ? props.page.get('user.view') : 'schedule');
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [share, setShare] = useState(false);
  const [groups, setGroups] = useState([]);
  const [config, setConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(new Date());

  // refs
  const menuRef = useRef(null);
  
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
      // check groups
      if (!groups) return;

      // items
      localItems = await getQuery().listen();

      // load items
      setData(localItems);
      setGroups([...(props.page.get('data.disableUnassigned') ? [] : [{
        type  : 'unassigned',
        value : '0',
        label : 'Unassigned',
      }]), ...groups]);
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
    props.page.on('data.disableUnassigned', onUpdate);

    // return fn
    return () => {
      // remove listener
      props.page.removeListener('data.group', onUpdate);
      props.page.removeListener('data.filter', onUpdate);
      props.page.removeListener('user.search', onUpdate);
      props.page.removeListener('user.filter.me', onUpdate);
      props.page.removeListener('user.filter.tags', onUpdate);
      props.page.removeListener('data.disableUnassigned', onUpdate);

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
    props.page.get('data.disableUnassigned'),
    props.page.get('user.search'),
    props.page.get('user.filter.me'),
    props.page.get('user.filter.tags'),
  ]);

  // column sx
  const columnSx = {
    p        : 1,
    maxWidth : 320,
    minWidth : 320,
  };

  // return jsx
  return (
    <Page { ...props } loading={ loading } require={ required } onConfig={ () => setConfig(true) } onShare={ () => setShare(true) }>

      <Page.Share show={ share } onHide={ (e) => setShare(false) } />
      { !!props.item && <Page.Item show item={ props.item } saveEmpty setItem={ props.setItem } onHide={ (e) => props.setItem(null) } /> }
      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu presence={ props.presence }>
        <Button ref={ menuRef } variant="contained" onClick={ () => setOpen(true) }>
          View:
          { ' ' }
          <b>{ views[view] }</b>
        </Button>
        <Menu
          open={ open }
          onClose={ () => setOpen(false) }
          anchorEl={ menuRef?.current }
        >
          { Object.keys(views).map((key, i) => {
            // return jsx
            return (
              <MenuItem key={ `view-${key}` } onClick={ (e) => !setView(key) && props.setUser('view', key) }>
                { views[key] }
              </MenuItem>
            );
          }) }
        </Menu>

        <Button color="primary" variant="contained" disabled={ !!isToday() } onClick={ (e) => setDate(new Date()) }>
          { isToday() ? 'Today' : moment(date).format('LL') }
        </Button>

        <IconButton onClick={ (e) => onPrev(e) }>
          <Icon type="fas" icon="chevron-left" />
        </IconButton>
        <IconButton onClick={ (e) => onNext(e) }>
          <Icon type="fas" icon="chevron-right" />
        </IconButton>

        { props.dashup.can(props.page, 'submit') && !!props.getForms().length && (
          <Button variant="contained" color="primary" startIcon={ (
            <Icon type="fas" icon={ props.getForms()[0].get('icon') || 'plus' } />
          ) } onClick={ (e) => props.setItem(new props.dashup.Model({}, props.dashup)) }>
            { props.getForms()[0].get('name') }
          </Button>
        ) }
      </Page.Menu>
      <Page.Filter onSearch={ setSearch } onTag={ setTag } onFilter={ setFilter } isString />
      <Page.Body>
        <Box flex={ 1 } position="relative" sx={ {
          '--du-body' : theme.palette.text.primary,
          '--du-dark' : theme.palette.dark.main,
          '--du-primary' : theme.palette.primary.main,
          '--du-light-transparent' : `${theme.palette.light.main}2e`,
          '--du-primary-transparent' : `${theme.palette.primary.main}2e`,

          '& .DuiItemCard' : {
            height : '100%',
          }
        } }>
          <Box position="absolute" top={ 0 } left={ 0 } right={ 0 } bottom={ 0 } display="flex">
            { view === 'schedule' ? (
              <Box component={ Simplebar } className="shift-wrapper" sx={ {
                width  : '100%',
                height : '100%',
              } }>
                <Stack direction="row">
                  <Box sx={ columnSx } />
                  { getDates().map((date) => {
                    // return jsx
                    return (
                      <Box sx={ {
                        display       : 'flex',
                        alignItems    : 'center',
                        flexDirection : 'row',

                        ...columnSx,
                      } } key={ `title-${date}` }>
                        <Typography>
                          { moment(date).format('dddd Do MMM') }
                        </Typography>
                      </Box>
                    );
                  }) }
                </Stack>

                { groups.map((group) => {
                  // group
                  return (
                    <Stack direction="row" key={ group.value }>
                      <Box sx={ {
                        display       : 'flex',
                        borderTop     : `1px solid var(--du-light-transparent)`,
                        alignItems    : 'center',
                        borderRight   : `1px solid var(--du-light-transparent)`,
                        flexDirection : 'row',

                        ...columnSx,
                      } }>
                        { group.type !== 'unassigned' && (
                          <>
                            { group.type === 'member' && (
                              <Avatar image={ group?.data?.avatar } name={ group.label } sx={ { mr : 2 } } />
                            ) }
                            { group.label }
                          </>
                        ) }
                      </Box>
                      { getDates().map((date) => {
                        // range
                        const range = moment.range(date, moment(date).add(1, 'day').toDate());

                        // get sub items
                        const filteredItems = [...items].filter((item) => item.resourceId === group.value).filter((item) => {
                          // check date
                          return range.overlaps(item.range);
                        });
                        
                        // return jsx
                        return (
                          <Box sx={ {
                            cursor      : 'pointer',
                            borderTop   : `1px solid var(--du-light-transparent)`,
                            borderRight : `1px solid var(--du-light-transparent)`,

                            ...columnSx,

                            '&:hover .empty-slot' : {
                              height       : '100%',
                              border       : `1px dashed var(--du-light-transparent)`,
                              background   : 'rgba(0, 0, 0, 0.1)',
                              borderRadius : 2,
                            }
                          } } key={ `group-${group.value}-${date}` }>
                            { !filteredItems.length && (
                              <Box className="empty-slot" onClick={ (e) => {
                                onCreate({
                                  end   : moment(date).set({ hour : 17 }).toDate(),
                                  start : moment(date).set({ hour : 9 }).toDate(),

                                  resourceId : group.value,
                                })
                              } } />
                            ) }
                            { filteredItems.map((event) => {
                              // repeat
                              const repeat = event.repeat;

                              return (
                                <Tooltip key={ `schedule-item-${event.item.get('_id')}` } title={ (
                                  event.allDay ? (
                                    moment(event.start).format('MMM DD YYYY')
                                  ) : (
                                    `${moment(event.start).format('hh:mm a')} - ${moment(event.end).format('hh:mm a')}`
                                  )
                                ) }>
                                  <Box width="100%" height="100%">
                                    <Item
                                      size="sm"
                                      item={ event.item }
                                      page={ props.page }
                                      group={ 'schedule' }
                                      dashup={ props.dashup }
                                      template={ props.page.get('data.display') }
                                      getField={ props.getField }
                                      BodyProps={ {
                                        sx : {
                                          flex : 1,
                                        }
                                      } }
                                      repeat={ !!repeat && (
                                        <Box>
                                          Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                                          { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                                        </Box>
                                      ) }
                                      onClick={ () => props.setItem(event.item) }
                                    />
                                  </Box>
                                </Tooltip>
                              )
                            }) }
                          </Box>
                        );
                      }) }
                    </Stack>
                  );
                }) }
              </Box>
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
                drilldownView="agenda"

                components={ {
                  event : ({ event }) => {
                    // repeat
                    const repeat = event.repeat;

                    // return event
                    return (
                      <Tooltip title={ `${moment(event.start).format('hh:mm a')} - ${moment(event.end).format('hh:mm a')}` }>
                        <Box height="100%" width="100%">
                          <Item
                            key={ `schedule-item-${event.item.get('_id')}` }
                            size="sm"
                            item={ event.item }
                            page={ props.page }
                            group={ 'schedule' }
                            dashup={ props.dashup }
                            template={ props.page.get('data.display') }
                            getField={ props.getField }
                            BodyProps={ {
                              sx : {
                                flex : 1,
                              }
                            } }
                            repeat={ !!repeat && (
                              <Box>
                                Repeats every { repeat?.amount > 1 ? `${repeat.amount.toLocaleString()} ${repeat.period || 'day'}s` : (repeat.period || 'day') }
                                { repeat?.ends && repeat.until === 'until' ? ` until ${moment(repeat.until).format('LL')}` : '' }
                              </Box>
                            ) }
                            onClick={ () => props.setItem(event.item, true) }
                          />
                        </Box>
                      </Tooltip>
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
          </Box>
        </Box>
      </Page.Body>
    </Page>
  );
};

// export default
export default PageSchedule;