---
title: "All-in-One Image: Single Container, Multi-Node and Compute-Storage Separated Clusters"
sidebar_label: All-in-One Image
language: en
description: The official Apache Doris all-in-one image runs three ways - one FE and one BE in a single container as an e2e / CI test fixture, a 3 FE + 3 BE multi-node cluster via Docker Compose, and a compute-storage separated cluster with Meta Service, FoundationDB and MinIO for local development and demos. Also covers image tags, multi-architecture support, configuration and building the image yourself.
keywords:
    - Apache Doris
    - all-in-one image
    - integration testing
    - e2e testing
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
    - multi-node cluster
    - compute-storage separation
    - compute group
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
<!-- Applicable Scenarios: Ecosystem project integration testing / CI environment setup / local multi-node and compute-storage separated clusters -->

The official Apache Doris all-in-one image, `apache/doris:all-in-one-<version>`, packs the released FE, BE and Meta Service into one image; the `DORIS_ROLE` environment variable decides what a container runs at startup. The same image serves three purposes:

| Mode | How to start | What it is for |
| --- | --- | --- |
| **[Single container](#single-container)**<br />1 FE + 1 BE in one container, healthy in about 20 s | `docker run apache/doris:all-in-one-4.1.3` | An e2e / CI test fixture for ecosystem projects such as connectors, SDKs and data integration tools: a real Doris instance instead of a mock |
| **[Multi-node cluster](#multi-node)**<br />3 FE + 3 BE, one container per node, healthy in about 35 s | `docker compose -f multi-node.yml up --wait` | Exercising locally what a single container cannot show: FE election and failover, three replicas, balancing, decommissioning |
| **[Compute-storage separated cluster](#cloud)**<br />FoundationDB + Meta Service + Recycler + MinIO + 1 to 3 FE + 3 BE in 2 compute groups, healthy in about 50 s | `docker compose -f cloud.yml up --wait` | Local feature work and demos of the compute-storage separated mode: compute groups, storage vaults, FE failover in cloud mode, with no external cloud resources |

The single container is meant for CI and needs nothing beyond `docker run`. The two compose files live under [`docker/runtime/all-in-one/4.1/compose/`](https://github.com/apache/doris/tree/master/docker/runtime/all-in-one/4.1/compose) in the main Doris repository and are meant for local feature work and demos. All three modes carry a health check: `healthy` means the cluster has formed, so nothing downstream has to poll or `sleep`.

:::caution Note

All three modes are test / development environments, not production deployments: memory is tuned down to CI runner and workstation sizes, the single container has a single replica, and nothing is persisted by default. The multi-node and compute-storage separated clusters are also no stand-in for the regression pipelines; the `docker()` suites under `regression-test/suites/cloud_p0` still need `doris-compose`.

:::

## Image overview

Image tags look like `apache/doris:all-in-one-<version>`, for example `apache/doris:all-in-one-4.1.3`. Every example below uses 4.1.3 — replace it with the version you need. For the available tags, see the [apache/doris repository on Docker Hub](https://hub.docker.com/r/apache/doris/tags?name=all-in-one).

The image is assembled from the official `apache/doris:fe-<version>`, `be-<version>` and `ms-<version>` images, so what runs inside it is the released artifact itself. Only two things are done for size: debug info is stripped from `doris_be` and from the Meta Service's `doris_cloud` and `libfdb_c.so` (`.symtab` is kept, so crash backtraces still resolve function names), and the JNI scanner directories the tag does not need are removed.

### The two tags: base and -full

| Tag | Covers | Image size (4.1.3, uncompressed) |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | Internal tables, Hive, Iceberg (including system tables), Paimon, JDBC catalogs, external table writeback, Java UDF | About 2.7 GB |
| `apache/doris:all-in-one-<version>-full` | Everything above, plus Hudi, Trino connector, MaxCompute | About 3.2 GB |

The sizes are the uncompressed layer sum measured on 4.1.3; about 0.2 GB of each is the Meta Service, which only the compute-storage separated cluster uses. For reference, the same payload without stripping and pruning is about 5.6 GB.

**Only pick `-full` if the tests actually read Hudi tables, go through the Trino connector, or use MaxCompute.** Otherwise use the tag without the suffix. None of the three modes requires a particular tag; the compose clusters switch to `-full` or to a self-built tag through the `DORIS_IMAGE` environment variable.

The difference between the two tags comes from how BE loads its scanners: at startup BE enumerates the directories under `be/lib/java_extensions/` to load JNI scanners. There is no list and no configuration key, so a tag supports exactly the formats whose directory it ships. Note that Hive and Iceberg **data** reads go through BE's native parquet / orc reader rather than these JNI scanners, so both tags support them.

### Multi-architecture support

`apache/doris:all-in-one-4.1.3` is an OCI image index carrying one manifest for linux/amd64 and one for linux/arm64. A `docker pull` picks the one matching the host automatically, the same way `apache/doris:fe-4.1.3` does, so CI does not need different tags for runners of different architectures.

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution Note

A Doris BE generally cannot run under cross-architecture emulation. Starting the amd64 image with `--platform linux/amd64` on Apple Silicon, for instance, segfaults, and the official `apache/doris:be-*` images behave the same way. Run the image on real hardware of the matching architecture.

:::

## Single container: an integration test fixture {#single-container}

Ecosystem projects around Apache Doris — connectors, SDKs, data integration tools — usually need a real Doris instance in their e2e / CI runs rather than a mock. The single-container mode is built for exactly that: one FE and one BE in one container, ready to use on startup, so it can be dropped in as a test fixture.

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

The image already carries a set of integration-test defaults. To change something, use the environment variables below; they are written into `fe.conf` / `be.conf` at container start, and the last assignment wins:

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    -e FE_HEAP=4096m \
    apache/doris:all-in-one-4.1.3
```

| Environment variable | Effect |
| --- | --- |
| `FE_CONFIG_EXTRA` | Appended to `fe.conf`. Separate multiple items with newlines |
| `BE_CONFIG_EXTRA` | Appended to `be.conf`. Separate multiple items with newlines |
| `FE_HEAP` / `BE_HEAP` | Override the `-Xmx` of the FE / BE-side JVM, e.g. `4096m`; the defaults are `2048m` and `1024m` |

**Data persistence**: there is none by default, so the data is gone once the container is removed, which is usually what CI wants. To keep the data, mount `/opt/apache-doris/fe/doris-meta` and `/opt/apache-doris/be/storage`. The startup path is idempotent, so the same data directory can be started again and again.

### Troubleshooting

- `docker logs <container>` carries the entrypoint's startup log and FE's console stream, which tells you where the cluster is stuck during startup.
- The full logs live inside the container at `fe/log/fe.log` and `be/log/be.INFO`.
- A non-zero container exit means FE or BE died. The log right before the exit names which one it was and which log file to read.
- Tests handling larger volumes of data may need `vm.max_map_count` raised **on the host** (`sysctl -w vm.max_map_count=2000000`). It is not a namespaced sysctl, so the container cannot set it, which is why the image skips `start_be.sh`'s check for it.

## Multi-node and compute-storage separated clusters

The two compose files live under `docker/runtime/all-in-one/4.1/compose/` in the main Doris repository and need Docker Compose v2 (the `docker compose` subcommand). The image defaults to `apache/doris:all-in-one-4.1.3` and can be changed through `DORIS_IMAGE`, set as an environment variable or in a `.env` file next to the compose file; every other knob is passed the same way, and the header comment of each file lists them all.

```shell
cd <doris repository>/docker/runtime/all-in-one/4.1/compose
```

Both files include a `client` service: it turns `healthy` only once every node is alive, which is what `docker compose up --wait` blocks on. It then idles inside the cluster network with `mysql` and `curl`, so `docker compose exec client ...` reaches the cluster.

### Multi-node cluster: multi-node.yml {#multi-node}

```shell
docker compose -f multi-node.yml up --wait          # healthy in about 35 s
docker compose -f multi-node.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f multi-node.yml kill fe-1          # a new master in a few seconds
docker compose -f multi-node.yml start fe-1         # rejoins as a follower
docker compose -f multi-node.yml down               # tears the cluster down; nothing persists
```

```
fe-1 ─┬─ fe-2, fe-3
      ├─ be-1, be-2, be-3
      └─ client
```

- `fe-1` bootstraps the cluster and `fe-2`, `fe-3` join as followers; `FE3_ROLE=observer` turns `fe-3` into an observer.
- Tables default to three replicas, one per BE, as they would on a real cluster.
- Host ports: `9030` / `8030` for `fe-1`, `9031` / `8031` for `fe-2`, `9032` / `8032` for `fe-3`, and `8040` for the HTTP port of `be-1`.
- Knobs: `DORIS_IMAGE`, `SUBNET` (default `172.31.81`), the host ports, `FE_HEAP` (default `1024m`), `BE_MEM_LIMIT` (default `25%`), `FE3_ROLE`.

### Compute-storage separated cluster: cloud.yml {#cloud}

```shell
docker compose -f cloud.yml up --wait                  # 1 FE + 3 BE, healthy in about 50 s
docker compose -f cloud.yml --profile ha up --wait     # ... plus two follower FEs, 3 FEs in total
docker compose -f cloud.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f cloud.yml down                       # tears the cluster down; nothing persists
```

```
fdb ─ fdb-init ─┬─ ms ─ cloud-init ─ fe-1 ─┬─ be-1, be-2  (cg_a)
                └─ recycler                 ├─ be-3        (cg_b)
minio ─ minio-init ─┘                       └─ client
```

- Every Doris process (FE, BE, Meta Service, Recycler) runs from the all-in-one image; FoundationDB and MinIO come from their upstream images.
- `cloud-init` is a one-shot container that creates the instance on the Meta Service in storage-vault mode with MinIO as the vault (path-style, plain HTTP); `fe-1` then marks `built_in_storage_vault` as the default vault, so `CREATE TABLE` works without naming one. Both steps are idempotent.
- The three BEs form two compute groups: `be-1` and `be-2` in `cg_a`, `be-3` in `cg_b`. This gives `use @cg_b`, `SHOW COMPUTE GROUPS`, `ALTER SYSTEM ADD BACKEND ... ("tag.compute_group_name" = ...)`, storage vaults, warm-up and FE failover in cloud mode something to run against, and lets you watch objects land in MinIO.
- Host ports: `9030` / `8030` for `fe-1` (`9031` / `8031` and `9032` / `8032` for `fe-2` and `fe-3` under the `ha` profile), `8040` for the HTTP port of `be-1`, `15000` for the Meta Service HTTP API (`5000` is taken by AirPlay on macOS), `9000` for MinIO and `9001` for the MinIO console (`minioadmin` / `minioadmin`).
- Knobs: `DORIS_IMAGE`, `SUBNET` (default `172.31.80`), the host ports, `FE_HEAP`, `BE_MEM_LIMIT`, `CG_A` / `CG_B` (compute group names), `INSTANCE_ID` (default `100001`, also the FEs' `cluster_id`), `S3_BUCKET` / `S3_AK` / `S3_SK`, `FDB_IMAGE` / `FDB_PLATFORM`.
- A cluster started with `--profile ha` should be stopped and torn down with the same flag, so that `fe-2` and `fe-3` from the profile are handled together with the rest.

### Things to know

- **Keeping data.** `docker compose stop` / `start` (or another `up`) keeps the data; instance creation, the default vault and node registration are all idempotent. `down` removes the containers and the network, and the data with them.
- **Node addresses.** Nodes get fixed IPs on a private subnet (`SUBNET`, default `172.31.81` for multi-node and `172.31.80` for cloud), so a restarted container keeps the identity Doris knows it by. The two files use different subnets, so both clusters can run at once if one of them is given other host ports.
- **From the host.** Use the published ports. On Docker Desktop (macOS / Windows) the container addresses are not routable from the host, so a stream load started on the host cannot follow FE's redirect to a BE; run it from the `client` service instead (`docker compose -f <file> exec client curl ...`). Linux hosts can reach the nodes directly.
- **Memory.** Defaults are `FE_HEAP=1024m` and `mem_limit = 25%` per BE. A full compute-storage separated cluster takes around 9 GB; give Docker Desktop 12 GB or more, and do not expect both topologies to fit side by side on a 16 GB VM.
- **FoundationDB on Apple Silicon.** The upstream `foundationdb/foundationdb:7.1.x` images are amd64 only, so on Apple Silicon `fdb` runs under emulation, which is fine for this purpose; `FDB_IMAGE` / `FDB_PLATFORM` switch it out. The Meta Service links the 7.1 client, so stay on a 7.1 server.
- **Smoke test.** `compose/smoke-test.sh <multi-node|cloud> [image:tag]` brings the topology up under its own project name, subnet and host ports, checks replicas or compute groups and the vault, stream loads through the client, kills the master FE, restarts a BE while the old master is down, brings the master back, and tears everything down. About two minutes per topology.

### Container roles: DORIS_ROLE

Both compose files are assembled from the roles of the same image; the entrypoint dispatches on `DORIS_ROLE` to decide what a container runs. A custom topology (say 1 FE + 5 BE) can be put together the same way:

| `DORIS_ROLE` | Runs | Required variables |
| --- | --- | --- |
| `all` (default) | FE + BE in one container, i.e. the single-container mode | none |
| `fe` | One FE. Bootstraps a new cluster when `FE_MASTER` is empty; otherwise registers as `FE_ROLE` (`follower` \| `observer`) and joins | `FE_MASTER` |
| `be` | One BE, registered with `FE_MASTER`; in compute-storage separated mode it joins the compute group named by `COMPUTE_GROUP` | `FE_MASTER` |
| `ms` / `recycler` | The Meta Service / Recycler of the compute-storage separated mode | `FDB_CLUSTER` |
| `cloud-init` | One-shot: creates the compute-storage separated instance on an S3-compatible object store, then exits | `MS_ENDPOINT`, `INSTANCE_ID`, `S3_*` |
| `client` | Waits for `EXPECT_FE` / `EXPECT_BE` live nodes, then idles with `mysql` and `curl` | `FE_MASTER` |

- `DEPLOY_MODE=cloud` turns `fe` and `be` into compute-storage separated nodes (`deploy_mode`, `meta_service_endpoint`, file cache and so on are written automatically); the FE takes `INSTANCE_ID` as its `cluster_id` and manages nodes by SQL, so no `cloud_unique_id` has to be handed out.
- `FE_MASTER` may list several FEs (`fe-1,fe-2,fe-3`): the first one that answers is used, so a node restart does not wait on the one FE that happens to be down. An FE that already has metadata rejoins on its own.
- Every role honours `FE_CONFIG_EXTRA` / `BE_CONFIG_EXTRA` / `MS_CONFIG_EXTRA` and `FE_HEAP` / `BE_HEAP`, and drops a ready flag once it is up, which the image `HEALTHCHECK` keys on. That is why `docker compose up --wait` blocks until the whole cluster has formed, and a dead process still turns into a non-zero container exit.
- Topology-dependent settings (`priority_networks`, replica count, balancing, the compute-storage separated keys) are written by the entrypoint per role at container start; the conf files baked into the image only carry the size-related defaults.

## Building the image yourself

The Dockerfile and the build script live under `docker/runtime/all-in-one/<release-line>/` in the main Doris repository, where `4.1` is currently available. Release lines differ enough in artifact layout that each gets its own directory instead of a version switch inside a single Dockerfile.

`build.sh` is the only entry point, and the script itself can be run from any directory:

```shell
# Build both the base and the -full tag from the official 4.1.3 component images
# (fe / be / ms), host architecture only
./build.sh -v 4.1.3

# Build base only, then run a smoke test against it
./build.sh -v 4.1.3 -f base -t

# Build from a local ./output, which is handy for verifying your own changes.
# Build Doris with build.sh --fe --be --cloud first; without --cloud there is no
# ./output/ms and the resulting image cannot serve the compute-storage separated cluster
./build.sh -v dev -s local

# Build from an extracted release tarball, e.g. while the component images of a
# new release are not on Docker Hub yet
./build.sh -v 4.1.4 -s tarball --tarball-dir ~/apache-doris-4.1.4-bin-x64
```

The build context is always the repository root (narrowed to a few KB by `Dockerfile.dockerignore`); a local `./output` or a tarball directory is passed as BuildKit named contexts, so it can live anywhere, but this needs `docker buildx`. A self-built image can be used with both compose files directly:

```shell
DORIS_IMAGE=apache/doris:all-in-one-dev docker compose -f multi-node.yml up --wait
```

Without `--platform`, only the host architecture is built. Multi-architecture builds need it spelled out, for example `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push`. Since a cross-architecture build goes through emulation and takes a long time, building each architecture natively on its own machine and then joining the results with `docker buildx imagetools create` is the better choice for a release.

`./build.sh --help` lists the remaining options.

:::tip

For implementation details — what the image prunes, why some directories that look like external table extras must not be pruned, where the size goes, and how to run the smoke test — see the [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md) in that directory.

:::
