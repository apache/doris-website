"""Measure publishing jobs without putting reports or credentials in the site."""

import argparse
from datetime import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import time
import urllib.request


REPORTS = Path(".i18n-build/publish-metrics")


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def git(*args):
    return subprocess.check_output(["git", *args]).decode().strip()


def snapshot():
    memory = {}
    if Path("/proc/meminfo").exists():
        for line in Path("/proc/meminfo").read_text().splitlines():
            key, value = line.split(":", 1)
            if key in ("MemTotal", "MemAvailable", "SwapTotal", "SwapFree"):
                memory[key + "KiB"] = int(value.split()[0])
    disks = {}
    for mount in (str(Path.cwd()), "/mnt"):
        if Path(mount).exists():
            usage = shutil.disk_usage(mount)
            disks[mount] = {"totalBytes": usage.total, "usedBytes": usage.used,
                            "freeBytes": usage.free}
    return {"time": time.time(), "memory": memory, "disks": disks}


def sample():
    # A timeout/cancellation may prevent finish from running. The runner also
    # cleans up this process at job end; the deadline bounds standalone use.
    deadline = time.monotonic() + 4 * 3600
    while not (REPORTS / "stop").exists() and time.monotonic() < deadline:
        with (REPORTS / "samples.jsonl").open("a") as out:
            out.write(json.dumps(snapshot()) + "\n")
        time.sleep(10)


def launch_sampler():
    subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "sample"],
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                     stderr=subprocess.DEVNULL, start_new_session=True)


def start(job):
    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "stop").unlink(missing_ok=True)
    context = {key: os.environ.get(key) for key in (
        "GITHUB_REPOSITORY", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT", "GITHUB_SHA",
        "GITHUB_WORKFLOW_REF", "GITHUB_EVENT_NAME", "RUNNER_OS", "RUNNER_ARCH",
        "ImageOS", "ImageVersion", "DEPLOY_SOURCE_SHA", "DORIS_ENABLE_JA",
        "DORIS_ENABLE_KO", "DORIS_ENABLE_RU", "DOCS_VERSIONS")}
    write_json(REPORTS / "context.json", {
        "schemaVersion": 1, "job": job, "startedAt": time.time(),
        "checkoutSha": git("rev-parse", "HEAD"), "context": context,
        "platform": platform.platform(), "cpuCount": os.cpu_count(),
        "activeVersions": (["current", *json.loads(Path("versions.json").read_text())]
                           if job == "build" else None),
        "checkoutActiveVersions": ["current", *json.loads(Path("versions.json").read_text())],
        "cachePolicy": ("fresh runner; no dependency cache; yarn cache clean before install"
                        if job == "build" else "fresh runner; site downloaded from this run's artifact"),
        "initialResources": snapshot(),
    })
    launch_sampler()


def site_inventory(site):
    if not site.is_dir():
        return None
    files, size = 0, 0
    for root, _, names in os.walk(site):
        for name in names:
            item = Path(root) / name
            if item.is_file():
                files += 1
                size += item.stat().st_size
    return {"files": files, "bytes": size}


def api(url):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + os.environ["GH_TOKEN"],
        "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.load(response)


def job_details(context):
    env = context["context"]
    if not os.environ.get("GH_TOKEN"):
        return None
    url = (f"https://api.github.com/repos/{env['GITHUB_REPOSITORY']}/actions/runs/"
           f"{env['GITHUB_RUN_ID']}/attempts/{env['GITHUB_RUN_ATTEMPT']}/jobs?per_page=100")
    return next(job for job in api(url)["jobs"] if job["name"] == context["job"])


def duration(start, end):
    return (datetime.fromisoformat(end.replace("Z", "+00:00")) -
            datetime.fromisoformat(start.replace("Z", "+00:00"))).total_seconds()


def tool_version(name):
    try:
        result = subprocess.run([name, "--version"], capture_output=True, text=True, timeout=15)
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def resource_peaks(samples):
    disks = {}
    available = []
    for sample in samples:
        memory = sample["memory"]
        if "MemAvailableKiB" in memory:
            available.append(memory["MemAvailableKiB"])
        for mount, usage in sample["disks"].items():
            current = disks.setdefault(mount, {"maxUsedBytes": 0, "minFreeBytes": usage["freeBytes"]})
            current["maxUsedBytes"] = max(current["maxUsedBytes"], usage["usedBytes"])
            current["minFreeBytes"] = min(current["minFreeBytes"], usage["freeBytes"])
    return {"sampleCount": len(samples), "sampleIntervalSeconds": 10,
            "minSystemMemoryAvailableKiB": min(available) if available else None,
            "disks": disks}


def finish(budget):
    (REPORTS / "stop").touch()
    report = json.loads((REPORTS / "context.json").read_text())
    report["finishedAt"] = time.time()
    report["elapsedThroughReportSeconds"] = report["finishedAt"] - report["startedAt"]
    report["finalResources"] = snapshot()
    report["site"] = site_inventory(Path("build"))
    if report["job"] == "deploy" and Path("build/versions.json").is_file():
        # Manual deploy code is checked out at the workflow commit, which
        # may have different versions from the protected source branch.
        report["activeVersions"] = ["current", *json.loads(Path("build/versions.json").read_text())]
    report["trackedDiffSha256"] = hashlib.sha256(
        subprocess.check_output(["git", "diff", "HEAD", "--binary"])).hexdigest()
    report["nodeVersion"] = tool_version("node")
    report["yarnVersion"] = tool_version("yarn")
    report["jobBudgetMinutes"] = budget
    report["steps"] = []
    samples = [report["initialResources"], report["finalResources"]]
    if (REPORTS / "samples.jsonl").exists():
        for line in (REPORTS / "samples.jsonl").read_text().splitlines():
            try:
                samples.append(json.loads(line))
            except json.JSONDecodeError:
                pass  # The sampler may still be finishing its final line.
    report["sampledResources"] = resource_peaks(samples)
    try:
        job = job_details(report)
        if job:
            report["runner"] = {key: job.get(key) for key in (
                "id", "runner_name", "runner_group_name", "labels", "started_at", "html_url")}
            for step in job["steps"]:
                item = {key: step.get(key) for key in (
                    "name", "number", "status", "conclusion", "started_at", "completed_at")}
                if item["started_at"] and item["completed_at"]:
                    item["seconds"] = duration(item["started_at"], item["completed_at"])
                    start = datetime.fromisoformat(item["started_at"].replace("Z", "+00:00")).timestamp()
                    end = datetime.fromisoformat(item["completed_at"].replace("Z", "+00:00")).timestamp()
                    item["sampledResources"] = resource_peaks(
                        [sample for sample in samples if start <= sample["time"] <= end])
                report["steps"].append(item)
            # Includes checkout/setup before start, excludes this reporting
            # step, telemetry upload and cleanup. Not a final job duration.
            report["elapsedThroughReportSeconds"] = (
                report["finishedAt"] - datetime.fromisoformat(job["started_at"].replace("Z", "+00:00")).timestamp())
    except Exception as error:
        report["jobApiError"] = type(error).__name__
        print("::warning::Publish step timing API unavailable; retain the run's final jobs JSON")
    artifact_id = os.environ.get("SITE_ARTIFACT_ID")
    if os.environ.get("GH_TOKEN") and report["context"]["GITHUB_REPOSITORY"]:
        report["siteArtifact"] = {"uploadId": artifact_id,
                                  "uploadDigest": os.environ.get("SITE_ARTIFACT_DIGEST")}
        try:
            env = report["context"]
            artifacts = api(f"https://api.github.com/repos/{env['GITHUB_REPOSITORY']}/actions/runs/{env['GITHUB_RUN_ID']}/artifacts?per_page=100")
            name = f"site-build-{env['GITHUB_RUN_ID']}-{env['GITHUB_RUN_ATTEMPT']}"
            artifact = next(item for item in artifacts["artifacts"] if item["name"] == name)
            report["siteArtifact"].update({key: artifact.get(key) for key in (
                "id", "name", "size_in_bytes", "digest", "created_at", "expires_at")})
        except Exception as error:
            report["siteArtifact"]["apiError"] = type(error).__name__
    measured = report["elapsedThroughReportSeconds"]
    report["provisionalBudgetWith30PercentMinutes"] = math.ceil(measured * 1.3 / 60)
    report["headroomPercentThroughReport"] = round((budget * 60 / measured - 1) * 100, 1)
    # Keep the GNU time output, existing per-locale/build/optimization reports
    # and ten-second samples as raw evidence alongside this compact report.
    write_json(REPORTS / "report.json", report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a") as out:
            out.write(f"### {report['job']} publishing measurements\n\n"
                      f"Source: `{report['context']['DEPLOY_SOURCE_SHA']}`; "
                      f"checkout: `{report['checkoutSha']}`.\n\n"
                      f"Elapsed through reporting: {measured / 60:.1f} min; "
                      f"job limit: {budget} min; provisional 30% budget: "
                      f"{report['provisionalBudgetWith30PercentMinutes']} min. "
                      "Add telemetry upload and cleanup from the final jobs API before accepting a budget.\n\n"
                      "| Step | Result | Seconds |\n| --- | --- | ---: |\n")
            for step in report["steps"]:
                out.write(f"| {step['name']} | {step['conclusion'] or step['status']} | {step.get('seconds', '')} |\n")
    if report["provisionalBudgetWith30PercentMinutes"] > budget:
        print("::warning::Publish job has less than 30% measured budget margin")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("start", "sample", "finish"))
    parser.add_argument("--job", choices=("build", "deploy"))
    parser.add_argument("--budget", type=int, default=180)
    args = parser.parse_args()
    if args.operation == "start":
        if not args.job:
            parser.error("start requires --job")
        start(args.job)
    elif args.operation == "sample":
        sample()
    else:
        finish(args.budget)
