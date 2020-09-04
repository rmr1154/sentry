from __future__ import absolute_import

from sentry.api.base import DocSection
from sentry.api.bases.organization import OrganizationReleasesBaseEndpoint
from sentry.api.exceptions import ResourceDoesNotExist
from sentry.api.serializers import serialize
from sentry.models import CommitFileChange, Release, ReleaseCommit, Repository
from rest_framework.response import Response


class CommitFileChangeEndpoint(OrganizationReleasesBaseEndpoint):
    doc_section = DocSection.RELEASES

    def get(self, request, organization, version):
        """
        Retrieve Files Changed in a Release's Commits
        `````````````````````````````````````````````

        Retrieve a list of files that were changed in a given release's commits.

        :pparam string organization_slug: the slug of the organization the
                                          release belongs to.
        :pparam string version: the version identifier of the release.

        :pparam string repo_id: the repository ID

        :auth: required
        """

        try:
            release = Release.objects.get(organization=organization, version=version)
        except Release.DoesNotExist:
            raise ResourceDoesNotExist

        if not self.has_release_permission(request, organization, release):
            raise ResourceDoesNotExist

        queryset = list(
            CommitFileChange.objects.filter(
                commit_id__in=ReleaseCommit.objects.filter(release=release).values_list(
                    "commit_id", flat=True
                )
            )
        )

        repo_name = request.query_params.get("repo_name")

        if repo_name:
            try:
                repo = Repository.objects.get(organization_id=organization.id, name=repo_name)
                queryset = queryset.filter(commit__repository_id=repo.id)
            except Repository.DoesNotExist:
                raise ResourceDoesNotExist

        context = serialize(queryset, request.user)
        return Response(context)
