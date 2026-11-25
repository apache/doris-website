#!/usr/bin/env python3
"""Compare the production branch with the last recorded website publication."""

import argparse
import io
import json
import os
import subprocess
from pathlib import Path
from zipfile import ZipFile

from review import ReviewError, api, repository, revision


PUBLISH_EVENTS = {
    ".github/workflows/cron-deploy-website.yml": {"push", "schedule"},
    ".github/workflows/manual-deploy-website.yml": {"workflow_dispatch"},
}
SITE_REF = "refs/heads/asf-site"


def gh_api(endpoint, *options):
    return subprocess.check_output(["gh", "api", endpoint, *options], timeout=60)


def is_master_commit(repo, run_sha, master_sha, request):
    if run_sha == master_sha:
        return True
    # A workflow_dispatch run can name a tag "master". Verify the run's
    # actual code was on the protected master branch before trusting its record.
    try:
        comparison = request(f"{repo}/compare/{run_sha}...{master_sha}?per_page=1")
    except ReviewError as error:
        if str(error) == "GitHub API request failed (HTTP 404)":
            return False
        raise
    return comparison["merge_base_commit"]["sha"] == run_sha


def published_site(repo, repo_id, master_sha, request=api, cli=gh_api):
    pages = json.loads(cli(f"{repo}/actions/artifacts?name=asf-site-publish&per_page=100",
                           "--paginate", "--slurp"))
    records = [record for page in pages for record in page["artifacts"] if not record["expired"]]
    for record in sorted(records, key=lambda item: (item["created_at"], item["id"]), reverse=True):
        owner = record.get("workflow_run") or {}
        if (owner.get("head_branch") != "master" or owner.get("repository_id") != repo_id
                or owner.get("head_repository_id") != repo_id):
            continue
        run = request(f"{repo}/actions/runs/{owner['id']}")
        if run["event"] not in PUBLISH_EVENTS.get(run["path"], set()):
            continue
        if not is_master_commit(repo, revision(run["head_sha"]), master_sha, request):
            continue
        with ZipFile(io.BytesIO(cli(f"{repo}/actions/artifacts/{record['id']}/zip"))) as archive:
            with archive.open("asf-site-publish.json") as data:
                result = json.loads(data.read(1024))
        return revision(result["site_sha"]), revision(result["source_sha"])
    return None


def rebuild_reason(record, current_site, current_source):
    if record is None:
        return "No trusted publication record. Build from master to record the expected asf-site commit."
    site_sha, source_sha = record
    if current_site != site_sha:
        return f"Unexpected asf-site commit. Expected {site_sha}, found {current_site or 'no branch'}."
    if current_source != source_sha:
        # A scheduled run can supersede a queued push in the shared concurrency group.
        return "The latest master commit has not been published."
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_sha", type=revision)
    args = parser.parse_args()
    repo = f"repos/{repository()}"
    record = published_site(repo, int(os.environ["GITHUB_REPOSITORY_ID"]), args.source_sha)
    refs = api(f"{repo}/git/matching-refs/heads/asf-site")
    current_site = next((revision(ref["object"]["sha"]) for ref in refs if ref["ref"] == SITE_REF), None)
    reason = rebuild_reason(record, current_site, args.source_sha)
    print(f"::warning::{reason}" if reason else "asf-site matches the last trusted publication.")
    with Path(os.environ["GITHUB_OUTPUT"]).open("a") as output:
        print(f"rebuild={'true' if reason else 'false'}", file=output)


if __name__ == "__main__":
    main()
