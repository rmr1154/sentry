import React from 'react';

import CommitRow from 'app/components/commitRow';
import {t} from 'app/locale';
import {Commit, Organization} from 'app/types';
import {PanelHeader, Panel, PanelBody} from 'app/components/panels';
import routeTitleGen from 'app/utils/routeTitle';
import {formatVersion} from 'app/utils/formatters';
import withOrganization from 'app/utils/withOrganization';
import {Main} from 'app/components/layouts/thirds';
import Pagination from 'app/components/pagination';

import {getCommitsByRepository} from './utils';
import Repositories from './repositories';
import {ReleaseContext} from './';

type Props = {
  organization: Organization;
} & Repositories['props'];

type State = {
  commits: Commit[];
} & Repositories['state'];

class ReleaseCommits extends Repositories<Props, State> {
  static contextType = ReleaseContext;

  getTitle() {
    const {params, organization} = this.props;
    return routeTitleGen(
      t('Commits - Release %s', formatVersion(params.release)),
      organization.slug,
      false
    );
  }

  getDefaultState(): State {
    return {
      ...super.getDefaultState(),
      commits: [],
    };
  }

  getReposEndpoint() {
    const {params} = this.props;
    const {project} = this.context;
    const {orgId, release} = params;
    return `/projects/${orgId}/${project.slug}/releases/${encodeURIComponent(
      release
    )}/repositories/`;
  }

  getEndpoints = (): ReturnType<Repositories['getEndpoints']> => {
    const {params} = this.props;
    const {orgId, release} = params;
    const {project} = this.context;
    const query = this.getQuery();

    return [
      ...super.getEndpoints(),
      [
        'commits',
        `/projects/${orgId}/${project.slug}/releases/${encodeURIComponent(
          release
        )}/commits/`,
        {query},
      ],
    ];
  };

  renderContent() {
    const {commits, commitsPageLinks} = this.state;

    if (commits.length === 0) {
      return this.renderEmptyContent(
        t('There are no commits associated with this release.')
      );
    }

    const commitsByRepository = getCommitsByRepository(commits);
    const reposToRender = this.getReposToRender(Object.keys(commitsByRepository));

    return (
      <React.Fragment>
        {this.renderRepoSwitcher()}
        {reposToRender.map(repoName => (
          <Panel key={repoName}>
            <PanelHeader>{repoName}</PanelHeader>
            <PanelBody>
              {commitsByRepository[repoName].map(commit => (
                <CommitRow key={commit.id} commit={commit} />
              ))}
            </PanelBody>
          </Panel>
        ))}
        <Pagination pageLinks={commitsPageLinks} />
      </React.Fragment>
    );
  }

  renderComponent() {
    return <Main fullWidth>{super.renderComponent()}</Main>;
  }
}

export default withOrganization(ReleaseCommits);
