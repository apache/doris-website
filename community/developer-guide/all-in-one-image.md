---
title: All-in-One Image for Integration Testing
language: en
description: The official Apache Doris all-in-one image runs one FE and one BE in a single container, giving ecosystem projects a real Doris instance for e2e and CI.
keywords:
    - Apache Doris
    - all-in-one image
    - integration testing
    - e2e testing
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
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

<!-- Knowledge Type: Tool Usage -->
<!-- Applicable Scenarios: Ecosystem project integration testing / CI environment setup -->

Ecosystem projects around Apache Doris — connectors, SDKs, data integration tools — usually need a real Doris instance in their e2e / CI runs rather than a mock. The official all-in-one image is built for exactly that: one FE and one BE in a single container, ready to use on startup, with a health check, so it can be dropped in as a test fixture.

This document describes what the image provides, how to use it, and how to build it yourself.

:::caution Note

This image is a test fixture designed for integration testing: a single FE and a single BE, one replica, memory settings tuned down for CI runners, and no data persistence by default. Do not use it for production deployment.

:::

## Image overview

Image tags look like `apache/doris:all-in-one-<version>`, for example `apache/doris:all-in-one-4.1.3`. Every example below uses 4.1.3 — replace it with the version you need. For the available tags, see the [apache/doris repository on Docker Hub](https://hub.docker.com/r/apache/doris/tags?name=all-in-one).

The image is assembled from the official `apache/doris:fe-<version>` and `apache/doris:be-<version>` images, so what runs inside it is the released artifact itself. Only two things are done for the CI use case: debug info is stripped from `doris_be` (`.symtab` is kept, so crash backtraces still resolve function names), and the JNI scanner directories the tag does not need are removed.

The behaviors that matter for integration testing:

| Feature | Description |
| --- | --- |
| Ready to use | FE startup, `ALTER SYSTEM ADD BACKEND` registration of the BE, and waiting for the BE to come online all happen inside the container. No external script is involved |
| Health check | The image ships a `HEALTHCHECK` that turns `healthy` only once FE is ready and the BE is online, usually within 20 seconds. CI can wait on that status instead of calling `sleep` |
| Single replica | `force_olap_table_replication_num = 1` is set, so `CREATE TABLE` does not need `replication_num` |
| Bounded resources | Memory is tuned down for CI runners: FE heap `-Xmx2048m`, the BE-side JNI heap `-Xmx1024m`, and BE `mem_limit = 40%` |
| Fail-fast | If either FE or BE exits, the container exits non-zero right away instead of restarting silently, so a failure surfaces immediately in CI |
| Graceful shutdown | `docker stop` stops BE first, then FE, and exits 0 |
| Multi-architecture | One tag covers both linux/amd64 and linux/arm64 |

### The two tags: base and -full

| Tag | Covers | Image size (4.1.3, uncompressed) |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | Internal tables, Hive, Iceberg (including system tables), Paimon, JDBC catalogs, external table writeback, Java UDF | About 2.5 GB |
| `apache/doris:all-in-one-<version>-full` | Everything above, plus Hudi, Trino connector, MaxCompute | About 3.0 GB |

The sizes were measured on 4.1.3. For reference, the same payload without stripping and pruning is about 4.9 GB.

**Only pick `-full` if the tests actually read Hudi tables, go through the Trino connector, or use MaxCompute.** Otherwise use the tag without the suffix.

The difference between the two tags comes from how BE loads its scanners: at startup BE enumerates the directories under `be/lib/java_extensions/` to load JNI scanners. There is no list and no configuration key, so a tag supports exactly the formats whose directory it ships. Note that Hive and Iceberg **data** reads go through BE's native parquet / orc reader rather than these JNI scanners, so both tags support them.

### Multi-architecture support

`apache/doris:all-in-one-4.1.3` is an OCI image index carrying one manifest for linux/amd64 and one for linux/arm64. A `docker pull` picks the one matching the host automatically, the same way `apache/doris:fe-4.1.3` does, so CI does not need different tags for runners of different architectures.

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution Note

A Doris BE generally cannot run under cross-architecture emulation. Starting the amd64 image with `--platform linux/amd64` on Apple Silicon, for instance, segfaults, and the official `apache/doris:be-*` images behave the same way. Run the image on real hardware of the matching architecture.

:::

## Using it in integration tests

### Connection information

| Item | Description |
| --- | --- |
| MySQL protocol | Port `9030`, user `root`, no password |
| FE HTTP | Port `8030`, `/api/health` needs no authentication |
| BE HTTP | Port `8040`, the stream load endpoint |
| BE heartbeat | Port `9050`, used inside the container, normally not mapped to the host |

### Plain docker run

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    apache/doris:all-in-one-4.1.3

# Wait until the container is healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' doris)" = healthy ]; do sleep 1; done

mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

The image ships a MySQL client, so if the host does not have one, run it inside the container instead:

```shell
docker exec doris mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

### Docker Compose

With `depends_on` and `service_healthy`, the test container starts only after Doris is genuinely usable:

```yaml
services:
  doris:
    image: apache/doris:all-in-one-4.1.3
    ports: ["9030:9030", "8030:8030", "8040:8040"]

  integration-test:
    image: my-project-tests:latest
    depends_on:
      doris:
        condition: service_healthy
```

### GitHub Actions

As a service container, GitHub Actions waits for the container to become `healthy` before running the `steps`, so the test code does not need its own retry-and-wait logic:

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      doris:
        image: apache/doris:all-in-one-4.1.3
        ports: ['9030:9030', '8030:8030', '8040:8040']
    steps:
      - uses: actions/checkout@v4
      - run: mvn -B verify -Pe2e
```

### Adjusting the configuration

The image already carries a set of integration-test defaults. To change something, use the two environment variables below to append configuration items; they are appended to the end of `fe.conf` and `be.conf` respectively at startup, and the last assignment wins:

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    apache/doris:all-in-one-4.1.3
```

| Environment variable | Effect |
| --- | --- |
| `FE_CONFIG_EXTRA` | Appended to `fe.conf`. Separate multiple items with newlines |
| `BE_CONFIG_EXTRA` | Appended to `be.conf`. Separate multiple items with newlines |

**Data persistence**: there is none by default, so the data is gone once the container is removed, which is usually what CI wants. To keep the data, mount `/opt/apache-doris/fe/doris-meta` and `/opt/apache-doris/be/storage`. The startup path is idempotent, so the same data directory can be started again and again.

### Troubleshooting

- `docker logs <container>` carries the entrypoint's startup log and FE's console stream, which tells you where the cluster is stuck during startup.
- The full logs live inside the container at `fe/log/fe.log` and `be/log/be.INFO`.
- A non-zero container exit means FE or BE died. The log right before the exit names which one it was and which log file to read.
- Tests handling larger volumes of data may need `vm.max_map_count` raised **on the host** (`sysctl -w vm.max_map_count=2000000`). It is not a namespaced sysctl, so the container cannot set it, which is why the image skips `start_be.sh`'s check for it.

## Building the image yourself

The Dockerfile and the build script live under `docker/runtime/all-in-one/<release-line>/` in the main Doris repository, where `4.1` is currently available. Release lines differ enough in artifact layout that each gets its own directory instead of a version switch inside a single Dockerfile.

`build.sh` is the only entry point. The build context is always the repository root, and the script itself can be run from any directory:

```shell
# Build both the base and the -full tag from the official 4.1.3 component images
# (host architecture only)
./build.sh -v 4.1.3

# Build base only, then run a smoke test against it
./build.sh -v 4.1.3 -f base -t

# Build from a local ./output, which is handy for verifying your own changes
# Requires a completed Doris build producing ./output/fe and ./output/be
./build.sh -v dev -s local
```

Without `--platform`, only the host architecture is built. Multi-architecture builds need it spelled out, for example `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push`. Since a cross-architecture build goes through emulation and takes a long time, building each architecture natively on its own machine and then joining the results with `docker buildx imagetools create` is the better choice for a release.

`./build.sh --help` lists the remaining options.

:::tip

For implementation details — what the image prunes, why some directories that look like external table extras must not be pruned, where the size goes, and how to run the smoke test — see the [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md) in that directory.

:::
