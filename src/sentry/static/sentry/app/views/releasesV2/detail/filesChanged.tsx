import React from 'react';
import styled from '@emotion/styled';

import {t, tn} from 'app/locale';
import {CommitFile, Organization} from 'app/types';
import routeTitleGen from 'app/utils/routeTitle';
import {formatVersion} from 'app/utils/formatters';
import withOrganization from 'app/utils/withOrganization';
import {Main} from 'app/components/layouts/thirds';
import Pagination from 'app/components/pagination';
import {Panel, PanelBody, PanelHeader} from 'app/components/panels';
import FileChange from 'app/components/fileChange';

import {getFilesByRepository} from './utils';
import Repositories from './repositories';
import {ReleaseContext} from './';

type Props = {
  organization: Organization;
} & Repositories['props'];

type State = {
  fileList: CommitFile[];
} & Repositories['state'];

class FilesChanged extends Repositories<Props, State> {
  static contextType = ReleaseContext;

  getTitle() {
    const {params, organization} = this.props;
    return routeTitleGen(
      t('Files Changed - Release %s', formatVersion(params.release)),
      organization.slug,
      false
    );
  }

  getDefaultState(): State {
    return {
      ...super.getDefaultState(),
      fileList: [],
    };
  }

  getReposEndpoint() {
    const {params} = this.props;
    const {orgId} = params;
    return `/organizations/${orgId}/repos/`;
  }

  getEndpoints = (): ReturnType<Repositories['getEndpoints']> => {
    const {params} = this.props;
    const {orgId, release} = params;
    const query = this.getQuery();

    return [
      ...super.getEndpoints(),
      [
        'fileList',
        `/organizations/${orgId}/releases/${encodeURIComponent(release)}/commitfiles/`,
        {query},
      ],
    ];
  };

  renderContent() {
    const {fileList, fileListPageLinks} = this.state;

    if (!fileList.length) {
      return this.renderEmptyContent(t('There are no changed files.'));
    }

    const filesByRepository = getFilesByRepository(fileList);
    const reposToRender = this.getReposToRender(Object.keys(filesByRepository));

    return (
      <React.Fragment>
        {this.renderRepoSwitcher()}
        {reposToRender.map(repoName => {
          const repoData = filesByRepository[repoName];
          const files = Object.keys(repoData);
          const fileCount = files.length;
          return (
            <Panel key={repoName}>
              <PanelHeader>
                <span>{repoName}</span>
                <span>{tn('%s file changed', '%s files changed', fileCount)}</span>
              </PanelHeader>
              <PanelBody>
                {files.map(filename => {
                  const {authors} = repoData[filename];
                  return (
                    <StyledFileChange
                      key={filename}
                      filename={filename}
                      authors={Object.values(authors)}
                    />
                  );
                })}
              </PanelBody>
            </Panel>
          );
        })}
        <Pagination pageLinks={fileListPageLinks} />
      </React.Fragment>
    );
  }

  renderComponent() {
    return <Main fullWidth>{super.renderComponent()}</Main>;
  }
}

export default withOrganization(FilesChanged);

const StyledFileChange = styled(FileChange)`
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  :last-child {
    border: none;
    border-radius: 0;
  }
`;
