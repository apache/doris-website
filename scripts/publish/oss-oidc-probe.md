# Website OSS OIDC probe

Run **Verify Website OSS OIDC** manually from `master` after the workflow has
been merged into `apache/doris-website`. The RAM role trusts the default GitHub
OIDC subject `repo:apache/doris-website:ref:refs/heads/master`; a PR or fork cannot
perform this live check. The workflow has no push or pull request trigger and
does not build or publish the website.

Configure these repository-level Actions variables. No GitHub Environment or
permanent AccessKey secret is required.

The Alibaba Cloud credentials action is a Git submodule at
`.github/actions/configure-aliyun-credentials`, pinned to
`1e5248c8d5d93a8781ac344a68e19a43341e79e6`. The workflow initializes that
submodule and uses its local path, following the Doris repository convention
for actions outside the ASF remote-action allowlist. It never uses
`git submodule update --remote`; updates require reviewing a new gitlink commit.
The action's OIDC inputs, output masking and credential cleanup remain provided
by that same pinned upstream implementation.

| Variable | Value |
| --- | --- |
| `ALIYUN_OIDC_PROVIDER_ARN` | Provider ARN for `https://token.actions.githubusercontent.com`, audience `sts.aliyuncs.com` |
| `ALIYUN_WEBSITE_ROLE_ARN` | ARN of the role that can read and write only website objects |
| `WEBSITE_OSS_BUCKET` | `doris-website-assets-prod-bj` |
| `WEBSITE_OSS_REGION` | `cn-beijing` |
| `WEBSITE_OSS_ENDPOINT` | `https://oss-cn-beijing.aliyuncs.com` |
| `WEBSITE_ASSET_BASE_URL` | `https://assets-cdn.selectdb.com/site` |

The probe verifies:

- Bucket location lookup and authenticated write, list, and read under `site/`.
- Denied writes to `media/` and `downloads/`, denied listing outside `site/`,
  and denied reads of a nonexistent diagnostic key under `private/`.
- Denied object deletion, object ACL changes, and bucket ACL reads.
- A unique probe delivered over CDN HTTPS with exact content and website CORS.
- Rejection of an anonymous HTTPS request for that same existing object at OSS.

Only an explicit OSS `403 AccessDenied` passes a negative permission check.
Network errors, missing objects and expired credentials fail the workflow.
Credentials are passed through environment variables, and raw CLI diagnostics
are not printed because they may contain signed request information.

The probe leaves a small, non-secret text object under `site/rebuild-probes/`
with a unique run/attempt/commit name. Deletion is checked against a key that was
never created. The ACL check attempts only to keep the probe private. If a
negative write unexpectedly succeeds, the workflow fails and may also leave
that diagnostic under `media/rebuild-probes/` or `downloads/rebuild-probes/`;
an administrator should inspect the role and remove those test objects.

Use the successful run to validate the cloud role before migrating production
uploads. Existing publishing workflows, their credentials, asset URLs and
the `asf-site` branch are unaffected by adding this manual diagnostic.

Local validation:

```sh
python3 -m unittest discover -s .github/scripts -p 'test_website_oss_probe.py' -v
```

The tests exercise permission and content failures with a simulated CLI. Live
OIDC, OSS and CDN checks require the manual workflow on `master`.
