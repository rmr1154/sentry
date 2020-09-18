import React from 'react';
import styled from '@emotion/styled';
import {RouteComponentProps} from 'react-router/lib/Router';
import pick from 'lodash/pick';

import {URL_PARAM} from 'app/constants/globalSelectionHeader';
import {t} from 'app/locale';
import DropdownControl, {DropdownItem} from 'app/components/dropdownControl';
import overflowEllipsis from 'app/styles/overflowEllipsis';
import space from 'app/styles/space';
import {Repository} from 'app/types';
import AsyncView from 'app/views/asyncView';
import LoadingError from 'app/components/loadingError';
import {Panel, PanelBody} from 'app/components/panels';
import EmptyStateWarning from 'app/components/emptyStateWarning';

import NoRepoConnected from './noRepoConnected';

const ALL_REPOSITORIES_LABEL = t('All Repositories');
const ITEMS_PER_PAGE = 20;

type RouteParams = {orgId: string; release: string};

type Props = RouteComponentProps<RouteParams, {}> & AsyncView['props'];

type State = {
  repos: Array<Repository>;
  activeRepo: string;
  dropdownButtonWidth?: number;
} & AsyncView['state'];

class Repositories<P extends Props = Props, S extends State = State> extends AsyncView<
  P,
  S
> {
  UNSAFE_componentWillReceiveProps(nextProps: P) {
    this.setActiveRepo(nextProps);
  }

  componentDidMount() {
    this.setActiveRepo(this.props);
  }

  componentDidUpdate(prevProps: P, prevState: S) {
    if (
      !this.state.dropdownButtonWidth ||
      prevState.activeRepo !== this.state.activeRepo
    ) {
      this.setButtonDropDownWidth();
    }

    super.componentDidUpdate(prevProps, prevState);
  }
  setButtonDropDownWidth() {
    const dropdownButtonWidth = this.dropdownButton?.current?.offsetWidth;
    if (dropdownButtonWidth) {
      this.setState({dropdownButtonWidth});
    }
  }

  dropdownButton = React.createRef<HTMLButtonElement>();

  setActiveRepo(props: Props) {
    const activeRepo = props.location.query?.activeRepo;
    if (activeRepo !== this.state.activeRepo) {
      this.setState({activeRepo: activeRepo ?? ALL_REPOSITORIES_LABEL});
    }
  }

  getReposEndpoint() {
    const {params} = this.props;
    const {project} = this.context;
    const {orgId, release} = params;
    return `/projects/${orgId}/${project.slug}/releases/${encodeURIComponent(
      release
    )}/repositories/`;
  }

  get404ErrorMessage(): string {
    // Children must implement this
    throw new Error('Not implemented');
  }

  getDefaultState(): State {
    return {
      ...super.getDefaultState(),
      repos: [],
      activeRepo: ALL_REPOSITORIES_LABEL,
    };
  }

  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const reposEndpoint = this.getReposEndpoint();
    return [['repos', reposEndpoint]];
  }

  getQuery() {
    const {location} = this.props;
    const {activeRepo} = this.state;

    const query = {
      ...pick(location.query, [...Object.values(URL_PARAM), 'cursor']),
      per_page: ITEMS_PER_PAGE,
    };

    if (activeRepo === ALL_REPOSITORIES_LABEL) {
      return query;
    }

    return {...query, repo_name: activeRepo};
  }

  getReposToRender(repos: Array<string>) {
    const {activeRepo} = this.state;
    if (activeRepo === ALL_REPOSITORIES_LABEL) {
      return repos;
    }
    return [activeRepo];
  }

  handleRepoFilterChange = (activeRepo: string) => {
    const {router, location} = this.props;
    router.push({
      ...location,
      query: {
        ...location.query,
        activeRepo: activeRepo === ALL_REPOSITORIES_LABEL ? undefined : activeRepo,
      },
    });
  };

  renderRepoSwitcher() {
    const {activeRepo, repos, dropdownButtonWidth} = this.state;
    return (
      <StyledDropdownControl
        minMenuWidth={dropdownButtonWidth}
        label={
          <React.Fragment>
            <FilterText>{`${t('Filter')}:`}</FilterText>
            {activeRepo}
          </React.Fragment>
        }
        buttonProps={{forwardRef: this.dropdownButton}}
      >
        {[ALL_REPOSITORIES_LABEL, ...repos.map(repo => repo.name)].map(repoName => (
          <DropdownItem
            key={repoName}
            onSelect={this.handleRepoFilterChange}
            eventKey={repoName}
            isActive={repoName === activeRepo}
          >
            <RepoLabel>{repoName}</RepoLabel>
          </DropdownItem>
        ))}
      </StyledDropdownControl>
    );
  }

  renderError(error?: Error, disableLog = false, disableReport = false): React.ReactNode {
    const {errors} = this.state;
    const notFound = Object.values(errors).find(resp => resp && resp.status === 404);
    if (notFound) {
      return (
        <React.Fragment>
          {this.renderRepoSwitcher()}
          <LoadingError message={this.get404ErrorMessage()} />
        </React.Fragment>
      );
    }
    return super.renderError(error, disableLog, disableReport);
  }

  renderEmptyContent(message: string) {
    return (
      <Panel>
        <PanelBody>
          <EmptyStateWarning small>{message}</EmptyStateWarning>
        </PanelBody>
      </Panel>
    );
  }

  renderContent(): JSX.Element | null {
    // Children must implement this
    throw new Error('Not implemented');
  }

  renderBody() {
    const {orgId} = this.props.params;
    const {repos} = this.state;

    if (!repos.length) {
      return <NoRepoConnected orgId={orgId} />;
    }

    return this.renderContent();
  }
}

export default Repositories;

const StyledDropdownControl = styled(DropdownControl)<{
  minMenuWidth: State['dropdownButtonWidth'];
}>`
  margin-bottom: ${space(1)};
  > *:nth-child(2) {
    right: auto;
    width: auto;
    ${p => p.minMenuWidth && `min-width: calc(${p.minMenuWidth}px + 10px);`}
    border-radius: ${p => p.theme.borderRadius};
    border-top-left-radius: 0px;
    border: 1px solid ${p => p.theme.button.default.border};
    top: calc(100% - 1px);
  }
`;

const FilterText = styled('em')`
  font-style: normal;
  color: ${p => p.theme.gray500};
  margin-right: ${space(0.5)};
`;

const RepoLabel = styled('div')`
  ${overflowEllipsis}
`;
