#!/usr/bin/env python3
"""Measure one full, sequential Docusaurus build without deploying anything."""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import threading
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--japanese', action='store_true')
args = parser.parse_args()
source, output = args.source.resolve(), args.output.resolve()
output.mkdir(parents=True, exist_ok=True)

env = os.environ.copy()
restricted = [key for key in env if key in ('DOCS_VERSIONS', 'LANDING_ONLY') or key.startswith('SKIP_')]
if any(env[key] for key in restricted):
    parser.error('Full evidence requires unset scope variables: ' + ', '.join(restricted))
env['DORIS_ENABLE_JA'] = 'true' if args.japanese else 'false'
env['DORIS_ASSET_ORIGIN'] = ''
locales = ['en', 'zh-CN'] + (['ja'] if args.japanese else [])
command = ['yarn', 'docusaurus', 'build']
for locale in locales:
    command += ['--locale', locale]
command += ['--out-dir', str(output / 'site')]

def run_text(command):
    return subprocess.check_output(command, cwd=source, text=True).strip()

def read_file(path):
    try:
        return Path(path).read_text().strip()
    except OSError:
        return None

def memory_info():
    text = read_file('/proc/meminfo') or ''
    return {key: int(value) * 1024 for key, value in re.findall(r'^(\w+):\s+(\d+)\s+kB', text, re.M)}

def cgroup_path():
    for line in (read_file('/proc/self/cgroup') or '').splitlines():
        if line.startswith('0::'):
            candidate = Path('/sys/fs/cgroup') / line[3:].lstrip('/')
            if candidate.is_dir():
                return candidate
    return None

cgroup = cgroup_path()
def cgroup_snapshot():
    if cgroup is None:
        return {'unavailable': 'No readable cgroup v2 path'}
    return {name: read_file(cgroup / name) for name in ('memory.current', 'memory.peak', 'memory.max', 'memory.events', 'memory.pressure', 'memory.swap.current', 'memory.swap.peak', 'memory.swap.max')}

def kernel_oom_kills():
    match = re.search(r'^oom_kill\s+(\d+)$', read_file('/proc/vmstat') or '', re.M)
    return int(match[1]) if match else None

output_lock = threading.Lock()
def emit(value):
    with output_lock:
        print(json.dumps(value), flush=True)

metadata = {
    'source_sha': run_text(['git', 'rev-parse', 'HEAD']),
    'dirty_paths': run_text(['git', 'status', '--short']),
    'node': run_text(['node', '--version']),
    'yarn': run_text(['yarn', '--version']),
    'yarn_lock_sha256': hashlib.sha256((source / 'yarn.lock').read_bytes()).hexdigest(),
    # The baseline and PoC both apply the same pinned React 18 SSR fix.
    'react_ssr': {
        'version': json.loads((source / 'node_modules/react-dom/package.json').read_text())['version'],
        'production_sha256': hashlib.sha256((source / 'node_modules/react-dom/cjs/react-dom-server.node.production.min.js').read_bytes()).hexdigest(),
        'development_sha256': hashlib.sha256((source / 'node_modules/react-dom/cjs/react-dom-server.node.development.js').read_bytes()).hexdigest(),
    },
    'runner_os': env.get('RUNNER_OS'),
    'runner_name': env.get('RUNNER_NAME'),
    'uname': run_text(['uname', '-a']),
    'command': command,
    'node_options': env.get('NODE_OPTIONS'),
    'pwa_service_worker_url': env.get('PWA_SERVICE_WORKER_URL'),
    'scope_variables': {key: env[key] for key in restricted},
    'active_versions': json.loads((source / 'versions.json').read_text()) + ['current'],
    'locales': locales,
    'asset_origin': env['DORIS_ASSET_ORIGIN'],
    'meminfo_before': memory_info(),
    'swap_config': read_file('/proc/swaps'),
    'cgroup_path': str(cgroup) if cgroup else None,
    'cgroup_before': cgroup_snapshot(),
    'kernel_oom_kills_before': kernel_oom_kills(),
    'started_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'language_events': [],
}
(output / 'environment.json').write_text(json.dumps(metadata, indent=2) + '\n')
start = time.monotonic()
emit({'event': 'environment', 'source_sha': metadata['source_sha'], 'node': metadata['node'],
      'meminfo': metadata['meminfo_before'], 'swap_config': metadata['swap_config'],
      'cgroup': metadata['cgroup_before'], 'kernel_oom_kills': metadata['kernel_oom_kills_before']})
# GNU time reports the command's Max RSS separately from system/cgroup samples.
process = subprocess.Popen(['/usr/bin/time', '-v', '-o', str(output / 'time.txt')] + command, cwd=source, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors='replace', start_new_session=True)

def terminate_build(signum, _frame):
    metadata['termination_signal'] = signal.Signals(signum).name
    # Terminate only this build's own process group, allowing the observer to
    # persist the final counters even if the runner skips artifact upload.
    try:
        os.killpg(process.pid, signum)
    except ProcessLookupError:
        pass

signal.signal(signal.SIGTERM, terminate_build)
signal.signal(signal.SIGINT, terminate_build)
stop = threading.Event()
peaks = {'system_used_bytes': 0, 'system_swap_used_bytes': 0, 'tree_rss_sum_bytes': 0, 'cgroup_current_bytes': None}
active_locale = None

def sample():
    with (output / 'memory.csv').open('w') as file:
        writer = csv.writer(file)
        writer.writerow(['elapsed_s', 'system_used_bytes', 'system_swap_used_bytes', 'tree_rss_sum_bytes', 'cgroup_current_bytes'])
        next_report = 0
        while True:
            mem = memory_info()
            used = mem.get('MemTotal', 0) - mem.get('MemAvailable', 0)
            swap = mem.get('SwapTotal', 0) - mem.get('SwapFree', 0)
            rows = subprocess.check_output(['ps', '-e', '-o', 'pid=,ppid=,rss='], text=True).splitlines()
            entries = [tuple(map(int, row.split())) for row in rows if len(row.split()) == 3]
            descendants = {process.pid}
            while True:
                expanded = descendants | {pid for pid, ppid, rss in entries if ppid in descendants}
                if expanded == descendants:
                    break
                descendants = expanded
            rss = sum(rss * 1024 for pid, ppid, rss in entries if pid in descendants)
            current = read_file(cgroup / 'memory.current') if cgroup else None
            current = int(current) if current and current.isdigit() else None
            for key, value in [('system_used_bytes', used), ('system_swap_used_bytes', swap), ('tree_rss_sum_bytes', rss), ('cgroup_current_bytes', current)]:
                if value is not None:
                    peaks[key] = max(peaks[key] or 0, value)
            writer.writerow([round(time.monotonic() - start, 3), used, swap, rss, current])
            file.flush()
            elapsed = time.monotonic() - start
            if elapsed >= next_report:
                emit({'event': 'memory', 'locale': active_locale, 'elapsed_s': round(elapsed, 3),
                      'memory_available_bytes': mem.get('MemAvailable'),
                      'swap_free_bytes': mem.get('SwapFree'), 'peaks': dict(peaks),
                      'kernel_oom_kills': kernel_oom_kills(), 'cgroup': cgroup_snapshot(),
                      'system_memory_pressure': read_file('/proc/pressure/memory')})
                next_report = elapsed + 60
            if stop.wait(2):
                break

sampler = threading.Thread(target=sample)
sampler.start()
with (output / 'build.log').open('w') as log:
    for line in process.stdout:
        log.write(line)
        log.flush()
        plain_line = re.sub(r'\x1b\[[0-9;]*m', '', line)
        match = re.search(r'\[INFO\] \[([^]]+)\] Creating an optimized production build', plain_line)
        event = None
        if match:
            active_locale = match[1]
            event = {'locale': active_locale, 'event': 'start'}
        elif '[SUCCESS] Generated static files' in plain_line:
            event = {'locale': active_locale, 'event': 'end'}
        if event:
            event.update({'elapsed_s': round(time.monotonic() - start, 3), 'utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
            metadata['language_events'].append(event)
            emit(event)
        if any(marker in plain_line for marker in ('[ERROR]', 'FATAL ERROR', 'heap out of memory', 'Killed')):
            emit({'event': 'build_error', 'line': plain_line.rstrip()})
exit_code = process.wait()
if exit_code < 0:
    exit_code = 128 - exit_code
stop.set()
sampler.join()
metadata.update({'exit_code': exit_code, 'elapsed_s': round(time.monotonic() - start, 3), 'sampled_peaks': peaks, 'cgroup_after': cgroup_snapshot(), 'meminfo_after': memory_info()})
metadata['kernel_oom_kills_after'] = kernel_oom_kills()
metadata['interpretation'] = 'Process RSS sums can double-count shared pages. System used memory includes the whole runner. cgroup peaks can include earlier steps: compare before/after. Max RSS alone is not whole-job memory. Missing metrics are null, never an asserted zero.'
(output / 'result.json').write_text(json.dumps(metadata, indent=2) + '\n')
emit({'exit_code': exit_code, 'elapsed_s': metadata['elapsed_s'], 'sampled_peaks': peaks,
      'termination_signal': metadata.get('termination_signal'), 'cgroup_after': metadata['cgroup_after'],
      'kernel_oom_kills_before': metadata['kernel_oom_kills_before'],
      'kernel_oom_kills_after': metadata['kernel_oom_kills_after']})
raise SystemExit(exit_code)
