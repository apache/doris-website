---
{
    "title": "스토리지·컴퓨팅 분리 클러스터 수동 배포",
    "language": "ko",
    "description": "Linux에서 Doris 스토리지·컴퓨팅 분리 클러스터를 수동으로 배포하는 방법을 자세히 설명하는 가이드입니다. FoundationDB, S3/HDFS, Meta Service 및 FE/BE 배포 단계와 자주 묻는 질문을 다룹니다.",
    "keywords": [
        "Doris 스토리지·컴퓨팅 분리 배포",
        "스토리지·컴퓨팅 분리 클러스터 설치",
        "FoundationDB 배포",
        "Doris 클라우드 배포",
        "S3 스토리지 구성",
        "Meta Service 배포"
    ]
}
---

스토리지·컴퓨팅 분리 클러스터 배포는 여덟 단계로 진행됩니다:

1. **FoundationDB 클러스터 준비**: 기존 FoundationDB 클러스터를 사용하거나 새로 생성합니다.

2. **S3 또는 HDFS 서비스 배포**: 기존 공유 스토리지를 사용하거나 새로 구성합니다.

3. **Meta Service 배포**: Doris 클러스터의 Meta Service를 배포합니다.

4. **데이터 정리 프로세스 배포**: Doris 클러스터의 데이터 정리 프로세스를 독립적으로 배포합니다. 이 단계는 선택 사항입니다.

5. **FE Master 노드 시작**: 첫 번째 FE 노드를 Master FE 노드로 시작합니다.

6. **FE Master 클러스터 구성**: FE Follower/Observer 노드를 추가하여 FE 클러스터를 구성합니다.

7. **BE 노드 추가**: BE 노드를 클러스터에 추가하고 등록합니다.

8. **Storage Vault 추가**: 공유 스토리지를 사용하여 하나 이상의 Storage Vault를 생성합니다.

배포를 시작하기 전에 적절한 Doris 버전을 [다운로드](https://doris.apache.org/download)할 수 있습니다.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Hardware and software requirements -->
<!-- Applicable scenario: Pre-deployment checks -->

| 유형 | 요구 사항 |
|------|------|
| **운영체제** | Linux (CentOS 7+, Ubuntu 20.04+) |
| **JDK** | OpenJDK 17 (JAVA_HOME을 설정해야 함) |
| **FoundationDB** | 7.1.x 계열 버전 |
| **네트워크** | 노드 간 포트에 접근할 수 있어야 함(기본값: FE 8030, BE 9050, Meta Service 5000) |
| **디스크** | SSD 권장(특히 FDB 데이터 디렉터리) |

## 1단계: FoundationDB 준비 {#step-1-prepare-foundationdb}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

이 절에서는 `fdb_vars.sh`와 `fdb_ctl.sh` 스크립트를 사용하여 FDB (FoundationDB) 서비스를 구성, 배포하고 시작하는 방법을 단계별로 설명합니다. [Doris 도구](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz)를 다운로드하면 `fdb_vars.sh`와 `fdb_ctl.sh`를 `fdb` 디렉터리에서 찾을 수 있습니다.

:::tip
Doris는 기본적으로 FDB 7.1.x 계열에 의존합니다. FDB가 이미 설치되어 있다면 버전이 7.1.x 계열인지 확인하세요. 그렇지 않으면 Meta Service가 시작되지 않습니다.
:::

### 머신 요구 사항 {#machine-requirements}

일반적으로 복제본 두 개를 유지하고 머신 한 대의 장애를 견딜 수 있는 FoundationDB 클러스터를 구성하려면 SSD가 장착된 머신이 최소 세 대 필요합니다. 테스트 또는 개발 환경에서는 머신 한 대로도 FoundationDB를 구성할 수 있습니다.

### fdb_vars.sh 스크립트 구성 {#configuring-the-fdb_varssh-script}

`fdb_vars.sh` 스크립트를 구성할 때는 다음 매개변수를 지정해야 합니다:

   | 매개변수         | 설명                                  | 유형                                       | 예시                                                      | 참고                                                        |
   | ---------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | FoundationDB가 사용하는 데이터 디렉터리    | 쉼표로 구분된 절대 경로 목록   | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | 스크립트를 실행하기 전에 디렉터리가 존재하는지 확인하세요. 프로덕션 환경에서는 SSD와 전용 디렉터리 사용을 권장합니다. |
   | FDB_CLUSTER_IPS  | 클러스터 IP 주소                              | 쉼표로 구분된 IP 주소 문자열   | 172.200.0.2,172.200.0.3,172.200.0.4                          | 프로덕션 클러스터에는 IP 주소가 최소 3개 있어야 합니다. 첫 번째 IP 주소가 코디네이터로 사용됩니다. 고가용성을 확보하려면 머신을 서로 다른 랙에 배치하세요. |
   | FDB_HOME         | FoundationDB 홈 디렉터리              | 절대 경로                           | /fdbhome                                                     | 기본 경로는 /fdbhome입니다. 반드시 절대 경로를 사용하세요. |
   | FDB_CLUSTER_ID   | 클러스터 ID                               | 문자열                                   | SAQESzbh                                                     | 각 클러스터의 ID는 고유해야 합니다. mktemp -u XXXXXXXX를 사용하여 생성할 수 있습니다. |
   | FDB_CLUSTER_DESC | FDB 클러스터 설명           | 문자열                                   | dorisfdb                                                     | 배포 환경에 맞는 의미 있는 설명으로 변경하는 것을 권장합니다. |


   필요에 따라 다음 사용자 지정 매개변수를 지정할 수 있습니다:

   | 매개변수        | 설명                                          | 유형    | 예시            | 참고                                                                       |
   | --------------- | ---------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------- |
   | MEMORY_LIMIT_GB | FDB 프로세스의 메모리 제한(GB 단위)          | 정수 | MEMORY_LIMIT_GB=16 | 사용 가능한 메모리와 FDB 프로세스의 요구 사항에 맞게 값을 조정하세요. |
   | CPU_CORES_LIMIT | FDB 프로세스의 CPU 코어 수 제한               | 정수 | CPU_CORES_LIMIT=8  | 사용 가능한 CPU 코어 수와 FDB 프로세스의 요구 사항에 맞게 값을 설정하세요. |

### FDB 클러스터 배포 {#deploying-the-fdb-cluster}

`fdb_vars.sh`로 환경을 구성한 후, 각 노드에서 `fdb_ctl.sh` 스크립트를 사용하여 FDB 클러스터를 배포할 수 있습니다.

```bash
./fdb_ctl.sh deploy
```

### FDB 서비스 시작 {#starting-the-fdb-service}

FDB 클러스터를 배포한 후에는 `fdb_ctl.sh` 스크립트를 사용하여 FDB 서비스를 시작할 수 있습니다.

   ```bash
   ./fdb_ctl.sh start
   ```

   위 명령은 FDB 서비스를 시작하고 클러스터를 온라인 상태로 전환한 다음, FDB 클러스터 연결 문자열을 가져옵니다. 이 문자열은 나중에 MetaService를 구성할 때 사용할 수 있습니다.

   :::warning
   fdb_ctl.sh 스크립트의 clean 명령은 모든 FDB 메타데이터를 삭제하므로 데이터가 손실될 수 있습니다. 프로덕션 환경에서는 절대 사용하지 마세요.
   :::

## 2단계: S3 또는 HDFS 서비스 설치(선택 사항) {#step-2-install-s3-or-hdfs-service-optional}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Doris의 스토리지·컴퓨팅 분리 모드는 S3 또는 HDFS 서비스를 사용하여 데이터를 저장합니다. 이러한 서비스가 이미 있다면 그대로 사용할 수 있습니다.
서비스가 없다면 다음의 간단한 MinIO 배포 안내를 따라 구성할 수 있습니다:

1. MinIO [다운로드 페이지](https://min.io/download?license=agpl&platform=linux)에서 적절한 버전과 운영체제를 선택하고, 해당 Server와 Client의 바이너리 또는 설치 패키지를 다운로드합니다.
2. MinIO Server를 시작합니다.

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this setting is MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this setting is MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. MinIO Client를 구성합니다.

   ```bash
   # If you installed the client from an installation package, the client is named mcli. If you downloaded the client binary directly, it is named mc.
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. 버킷을 생성합니다.

   ```bash
   ./mc mb myminio/doris
   ```

5. 정상적으로 작동하는지 확인합니다.

   ```bash
   # Upload a file
   ./mc mv test_file myminio/doris
   # View the file
   ./mc ls myminio/doris
   ```

## 3단계: Meta Service 배포 {#step-3-deploy-meta-service}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. 구성

   `./conf/doris_cloud.conf` 파일에서 수정해야 할 주요 매개변수는 다음 두 가지입니다:

   - `brpc_listen_port`: Meta Service의 수신 포트입니다. 기본값은 5000입니다.
   - `fdb_cluster`: FoundationDB 클러스터의 연결 정보로, FoundationDB를 배포할 때 얻을 수 있습니다. (Doris에서 제공하는 `fdb_ctl.sh` 스크립트로 FDB를 배포했다면 `$FDB_HOME/conf/fdb.cluster` 파일에서 이 값을 확인할 수 있습니다.)

   구성 예시:

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   참고: `fdb_cluster` 값은 FoundationDB 머신의 `/etc/foundationdb/fdb.cluster` 파일 내용과 일치해야 합니다. (Doris에서 제공하는 `fdb_ctl.sh` 스크립트로 FDB를 배포했다면 `$FDB_HOME/conf/fdb.cluster` 파일에서 이 값을 확인할 수 있습니다.)

   다음 예시에서는 파일의 마지막 줄을 `fdb_cluster` 필드의 값으로 사용하여 `doris_cloud.conf`에 입력합니다:

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. 시작 및 중지

   시작하기 전에 `JAVA_HOME` 환경 변수가 올바르게 설정되어 있고 OpenJDK 17을 가리키는지 확인하세요. 그런 다음 `ms` 디렉터리로 이동합니다.

   시작 명령은 다음과 같습니다:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   시작 스크립트의 반환값이 0이면 시작에 성공한 것이며, 그렇지 않으면 시작에 실패한 것입니다. 시작에 성공하면 표준 출력의 마지막 줄에 "doris_cloud start successfully"가 표시됩니다.

   중지 명령은 다음과 같습니다:

   ```shell
   bin/stop.sh
   ```

   프로덕션 환경에서는 Meta Service 노드가 최소 3개 있어야 합니다.

3. 여러 구성 파일 사용(선택 사항, 4.0.8+)

   4.0.8 버전부터 `bin/start.sh`는 `CONF_FILES` 환경 변수를 통해 여러 구성 파일을 받을 수 있습니다. 이를 통해 공통 구성과 노드별 구성을 쉽게 분리할 수 있습니다:

   ```shell
   export CONF_FILES="common.conf,doris_cloud.conf"
   bin/start.sh --daemon
   ```

   적용 규칙은 다음과 같습니다:

   - 여러 파일은 쉼표로 구분합니다. 파일은 **왼쪽에서 오른쪽 순서로** 읽습니다.
   - 상대 경로는 `${DORIS_HOME}/conf/`를 기준으로 해석하며, 절대 경로도 사용할 수 있습니다. 와일드카드도 지원합니다(예: `conf.d/*.conf`).
   - 같은 변수가 여러 번 정의되어 있으면 **처음** 정의된 값이 적용됩니다. 나중에 읽는 파일은 이 값을 덮어쓰지 않습니다.
   - 셸에서 이미 내보낸 환경 변수는 우선순위가 가장 높으며, 구성 파일에서 덮어쓰지 않습니다.
   - 존재하지 않는 파일은 건너뛰며, 이로 인해 시작에 실패하지는 않습니다.
   - `CONF_FILES`가 없으면 이전 버전과 동일하게 `doris_cloud.conf`만 읽습니다.

   :::info 참고

   이 기능은 구성 파일에 `KEY=VALUE` 형식으로 작성된 **대문자 환경 변수**(예: `JAVA_HOME`)만 처리합니다. Meta Service 자체 구성 항목은 여전히 `doris_cloud.conf`에서 읽습니다.

   :::



## 4단계: 데이터 정리 프로세스 독립 배포(선택 사항) {#step-4-standalone-deployment-of-the-data-recycler-optional}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

:::tip

Meta Service 자체에서 메타데이터 관리와 데이터 정리 기능을 모두 제공합니다. 이 두 기능은 별도로 배포할 수 있습니다. 데이터 정리 프로세스를 별도로 배포해야 한다면 다음 단계를 참고하세요.

:::

1. 새 작업 디렉터리(예: `recycler`)를 생성하고 `ms` 디렉터리의 내용을 복사합니다:

   ```shell
   cp -r ms recycler
   ```

2. 새 디렉터리의 구성 파일에서 BRPC 수신 포트인 `brpc_listen_port`와 `fdb_cluster` 값을 수정합니다.

   데이터 정리 프로세스를 시작합니다:
   
   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   메타데이터 작업 기능만 시작합니다:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## 5단계: FE Master 노드 시작 {#step-5-start-the-fe-master-node}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. fe.conf 파일 구성

   `fe.conf` 파일에서 다음 주요 매개변수를 구성해야 합니다:

   - `deploy_mode`
     - 설명: Doris 시작 모드를 지정합니다.
     - 형식: `cloud`는 스토리지·컴퓨팅 분리 모드를 의미하며, 그 외의 값은 스토리지·컴퓨팅 통합 모드를 의미합니다.
     - 예시: `cloud`
   - `cluster_id`
     - 설명: 스토리지·컴퓨팅 분리 아키텍처에서 클러스터를 고유하게 식별하는 값입니다. 서로 다른 클러스터는 서로 다른 `cluster_id` 값을 사용해야 합니다.
     - 형식: int
     - 예시: 셸 스크립트 `echo $(($((RANDOM << 15)) | $RANDOM))`를 사용하여 임의의 ID를 생성할 수 있습니다.
     - 참고: 서로 다른 클러스터는 서로 다른 `cluster_id` 값을 사용해야 합니다.
   - `meta_service_endpoint`
     - 설명: Meta Service의 주소와 포트입니다.
     - 형식: `IP:Port`
     - 예시: `127.0.0.1:5000`. 여러 Meta Service 엔드포인트를 쉼표로 구분하여 구성할 수 있습니다.

2. FE Master 노드 시작

   시작 명령:

   ```bash
   bin/start_fe.sh --daemon
   ```

   첫 번째 FE 프로세스는 클러스터를 초기화하고 FOLLOWER 역할로 실행됩니다. MySQL 클라이언트로 FE에 연결하고 `show frontends`를 실행하여 방금 시작한 FE가 Master인지 확인하세요.

## 6단계: FE Follower/Observer 노드 등록 {#step-6-register-fe-followerobserver-nodes}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

다른 노드도 같은 단계에 따라 구성 파일을 수정하고 시작합니다. 그런 다음 MySQL 클라이언트로 Master 역할의 FE에 연결하고, 다음 SQL 명령을 사용하여 FE 노드를 추가합니다:

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


`host:port`를 FE 노드의 실제 주소와 edit-log 포트로 바꾸세요. 자세한 내용은 [ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER)와 [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER)를 참고하세요.

프로덕션 환경에서는 첫 번째 FE를 포함하여 FOLLOWER 역할의 FE 노드 총수가 홀수로 유지되도록 하세요. 일반적으로 FOLLOWER 노드 세 대면 충분합니다. Observer 역할의 FE 노드 수는 자유롭게 정할 수 있습니다.

## 7단계: BE 노드 추가 {#step-7-add-be-nodes}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

클러스터에 Backend 노드를 추가하려면 각 Backend에 대해 다음 단계를 수행합니다:

1. be.conf 구성

   `be.conf` 파일에서 다음 주요 매개변수를 구성해야 합니다:
    - deploy_mode
      - 설명: Doris 시작 모드를 지정합니다.
      - 형식: `cloud`는 스토리지·컴퓨팅 분리 모드를 의미하며, 그 외의 값은 스토리지·컴퓨팅 통합 모드를 의미합니다.
      - 예시: cloud
    - file_cache_path
      - 설명: 파일 캐싱에 사용할 디스크 경로와 기타 매개변수입니다. 디스크당 하나의 항목을 갖는 배열로 표현합니다. `path`는 디스크 경로를 지정하고, `total_size`는 캐시 크기를 제한합니다. -1 또는 0은 디스크 전체 공간을 사용한다는 의미입니다.
      - 형식: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - 예시: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - 기본값: [{"path":"${DORIS_HOME}/file_cache"}]

2. BE 프로세스 시작

   다음 명령을 사용하여 Backend를 시작합니다:

   ```bash
   bin/start_be.sh --daemon
   ```

3. 클러스터에 BE 추가

   MySQL 클라이언트를 사용하여 임의의 FE 노드에 연결합니다:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   `<ip>`를 새 Backend의 IP 주소로 바꾸고, `<heartbeat_service_port>`를 구성한 하트비트 서비스 포트로 바꾸세요(기본값은 9050).

   PROPERTIES를 사용하여 BE가 속할 컴퓨팅 그룹을 설정할 수 있습니다.

   자세한 사용법은 [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)와 [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND)를 참고하세요.

4. BE 상태 확인

   Backend 로그 파일(`be.log`)을 확인하여 정상적으로 시작되고 클러스터에 참여했는지 확인합니다.

   다음 SQL 명령을 사용하여 Backend 상태를 확인할 수도 있습니다:

   ```sql
   SHOW BACKENDS;
   ```

   이 명령은 클러스터의 모든 Backend와 현재 상태를 표시합니다.

## 8단계: Storage Vault 추가 {#step-8-add-storage-vault}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Storage Vault는 Doris 스토리지·컴퓨팅 분리 아키텍처의 중요한 구성 요소입니다. 데이터가 저장되는 공유 스토리지 계층을 나타냅니다. HDFS 또는 S3 호환 객체 스토리지를 사용하여 하나 이상의 Storage Vault를 생성할 수 있습니다. 하나의 Storage Vault를 기본 Storage Vault로 설정할 수 있습니다. 시스템 테이블과 Storage Vault를 지정하지 않은 테이블은 이 기본 Storage Vault에 저장됩니다. 기본 Storage Vault는 삭제할 수 없습니다. 다음은 Doris 클러스터에 Storage Vault를 생성하는 방법입니다:

1. HDFS Storage Vault 생성

   SQL로 Storage Vault를 생성하려면 MySQL 클라이언트로 Doris 클러스터에 연결합니다.

   ```sql
   CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. S3 Storage Vault 생성

   S3 호환 객체 스토리지를 사용하여 Storage Vault를 생성하려면 다음 단계를 따릅니다:

   - MySQL 클라이언트로 Doris 클러스터에 연결합니다.
   - 다음 SQL 명령을 실행하여 S3 Storage Vault를 생성합니다:

   ```sql
   CREATE STORAGE VAULT IF NOT EXISTS s3_vault
       PROPERTIES (
       "type"="S3",
       "s3.endpoint"="https://s3.us-east-1.amazonaws.com",
       "s3.access_key" = "ak",
       "s3.secret_key" = "sk",
       "s3.region" = "us-east-1",
       "s3.root.path" = "ssb_sf1_p2_s3",
       "s3.bucket" = "doris-build-1308700295",
       "provider" = "S3"
   );
   ```

   다른 객체 스토리지 서비스에 Storage Vault를 생성하려면 [Storage Vault 생성](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)을 참고하세요.

3. 기본 Storage Vault 설정

   다음 SQL 문을 사용하여 기본 Storage Vault를 설정합니다.

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## 자주 묻는 질문 {#faq}

### 질문: Meta Service가 "FDB version mismatch" 오류와 함께 시작되지 않으면 어떻게 하나요? {#q-meta-service-fails-to-start-with-the-error-fdb-version-mismatch}

Doris는 기본적으로 FDB 7.1.x 계열에 의존합니다. `fdbserver --version`을 실행하여 설치된 FoundationDB 버전을 확인하세요. 버전이 일치하지 않으면 올바른 버전의 FDB를 다시 설치하세요.

### 질문: FE 노드가 정상적으로 시작되어 Master가 되었는지 어떻게 확인하나요? {#q-how-do-i-confirm-that-an-fe-node-has-started-successfully-and-become-the-master}

다음 명령을 실행하여 확인합니다:
```bash
mysql -h <fe_host> -P 9030 -u root -e "SHOW FRONTENDS;"
```
출력에서 해당 FE의 `Role` 열이 `MASTER`인지 확인하세요.

### 질문: BE 노드가 시작 후에도 "Starting" 상태로 유지되면 어떻게 해결하나요? {#q-how-do-i-troubleshoot-a-be-node-that-stays-in-the-starting-state-after-startup}

다음 단계에 따라 문제를 해결합니다:
1. BE 로그 `be.log`에 오류 메시지가 있는지 확인합니다.
2. `meta_service_endpoint`가 올바르게 구성되어 있고 Meta Service에 접근할 수 있는지 확인합니다.
3. `deploy_mode`가 `cloud`로 설정되어 있는지 확인합니다.
4. `SHOW BACKENDS;`를 실행하여 자세한 오류 설명을 확인합니다.

### 질문: Storage Vault가 정상적으로 생성되었는지 어떻게 확인하나요? {#q-how-do-i-confirm-that-a-storage-vault-was-created-successfully}

다음 SQL을 실행하여 확인합니다:
```sql
SHOW STORAGE VAULT;
```
생성한 Storage Vault의 상태가 `OK`인지 확인하세요.

### 질문: BE 노드를 추가할 때 "backend already exists" 오류가 발생하면 어떻게 하나요? {#q-adding-a-be-node-returns-the-error-backend-already-exists}

BE 노드가 이미 존재하거나 이전 레코드가 완전히 정리되지 않았을 수 있습니다. 다음 명령을 실행하여 기존 레코드를 제거하고 다시 시도하세요:
```sql
ALTER SYSTEM DROP BACKEND "<ip>:<port>";
```

## 문제 해결 {#troubleshooting}

### FE가 Meta Service에 연결할 수 없음 {#fe-cannot-connect-to-meta-service}

- **증상**: FE 로그에 "connect to meta service failed"가 표시됩니다.
- **문제 해결 단계**:
  1. Meta Service 프로세스가 실행 중인지 확인합니다: `ps aux | grep doris_cloud`.
  2. `meta_service_endpoint`의 형식이 올바른지 확인합니다(`IP:Port` 형식이어야 함).
  3. 노드 간 네트워크에 접근할 수 있는지 확인합니다(기본 포트 5000).

### BE가 "Too many open files" 오류와 함께 시작되지 않음 {#be-fails-to-start-with-too-many-open-files}

- **문제 해결 단계**:
  1. `ulimit -n`을 실행하여 현재 제한을 확인합니다.
  2. `max_open_files = 65535`를 `be.conf`에 추가합니다.
  3. 또는 `ulimit -n 65535`를 실행한 다음 BE를 다시 시작합니다.

### FDB 클러스터가 시작되지 않음 {#fdb-cluster-fails-to-start}

- **문제 해결 단계**:
  1. `DATA_DIRS`에 지정한 디렉터리들이 `fdb_vars.sh`에 구성되어 있으며, 실제로 존재하고 적절한 권한이 있는지 확인합니다.
  2. `FDB_CLUSTER_IPS`가 모든 노드에서 동일하게 구성되어 있는지 확인합니다.
  3. `/var/log/foundationdb/fdbserver.log`에서 FDB 로그를 확인합니다.

## 참고 사항 {#notes}

- 메타데이터 작업을 담당하는 Meta Service 프로세스만 FE 및 BE의 `meta_service_endpoint` 구성 대상으로 사용해야 합니다.
- 데이터 정리 프로세스는 `meta_service_endpoint` 구성 대상으로 사용해서는 안 됩니다.
