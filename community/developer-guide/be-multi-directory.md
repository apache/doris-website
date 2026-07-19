---
title: BE Multi-Directory Shared Cache
language: en
description: Guide to configuring and debugging ccache shared cache for Apache Doris BE development across multiple directories (worktrees).
keywords:
    - Apache Doris BE
    - ccache
    - git worktree
    - multi-directory development
    - CCACHE_BASEDIR
    - ffile-prefix-map
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# BE Multi-Directory Shared Cache

When working with an AI agent on Doris BE development, a common pattern is to maintain multiple development branches in parallel across different directories using `git worktree` or similar approaches. Because ccache caching is sensitive to full path names, ccache cannot hit the cache in different directories even when the contents of the cpp files are nearly identical. As a result, the worktree directory has to be compiled from scratch, which significantly slows down development. To solve this problem, custom optimizations have been applied. Configure as described below.

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-worktree parallel development / Build acceleration -->

## 1. Directory Requirements

Doris already sets `CCACHE_BASEDIR` and `-ffile-prefix-map` in its environment configuration file, mapping most compile options to the same path so that the cache can be hit. **The prerequisite is that all Doris development directories must share the same parent directory.** That is, all Doris development directories must satisfy the following sibling relationship:

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## 2. Environment Configuration

<!-- Knowledge type: Operation steps -->

### 2.1 Configure the UBSAN_IGNORELIST Hardcoded Path

In addition to the automatic settings above, the hardcoded path still needs to be adjusted manually. In the worktree directory's `custom_env.sh`, hardcode the main repository's UBSAN IGNORELIST:

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

Here, `DORIS_MAIN_REPO` is the path to the main repository. Recommended practice:

1. Configure this value directly in the main repository's `custom_env.sh`.
2. Through the cooperation of `hooks/setup_worktree.sh` and `AGENTS.md`, let the AI workflow automatically propagate it to all worktree directories.

### 2.2 Increase the ccache Cache Capacity

To ensure sufficient cache space, manually increase the ccache cache capacity:

```bash
ccache --set-config=max_size=50G
```

| Configuration | Recommended value | Description                                                  |
| ------------- | ----------------- | ------------------------------------------------------------ |
| `max_size`    | `50G`             | Minimum recommended capacity when running multiple worktrees in parallel |

## 3. Debugging Methods

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Troubleshooting / Cache miss diagnosis -->

### 3.1 View Cache Statistics

Run `ccache -s` to view cache statistics and confirm whether the cache is working. Focus on the `cache hit rate` field. If the value is too low, the cache is not being hit correctly. Before each observation, run `ccache -z` to clear the statistics so that the result is accurate.

| Command      | Purpose                                  |
| ------------ | ---------------------------------------- |
| `ccache -s`  | View cache hit statistics                |
| `ccache -z`  | Clear statistics (does not clear cache)  |
| `ccache -C`  | Clear the cache (use with caution)       |

### 3.2 Enable ccache Debug Logging

When you confirm that there is a problem with cache hits, enable ccache debug logging:

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

| Environment variable | Effect                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `CCACHE_LOGFILE`     | Detailed log output file, used to inspect the reason for each cache hit or miss        |
| `CCACHE_DEBUG=1`     | Generates a `*.ccache-input-text` file for each compilation unit, recording its inputs |

### 3.3 Identify the Cause of a Miss

Once `CCACHE_DEBUG=1` is enabled, each compilation unit produces its own `*.ccache-input-text` file, recording the inputs for that compilation unit, including the source file path, compile options, and so on.

In theory, for the same file in two different directories, **the contents of their respective `ccache-input-text` files must be exactly identical for the ccache cache to be hit.** For a file that misses, compare the `ccache-input-text` files on both sides to identify the cause of the miss.

## 4. Frequently Asked Questions (FAQ)

<!-- Knowledge type: Troubleshooting -->

### Q1: The cache hit rate is always 0

Check whether all worktrees are under the same parent directory. If not, `CCACHE_BASEDIR` and `-ffile-prefix-map` cannot map the paths to a consistent value, and the cache will never hit.

### Q2: Cache space is evicted frequently

Increase `max_size` as described in Section 2.2. For scenarios with multiple worktrees running in parallel, at least 50 GB is recommended.

### Q3: The UBSAN_IGNORELIST path reports an error

The worktree directory does not point to the main repository's ignorelist file through `custom_env.sh`. See Section 2.1 for the configuration.
