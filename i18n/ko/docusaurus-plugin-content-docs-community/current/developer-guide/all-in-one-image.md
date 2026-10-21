---
title: "올인원 이미지: 단일 컨테이너, 다중 노드 및 컴퓨팅·스토리지 분리 클러스터"
sidebar_label: 올인원 이미지
language: ko
description: 공식 Apache Doris 올인원 이미지는 세 가지 방식으로 실행할 수 있습니다. 단일 컨테이너에서 FE 하나와 BE 하나를 실행하는 e2e / CI 테스트 픽스처, Docker Compose를 사용하는 3 FE + 3 BE 다중 노드 클러스터, 로컬 개발과 데모를 위해 Meta Service, FoundationDB, MinIO를 사용하는 컴퓨팅·스토리지 분리 클러스터를 지원합니다. 이미지 태그, 다중 아키텍처 지원, 구성 및 직접 이미지를 빌드하는 방법도 설명합니다.
keywords:
    - Apache Doris
    - 올인원 이미지
    - 통합 테스트
    - e2e 테스트
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
    - 다중 노드 클러스터
    - 컴퓨팅·스토리지 분리
    - 컴퓨팅 그룹
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

공식 Apache Doris 올인원 이미지인 `apache/doris:all-in-one-<version>`는 릴리스된 FE, BE, Meta Service를 하나의 이미지에 담고 있으며, `DORIS_ROLE` 환경 변수가 컨테이너 시작 시 실행할 구성 요소를 결정합니다. 같은 이미지를 세 가지 용도로 사용할 수 있습니다.

| 모드 | 시작 방법 | 용도 |
| --- | --- | --- |
| **[단일 컨테이너](#single-container)**<br />컨테이너 하나에서 1 FE + 1 BE 실행, 약 20초 후 정상 상태 | `docker run apache/doris:all-in-one-4.1.3` | 커넥터, SDK, 데이터 통합 도구 등 생태계 프로젝트의 e2e / CI 테스트 픽스처: 모의 객체 대신 실제 Doris 인스턴스 사용 |
| **[다중 노드 클러스터](#multi-node)**<br />3 FE + 3 BE, 노드마다 컨테이너 하나, 약 35초 후 정상 상태 | `docker compose -f multi-node.yml up --wait` | 단일 컨테이너로는 확인할 수 없는 동작을 로컬에서 검증: FE 선출과 장애 조치, 복제본 세 개, 밸런싱, 노드 해제 |
| **[컴퓨팅·스토리지 분리 클러스터](#cloud)**<br />FoundationDB + Meta Service + Recycler + MinIO + 1~3 FE + 3 BE, 2개의 컴퓨팅 그룹, 약 50초 후 정상 상태 | `docker compose -f cloud.yml up --wait` | 외부 클라우드 리소스 없이 컴퓨팅·스토리지 분리 모드의 기능을 로컬에서 개발하고 시연: 컴퓨팅 그룹, 스토리지 볼트, 클라우드 모드의 FE 장애 조치 |

단일 컨테이너는 CI용으로 설계되었으며 `docker run`만으로 실행할 수 있습니다. 두 Compose 파일은 Doris 기본 저장소의 [`docker/runtime/all-in-one/4.1/compose/`](https://github.com/apache/doris/tree/master/docker/runtime/all-in-one/4.1/compose)에 있으며, 로컬 기능 개발과 데모를 위한 파일입니다. 세 모드 모두 상태 검사를 제공합니다. `healthy`는 클러스터 구성이 완료되었음을 뜻하므로 이후 단계에서 폴링하거나 `sleep`을 호출할 필요가 없습니다.

:::caution 참고

세 모드는 모두 테스트 / 개발 환경이며 운영 배포용이 아닙니다. 메모리는 CI 러너와 워크스테이션 규모에 맞춰 낮게 설정되어 있고, 단일 컨테이너는 복제본 하나를 사용하며, 기본적으로 데이터가 영구 저장되지 않습니다. 다중 노드 및 컴퓨팅·스토리지 분리 클러스터도 회귀 테스트 파이프라인을 대체하지는 않습니다. `docker()` 스위트(`regression-test/suites/cloud_p0` 아래)는 여전히 `doris-compose`가 필요합니다.

:::

## 이미지 개요 {#image-overview}

이미지 태그는 `apache/doris:all-in-one-<version>` 형식이며, 예를 들면 `apache/doris:all-in-one-4.1.3`입니다. 아래의 모든 예제는 4.1.3을 사용하므로 필요한 버전으로 바꾸세요. 사용 가능한 태그는 [Docker Hub의 apache/doris 저장소](https://hub.docker.com/r/apache/doris/tags?name=all-in-one)를 참고하세요.

이 이미지는 공식 `apache/doris:fe-<version>`, `be-<version>`, `ms-<version>` 이미지로 구성되므로 내부에서 실행되는 것은 릴리스된 아티팩트 자체입니다. 용량을 줄이기 위해 수행하는 작업은 두 가지뿐입니다. `doris_be`와 Meta Service의 `doris_cloud`, `libfdb_c.so`에서 디버그 정보를 제거하고(`.symtab`은 유지하므로 크래시 백트레이스에서 함수 이름을 계속 확인할 수 있음), 해당 태그에 필요하지 않은 JNI 스캐너 디렉터리를 제거합니다.

### 두 가지 태그: 기본 태그와 -full {#the-two-tags-base-and--full}

| 태그 | 지원 범위 | 이미지 크기(4.1.3, 압축 전) |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | 내부 테이블, Hive, Iceberg(시스템 테이블 포함), Paimon, JDBC Catalog, 외부 테이블 쓰기, Java UDF | 약 2.7 GB |
| `apache/doris:all-in-one-<version>-full` | 위의 모든 기능과 Hudi, Trino 커넥터, MaxCompute | 약 3.2 GB |

이 크기는 4.1.3에서 측정한 압축 전 레이어 크기의 합계입니다. 각 이미지에서 약 0.2 GB는 컴퓨팅·스토리지 분리 클러스터에서만 사용하는 Meta Service가 차지합니다. 참고로 디버그 정보와 불필요한 파일을 제거하지 않은 동일한 구성의 크기는 약 5.6 GB입니다.

**테스트에서 실제로 Hudi 테이블을 읽거나, Trino 커넥터를 거치거나, MaxCompute를 사용하는 경우에만 `-full`을 선택하세요.** 그 외에는 접미사가 없는 태그를 사용하세요. 세 모드 중 어느 것도 특정 태그를 요구하지 않습니다. Compose 클러스터는 `-full` 태그나 직접 빌드한 태그로 전환할 수 있으며, 이때 `DORIS_IMAGE` 환경 변수를 사용합니다.

두 태그의 차이는 BE가 스캐너를 로드하는 방식에서 비롯됩니다. BE는 시작 시 `be/lib/java_extensions/` 아래의 디렉터리를 열거하여 JNI 스캐너를 로드합니다. 별도의 목록이나 구성 키가 없으므로 각 태그는 포함된 디렉터리에 해당하는 형식만 지원합니다. Hive와 Iceberg의 **데이터** 읽기는 이 JNI 스캐너가 아니라 BE의 네이티브 parquet / orc 리더를 사용하므로 두 태그 모두 지원합니다.

### 다중 아키텍처 지원 {#multi-architecture-support}

`apache/doris:all-in-one-4.1.3`은 linux/amd64와 linux/arm64용 매니페스트를 하나씩 포함하는 OCI 이미지 인덱스입니다. `docker pull`은 `apache/doris:fe-4.1.3`과 마찬가지로 호스트에 맞는 이미지를 자동으로 선택하므로, CI에서 러너의 아키텍처별로 다른 태그를 사용할 필요가 없습니다.

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution 참고

Doris BE는 일반적으로 다른 아키텍처를 에뮬레이션하는 환경에서 실행할 수 없습니다. 예를 들어 Apple Silicon에서 `--platform linux/amd64`로 amd64 이미지를 시작하면 세그먼테이션 오류가 발생하며, 공식 `apache/doris:be-*` 이미지도 동일하게 동작합니다. 이미지와 일치하는 아키텍처의 실제 하드웨어에서 실행하세요.

:::

## 단일 컨테이너: 통합 테스트 픽스처 {#single-container}

Apache Doris 생태계의 커넥터, SDK, 데이터 통합 도구 등의 프로젝트는 일반적으로 e2e / CI 실행 시 모의 객체 대신 실제 Doris 인스턴스가 필요합니다. 단일 컨테이너 모드는 바로 이 용도를 위해 만들어졌습니다. 컨테이너 하나에서 FE 하나와 BE 하나를 실행하며, 시작하면 바로 사용할 수 있어 테스트 픽스처로 손쉽게 추가할 수 있습니다.

통합 테스트에서 중요한 동작은 다음과 같습니다.

| 기능 | 설명 |
| --- | --- |
| 즉시 사용 가능 | FE 시작, `ALTER SYSTEM ADD BACKEND`를 통한 BE 등록, BE가 온라인 상태가 될 때까지 기다리는 과정이 모두 컨테이너 내부에서 이루어집니다. 외부 스크립트는 필요하지 않습니다 |
| 상태 검사 | 이미지에 포함된 `HEALTHCHECK`는 FE가 준비되고 BE가 온라인 상태가 된 뒤에만 `healthy`로 바뀌며, 보통 20초 이내에 완료됩니다. CI는 `sleep`을 호출하는 대신 이 상태를 기다릴 수 있습니다 |
| 단일 복제본 | `force_olap_table_replication_num = 1`이 설정되어 있으므로 `CREATE TABLE`에 `replication_num`을 지정할 필요가 없습니다 |
| 제한된 리소스 사용 | 메모리를 CI 러너에 맞춰 낮게 설정합니다. FE 힙은 `-Xmx2048m`, BE 측 JNI 힙은 `-Xmx1024m`, BE는 `mem_limit = 40%`입니다 |
| 실패 시 즉시 종료 | FE나 BE 중 하나라도 종료되면 조용히 재시작하는 대신 컨테이너가 즉시 영이 아닌 종료 코드로 종료되므로, CI에서 실패를 바로 확인할 수 있습니다 |
| 정상 종료 | `docker stop`은 BE를 먼저 중지한 다음 FE를 중지하고 종료 코드 0으로 종료합니다 |
| 다중 아키텍처 | 하나의 태그로 linux/amd64와 linux/arm64를 모두 지원합니다 |

### 연결 정보 {#connection-information}

| 항목 | 설명 |
| --- | --- |
| MySQL 프로토콜 | 포트 `9030`, 사용자 `root`, 비밀번호 없음 |
| FE HTTP | 포트 `8030`, `/api/health`는 인증 불필요 |
| BE HTTP | 포트 `8040`, Stream Load 엔드포인트 |
| BE 하트비트 | 포트 `9050`, 컨테이너 내부에서 사용하며 일반적으로 호스트에 매핑하지 않음 |

### docker run으로 직접 실행 {#plain-docker-run}

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    apache/doris:all-in-one-4.1.3

# Wait until the container is healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' doris)" = healthy ]; do sleep 1; done

mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

이미지에 MySQL 클라이언트가 포함되어 있으므로 호스트에 클라이언트가 없다면 컨테이너 내부에서 실행하세요.

```shell
docker exec doris mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

### Docker Compose {#docker-compose}

`depends_on`과 `service_healthy`를 사용하면 Doris가 실제로 사용 가능한 상태가 된 후에만 테스트 컨테이너가 시작됩니다.

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

### GitHub Actions {#github-actions}

서비스 컨테이너로 사용하면 GitHub Actions는 컨테이너가 `healthy` 상태가 될 때까지 기다린 뒤 `steps`를 실행하므로, 테스트 코드에 별도의 재시도 및 대기 로직이 필요하지 않습니다.

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

### 구성 조정 {#adjusting-the-configuration}

이미지에는 통합 테스트용 기본 설정이 포함되어 있습니다. 설정을 변경하려면 아래 환경 변수를 사용하세요. 컨테이너 시작 시 `fe.conf` / `be.conf`에 기록되며, 마지막으로 할당한 값이 적용됩니다.

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    -e FE_HEAP=4096m \
    apache/doris:all-in-one-4.1.3
```

| 환경 변수 | 효과 |
| --- | --- |
| `FE_CONFIG_EXTRA` | `fe.conf` 끝에 추가합니다. 여러 항목은 줄바꿈으로 구분하세요 |
| `BE_CONFIG_EXTRA` | `be.conf` 끝에 추가합니다. 여러 항목은 줄바꿈으로 구분하세요 |
| `FE_HEAP` / `BE_HEAP` | FE / BE 측 JVM의 `-Xmx`를 재정의합니다. 예를 들어 `4096m`이며, 기본값은 각각 `2048m`과 `1024m`입니다 |

**데이터 영구 저장**: 기본적으로 데이터를 영구 저장하지 않으므로 컨테이너를 제거하면 데이터도 사라집니다. 일반적으로 CI에서는 이 동작이 적합합니다. 데이터를 유지하려면 `/opt/apache-doris/fe/doris-meta`와 `/opt/apache-doris/be/storage`를 마운트하세요. 시작 절차는 멱등성을 보장하므로 동일한 데이터 디렉터리로 반복해서 시작할 수 있습니다.

### 문제 해결 {#troubleshooting}

- `docker logs <container>`에는 진입점의 시작 로그와 FE 콘솔 출력이 포함되어 있어, 시작 중 클러스터가 어느 단계에서 멈췄는지 확인할 수 있습니다.
- 전체 로그는 컨테이너 내부의 `fe/log/fe.log`와 `be/log/be.INFO`에 있습니다.
- 컨테이너가 영이 아닌 종료 코드로 종료되었다면 FE 또는 BE가 종료된 것입니다. 종료 직전 로그에 어느 프로세스가 종료되었는지와 확인할 로그 파일이 표시됩니다.
- 대용량 데이터를 처리하는 테스트에서는 `vm.max_map_count`를 **호스트에서** 높여야 할 수 있습니다(`sysctl -w vm.max_map_count=2000000`). 이 sysctl은 네임스페이스별로 분리되지 않아 컨테이너에서 설정할 수 없으므로, 이미지에서는 `start_be.sh`의 해당 검사를 건너뜁니다.

## 다중 노드 및 컴퓨팅·스토리지 분리 클러스터 {#multi-node-and-compute-storage-separated-clusters}

두 Compose 파일은 Doris 기본 저장소의 `docker/runtime/all-in-one/4.1/compose/` 아래에 있으며, Docker Compose v2(`docker compose` 하위 명령)가 필요합니다. 이미지 기본값은 `apache/doris:all-in-one-4.1.3`이며 `DORIS_IMAGE`로 변경할 수 있습니다. 이 값은 환경 변수로 설정하거나 Compose 파일 옆의 `.env` 파일에 지정합니다. 다른 모든 조정 항목도 같은 방식으로 전달하며, 각 파일의 상단 주석에 전체 목록이 나와 있습니다.

```shell
cd <doris repository>/docker/runtime/all-in-one/4.1/compose
```

두 파일 모두 `client` 서비스를 포함합니다. 이 서비스는 모든 노드가 실행 중인 경우에만 `healthy` 상태가 되며, `docker compose up --wait`는 이 상태가 될 때까지 기다립니다. 이후 클러스터 네트워크 내부에서 `mysql`과 `curl`을 사용할 수 있는 상태로 대기하므로, `docker compose exec client ...`로 클러스터에 접근할 수 있습니다.

### 다중 노드 클러스터: multi-node.yml {#multi-node}

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

- `fe-1`이 클러스터를 초기화하고 `fe-2`, `fe-3`는 follower로 참여합니다. `FE3_ROLE=observer`로 설정하면 `fe-3`가 observer가 됩니다.
- 테이블은 실제 클러스터와 마찬가지로 기본적으로 BE마다 하나씩, 복제본 세 개를 사용합니다.
- 호스트 포트: `9030` / `8030`은 `fe-1`용, `9031` / `8031`은 `fe-2`용, `9032` / `8032`는 `fe-3`용이며, `8040`은 `be-1`의 HTTP 포트입니다.
- 조정 항목: `DORIS_IMAGE`, `SUBNET`(기본값 `172.31.81`), 호스트 포트, `FE_HEAP`(기본값 `1024m`), `BE_MEM_LIMIT`(기본값 `25%`), `FE3_ROLE`.

### 컴퓨팅·스토리지 분리 클러스터: cloud.yml {#cloud}

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

- 모든 Doris 프로세스(FE, BE, Meta Service, Recycler)는 올인원 이미지에서 실행됩니다. FoundationDB와 MinIO는 각 업스트림 이미지를 사용합니다.
- `cloud-init`은 한 번 실행되는 컨테이너로, MinIO를 볼트로 사용하는 스토리지 볼트 모드의 인스턴스를 Meta Service에 생성합니다(path-style, 일반 HTTP 사용). 이후 `fe-1`이 `built_in_storage_vault`를 기본 볼트로 지정하므로 `CREATE TABLE`에서 볼트 이름을 지정할 필요가 없습니다. 두 단계 모두 멱등성을 보장합니다.
- BE 세 개는 두 컴퓨팅 그룹을 구성합니다. `be-1`과 `be-2`는 `cg_a`에, `be-3`는 `cg_b`에 속합니다. 이 구성을 대상으로 `use @cg_b`, `SHOW COMPUTE GROUPS`, `ALTER SYSTEM ADD BACKEND ... ("tag.compute_group_name" = ...)`, 스토리지 볼트, 워밍업, 클라우드 모드의 FE 장애 조치를 실행해 볼 수 있으며, 객체가 MinIO에 저장되는 과정도 확인할 수 있습니다.
- 호스트 포트: `9030` / `8030`은 `fe-1`용(`9031` / `8031` 및 `9032` / `8032`는 각각 `fe-2`와 `fe-3`용이며 `ha` 프로필에서 사용), `8040`은 `be-1`의 HTTP 포트, `15000`은 Meta Service HTTP API용(macOS에서는 AirPlay가 `5000`을 사용), `9000`은 MinIO용, `9001`은 MinIO 콘솔용(`minioadmin` / `minioadmin`)입니다.
- 조정 항목: `DORIS_IMAGE`, `SUBNET`(기본값 `172.31.80`), 호스트 포트, `FE_HEAP`, `BE_MEM_LIMIT`, `CG_A` / `CG_B`(컴퓨팅 그룹 이름), `INSTANCE_ID`(기본값 `100001`, FE의 `cluster_id`로도 사용), `S3_BUCKET` / `S3_AK` / `S3_SK`, `FDB_IMAGE` / `FDB_PLATFORM`.
- `--profile ha`로 시작한 클러스터는 중지하고 제거할 때도 같은 플래그를 사용해야 합니다. 그래야 해당 프로필의 `fe-2`와 `fe-3`가 나머지 구성 요소와 함께 처리됩니다.

### 알아둘 사항 {#things-to-know}

- **데이터 유지.** `docker compose stop` / `start`(또는 다시 `up`)를 실행하면 데이터가 유지됩니다. 인스턴스 생성, 기본 볼트 설정, 노드 등록은 모두 멱등성을 보장합니다. `down`은 컨테이너와 네트워크를 제거하며, 데이터도 함께 제거됩니다.
- **노드 주소.** 노드는 사설 서브넷의 고정 IP를 사용합니다(`SUBNET`, 기본값은 다중 노드에서 `172.31.81`, 클라우드에서 `172.31.80`). 따라서 컨테이너를 재시작해도 Doris가 인식하는 노드 식별 정보가 유지됩니다. 두 파일은 서로 다른 서브넷을 사용하므로 한쪽의 호스트 포트를 다르게 지정하면 두 클러스터를 동시에 실행할 수 있습니다.
- **호스트에서 접근.** 공개된 포트를 사용하세요. Docker Desktop(macOS / Windows)에서는 호스트에서 컨테이너 주소로 라우팅할 수 없으므로, 호스트에서 시작한 Stream Load는 FE가 BE로 보내는 리디렉션을 따라갈 수 없습니다. 이 경우 `client` 서비스에서 실행하세요(`docker compose -f <file> exec client curl ...`). Linux 호스트에서는 노드에 직접 접근할 수 있습니다.
- **메모리.** 기본값은 `FE_HEAP=1024m`과 BE별 `mem_limit = 25%`입니다. 전체 컴퓨팅·스토리지 분리 클러스터는 약 9 GB를 사용합니다. Docker Desktop에는 12 GB 이상을 할당하세요. 16 GB VM에서 두 토폴로지를 동시에 실행하기는 어렵습니다.
- **Apple Silicon의 FoundationDB.** 업스트림 `foundationdb/foundationdb:7.1.x` 이미지는 amd64만 지원하므로 Apple Silicon에서 `fdb`는 에뮬레이션으로 실행됩니다. 이 용도로는 문제가 없습니다. `FDB_IMAGE` / `FDB_PLATFORM`으로 다른 이미지나 플랫폼을 지정할 수 있습니다. Meta Service는 7.1 클라이언트와 링크되므로 7.1 서버를 사용하세요.
- **스모크 테스트.** `compose/smoke-test.sh <multi-node|cloud> [image:tag]`는 별도의 프로젝트 이름, 서브넷, 호스트 포트로 토폴로지를 시작합니다. 복제본 또는 컴퓨팅 그룹과 볼트를 확인하고, 클라이언트를 통해 Stream Load로 데이터를 적재하고, master FE를 종료하고, 기존 master가 중지된 상태에서 BE를 재시작한 다음, master를 다시 시작하고 모든 리소스를 정리합니다. 토폴로지당 약 두 분이 걸립니다.

### 컨테이너 역할: DORIS_ROLE {#container-roles-doris_role}

두 Compose 파일은 같은 이미지의 역할들을 조합하여 구성됩니다. 진입점은 `DORIS_ROLE`에 따라 컨테이너에서 실행할 구성 요소를 결정합니다. 사용자 지정 토폴로지(예: 1 FE + 5 BE)도 같은 방식으로 구성할 수 있습니다.

| `DORIS_ROLE` | 실행 내용 | 필수 변수 |
| --- | --- | --- |
| `all`(기본값) | 컨테이너 하나에서 FE + BE 실행, 즉 단일 컨테이너 모드 | 없음 |
| `fe` | FE 하나를 실행합니다. `FE_MASTER`가 비어 있으면 새 클러스터를 초기화하고, 그렇지 않으면 `FE_ROLE`(`follower` \| `observer`)로 등록하여 참여합니다 | `FE_MASTER` |
| `be` | BE 하나를 실행하고 `FE_MASTER`에 등록합니다. 컴퓨팅·스토리지 분리 모드에서는 `COMPUTE_GROUP`으로 지정한 컴퓨팅 그룹에 참여합니다 | `FE_MASTER` |
| `ms` / `recycler` | 컴퓨팅·스토리지 분리 모드의 Meta Service / Recycler | `FDB_CLUSTER` |
| `cloud-init` | 한 번 실행: S3 호환 객체 스토리지에 컴퓨팅·스토리지 분리 인스턴스를 생성한 뒤 종료합니다 | `MS_ENDPOINT`, `INSTANCE_ID`, `S3_*` |
| `client` | `EXPECT_FE` / `EXPECT_BE`만큼의 노드가 실행 중일 때까지 기다린 뒤 `mysql`과 `curl`을 사용할 수 있는 상태로 대기합니다 | `FE_MASTER` |

- `DEPLOY_MODE=cloud`는 `fe`와 `be`를 컴퓨팅·스토리지 분리 노드로 전환합니다(`deploy_mode`, `meta_service_endpoint`, 파일 캐시 등이 자동으로 기록됨). FE는 `INSTANCE_ID`를 자신의 `cluster_id`로 사용하고 SQL로 노드를 관리하므로, `cloud_unique_id`를 별도로 부여할 필요가 없습니다.
- `FE_MASTER`에는 여러 FE를 나열할 수 있습니다(`fe-1,fe-2,fe-3`). 가장 먼저 응답하는 FE를 사용하므로 노드를 재시작할 때 마침 중지된 FE 하나를 기다리지 않습니다. 이미 메타데이터가 있는 FE는 자체적으로 다시 참여합니다.
- 모든 역할은 `FE_CONFIG_EXTRA` / `BE_CONFIG_EXTRA` / `MS_CONFIG_EXTRA`와 `FE_HEAP` / `BE_HEAP`을 반영하며, 실행 준비가 완료되면 준비 플래그를 생성합니다. 이미지의 `HEALTHCHECK`는 이 플래그를 기준으로 상태를 확인합니다. 따라서 `docker compose up --wait`는 전체 클러스터 구성이 완료될 때까지 기다리며, 프로세스가 종료되면 컨테이너도 영이 아닌 종료 코드로 종료됩니다.
- 토폴로지에 따라 달라지는 설정(`priority_networks`, 복제본 수, 밸런싱, 컴퓨팅·스토리지 분리 관련 키)은 컨테이너 시작 시 진입점이 역할별로 기록합니다. 이미지에 포함된 구성 파일에는 리소스 크기 관련 기본값만 들어 있습니다.

## 직접 이미지 빌드하기 {#building-the-image-yourself}

Dockerfile과 빌드 스크립트는 Doris 기본 저장소의 `docker/runtime/all-in-one/<release-line>/` 아래에 있으며, 현재 `4.1`이 제공됩니다. 릴리스 라인마다 아티팩트 구조의 차이가 크므로, 하나의 Dockerfile에서 버전에 따라 분기하는 대신 각 릴리스 라인에 별도의 디렉터리를 사용합니다.

`build.sh`가 유일한 진입점이며, 스크립트는 어느 디렉터리에서든 실행할 수 있습니다.

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

빌드 컨텍스트는 항상 저장소 루트입니다(`Dockerfile.dockerignore`로 몇 KB 수준으로 제한됨). 로컬 `./output`이나 tarball 디렉터리는 BuildKit의 명명된 컨텍스트로 전달되므로 어느 위치에 있어도 되지만, 이 기능에는 `docker buildx`가 필요합니다. 직접 빌드한 이미지는 두 Compose 파일에서 바로 사용할 수 있습니다.

```shell
DORIS_IMAGE=apache/doris:all-in-one-dev docker compose -f multi-node.yml up --wait
```

`--platform`을 지정하지 않으면 호스트 아키텍처만 빌드합니다. 다중 아키텍처 빌드에서는 이를 명시해야 합니다. 예를 들면 `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push`입니다. 다른 아키텍처용 빌드는 에뮬레이션을 거쳐 시간이 오래 걸리므로, 릴리스용으로는 각 아키텍처의 실제 머신에서 네이티브로 빌드한 뒤 `docker buildx imagetools create`로 결과를 합치는 편이 좋습니다.

`./build.sh --help`에서 나머지 옵션을 확인할 수 있습니다.

:::tip

이미지에서 제거하는 항목, 외부 테이블용 추가 구성 요소처럼 보이는 일부 디렉터리를 제거하면 안 되는 이유, 용량이 사용되는 곳, 스모크 테스트 실행 방법 등 구현 세부 사항은 해당 디렉터리의 [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md)를 참고하세요.

:::
