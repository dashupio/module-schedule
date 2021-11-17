
// import react
import React from 'react';
import { Query, View, TextField, MenuItem, Box, Divider } from '@dashup/ui';

// create page model config
const PageScheduleConfig = (props = {}) => {

  // get dashboards
  const getModels = () => {
    // get forms
    const models = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'model' && !page.get('archived');
    });

    // return mapped
    return models.map((model) => {
      // return values
      return {
        value : model.get('_id'),
        label : model.get('name'),

        selected : (props.page.get('data.model') || []).includes(model.get('_id')),
      };
    });
  };

  // get forms
  const getForms = () => {
    // get forms
    const forms = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'form' && page.get('data.model') === props.page.get('data.model') && !page.get('archived');
    });

    // return mapped
    return forms.map((form) => {
      // return values
      return {
        value : form.get('_id'),
        label : form.get('name'),

        selected : (props.page.get('data.forms') || []).includes(form.get('_id')),
      };
    });
  };
  
  // get field
  const getField = (tld, types = []) => {
    // return value
    return props.getFields().map((field) => {
      // check type
      if (types.length && !types.includes(field.type)) return;

      // return fields
      return {
        label : field.label || field.name,
        value : field.uuid,

        selected : (props.page.get(`data.${tld}`) || []).includes(field.uuid),
      };
    }).filter((f) => f);
  };

  // return jsx
  return (
    <>
      <TextField
        label="Choose Model"
        value={ props.page.get('data.model') }
        select
        onChange={ (e) => props.setData('model', e.target.value) }
        fullWidth
      >
        { getModels().map((option) => {
          // return jsx
          return (
            <MenuItem key={ option.value } value={ option.value }>
              { option.label }
            </MenuItem>
          );
        }) }
      </TextField>

      { !!props.page.get('data.model') && (
        <TextField
          label="Choose Form(s)"
          value={ Array.isArray(props.page.get('data.forms')) ? props.page.get('data.forms') : [props.page.get('data.forms')].filter((f) => f) }
          select
          onChange={ (e) => props.setData('forms', e.target.value) }
          fullWidth

          SelectProps={ {
            multiple : true,
          } }
        >
          { getForms().map((option) => {
            // return jsx
            return (
              <MenuItem key={ option.value } value={ option.value }>
                { option.label }
              </MenuItem>
            );
          }) }
        </TextField>
      ) }

      { !!props.page.get('data.model') && props.getFields && !!props.getFields().length && (
        <>
          <Box my={ 2 }>
            <Divider />
          </Box>

          <TextField
            label="Date Field"
            value={ props.page.get('data.date') }
            select
            onChange={ (e) => props.setData('date', e.target.value) }
            fullWidth
          >
            { getField('date', ['date']).map((option) => {
              // return jsx
              return (
                <MenuItem key={ option.value } value={ option.value }>
                  { option.label }
                </MenuItem>
              );
            }) }
          </TextField>
            
          <TextField
            label="Group Field"
            value={ props.page.get('data.group') }
            select
            onChange={ (e) => props.setData('group', e.target.value) }
            fullWidth
          >
            { getField('group').map((option) => {
              // return jsx
              return (
                <MenuItem key={ option.value } value={ option.value }>
                  { option.label }
                </MenuItem>
              );
            }) }
          </TextField>
        
          <TextField
            label="Tag Field(s)"
            value={ Array.isArray(props.page.get('data.tag')) ? props.page.get('data.tag') : [props.page.get('data.tag')].filter((f) => f) }
            select
            onChange={ (e) => props.setData('tag', e.target.value) }
            fullWidth

            SelectProps={ {
              multiple : true,
            } }
          >
            { getField('tag', ['select', 'checkbox']).map((option) => {
              // return jsx
              return (
                <MenuItem key={ option.value } value={ option.value }>
                  { option.label }
                </MenuItem>
              );
            }) }
          </TextField>
        
          <TextField
            label="Tag Field(s)"
            value={ Array.isArray(props.page.get('data.user')) ? props.page.get('data.user') : [props.page.get('data.user')].filter((f) => f) }
            select
            onChange={ (e) => props.setData('user', e.target.value) }
            fullWidth

            SelectProps={ {
              multiple : true,
            } }
          >
            { getField('user', ['user']).map((option) => {
              // return jsx
              return (
                <MenuItem key={ option.value } value={ option.value }>
                  { option.label }
                </MenuItem>
              );
            }) }
          </TextField>

          <View
            type="field"
            view="input"
            mode="handlebars"
            struct="code"
            field={ {
              label : 'Item Display'
            } }
            value={ props.page.get('data.display') }
            dashup={ props.dashup }
            onChange={ (f, val) => props.setData('display', val) }
          />

          <Query
            isString

            page={ props.page }
            label="Filter By"
            query={ props.page.get('data.filter') }
            dashup={ props.dashup }
            fields={ props.getFields() }
            onChange={ (val) => props.setData('filter', val) }
            getFieldStruct={ props.getFieldStruct }
          />
        </>
      ) }
    </>
  )
};

// export default
export default PageScheduleConfig;