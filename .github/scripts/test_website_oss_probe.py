import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('website_oss_probe', Path(__file__).with_name('website_oss_probe.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

CONFIG = {
    'GITHUB_REPOSITORY': 'apache/doris-website',
    'GITHUB_REF': 'refs/heads/master',
    'GITHUB_EVENT_NAME': 'workflow_dispatch',
    'GITHUB_SHA': 'a' * 40,
    'GITHUB_RUN_ID': '123',
    'GITHUB_RUN_ATTEMPT': '1',
    'WEBSITE_OSS_BUCKET': 'doris-website-assets-prod-bj',
    'WEBSITE_OSS_REGION': 'cn-beijing',
    'WEBSITE_OSS_ENDPOINT': 'https://oss-cn-beijing.aliyuncs.com',
    'WEBSITE_ASSET_BASE_URL': 'https://assets-cdn.selectdb.com/site',
}
DENIED = 'Http Status Code: 403.\nError Code: AccessDenied.\n'


class ProbeTests(unittest.TestCase):
    def test_workflow_is_manual_master_only_and_cannot_publish(self):
        root = Path(__file__).resolve().parents[2]
        raw = subprocess.check_output(['node', '-e', """
            const fs = require('fs'), yaml = require('js-yaml');
            console.log(JSON.stringify(yaml.load(fs.readFileSync('.github/workflows/verify-website-oss.yml', 'utf8'))));
        """], cwd=root)
        workflow = json.loads(raw)
        self.assertEqual(set(workflow['on']), {'workflow_dispatch'})
        self.assertEqual(workflow['permissions'], {'contents': 'read'})
        job = workflow['jobs']['probe']
        self.assertEqual(job['permissions'], {'contents': 'read', 'id-token': 'write'})
        for condition in ["github.repository == 'apache/doris-website'",
                          "github.ref == 'refs/heads/master'",
                          "github.event_name == 'workflow_dispatch'"]:
            self.assertIn(condition, job['if'])
        checkout = job['steps'][0]
        self.assertEqual(checkout['with']['ref'], '${{ github.sha }}')
        self.assertFalse(checkout['with']['persist-credentials'])
        self.assertNotIn('environment', job)
        self.assertNotIn('secrets.', json.dumps(workflow))
        self.assertNotIn('asf-site', json.dumps(job))
        for step in job['steps']:
            if 'uses' in step and not step['uses'].startswith('./'):
                self.assertRegex(step['uses'], r'@[0-9a-f]{40}$')
        uses = [step.get('uses', '') for step in job['steps']]
        local_action = './.github/actions/configure-aliyun-credentials'
        self.assertIn(local_action, uses)
        self.assertFalse(any(item.startswith('aliyun/') for item in uses))
        init = next(index for index, step in enumerate(job['steps'])
                    if step.get('run') == 'git submodule update --init --depth 1 -- .github/actions/configure-aliyun-credentials')
        self.assertLess(init, uses.index(local_action))
        gitlink = subprocess.check_output(['git', 'ls-files', '--stage', '--',
                                           '.github/actions/configure-aliyun-credentials'], cwd=root, text=True)
        mode, revision, *_ = gitlink.split()
        self.assertEqual(mode, '160000')
        self.assertEqual(revision, '1e5248c8d5d93a8781ac344a68e19a43341e79e6')
        url = subprocess.check_output(['git', 'config', '-f', '.gitmodules', '--get',
                                      'submodule..github/actions/configure-aliyun-credentials.url'],
                                     cwd=root, text=True).strip()
        self.assertEqual(url, 'https://github.com/aliyun/configure-aliyun-credentials-action.git')

    def test_rejects_untrusted_contexts_before_any_cloud_access(self):
        for key, value in [('GITHUB_REPOSITORY', 'someone/doris-website'),
                           ('GITHUB_REF', 'refs/pull/1/merge'),
                           ('GITHUB_REF', 'refs/heads/preview'),
                           ('GITHUB_EVENT_NAME', 'pull_request'),
                           ('GITHUB_SHA', 'master'),
                           ('GITHUB_RUN_ID', '../site'),
                           ('WEBSITE_OSS_ENDPOINT', 'http://oss-cn-beijing.aliyuncs.com'),
                           ('WEBSITE_OSS_BUCKET', 'doris-community-ci'),
                           ('WEBSITE_ASSET_BASE_URL', 'https://assets-cdn.selectdb.com')]:
            with self.subTest(key=key, value=value), self.assertRaises(probe.ProbeError):
                probe.configuration({**CONFIG, key: value})

    def test_only_explicit_access_denials_count_as_permission_boundaries(self):
        self.assertTrue(probe.access_denied(subprocess.CompletedProcess([], 2, '', DENIED)))
        for code, message in [(0, DENIED), (2, 'connection timed out'),
                              (2, 'Http Status Code: 404.\nError Code: NoSuchKey.'),
                              (2, 'Http Status Code: 403.\nError Code: SecurityTokenExpired.'),
                              (2, 'Http Status Code: 400.\nError Code: AccessDenied.')]:
            with self.subTest(message=message):
                self.assertFalse(probe.access_denied(subprocess.CompletedProcess([], code, '', message)))

    def fake_runner(self, calls, *, allow_media_write=False):
        def run(command, **kwargs):
            calls.append(command)
            if command[1] == 'cat':
                return subprocess.CompletedProcess(command, 0, 'github-123-1-aaaaaaaaaaaa\n', '')
            operation = command[2]
            key = command[command.index('--key') + 1] if '--key' in command else ''
            prefix = command[command.index('--prefix') + 1] if '--prefix' in command else ''
            allowed = (operation == 'get-bucket-location'
                       or operation == 'put-object' and key.startswith('site/rebuild-probes/')
                       or operation == 'list-objects-v2' and prefix == 'site/rebuild-probes/'
                       or allow_media_write and operation == 'put-object' and key.startswith('media/'))
            return subprocess.CompletedProcess(command, 0 if allowed else 2, '', '' if allowed else DENIED)
        return run

    def test_full_probe_uses_disposable_keys_and_never_publishes(self):
        calls = []
        with patch.object(probe, 'verify_delivery') as delivery, \
                patch.object(probe, 'request', return_value=(403, b'', {'Server': 'AliyunOSS'})):
            report = probe.Probe(CONFIG, run=self.fake_runner(calls)).execute()
        self.assertFalse(report['published'])
        self.assertEqual(len(report['checks']), 14)
        delivery.assert_called_once_with(
            'https://assets-cdn.selectdb.com/site/rebuild-probes/github-123-1-aaaaaaaaaaaa.txt',
            b'github-123-1-aaaaaaaaaaaa\n')
        for command in calls:
            self.assertEqual(command[command.index('--mode') + 1], 'StsToken')
            self.assertEqual(command[command.index('--config-file') + 1], os.devnull)
            self.assertNotIn('--access-key-id', command)
            self.assertNotIn('--access-key-secret', command)
            self.assertNotIn('--sts-token', command)
            if 'delete-object' in command:
                self.assertIn('/never-created-github-', command[command.index('--key') + 1])
            if 'put-object-acl' in command:
                self.assertEqual(command[command.index('--object-acl') + 1], 'private')

    def test_broad_write_permissions_fail_the_probe(self):
        with self.assertRaisesRegex(probe.ProbeError, 'media_write_denied'):
            probe.Probe(CONFIG, run=self.fake_runner([], allow_media_write=True)).execute()

    def test_public_oss_origin_fails_the_probe(self):
        with patch.object(probe, 'verify_delivery'), \
                patch.object(probe, 'request', return_value=(200, b'', {'Server': 'AliyunOSS'})), \
                self.assertRaisesRegex(probe.ProbeError, 'Anonymous OSS read'):
            probe.Probe(CONFIG, run=self.fake_runner([])).execute()

    def test_cdn_requires_exact_content_and_cors(self):
        for response in [(200, b'wrong', {'Access-Control-Allow-Origin': 'https://doris.apache.org'}),
                         (200, b'expected', {}), (404, b'expected', {})]:
            with self.subTest(response=response), self.assertRaises(probe.ProbeError):
                probe.verify_delivery('https://assets-cdn.selectdb.com/site/probe.txt', b'expected',
                                      fetch=lambda _: response, pause=lambda _: None)

    def test_cdn_retries_propagation_errors(self):
        responses = iter([(503, b'', {}), (200, b'expected', {'access-control-allow-origin': 'https://doris.apache.org'})])
        probe.verify_delivery('https://assets-cdn.selectdb.com/site/probe.txt', b'expected',
                              fetch=lambda _: next(responses), pause=lambda _: None)

    def test_cli_failure_does_not_log_raw_signed_requests(self):
        def fail(command, **kwargs):
            return subprocess.CompletedProcess(command, 2, '', 'signed request with secret-data')
        with self.assertRaises(probe.ProbeError) as error:
            probe.Probe(CONFIG, run=fail).oss('read', 'cat', 'oss://bucket/site/probe')
        self.assertNotIn('secret-data', str(error.exception))


if __name__ == '__main__':
    unittest.main()
