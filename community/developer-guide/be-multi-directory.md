---
{
    "title": "BE Multi-Directory Shared Cache",
    "language": "en"
}
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

When working with AI Agents for Doris BE development, a common pattern is to use `git worktree` or similar methods to maintain multiple development branches in different directories simultaneously. Due to ccache's sensitivity to full path names, even when the majority of cpp files are identical across different directories, ccache cannot hit the cache, causing worktree directories to recompile from scratch, significantly slowing down development. To address this issue, we have implemented custom optimizations that can be configured as follows:

## Directory Requirements

Doris has already set `CCACHE_BASEDIR` and `-ffile-prefix-map` in the environment configuration file, mapping most compilation options to the same path for cache hit. **The premise is that all Doris development directories must share the same parent directory.** All Doris development directories must satisfy relationship like this:

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## Environment Configuration

1. In addition to the above settings, hardcoded paths still need to be manually adjusted. The UBSAN IGNORELIST of the main repository needs to be hardcoded in the `custom_env.sh` of the worktree directory:

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

Where `DORIS_MAIN_REPO` is the path to the main repository. We recommend configuring this value directly in the main repository's `custom_env.sh`, and having the AI workflow automatically pass it to all worktree directories through `hooks/setup_worktree.sh` and `AGENTS.md`.

2. To ensure sufficient cache space, manually increase the ccache cache capacity:

```bash
ccache --set-config=max_size=50G
```

## Debug Method

You can use `ccache -s` to view cache statistics and confirm whether the cache is working. Pay attention to the `cache hit rate` field; if the value is too low, it indicates the cache is not being hit correctly. Before each observation, you can use `ccache -z` to clear the statistics to ensure accurate results. When cache hits are problematic, you can enable ccache debug logs to confirm:

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

You can view detailed cache hit information in `CCACHE_LOGFILE` to help identify issues. After enabling `CCACHE_DEBUG=1`, each compilation unit will generate its own `*.ccache-input-text` file, recording the input information of that compilation unit, including source file paths and compilation options. Theoretically, the same file in two different directories must have **completely identical `ccache-input-text` content** to hit the ccache cache. For files that fail to hit the cache, you can examine the differences between the two `ccache-input-text` files to identify the reasons for the cache miss.
