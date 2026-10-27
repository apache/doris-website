import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("review.py")
ROOT = SCRIPT.parents[2]
spec = importlib.util.spec_from_file_location("review", SCRIPT)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
BASE = "a" * 40
HEAD = "b" * 40


def pull(head=HEAD):
    return {"state": "open", "head": {"sha": head},
            "base": {"sha": BASE, "repo": {"full_name": "apache/doris-website"}}}


class AuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"GITHUB_REPOSITORY": "apache/doris-website",
                                          "GITHUB_REF": "refs/heads/master"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.event = {"repository": {"full_name": "apache/doris-website"},
                      "issue": {"number": 42, "pull_request": {}},
                      "comment": {"body": "/review", "user": {"login": "maintainer"}}}
        self.event["issue"]["pull_request"] = {"url": "https://api.github.com/example"}

    def test_substrings_and_quoted_commands_do_not_authorize(self):
        for body in ("/review-docs", "please /review", "> /review", "/review malicious-argument"):
            self.event["comment"]["body"] = body
            result = review.authorize(self.event, "/review", lambda *args: self.fail("API called"))
            self.assertEqual(result, {"allowed": "false"})

    def test_organization_member_without_repository_write_is_denied(self):
        self.event["comment"]["author_association"] = "MEMBER"
        self.assertEqual(review.authorize(self.event, "/review", lambda *a: {"permission": "read"}),
                         {"allowed": "false"})

    def test_write_permission_binds_exact_commits(self):
        def request(endpoint):
            return {"permission": "write"} if endpoint.endswith("/permission") else pull()
        self.assertEqual(review.authorize(self.event, "/review", request),
                         {"allowed": "true", "number": "42", "head_sha": HEAD, "base_sha": BASE})

    def test_malformed_sha_is_rejected(self):
        with self.assertRaises(ValueError):
            review.revision(HEAD + "\nallowed=true")

    def test_deployment_rejects_pr_refs_tags_paths_and_unprotected_branches(self):
        for branch in ("refs/pull/42/head", "refs/tags/v1", "../master", "a/../master", "master\nbad"):
            with self.assertRaises(ValueError):
                review.deploy_ref(branch, lambda *a: self.fail("API called"))
        with self.assertRaises(ValueError):
            review.deploy_ref("preview", lambda *a: {"name": "preview", "protected": False})

    def test_protected_preview_is_pinned_and_url_encoded(self):
        def request(endpoint):
            self.assertTrue(endpoint.endswith("/branches/release%2Fpreview"))
            return {"name": "release/preview", "protected": True, "commit": {"sha": HEAD}}
        self.assertEqual(review.deploy_ref("release/preview", request),
                         {"branch": "release/preview", "source_sha": HEAD})

    def test_dispatch_from_untrusted_workflow_branch_is_denied(self):
        with patch.dict(os.environ, {"GITHUB_REF": "refs/heads/attacker"}):
            with self.assertRaises(ValueError):
                review.deploy_ref("master", lambda *a: self.fail("API called"))


class DataBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="doris-review-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.env = patch.dict(os.environ, {"GITHUB_REPOSITORY": "apache/doris-website"})
        self.env.start()
        self.addCleanup(self.env.stop)

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, stderr=subprocess.DEVNULL).decode().strip()

    def commits(self):
        self.git("init", "-q")
        self.git("config", "user.name", "Security test")
        self.git("config", "user.email", "security@example.invalid")
        (self.root / "AGENTS.md").write_text("Trusted guide: verify all checkpoints.")
        (self.root / "doc.md").write_text("first\nsecond\n")
        self.git("add", ".")
        self.git("commit", "-qm", "base")
        base = self.git("rev-parse", "HEAD")
        (self.root / "doc.md").write_text("first\nchanged\n")
        (self.root / "$(touch pwned).md").write_text("untrusted filename")
        (self.root / ".opencode/plugins").mkdir(parents=True)
        (self.root / ".opencode/plugins/attack.js").write_text("throw new Error('must never execute')")
        (self.root / "secret-link.md").symlink_to("/outside/credentials.json")
        self.git("add", ".")
        self.git("commit", "-qm", "untrusted PR")
        head = self.git("rev-parse", "HEAD")
        self.git("checkout", "--detach", base)
        return base, head

    def test_packet_reads_blobs_without_executing_plugins_filenames_or_symlinks(self):
        base, head = self.commits()
        prompt = review.packet(self.root, base, head)
        self.assertIn("Trusted guide", prompt)
        self.assertIn("attack.js", prompt)
        self.assertIn("changed", prompt)
        self.assertFalse((self.root / "pwned").exists())
        self.assertFalse((self.root / ".opencode").exists())
        self.assertEqual(self.git("rev-parse", "HEAD"), base)

    def test_publisher_validates_locations_and_cannot_approve_or_change_targets(self):
        base, head = self.commits()
        calls = []
        current = pull(head)
        current["base"]["sha"] = base
        def request(endpoint, method="GET", body=None):
            calls.append((endpoint, method, body))
            return current
        result = {"summary": "Verified issue", "comments": [{"path": "doc.md", "line": 2, "body": "Fix this"}]}
        review.publish(self.root, result, "code", "42", base, head, request)
        posted = calls[-1][2]
        self.assertEqual(posted["event"], "COMMENT")
        self.assertEqual(posted["commit_id"], head)
        self.assertEqual(posted["comments"][0]["side"], "RIGHT")
        result["comments"][0]["line"] = 999
        with self.assertRaises(ValueError):
            review.publish(self.root, result, "code", "42", base, head, request)
        self.assertEqual(len([c for c in calls if c[1] == "POST"]), 1)
        with self.assertRaises(ValueError):
            review.validate_result(dict(result, event="APPROVE"), "code")

    def test_stale_reviews_fail_before_writing(self):
        methods = []
        def request(endpoint, method="GET", body=None):
            methods.append(method)
            return pull("c" * 40)
        with self.assertRaises(ValueError):
            review.publish(self.root, {"body": "advisory"}, "docs", "42", BASE, HEAD, request)
        self.assertEqual(methods, ["GET"])

    def test_docs_publisher_does_not_overwrite_another_bot(self):
        writes = []
        def request(endpoint, method="GET", body=None):
            if method != "GET":
                writes.append((endpoint, method, body))
                return {}
            if "/comments?" in endpoint:
                return [{"id": 9, "user": {"login": "other[bot]"}, "body": review.DOCS_MARKER}]
            return pull()
        review.publish(self.root, {"body": "advisory"}, "docs", "42", BASE, HEAD, request)
        self.assertEqual(writes[0][0], "repos/apache/doris-website/issues/42/comments")
        self.assertEqual(writes[0][1], "POST")

    def test_rejects_oversized_or_executable_artifact_fields(self):
        for data in ({"body": "x" * review.MAX_RESULT_BYTES}, {"body": "hi", "command": "sh"}):
            with self.assertRaises(ValueError):
                review.validate_result(data, "docs")

    def test_model_has_no_inherited_secrets_and_no_external_plugins_or_tools(self):
        output = {"summary": "No verified issues; tests not run.", "comments": []}
        events = "\n".join(json.dumps(event) for event in (
            {"type": "text", "part": {"text": json.dumps(output)}},
            {"type": "step_finish", "part": {"reason": "stop"}}))
        def run(args, **kwargs):
            self.assertIn("--pure", args)
            for key in ("GH_TOKEN", "OSS_AK", "OSS_SK", "GITHUB_TOKEN", "GITHUB_ENV", "GITHUB_PATH"):
                self.assertNotIn(key, kwargs["env"])
            config = json.loads(kwargs["env"]["OPENCODE_CONFIG_CONTENT"])
            self.assertEqual(config["permission"], "deny")
            self.assertEqual(config["tools"], {"*": False})
            self.assertNotEqual(kwargs["cwd"], ROOT)
            return subprocess.CompletedProcess(args, 0, events, "")
        with patch.object(review.subprocess, "run", side_effect=run):
            self.assertEqual(review.run_model("/trusted/opencode", self.root, "untrusted data"), output)

    def test_tool_calls_and_incomplete_model_results_fail_closed(self):
        for events in ([{"type": "tool_use"}], [{"type": "error"}],
                       [{"type": "step_finish", "part": {"reason": "length"}}]):
            with self.assertRaises(ValueError):
                review.parse_model_events("\n".join(map(json.dumps, events)))

    def test_docs_wrapper_uses_trusted_modules_against_a_changed_fixture(self):
        fixture = ROOT / "scripts/docs-governance/__fixtures__/repo"
        shutil.copytree(fixture, self.root, dirs_exist_ok=True)
        base, head = self.commits()
        output = self.root / "review.json"
        completed = subprocess.run(["node", str(SCRIPT.with_name("docs-review.cjs")), str(self.root), str(output)],
                                   env={**os.environ, "BASE_SHA": base, "HEAD_SHA": head}, capture_output=True)
        self.assertEqual(completed.returncode, 0, completed.stderr.decode())
        self.assertIn("body", json.loads(output.read_text()))


class WorkflowTests(unittest.TestCase):
    def test_build_check_handles_an_older_pr_branch(self):
        raw = subprocess.check_output(["node", "-e", """
            const fs=require('fs'),yaml=require('js-yaml');
            console.log(JSON.stringify(yaml.load(fs.readFileSync(
                '.github/workflows/build-check.yml','utf8')).jobs['build-and-deploy'].steps));
        """], cwd=ROOT)
        steps = json.loads(raw)
        checkout = next(step for step in steps if step.get("uses", "").startswith("actions/checkout@"))
        security = next(step for step in steps if step.get("name") == "Workflow security boundary tests")
        links = next(step for step in steps if step.get("name") == "Run Node.js dead link checker")
        with tempfile.TemporaryDirectory(prefix="doris-build-check-test-") as directory:
            root = Path(directory)

            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root,
                                               stderr=subprocess.DEVNULL).decode().strip()

            git("init", "-q", "-b", "master")
            git("config", "user.name", "Build check test")
            git("config", "user.email", "build-check@example.invalid")
            (root / "source.md").write_text("English source\n")
            git("add", ".")
            git("commit", "-qm", "shared source")
            git("branch", "old-pr")
            tests = root / ".github/scripts"
            tests.mkdir(parents=True)
            (tests / "test_base.py").write_text(
                "import unittest\nfrom pathlib import Path\n"
                "class BaseTests(unittest.TestCase):\n"
                "    def test_pr_and_base_files_are_present(self):\n"
                "        self.assertTrue(Path('source.md').is_file())\n"
                "        self.assertTrue(Path('translation.md').is_file())\n")
            git("add", ".")
            git("commit", "-qm", "add base-branch security tests")
            git("checkout", "-q", "old-pr")
            (root / "translation.md").write_text("[Missing page](missing.md)\n")
            git("add", ".")
            git("commit", "-qm", "translate an older source snapshot")
            head = git("rev-parse", "HEAD")
            git("merge", "--no-ff", "-qm", "PR merge snapshot", "master")
            merge = git("rev-parse", "HEAD")
            git("update-ref", "refs/remotes/origin/master", git("rev-parse", "master"))
            refs = {"${{ github.sha }}": merge, "${{ github.event.pull_request.head.sha }}": head}
            git("checkout", "--detach", refs[checkout["with"]["ref"]])
            completed = subprocess.run(security["run"], cwd=root, shell=True,
                                       executable="/bin/bash", capture_output=True, text=True)
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
            self.assertIn("test_pr_and_base_files_are_present", completed.stderr)
            # A clean merge has no combined diff; the link checker must still inspect PR files.
            (root / "scripts").symlink_to(ROOT / "scripts", target_is_directory=True)
            completed = subprocess.run(links["run"], cwd=root, shell=True, executable="/bin/bash",
                                       env={**os.environ, "BASE_REF": "master", **{key: refs[value]
                                            for key, value in links.get("env", {}).items()}},
                                       capture_output=True, text=True)
            self.assertEqual(completed.returncode, 1, completed.stdout + completed.stderr)
            self.assertIn("A broken link was detected", completed.stderr)

    def test_privilege_and_artifact_boundaries(self):
        raw = subprocess.check_output(["node", "-e", """
            const fs=require('fs'),yaml=require('js-yaml');
            const root='.github/workflows/';
            console.log(JSON.stringify(Object.fromEntries(fs.readdirSync(root).filter(f=>f.endsWith('.yml'))
                .map(f=>[f,yaml.load(fs.readFileSync(root+f,'utf8'))]))));
        """], cwd=ROOT)
        workflows = json.loads(raw)
        for name, workflow in workflows.items():
            self.assertNotEqual(workflow.get("permissions"), "write-all", name)
            self.assertNotIn("pull_request_target", workflow["on"], name)
            self.assertNotIn("workflow_run", workflow["on"], name)
            if "pull_request" in workflow["on"]:
                self.assertEqual(workflow["permissions"], {"contents": "read"}, name)
                for job in workflow["jobs"].values():
                    self.assertNotIn("environment", job, name)
                    self.assertNotIn("secrets.", json.dumps(job), name)
                    self.assertNotIn("write", job.get("permissions", {}).values(), name)
            for job in workflow["jobs"].values():
                for step in job.get("steps", []):
                    if "uses" in step and not step["uses"].startswith("./"):
                        self.assertRegex(step["uses"], r"@[0-9a-f]{40}$", name)
        for name in ("opencode-review.yml", "docs-ai-review.yml"):
            workflow = workflows[name]
            self.assertEqual(workflow["permissions"], {"contents": "read", "pull-requests": "read"})
            publisher = workflow["jobs"]["publish"]
            self.assertEqual(publisher["permissions"]["pull-requests"], "write")
            self.assertIn("authorize", publisher["needs"])
            self.assertIn("analyze", publisher["needs"])
            for step in publisher["steps"]:
                self.assertNotIn("yarn", step.get("run", ""))
                if step.get("uses", "").startswith("actions/checkout@"):
                    self.assertEqual(step["with"]["ref"], "${{ github.sha }}")
                    self.assertFalse(step["with"]["persist-credentials"])
                    if name == "opencode-review.yml":
                        self.assertEqual(step["with"]["fetch-depth"], 0)
        for name in ("cron-deploy-website.yml", "manual-deploy-website.yml",
                     "cron-generate-pdf.yml", "manual-generate-pdf.yml"):
            workflow = workflows[name]
            build = workflow["jobs"]["build"]
            self.assertNotIn("environment", build)
            self.assertNotIn("secrets.", json.dumps(build))
            self.assertEqual(workflow["permissions"], {"contents": "read"})
            deploy = workflow["jobs"]["deploy"]
            self.assertEqual(deploy["environment"], "Production")
            self.assertEqual(deploy["steps"][0]["with"]["ref"], "${{ github.sha }}")
            self.assertEqual(workflow["jobs"]["source"]["steps"][-1]["env"]["DEPLOY_BRANCH"],
                             "${{ inputs.branch }}" if name.startswith("manual") else "master")

    def test_repository_secrets_work_without_new_environment_configuration(self):
        raw = subprocess.check_output(["node", "-e", """
            const fs=require('fs'),yaml=require('js-yaml');
            console.log(JSON.stringify(Object.fromEntries(['translation-run.yml','opencode-review.yml',
                'japanese-translation.yml','korean-translation.yml','russian-translation.yml']
                .map(f=>[f,yaml.load(fs.readFileSync('.github/workflows/'+f,'utf8'))]))));
        """], cwd=ROOT)
        workflows = json.loads(raw)
        for workflow in workflows.values():
            for job in workflow["jobs"].values():
                self.assertNotIn("environment", job)
        shared = workflows["translation-run.yml"]
        self.assertEqual(shared["jobs"]["discover"]["if"], "github.ref == 'refs/heads/master'")
        for name in ("japanese-translation.yml", "korean-translation.yml", "russian-translation.yml"):
            caller = workflows[name]["jobs"]["translation"]
            self.assertEqual(caller["uses"], "./.github/workflows/translation-run.yml")
            self.assertEqual(caller["secrets"]["OSS_AK"], "${{ secrets.OSS_AK }}")
            self.assertNotIn("pull_request", workflows[name]["on"])
        for job in shared["jobs"].values():
            for step in job["steps"]:
                if step.get("uses", "").startswith("actions/checkout@"):
                    self.assertEqual(step["with"]["ref"], "master")
                    self.assertFalse(step["with"]["persist-credentials"])
                if step.get("run", "").startswith("yarn "):
                    self.assertIn("--ignore-scripts", step["run"])


if __name__ == "__main__":
    unittest.main()
