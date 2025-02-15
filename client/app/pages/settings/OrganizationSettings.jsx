import React from 'react';
import { react2angular } from 'react2angular';
import { isEmpty, join, get } from 'lodash';

import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Checkbox from 'antd/lib/checkbox';
import Tooltip from 'antd/lib/tooltip';
import LoadingState from '@/components/items-list/components/LoadingState';
import { HelpTrigger } from '@/components/HelpTrigger';

import { routesToAngularRoutes } from '@/lib/utils';
import { clientConfig } from '@/services/auth';
import settingsMenu from '@/services/settingsMenu';
import recordEvent from '@/services/recordEvent';
import OrgSettings from '@/services/organizationSettings';

const Option = Select.Option;

class OrganizationSettings extends React.Component {
  state = {
    settings: {},
    formValues: {},
    loading: true,
    submitting: false,
  };

  componentDidMount() {
    recordEvent('view', 'page', 'org_settings');
    OrgSettings.get().then((response) => {
      const settings = get(response, 'settings');
      this.setState({ settings, formValues: { ...settings }, loading: false });
    });
  }

  disablePasswordLoginToggle = () => !(clientConfig.googleLoginEnabled || this.state.formValues.auth_saml_enabled);

  handleSubmit = (e) => {
    e.preventDefault();
    if (!this.state.submitting) {
      this.setState({ submitting: true });
      OrgSettings.save(this.state.formValues)
        .then((response) => {
          const settings = get(response, 'settings');
          this.setState({ settings, formValues: { ...settings } });
        })
        .finally(() => this.setState({ submitting: false }));
    }
  };

  handleChange = (name, value) => {
    this.setState(prevState => ({ formValues: Object.assign(prevState.formValues, { [name]: value }) }), () => {
      if (this.disablePasswordLoginToggle() && !this.state.formValues.auth_password_login_enabled) {
        this.handleChange('auth_password_login_enabled', true);
      }
    });
  };

  renderGoogleLoginOptions() {
    const { formValues } = this.state;
    return (
      <React.Fragment>
        <h4>Google Login</h4>
        <Form.Item label="Allowed Google Apps Domains">
          <Select
            mode="tags"
            value={formValues.auth_google_apps_domains}
            onChange={value => this.handleChange('auth_google_apps_domains', value)}
          />
          {!isEmpty(formValues.auth_google_apps_domains) && (
          <Alert
            message={(
              <p>
                Any user registered with a <strong>{join(formValues.auth_google_apps_domains, ', ')}</strong>{' '}
                Google Apps account will be able to login. If they don{'\''}t have an existing user,
                a new user will be created and join the <strong>Default</strong> group.
              </p>
            )}
            className="m-t-15"
          />
          )}
        </Form.Item>
      </React.Fragment>
    );
  }

  renderSAMLOptions() {
    const { formValues } = this.state;
    return (
      <React.Fragment>
        <h4>SAML</h4>
        <Form.Item>
          <Checkbox
            name="auth_saml_enabled"
            checked={formValues.auth_saml_enabled}
            onChange={e => this.handleChange('auth_saml_enabled', e.target.checked)}
          >
            SAML Enabled
          </Checkbox>
        </Form.Item>
        {formValues.auth_saml_enabled && (
          <div>
            <Form.Item label="SAML Metadata URL">
              <Input
                value={formValues.auth_saml_metadata_url}
                onChange={e => this.handleChange('auth_saml_metadata_url', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="SAML Entity ID">
              <Input
                value={formValues.auth_saml_entity_id}
                onChange={e => this.handleChange('auth_saml_entity_id', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="SAML NameID Format">
              <Input
                value={formValues.auth_saml_nameid_format}
                onChange={e => this.handleChange('auth_saml_nameid_format', e.target.value)}
              />
            </Form.Item>
          </div>
        )}
      </React.Fragment>
    );
  }

  renderGeneralSettings() {
    const { formValues } = this.state;
    return (
      <React.Fragment>
        <h3 className="m-t-0">General</h3>
        <hr />
        <Form.Item label="Date Format">
          <Select
            value={formValues.date_format}
            onChange={value => this.handleChange('date_format', value)}
            data-test="DateFormatSelect"
          >
            {clientConfig.dateFormatList.map(dateFormat => (
              <Option key={dateFormat}>{dateFormat}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Time Format">
          <Select
            value={formValues.time_format}
            onChange={value => this.handleChange('time_format', value)}
            data-test="TimeFormatSelect"
          >
            {clientConfig.timeFormatList.map(timeFormat => (
              <Option key={timeFormat}>{timeFormat}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Multi-byte Search">
          <Checkbox
            name="multi_byte_search_enabled"
            checked={formValues.multi_byte_search_enabled}
            onChange={e => this.handleChange('multi_byte_search_enabled', e.target.checked)}
          >
          Enable multi-byte (Chinese, Japanese, and Korean) search for query names and descriptions (slower)
          </Checkbox>
        </Form.Item>
        <Form.Item label="Feature Flags">
          <Checkbox
            name="feature_show_permissions_control"
            checked={formValues.feature_show_permissions_control}
            onChange={e => this.handleChange('feature_show_permissions_control', e.target.checked)}
          >
            Enable experimental multiple owners support
          </Checkbox>
        </Form.Item>
      </React.Fragment>
    );
  }

  renderAuthSettings() {
    const { settings, formValues } = this.state;
    return (
      <React.Fragment>
        <h3 className="m-t-0">
          Authentication <HelpTrigger type="AUTHENTICATION_OPTIONS" />
        </h3>
        <hr />
        {!settings.auth_password_login_enabled && (
        <Alert
          message="Password based login is currently disabled and users will
            be able to login only with the enabled SSO options."
          type="warning"
          className="m-t-15 m-b-15"
        />
        )}
        <Form.Item>
          <Checkbox
            checked={formValues.auth_password_login_enabled}
            disabled={this.disablePasswordLoginToggle()}
            onChange={e => this.handleChange('auth_password_login_enabled', e.target.checked)}
          >
            <Tooltip
              title={this.disablePasswordLoginToggle() ?
                'Password login can be disabled only if another login method is enabled.' : null}
              placement="right"
            >
              Password Login Enabled
            </Tooltip>
          </Checkbox>
        </Form.Item>
        {clientConfig.googleLoginEnabled && this.renderGoogleLoginOptions()}
        {this.renderSAMLOptions()}
      </React.Fragment>
    );
  }

  render() {
    const { loading, submitting } = this.state;
    return (
      <div className="row" data-test="OrganizationSettings">
        <div className="col-md-offset-4 col-md-4">
          {loading ? (<LoadingState className="" />) : (
            <Form layout="vertical" onSubmit={this.handleSubmit}>
              {this.renderGeneralSettings()}
              {this.renderAuthSettings()}
              <Button className="w-100" type="primary" htmlType="submit" loading={submitting}>
                Save
              </Button>
            </Form>
          )}
        </div>
      </div>
    );
  }
}

export default function init(ngModule) {
  settingsMenu.add({
    permission: 'admin',
    title: 'Settings',
    path: 'settings/organization',
    order: 6,
  });

  ngModule.component('pageOrganizationSettings', react2angular(OrganizationSettings));

  return routesToAngularRoutes([
    {
      path: '/settings/organization',
      title: 'Organization Settings',
      key: 'organization-settings',
    },
  ], {
    reloadOnSearch: false,
    template: '<settings-screen><page-organization-settings on-error="handleError"></page-organization-settings></settings-screen>',
    controller($scope, $exceptionHandler) {
      'ngInject';

      $scope.handleError = $exceptionHandler;
    },
  });
}

init.init = true;
