import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from datetime import datetime, timezone
import time
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("publish_metrics.py")
ROOT = SCRIPT.parents[2]
spec = importlib.util.spec_from_file_location("publish_metrics", SCRIPT)
metrics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metrics)


class PublishMetricsTests(unittest.TestCase):
    def test_resource_summary_preserves_disk_and_memory_extrema(self):
        samples = [
            {"memory": {"MemAvailableKiB": 100}, "disks": {"/": {"usedBytes": 800, "freeBytes": 200}}},
            {"memory": {"MemAvailableKiB": 50}, "disks": {"/": {"usedBytes": 850, "freeBytes": 150}}},
        ]
        peaks = metrics.resource_peaks(samples)
        self.assertEqual(peaks["minSystemMemoryAvailableKiB"], 50)
        self.assertEqual(peaks["disks"]["/"], {"maxUsedBytes": 850, "minFreeBytes": 150})
        self.assertEqual(metrics.resource_peaks([])["minSystemMemoryAvailableKiB"], None)
        self.assertEqual(metrics.duration("2026-10-23T14:00:00Z", "2026-10-23T14:01:30Z"), 90)

    def test_failed_build_still_reports_without_serializing_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = Path.cwd()
            os.chdir(directory)
            self.addCleanup(os.chdir, previous)
            subprocess.run(["git", "init", "-q"], check=True)
            Path("versions.json").write_text('["4.x", "3.x", "2.1"]')
            subprocess.run(["git", "add", "versions.json"], check=True)
            subprocess.run(["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.com",
                            "commit", "-qm", "fixture"], check=True)
            with patch.dict(os.environ, {"GH_TOKEN": "SECRET_MUST_NOT_APPEAR", "DEPLOY_SOURCE_SHA": "a" * 40,
                                         "GITHUB_REPOSITORY": "fixture/site", "GITHUB_RUN_ID": "42", "GITHUB_RUN_ATTEMPT": "1",
                                         "GITHUB_STEP_SUMMARY": str(Path(directory) / "summary.md")}):
                with patch.object(metrics, "git", return_value="a" * 40), patch.object(metrics, "launch_sampler"):
                    metrics.start("build")
                with patch.object(metrics, "job_details", side_effect=RuntimeError("SECRET_MUST_NOT_APPEAR")), \
                        patch.object(metrics, "api", side_effect=RuntimeError("SECRET_MUST_NOT_APPEAR")):
                    metrics.finish(180)
                text = (metrics.REPORTS / "report.json").read_text()
                report = json.loads(text)
                self.assertNotIn("SECRET_MUST_NOT_APPEAR", text)
                self.assertEqual(report["jobApiError"], "RuntimeError")
                self.assertIsNone(report["site"])
                self.assertTrue((metrics.REPORTS / "stop").exists())
                self.assertEqual(report["activeVersions"], ["current", "4.x", "3.x", "2.1"])
                self.assertIn("final jobs API", Path("summary.md").read_text())
                now = time.time()
                def stamp(offset):
                    return datetime.fromtimestamp(now + offset, timezone.utc).isoformat()
                job = {"name": "build", "started_at": stamp(-120), "steps": [
                    {"name": "Build", "started_at": stamp(-110), "completed_at": stamp(-20),
                     "conclusion": "failure", "status": "completed"}]}
                sample = {"time": now - 90, "memory": {"MemAvailableKiB": 100}, "disks": {}}
                (metrics.REPORTS / "samples.jsonl").write_text(json.dumps(sample) + '\n{"partial":')
                with patch.object(metrics, "job_details", return_value=job), patch.object(metrics, "api", return_value={
                        "artifacts": [{"id": 9, "name": "site-build-42-1", "size_in_bytes": 123}]}):
                    metrics.finish(180)
                report = json.loads((metrics.REPORTS / "report.json").read_text())
                self.assertEqual(report["steps"][0]["seconds"], 90)
                self.assertEqual(report["steps"][0]["sampledResources"]["sampleCount"], 1)
                self.assertEqual(report["steps"][0]["conclusion"], "failure")
                self.assertEqual(report["siteArtifact"]["size_in_bytes"], 123)
            os.chdir(previous)

    def test_inventory_counts_hidden_control_files_and_all_locales(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            (site / "ja").mkdir()
            (site / ".asf.yaml").write_bytes(b"control")
            (site / "index.html").write_bytes(b"english")
            (site / "ja/index.html").write_bytes(b"japanese")
            self.assertEqual(metrics.site_inventory(site), {"files": 3, "bytes": 22})

    def test_measurement_code_and_reports_preserve_deployment_boundaries(self):
        raw = subprocess.check_output(["node", "-e", """
            const fs=require('fs'),yaml=require('js-yaml');
            console.log(JSON.stringify(['cron','manual'].map(name=>yaml.load(
              fs.readFileSync(`.github/workflows/${name}-deploy-website.yml`,'utf8')))));
        """], cwd=ROOT)
        for workflow in json.loads(raw):
            build, deploy = (workflow["jobs"][name] for name in ("build", "deploy"))
            self.assertEqual(build["timeout-minutes"], 180)
            self.assertEqual(build["permissions"], {"contents": "read", "actions": "read"})
            self.assertNotIn("environment", build)
            self.assertNotIn("secrets.", json.dumps(build))
            trusted = next(step for step in build["steps"] if step.get("name") == "Checkout trusted measurement code")
            self.assertEqual(trusted["with"]["ref"], "${{ github.sha }}")
            self.assertFalse(trusted["with"]["persist-credentials"])
            self.assertEqual(deploy["environment"], "Production")
            self.assertEqual(deploy["needs"], ["source", "build"])
            for job in (build, deploy):
                report = next(step for step in job["steps"] if step.get("name") == "Report publishing measurements")
                self.assertIn("always()", report["if"])
                upload = next(step for step in job["steps"] if step.get("name") == "Upload publishing measurements")
                self.assertIn("always()", upload["if"])
                self.assertTrue(upload["with"]["include-hidden-files"])
                self.assertTrue(all(path.startswith(".i18n-build/") for path in upload["with"]["path"].splitlines()))


if __name__ == "__main__":
    unittest.main()
