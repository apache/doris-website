import io
import json
import unittest
from zipfile import ZipFile

from check_asf_site import published_site, rebuild_reason


MASTER = "a" * 40
OLD_MASTER = "b" * 40
SITE = "c" * 40
UNRELATED = "d" * 40
REPO = "repos/apache/doris-website"


class SiteIntegrityTests(unittest.TestCase):
    def test_rebuilds_a_missing_or_changed_site_and_publishes_pending_master(self):
        self.assertIsNone(rebuild_reason((SITE, MASTER), SITE, MASTER))
        self.assertIn("Unexpected asf-site commit", rebuild_reason((SITE, MASTER), UNRELATED, MASTER))
        self.assertIn("no branch", rebuild_reason((SITE, MASTER), None, MASTER))
        self.assertIn("No trusted publication", rebuild_reason(None, SITE, MASTER))
        self.assertIn("has not been published", rebuild_reason((SITE, OLD_MASTER), SITE, MASTER))

    def test_only_downloads_records_from_trusted_publishing_runs(self):
        def artifact(artifact_id, **changes):
            owner = {"repository_id": 42, "head_repository_id": 42, "head_branch": "master", "id": artifact_id}
            owner.update(changes)
            return {"id": artifact_id, "created_at": "2026-11-25T08:00:00Z",
                    "expired": False, "workflow_run": owner}

        records = [
            artifact(1),
            artifact(5, head_branch="asf-site"),
            artifact(4, head_repository_id=99),
            artifact(3),  # Same repository, but an unrelated workflow.
            artifact(2),  # A manual run on a tag named master.
        ]
        manual = ".github/workflows/manual-deploy-website.yml"
        automatic = ".github/workflows/cron-deploy-website.yml"
        responses = {
            f"{REPO}/actions/runs/1": {"path": automatic, "event": "schedule", "head_sha": OLD_MASTER},
            f"{REPO}/actions/runs/2": {"path": manual, "event": "workflow_dispatch", "head_sha": UNRELATED},
            f"{REPO}/actions/runs/3": {"path": ".github/workflows/other.yml", "event": "push", "head_sha": MASTER},
            f"{REPO}/compare/{UNRELATED}...{MASTER}?per_page=1": {"merge_base_commit": {"sha": OLD_MASTER}},
            f"{REPO}/compare/{OLD_MASTER}...{MASTER}?per_page=1": {"merge_base_commit": {"sha": OLD_MASTER}},
        }

        def cli(endpoint, *options):
            if endpoint.endswith("&per_page=100"):
                self.assertEqual(options, ("--paginate", "--slurp"))
                return json.dumps([{"artifacts": records[:3]}, {"artifacts": records[3:]}])
            self.assertEqual(endpoint, f"{REPO}/actions/artifacts/1/zip")
            data = io.BytesIO()
            with ZipFile(data, "w") as archive:
                archive.writestr("asf-site-publish.json", json.dumps({"site_sha": SITE, "source_sha": MASTER}))
            return data.getvalue()

        self.assertEqual(published_site(REPO, 42, MASTER, responses.__getitem__, cli), (SITE, MASTER))
