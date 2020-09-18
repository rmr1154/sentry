# -*- coding: utf-8 -*-

from __future__ import absolute_import

import datetime
import os

from django.core.urlresolvers import reverse
from openapi_core import create_spec
from openapi_core.contrib.django import DjangoOpenAPIRequest, DjangoOpenAPIResponse
from openapi_core.validation.response.validators import ResponseValidator

from sentry.models import Deploy, Environment, Release
from sentry.testutils import APITestCase
from sentry.utils import json


def create_doc_schema():
    # spec = None
    path = os.path.join(os.path.dirname(__file__)) + "/spec.json"
    with open(path) as json_file:
        data = json.load(json_file)
        spec = create_spec(data)

    json_file.close()

    return spec


class ReleaseDeploysDocs(APITestCase):
    def test_simple(self):
        project = self.create_project(name="foo")
        release = Release.objects.create(
            organization_id=project.organization_id,
            # test unicode
            version="1–0",
        )
        release.add_project(project)
        Deploy.objects.create(
            environment_id=Environment.objects.create(
                organization_id=project.organization_id, name="production"
            ).id,
            organization_id=project.organization_id,
            release=release,
            date_finished=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        )
        Deploy.objects.create(
            environment_id=Environment.objects.create(
                organization_id=project.organization_id, name="staging"
            ).id,
            organization_id=project.organization_id,
            release=release,
        )

        url = reverse(
            "sentry-api-0-organization-release-deploys",
            kwargs={"organization_slug": project.organization.slug, "version": release.version},
        )

        self.login_as(user=self.user)

        response = self.client.get(url)

        spec = create_doc_schema()
        openapi_response = DjangoOpenAPIResponse.create(response)
        openapi_request = DjangoOpenAPIRequest.create(
            response.wsgi_request, "GET", response._headers
        )
        validator = ResponseValidator(spec)
        result = validator.validate(openapi_request, openapi_response)
        result.raise_for_errors()
        assert result.errors == []
