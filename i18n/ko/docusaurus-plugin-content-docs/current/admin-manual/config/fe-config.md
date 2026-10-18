---
{
    "title": "FE 구성 | 구성",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "메타데이터 관리, 쿼리 엔진, 데이터 적재/내보내기, 스토리지 설정을 비롯한 Doris Frontend(FE) 구성 매개변수의 전체 참조 가이드입니다.",
    "sidebar_label": "FE 구성"
}
---

# FE 구성 {#fe-configuration}

이 문서에서는 FE의 구성 항목을 소개합니다.

FE 구성 파일인 `fe.conf`는 일반적으로 FE 배포 경로의 `conf/` 디렉터리에 저장됩니다. 버전 0.14에서는 별도의 구성 파일인 `fe_custom.conf`가 도입됩니다. 이 파일은 사용자가 운영 중에 동적으로 설정하고 영구 저장한 구성 항목을 기록하는 데 사용됩니다.

FE 프로세스가 시작되면 먼저 `fe.conf`의 구성 항목을 읽고, 그다음 `fe_custom.conf`의 구성 항목을 읽습니다. `fe_custom.conf`의 구성 항목은 `fe.conf`에 있는 동일한 구성 항목을 덮어씁니다.

`fe_custom.conf` 파일의 위치는 `fe.conf`의 `custom_config_dir` 구성 항목으로 지정할 수 있습니다.

## 구성 항목 조회 {#view-configuration-items}

FE 구성 항목을 조회하는 방법은 두 가지입니다.

1. FE 웹 페이지

    브라우저에서 FE 웹 페이지 `http://fe_host:fe_http_port/variable`을 엽니다. `Configure Info`에서 현재 적용 중인 FE 구성 항목을 확인할 수 있습니다.

2. 명령으로 조회

    FE가 시작된 후 MySQL 클라이언트에서 다음 명령으로 FE 구성 항목을 조회할 수 있습니다. 자세한 구문은 [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)를 참조하세요.

    `SHOW FRONTEND CONFIG;`

    결과에 표시되는 각 열의 의미는 다음과 같습니다.

    * Key: 구성 항목의 이름입니다.
    * Value: 구성 항목의 현재 값입니다.
    * Type: 정수, 문자열 등 구성 항목 값의 유형입니다.
    * IsMutable: 동적으로 설정할 수 있는지 나타냅니다. true이면 실행 중에 동적으로 설정할 수 있습니다. false이면 `fe.conf`에서만 설정할 수 있으며, FE를 다시 시작한 후 적용됩니다.
    * MasterOnly: Master FE 노드 전용 구성 항목인지 나타냅니다. true이면 Master FE 노드에서만 의미가 있으며, 다른 유형의 FE 노드에서는 의미가 없습니다. false이면 모든 유형의 FE 노드에서 의미가 있습니다.
    * Comment: 구성 항목의 설명입니다.

## 구성 항목 설정 {#set-configuration-items}

버전 4.1.5부터 `SHOW FRONTEND CONFIG`와 구성 내보내기 엔드포인트는 비어 있지 않은 민감한 값을 `********`로 마스킹합니다. 여기에는 `initial_root_password`, TLS 개인 키 비밀번호, HTTPS Key Store 비밀번호, MySQL SSL 인증서 비밀번호가 포함됩니다. 빈 값은 설정되지 않았음을 나타내도록 그대로 유지됩니다. 마스킹은 실제 적용되는 구성에 영향을 주지 않습니다.

FE 구성 항목을 설정하는 방법은 다음과 같습니다.

1. 정적 설정

    `conf/fe.conf` 파일에 구성 항목을 추가하고 값을 설정합니다. `fe.conf`의 구성 항목은 FE 프로세스가 시작될 때 읽습니다. `fe.conf`에 없는 구성 항목에는 기본값이 사용됩니다.

2. MySQL 프로토콜을 통한 동적 설정

    FE가 시작된 후 다음 명령으로 구성 항목을 동적으로 설정할 수 있습니다. 이 명령을 실행하려면 관리자 권한이 필요합니다.

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    모든 구성 항목이 동적 설정을 지원하는 것은 아닙니다. 동적 설정 지원 여부는 `IsMutable` 열에서 확인할 수 있으며, 이 열은 ` SHOW FRONTEND CONFIG; ` 명령 결과에 표시됩니다.

    `MasterOnly` 구성 항목을 수정하면 명령이 Master FE로 직접 전달되며, Master FE의 해당 구성 항목만 수정됩니다.

    **이 방식으로 수정한 구성 항목은 FE 프로세스를 다시 시작하면 적용되지 않습니다.**

    이 명령에 대한 자세한 도움말은 `HELP ADMIN SET CONFIG;` 명령으로 확인할 수 있습니다.

3. HTTP 프로토콜을 통한 동적 설정

    자세한 내용은 [구성 설정 작업](../open-api/fe-http/set-config-action)을 참조하세요.

    이 방법으로는 수정한 구성 항목을 영구 저장할 수도 있습니다. 구성 항목은 `fe_custom.conf` 파일에 저장되며, FE를 다시 시작한 후에도 적용됩니다.

## 예제 {#examples}

1. `async_pending_load_task_pool_size` 수정

    `SHOW FRONTEND CONFIG;`로 조회하면 이 구성 항목은 동적으로 설정할 수 없음을 확인할 수 있습니다(`IsMutable`이 false). `fe.conf`에 다음 항목을 추가해야 합니다.

    `async_pending_load_task_pool_size = 20`

    그런 다음 FE 프로세스를 다시 시작하면 구성이 적용됩니다.

2. `dynamic_partition_enable` 수정

    `SHOW FRONTEND CONFIG;`로 조회하면 이 구성 항목은 동적으로 설정할 수 있음을 확인할 수 있습니다(`IsMutable`이 true). 또한 Master FE 전용 구성입니다. 먼저 임의의 FE에 연결한 다음 다음 명령을 실행하여 구성을 수정할 수 있습니다.

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    이후 다음 명령으로 수정된 값을 확인할 수 있습니다.

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    위 방식으로 수정한 구성은 Master FE가 다시 시작되거나 Master 선출이 수행되면 적용되지 않습니다. 구성을 영구적으로 적용하려면 `fe.conf`에 구성 항목을 직접 추가하고 FE를 다시 시작하면 됩니다.

3. `max_distribution_pruner_recursion_depth` 수정

    `SHOW FRONTEND CONFIG;`로 조회하면 이 구성 항목은 동적으로 설정할 수 있음을 확인할 수 있습니다(`IsMutable`이 true). 이 항목은 Master FE 전용이 아닙니다.

    마찬가지로 동적 구성 변경 명령으로 구성을 수정할 수 있습니다. 이 구성은 Master FE 전용이 아니므로, 모든 FE가 수정된 구성 값을 사용하도록 하려면 각 FE에 별도로 연결하여 동적으로 수정해야 합니다.

## 구성 항목 {#configurations}

### 메타데이터 및 클러스터 {#metadata-and-cluster}

#### `meta_dir` {#meta_dir}

기본값：DORIS_HOME_DIR + "/doris-meta"

유형: string 설명: Doris 메타데이터가 저장되는 위치입니다. 이 디렉터리의 스토리지는 다음 조건을 갖추는 것이 좋습니다.

* 높은 쓰기 성능(SSD)
* 안전성(RAID)

#### `catalog_try_lock_timeout_ms` {#catalog_try_lock_timeout_ms}

기본값：5000  （ms）

동적 변경 가능 여부：true

Catalog 잠금의 tryLock 시간 제한 설정입니다. 테스트가 필요한 경우가 아니라면 일반적으로 변경할 필요가 없습니다.

#### `enable_bdbje_debug_mode` {#enable_bdbje_debug_mode}

기본값：false

true로 설정하면 FE가 BDBJE 디버그 모드로 시작됩니다.

#### `max_bdbje_clock_delta_ms` {#max_bdbje_clock_delta_ms}

기본값：5000 （5s）

Master가 아닌 FE 호스트와 Master FE 호스트 사이에 허용되는 최대 시계 오차를 설정합니다. Master가 아닌 FE가 BDBJE를 통해 Master FE에 연결할 때마다 이 값을 확인합니다. 시계 오차가 이 값보다 크면 연결을 중단합니다.

#### `metadata_failure_recovery` {#metadata_failure_recovery}

기본값：false

true이면 FE가 bdbje 복제 그룹을 초기화하고(즉, 선출 가능한 모든 노드 정보를 제거하고) Master로 시작을 시도합니다. 선출 가능한 노드를 모두 시작할 수 없다면 메타데이터를 다른 노드로 복사하고 이 구성을 true로 설정하여 FE 재시작을 시도할 수 있습니다.

#### `txn_rollback_limit` {#txn_rollback_limit}

기본값：100

bdbje가 그룹에 다시 참여하려고 할 때 롤백할 수 있는 최대 트랜잭션 수입니다.

#### `grpc_threadmgr_threads_nums` {#grpc_threadmgr_threads_nums}

기본값: 4096

grpc_threadmgr에서 grpc 이벤트를 처리하는 스레드 수입니다.

#### `bdbje_replica_ack_timeout_second` {#bdbje_replica_ack_timeout_second}

기본값：10  (s)

bdbje에 쓸 때 복제본의 ack 시간 제한입니다. 비교적 큰 로그를 쓸 때 ack 시간이 초과되어 로그 쓰기가 실패할 수 있습니다. 이 경우 값을 적절히 늘릴 수 있습니다.

#### `bdbje_lock_timeout_second` {#bdbje_lock_timeout_second}

기본값：5

bdbje 작업의 잠금 시간 제한입니다. FE WARN 로그에 LockTimeoutException이 많이 나타나면 이 값을 늘려 볼 수 있습니다.

#### `bdbje_heartbeat_timeout_second` {#bdbje_heartbeat_timeout_second}

기본값：30

Master와 Follower 간 bdbje heartbeat의 시간 제한입니다. 기본값은 bdbje의 기본값과 동일한 30초입니다. 일시적인 네트워크 문제나 예상치 못한 긴 Java GC로 문제가 발생한다면 이 값을 늘려 잘못된 시간 초과 판정 가능성을 줄일 수 있습니다.

#### `replica_ack_policy` {#replica_ack_policy}

기본값：SIMPLE_MAJORITY

옵션: ALL, NONE, SIMPLE_MAJORITY

bdbje의 복제본 ack 정책입니다. 자세한 내용은 <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>을 참조하세요.

#### `replica_sync_policy` {#replica_sync_policy}

기본값：SYNC

옵션：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje의 Follower FE 동기화 정책입니다.

#### `master_sync_policy` {#master_sync_policy}

기본값：SYNC

옵션：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje의 Master FE 동기화 정책입니다. Follower FE를 하나만 배포한다면 'SYNC'로 설정하세요. Follower FE를 3개보다 많이 배포한다면 이 항목과 'replica_sync_policy'를 WRITE_NO_SYNC로 설정할 수 있습니다. 자세한 내용은 <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>을 참조하세요.

#### `bdbje_reserved_disk_bytes` {#bdbje_reserved_disk_bytes}

복제된 JE Environment에서 유지할 예약 공간의 목표 상한값입니다. 단위는 바이트입니다.

기본값: 1073741824

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `ignore_meta_check` {#ignore_meta_check}

기본값：false

동적 변경 가능 여부：true

true이면 Master가 아닌 FE는 Master FE와 자신 사이의 메타데이터 지연 차이가 *meta_delay_toleration_second*를 초과하더라도 이를 무시하고 읽기 서비스를 계속 제공합니다.
어떤 이유로 Master FE를 비교적 오랫동안 중지해야 하지만 Master가 아닌 FE가 계속 읽기 서비스를 제공하기를 원하는 경우 유용합니다.

#### `meta_delay_toleration_second` {#meta_delay_toleration_second}

기본값: 300 (5분)

Master가 아닌 FE는 메타데이터 지연 차이가 *meta_delay_toleration_second*를 초과하면 서비스 제공을 중지합니다.

#### `edit_log_port` {#edit_log_port}

기본값：9010

bdbje 포트입니다.

#### `edit_log_type` {#edit_log_type}

기본값：BDB

Edit Log 유형입니다.
BDB: bdbje에 로그를 씁니다.
LOCAL: 더 이상 사용되지 않습니다.

#### `edit_log_roll_num` {#edit_log_roll_num}

기본값：50000

동적 변경 가능 여부：true

Master FE 전용：true

Master FE는 메타데이터 저널이 *edit_log_roll_num*개 쌓일 때마다 이미지를 저장합니다.

#### `force_do_metadata_checkpoint` {#force_do_metadata_checkpoint}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 checkpoint 스레드가 JVM 메모리 사용률에 관계없이 checkpoint를 수행합니다.

#### `metadata_checkpoint_memory_threshold` {#metadata_checkpoint_memory_threshold}

기본값：60  （60%）

동적 변경 가능 여부：true

Master FE 전용：true

JVM 메모리 사용률(heap 또는 old 메모리 풀)이 이 임계값을 초과하면 OOM을 방지하기 위해 checkpoint 스레드가 동작하지 않습니다.

#### `max_same_name_catalog_trash_num` {#max_same_name_catalog_trash_num}

Catalog 휴지통에 보관할 동일한 이름의 메타데이터 최대 개수를 설정합니다. 최댓값을 초과하면 가장 먼저 삭제된 메타데이터를 영구 삭제하며, 이후에는 복구할 수 없습니다. 0은 동일한 이름의 객체를 보관하지 않음을 의미합니다. < 0은 제한 없음을 의미합니다.

참고: 동일한 이름의 메타데이터인지 판단하는 범위는 제한됩니다. 예를 들어 동일한 이름의 데이터베이스는 같은 클러스터 내에서, 동일한 이름의 테이블은 같은 데이터베이스(동일한 데이터베이스 id) 내에서, 동일한 이름의 파티션은 같은 데이터베이스(동일한 데이터베이스 id)의 같은 테이블(동일한 테이블 id) 내에서 판단합니다.

기본값: 3

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `cluster_id` {#cluster_id}

기본값：-1

노드(FE 또는 BE)의 클러스터 id가 같으면 동일한 Doris 클러스터에 속한 것으로 간주합니다. 클러스터 id는 일반적으로 Master FE가 처음 시작될 때 생성되는 임의의 정수입니다. 직접 지정할 수도 있습니다.

#### `heartbeat_mgr_blocking_queue_size` {#heartbeat_mgr_blocking_queue_size}

기본값：1024

Master FE 전용：true

heartbeat_mgr에서 heartbeat 작업을 저장하는 블로킹 큐의 크기입니다.

#### `heartbeat_mgr_threads_num` {#heartbeat_mgr_threads_num}

기본값：8

Master FE 전용：true

heartbeat_mgr에서 heartbeat 이벤트를 처리하는 스레드 수입니다.

#### `disable_cluster_feature` {#disable_cluster_feature}

기본값：true

동적 변경 가능 여부：true

멀티 클러스터 기능은 버전 0.12에서 더 이상 사용되지 않을 예정입니다. 이 구성을 true로 설정하면 다음과 같은 클러스터 기능 관련 작업이 모두 비활성화됩니다.

1. 클러스터 생성/삭제
2. 미할당 Backend 추가/클러스터에 Backend 추가/클러스터 decommission 균형 조정
3. 클러스터의 Backend 수 변경
4. 데이터베이스 연결/마이그레이션

#### `enable_fqdn_mode` {#enable_fqdn_mode}

이 구성은 주로 k8s 클러스터 환경에서 사용됩니다. enable_fqdn_mode가 true이면 BE가 위치한 Pod를 다시 생성한 후에도 Pod 이름은 유지되며, IP는 변경될 수 있습니다.

기본값: false

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: true

#### `enable_token_check` {#enable_token_check}

기본값：true

상위 호환성을 위한 항목으로, 추후 제거될 예정입니다. 이미지 파일을 다운로드할 때 토큰을 확인합니다.

#### `fe_meta_auth_token` {#fe_meta_auth_token}

기본값: "" (빈 문자열)

동적 변경 가능 여부: false

FE 노드 간에 FE 메타데이터 서비스 HTTP 엔드포인트(`image`, `role`, `check`, `put`, `journal_id` 등)를 인증하는 데 사용하는 클러스터 토큰입니다. Doris 4.0 계열의 버전 4.0.8과 4.1 계열의 버전 4.1.4에서 추가되었습니다.

비어 있지 않은 값으로 설정하면 이 엔드포인트는 기존 노드 호스트 확인 외에도 호출자가 일치하는 토큰 헤더를 제공하도록 요구합니다. 따라서 클러스터 구성원이 아닌 호출자가 FE 메타데이터 엔드포인트에 접근하는 것을 방지합니다. 값을 비워 두면 기존의 노드 호스트만 확인하는 동작을 유지하므로 기존 클러스터와 롤링 업그레이드에 영향을 주지 않습니다.

:::caution 참고

이 구성은 **모든 FE에서** 동일해야 하며, 활성화하기 전에 `fe.conf`에 기록해야 합니다. 그렇지 않으면 FE가 서로의 메타데이터 요청을 거부하여 메타데이터 동기화가 실패합니다.

:::

#### `enable_multi_tags` {#enable_multi_tags}

기본값: false

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: true

단일 BE의 멀티 태그 기능을 활성화할지 여부입니다.

#### `initial_root_password` {#initial_root_password}

root 사용자의 초기 비밀번호를 2단계 SHA-1 암호화 값으로 설정합니다. 기본값은 ''이며, root 비밀번호가 없음을 의미합니다. 이후 root 사용자에 대해 `set password` 작업을 수행하면 초기 root 비밀번호를 덮어씁니다.

예: 평문 비밀번호를 `root@123`으로 설정하려면 Doris SQL `select password('root@123')`을 실행하여 암호화된 비밀번호 `*A00C34073A26B40AB4307650BFB9309D6BFA6999`를 생성할 수 있습니다.

기본값: 빈 문자열

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: true

#### `enable_cooldown_replica_affinity` {#enable_cooldown_replica_affinity}

스캔 시 콜드 스토리지로 이동한 복제본을 우선 사용할지 선택할 수 있습니다. 기본값은 true입니다.

기본값: true

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

### TSO (Timestamp Oracle) {#tso-timestamp-oracle}

<version since="dev">

</version>

TSO는 `enable_feature_binlog`로 활성화합니다. 이 항목의 기본값은 false이며 동적으로 변경할 수 없습니다. 현재 지원되는 TSO 매개변수는 다음과 같습니다. 사용 방법과 주의 사항은 [TSO](../cluster-management/tso.md)를 참조하세요.

| 매개변수 | 유형 | 기본값 | 동적 변경 가능 여부 | Master 전용 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 할당 윈도우 갱신 여부를 확인하는 간격입니다. |
| `tso_max_update_retry_count` | int | `3` | true | true | TSO 상태 갱신의 최대 시도 횟수입니다. |
| `tso_max_get_retry_count` | int | `10` | true | true | 실패를 보고하기 전 TSO 할당의 최대 시도 횟수입니다. |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 예약된 할당 윈도우의 기간입니다. 주기적인 영구 저장 간격의 상한이기도 합니다. |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 시작 시 보정 과정에서 허용되는 재생된 윈도우 종료 시각과 시스템 시계 간 최대 차이입니다. |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | 테스트 전용 시계 오프셋입니다. 정상 운영에는 사용하지 마세요. |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 논리 카운터가 용량의 절반을 초과하고 실제 시계의 진행이 충분하지 않으면 물리적 구성 요소를 1 ms 앞으로 이동합니다. |

### 서비스 {#service}

#### `arrow_flight_deferred_query_idle_timeout_second` {#arrow_flight_deferred_query_idle_timeout_second}

기본값: 3600 (초)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

버전 4.1.5부터 지원됩니다. 외부 테이블을 배치로 스캔하는 Arrow Flight SQL 쿼리는 `GetFlightInfo`를 반환한 후에도 FE Coordinator를 유지해야 합니다. 그래야 클라이언트가 `DoGet`으로 결과를 읽을 때 BE가 계속 split을 가져올 수 있습니다. 이 설정은 유휴 세션에서 이러한 쿼리가 리소스를 유지하는 시간을 제한합니다. 이 기간은 쿼리 시작 시점부터 계산하며, 쿼리 실행 시간 제한보다 짧아지지 않습니다. 기간이 만료되면 Coordinator, Workload Group 큐 슬롯, `active_queries` 항목이 해제되지만 세션은 열린 상태로 유지되며 계속 `wait_timeout`의 적용을 받습니다. 이 기한을 비활성화하려면 `0`으로 설정하세요.

#### `query_port` {#query_port}

기본값：9030

FE MySQL 서버 포트입니다.

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

기본값：-1

Arrow Flight SQL 서버 포트입니다.

#### `frontend_address` {#frontend_address}

상태: 더 이상 사용되지 않으며, 사용을 권장하지 않습니다. 이 매개변수는 추후 삭제될 수 있습니다.

유형: string

설명: *InetAddress.getByName*으로 IP 주소를 가져오는 대신 FE의 IP 주소를 명시적으로 설정합니다. 일반적으로 *InetAddress.getByName*에서 예상한 결과를 얻을 수 없을 때 사용합니다. IP 주소만 지원하며 호스트 이름은 지원하지 않습니다.

기본값: 0.0.0.0

#### `priority_networks` {#priority_networks}

기본값：없음

여러 IP를 가진 서버의 IP 선택 전략을 선언합니다. 이 목록과 일치하는 IP는 최대 하나여야 합니다. 세미콜론으로 구분된 CIDR 표기법 목록이며, 예를 들면 10.10.10.0/24입니다. 이 규칙과 일치하는 IP가 없으면 임의로 하나를 선택합니다.

#### `http_port` {#http_port}

기본값：8030

HTTP 바인딩 포트입니다. 현재 모든 FE의 HTTP 포트는 같아야 합니다.

#### `https_port` {#https_port}

기본값：8050

HTTPS 바인딩 포트입니다. 현재 모든 FE의 HTTPS 포트는 같아야 합니다.

#### `enable_https` {#enable_https}

기본값：false

HTTPS 활성화 여부입니다. false이면 HTTP를 지원합니다. true이면 HTTP와 HTTPS를 모두 지원하며, HTTP 요청은 자동으로 HTTPS로 리디렉션됩니다.
enable_https가 true이면 fe.conf에 SSL 인증서 정보를 설정해야 합니다.

#### `enable_ssl` {#enable_ssl}

기본값：true

true로 설정하면 Doris가 MySQL과 SSL 프로토콜 기반의 암호화 채널을 설정합니다.

#### `qe_max_connection` {#qe_max_connection}

기본값：1024

FE당 최대 연결 수입니다.

#### `check_java_version` {#check_java_version}

기본값：true

Doris가 컴파일 시와 실행 시의 Java 버전이 호환되는지 확인합니다. 호환되지 않으면 Java 버전 불일치 예외 메시지를 출력하고 시작을 중단합니다.

#### `rpc_port` {#rpc_port}

기본값：9020

FE Thrift Server 포트입니다.

#### `thrift_server_type` {#thrift_server_type}

FE의 Thrift 서비스가 사용하는 서비스 모델을 지정합니다. String 유형이며 대소문자를 구분하지 않습니다.

'SIMPLE'로 설정하면 'TSimpleServer' 모델을 사용합니다. 일반적으로 프로덕션 환경에는 적합하지 않으며 테스트 용도로만 사용합니다.

'THREADED'로 설정하면 'TThreadedSelectorServer' 모델을 사용합니다. 이는 비차단 I/O 모델인 Master-Slave Reactor 모델로, 많은 동시 연결 요청에 신속하게 응답하며 대부분의 시나리오에서 좋은 성능을 제공합니다.

`THREAD_POOL`로 설정하면 `TThreadPoolServer` 모델을 사용합니다. 이 모델은 차단 I/O 모델로, 스레드 풀을 사용하여 사용자 연결을 처리합니다. 동시 연결 수는 스레드 풀의 스레드 수로 제한됩니다. 동시 요청 수를 미리 예측할 수 있고 충분한 스레드 리소스 비용을 감당할 수 있다면 이 모델이 더 나은 성능을 제공합니다. 기본적으로 이 서비스 모델을 사용합니다.

#### `thrift_server_max_worker_threads` {#thrift_server_max_worker_threads}

기본값：4096

Thrift 서버의 최대 작업 스레드 수입니다.

#### `thrift_backlog_num` {#thrift_backlog_num}

기본값：1024

Thrift 서버의 backlog_num입니다. 이 값을 늘릴 때는 Linux의 /proc/sys/net/core/somaxconn 설정보다 큰 값인지 확인해야 합니다.

#### `thrift_client_timeout_ms` {#thrift_client_timeout_ms}

기본값：0

Thrift 서버의 연결 시간 제한 및 소켓 시간 제한 설정입니다.

읽기 시간 초과를 방지하기 위해 thrift_client_timeout_ms 값을 영으로 설정합니다.

#### `thrift_max_message_size` {#thrift_max_message_size}

기본값: 100MB

Thrift 서버가 수신하는 메시지의 최대 크기입니다. 단위는 바이트입니다. 클라이언트가 보내는 메시지의 크기가 이 제한을 초과하면 Thrift 서버는 요청을 거부하고 연결을 닫습니다. 이때 클라이언트에 "connection has been closed by peer." 오류가 발생합니다. 이 경우 이 매개변수 값을 늘려 볼 수 있습니다.

#### `use_compact_thrift_rpc` {#use_compact_thrift_rpc}

기본값: true

쿼리 계획 구조를 압축 형식으로 전송할지 여부입니다. 활성화하면 쿼리 계획 구조의 크기를 약 50% 줄일 수 있어 일부 "send fragment timeout" 오류를 방지할 수 있습니다.
다만 동시성이 높은 소규모 쿼리 시나리오에서는 동시성이 약 10% 감소할 수 있습니다.

#### `grpc_max_message_size_bytes` {#grpc_max_message_size_bytes}

기본값：1G

GRPC 클라이언트 채널의 초기 흐름 제어 윈도우 크기와 최대 메시지 크기를 설정합니다. 결과 집합이 크면 이 값을 늘려야 할 수 있습니다.

#### `max_mysql_service_task_threads_num` {#max_mysql_service_task_threads_num}

기본값：4096

Task 이벤트를 처리하는 스레드 수입니다.

#### `mysql_service_io_threads_num` {#mysql_service_io_threads_num}

기본값：4

FE가 NIO 모델 기반의 MySQL 서버를 시작할 때 IO 이벤트를 처리하는 스레드 수입니다.

#### `mysql_nio_backlog_num` {#mysql_nio_backlog_num}

기본값：1024

MySQL NIO 서버의 backlog_num입니다. 이 값을 늘릴 때는 Linux의 /proc/sys/net/core/somaxconn 파일에 있는 값도 함께 늘려야 합니다.

#### `broker_timeout_ms` {#broker_timeout_ms}

기본값：10000   （10s）

Broker RPC의 기본 시간 제한입니다.

#### `backend_rpc_timeout_ms` {#backend_rpc_timeout_ms}

FE가 BE로 RPC 요청을 보낼 때의 시간 제한입니다. 단위는 밀리초입니다.

기본값: 60000

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: true

#### `drop_backend_after_decommission` {#drop_backend_after_decommission}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

1. BE의 decommission이 성공적으로 완료된 후 시스템에서 해당 BE를 제거할지 제어합니다. true이면 BE가 성공적으로 오프라인 상태가 된 후 BE 노드를 삭제합니다. false이면 BE가 성공적으로 오프라인 상태가 된 후에도 DECOMMISSION 상태로 남으며 제거되지 않습니다.

   이 구성은 특정 시나리오에서 유용합니다. Doris 클러스터의 초기 상태에서 각 BE 노드에 디스크가 하나씩 있다고 가정해 보겠습니다. 일정 기간 운영한 후 수직 확장을 수행하여 각 BE 노드에 새 디스크를 2개 추가했습니다. 현재 Doris는 BE 내부 디스크 간 데이터 균형 조정을 지원하지 않으므로 초기 디스크의 데이터양이 새로 추가한 디스크보다 항상 훨씬 많을 수 있습니다. 이때 다음 작업으로 디스크 간 균형을 수동으로 조정할 수 있습니다.

   1. 이 구성 항목을 false로 설정합니다.
   2. 특정 BE 노드에 decommission 작업을 수행합니다. 이 작업은 해당 BE의 모든 데이터를 다른 노드로 마이그레이션합니다.
   3. decommission 작업이 완료되어도 BE는 제거되지 않습니다. 이때 해당 BE의 decommission 상태를 취소합니다. 그러면 다른 BE 노드의 데이터가 다시 이 노드로 이동하면서 균형 조정이 시작됩니다. 이 과정에서 데이터가 해당 BE의 모든 디스크에 고르게 분산됩니다.
   4. 모든 BE 노드에 대해 2단계와 3단계를 순서대로 수행하면 모든 노드의 디스크 균형을 맞출 수 있습니다.

#### `max_backend_down_time_second` {#max_backend_down_time_second}

기본값: 3600  (1시간)

동적 변경 가능 여부：true

Master FE 전용：true

Backend가 *max_backend_down_time_second* 동안 중단되면 BACKEND_DOWN 이벤트가 발생합니다.

#### `disable_backend_black_list` {#disable_backend_black_list}

BE 블랙리스트 기능을 비활성화합니다. 이 기능을 비활성화하면 BE에 대한 쿼리 요청이 실패해도 해당 BE가 블랙리스트에 추가되지 않습니다.
이 매개변수는 간헐적인 버그로 다수의 회귀 테스트가 실패하는 상황을 줄이기 위한 회귀 테스트 환경에 적합합니다.

기본값: false

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

#### `max_backend_heartbeat_failure_tolerance_count` {#max_backend_heartbeat_failure_tolerance_count}

BE 노드의 heartbeat 실패를 허용하는 최대 횟수입니다. 연속 heartbeat 실패 횟수가 이 값을 초과하면 BE 상태가 dead로 설정됩니다.
이 매개변수는 간헐적인 heartbeat 실패로 다수의 회귀 테스트가 실패하는 상황을 줄이기 위한 회귀 테스트 환경에 적합합니다.

기본값: 1

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

### `abort_txn_after_lost_heartbeat_time_second` {#abort_txn_after_lost_heartbeat_time_second}

heartbeat가 끊긴 후 트랜잭션을 중단하기까지의 시간입니다. 기본값은 300이며, BE의 heartbeat가 끊긴 후 300s가 지나면 해당 BE의 트랜잭션을 중단한다는 의미입니다.

기본값: 300(s)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `enable_access_file_without_broker` {#enable_access_file_without_broker}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

Broker를 통해 BOS 또는 다른 클라우드 스토리지에 접근할 때 Broker를 건너뛰도록 시도할지 설정합니다.

#### `agent_task_resend_wait_time_ms` {#agent_task_resend_wait_time_ms}

기본값：5000

동적 변경 가능 여부：true

Master FE 전용：true

agent_task에 create_time이 설정된 경우 agent 작업을 다시 보낼지 결정합니다. current_time - create_time > agent_task_resend_wait_time_ms인 경우에만 ReportHandler가 agent 작업을 다시 보낼 수 있습니다.

현재 이 구성은 주로 `PUBLISH_VERSION` agent 작업의 중복 전송 문제를 해결하는 데 사용됩니다. 현재 기본값인 5000은 실험적으로 정한 값입니다.

agent 작업을 AgentTaskQueue에 제출하는 시점과 BE에 제출하는 시점 사이에는 일정한 지연이 있습니다. 이 구성 값을 늘리면 agent 작업이 중복 전송되는 문제를 효과적으로 줄일 수 있습니다.

다만 제출에 실패하거나 실행에 실패한 agent 작업을 다시 실행하기까지 걸리는 시간도 늘어납니다.

#### `max_agent_task_threads_num` {#max_agent_task_threads_num}

기본값：4096

Master FE 전용：true

agent 작업 스레드 풀에서 agent 작업을 처리하는 최대 스레드 수입니다.

#### `remote_fragment_exec_timeout_ms` {#remote_fragment_exec_timeout_ms}

기본값：30000  （ms）

동적 변경 가능 여부：true

비동기 원격 fragment 실행의 시간 제한입니다. 일반적으로 비동기 원격 fragment는 짧은 시간 안에 실행됩니다. 시스템 부하가 높다면 이 시간 제한을 늘려 보세요.

#### `auth_token` {#auth_token}

기본값：비어 있음

내부 인증에 사용하는 클러스터 토큰입니다.

#### `enable_http_server_v2` {#enable_http_server_v2}

기본값: 정식 버전 0.14.0 출시 이후에는 true이며, 이전에는 false입니다.

HTTP Server V2는 SpringBoot로 구현되며 프런트엔드와 백엔드를 분리한 아키텍처를 사용합니다. HTTPv2를 활성화해야 새 프런트엔드 UI를 사용할 수 있습니다.

#### `http_api_extra_base_path` {#http_api_extra_base_path}

일부 배포 환경에서는 HTTP API의 공통 접두사로 추가 기본 경로를 지정해야 합니다. 이 매개변수로 추가 접두사를 지정할 수 있습니다.
설정 후 `GET /api/basepath` 인터페이스로 매개변수 값을 가져올 수 있습니다. 새 UI도 URL을 구성하기 전에 이 기본 경로를 먼저 가져오려고 시도합니다. `enable_http_server_v2`가 true일 때만 유효합니다.

기본값은 비어 있으며, 설정되지 않았음을 의미합니다.

#### `jetty_server_acceptors` {#jetty_server_acceptors}

기본값：2

#### `jetty_server_selectors` {#jetty_server_selectors}

기본값：4

#### `jetty_server_workers` {#jetty_server_workers}

기본값：0

위 세 매개변수에 대응하는 Jetty의 스레드 아키텍처는 acceptors, selectors, workers라는 세 스레드 풀로 구성됩니다. Acceptors는 새 연결을 수락한 뒤 selectors에 넘겨 HTTP 메시지 프로토콜의 파싱을 처리하게 하고, 마지막으로 workers가 요청을 처리합니다. 앞의 두 스레드 풀은 비차단 모델을 사용하므로 스레드 하나로 여러 소켓의 읽기와 쓰기를 처리할 수 있어 필요한 스레드 수가 적습니다.

대부분의 프로젝트에서는 acceptors 스레드가 1-2개, selectors 스레드가 2~4개면 충분합니다. Workers는 블로킹 방식의 비즈니스 로직을 처리하며 데이터베이스 작업이 많은 경우가 많아 많은 스레드가 필요합니다. 구체적인 수는 애플리케이션의 QPS와 IO 이벤트 비율에 따라 달라집니다. QPS가 높을수록 더 많은 스레드가 필요하고, IO 비율이 높을수록 대기하는 스레드가 많아져 전체적으로 더 많은 스레드가 필요합니다.

Worker 스레드 풀은 기본적으로 설정되지 않습니다. 필요에 맞게 설정하세요.

#### `jetty_server_max_http_post_size` {#jetty_server_max_http_post_size}

기본값：`100 * 1024 * 1024`  （100MB）

PUT 또는 POST 메서드로 업로드하는 파일의 최대 바이트 수입니다. 기본값은 100MB입니다.

#### `jetty_server_max_http_header_size` {#jetty_server_max_http_header_size}

기본값：1048576  （1M）

HTTP 헤더 크기를 설정하는 매개변수입니다. 기본값은 1M입니다.

#### `http_sql_submitter_max_worker_threads` {#http_sql_submitter_max_worker_threads}

기본값：2

HTTP SQL 제출기의 최대 작업 스레드 수입니다.

#### `http_load_submitter_max_worker_threads` {#http_load_submitter_max_worker_threads}

기본값：2

HTTP 업로드 제출기의 최대 작업 스레드 수입니다.

:::caution 동작 변경 (4.1.4)

버전 4.1.4에서 `/api/upload` 엔드포인트가 제거되면서 이 구성 항목도 함께 제거되었습니다. [업로드 작업](../open-api/fe-http/upload-action)을 참조하세요.

:::

### 쿼리 엔진 {#query-engine}

#### `default_max_query_instances` {#default_max_query_instances}

사용자 속성 max_query_instances가 0 이하일 때 사용하는 기본값입니다. 사용자별 최대 인스턴스 수를 제한합니다. 이 매개변수가 0 이하이면 제한이 없습니다.

기본값은 -1입니다.

#### `max_query_retry_time` {#max_query_retry_time}

기본값：3

동적 변경 가능 여부：true

쿼리 재시도 횟수입니다. RPC 예외가 발생하고 아직 사용자에게 결과를 보내지 않은 경우 쿼리를 재시도할 수 있습니다. 이 횟수를 줄이면 연쇄적인 과부하를 방지할 수 있습니다.

#### `max_dynamic_partition_num` {#max_dynamic_partition_num}

기본값：500

동적 변경 가능 여부：true

Master FE 전용：true

동적 파티션 테이블을 생성할 때 한 번에 너무 많은 파티션을 생성하지 않도록 최대 파티션 수를 제한합니다. 파티션 수는 동적 파티션 매개변수의 "start"와 "end"로 결정됩니다.

#### `dynamic_partition_enable` {#dynamic_partition_enable}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：true

동적 파티션 스케줄러를 활성화할지 여부입니다. 기본적으로 활성화됩니다.

#### `dynamic_partition_check_interval_seconds` {#dynamic_partition_check_interval_seconds}

기본값：600 （s）

동적 변경 가능 여부：true

Master FE 전용：true

동적 파티션을 확인하는 간격을 결정합니다.

#### `max_multi_partition_num` {#max_multi_partition_num}

기본값：4096

동적 변경 가능 여부：true

Master FE 전용：true

멀티 파티션의 파티션 이름 접두사를 설정합니다. 멀티 파티션에만 적용되며 동적 파티션에는 적용되지 않습니다. 기본 접두사는 "p_"입니다.

#### `multi_partition_name_prefix` {#multi_partition_name_prefix}

기본값：p_

동적 변경 가능 여부：true

Master FE 전용：true

멀티 파티션의 파티션 이름 접두사를 설정합니다. 멀티 파티션에만 적용되며 동적 파티션에는 적용되지 않습니다. 기본 접두사는 "p_"입니다.

#### `partition_in_memory_update_interval_secs` {#partition_in_memory_update_interval_secs}

기본값：300 (s)

동적 변경 가능 여부：true

Master FE 전용：true

메모리에 있는 전역 파티션 정보를 갱신하는 간격입니다.

#### `enable_concurrent_update` {#enable_concurrent_update}

기본값：false

동적 변경 가능 여부：false

Master FE 전용：true

동시 업데이트를 활성화할지 여부입니다.

#### `lower_case_table_names` {#lower_case_table_names}

기본값：0

동적 변경 가능 여부：false

Master FE 전용：true

이 구성은 클러스터 초기화 시에만 설정할 수 있습니다. 초기화가 완료된 후에는 클러스터를
다시 시작하거나 업그레이드할 때도 변경할 수 없습니다.

0: 테이블 이름을 지정한 대로 저장하며, 비교 시 대소문자를 구분합니다.
1: 테이블 이름을 소문자로 저장하며, 비교 시 대소문자를 구분하지 않습니다.
2: 테이블 이름을 지정한 대로 저장하지만 소문자로 변환하여 비교합니다.

#### `table_name_length_limit` {#table_name_length_limit}

기본값：64

동적 변경 가능 여부：true

Master FE 전용：true

테이블 이름의 최대 길이를 제어합니다.

#### `cache_enable_sql_mode` {#cache_enable_sql_mode}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：false

이 스위치를 활성화하면 SQL 쿼리 결과 집합을 캐시합니다. 쿼리에 포함된 모든 테이블의 모든 파티션에서 마지막으로 확인한 버전 시각과의 간격이 cache_last_version_interval_second보다 크고, 결과 집합의 행 수가 cache_result_max_row_count보다 적으며, 데이터 크기가 cache_result_max_data_size보다 작으면 결과 집합을 캐시합니다. 이후 동일한 SQL은 캐시에 적중합니다.

true로 설정하면 FE가 SQL 결과 캐싱을 활성화합니다. 이 옵션은 오프라인 데이터 갱신 시나리오에 적합합니다.

|                        | 사례1 | 사례2 | 사례3 | 사례4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode` {#cache_enable_partition_mode}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：false

true로 설정하면 FE가 BE 캐시에서 데이터를 가져옵니다. 이 옵션은 일부 파티션이 실시간으로 갱신되는 시나리오에 적합합니다.

#### `cache_result_max_row_count` {#cache_result_max_row_count}

기본값：3000

동적 변경 가능 여부：true

Master FE 전용：false

과도한 메모리 사용을 방지하기 위해 캐시할 수 있는 최대 행 수를 제한합니다. 기본값은 3000입니다. 이 임계값을 초과하면 캐시할 수 없습니다.

#### `cache_result_max_data_size` {#cache_result_max_data_size}

기본값: 31457280

동적 변경 가능 여부: true

Master FE 전용: false

과도한 메모리 사용을 방지하기 위해 캐시할 수 있는 행 데이터의 최대 크기를 제한합니다. 기본값은 10MB입니다. 이 임계값을 초과하면 캐시할 수 없습니다.

#### `cache_last_version_interval_second` {#cache_last_version_interval_second}

기본값：30

동적 변경 가능 여부：true

Master FE 전용：false

테이블 파티션의 최신 버전 시간 간격으로, 데이터 갱신 시점과 현재 버전 사이의 시간 간격을 의미합니다. 일반적으로 900초로 설정하여 오프라인 데이터 적재와 실시간 데이터 적재를 구분합니다.

#### `max_allowed_in_element_num_of_delete` {#max_allowed_in_element_num_of_delete}

기본값：1024

동적 변경 가능 여부：true

Master FE 전용：true

DELETE 문에서 InPredicate의 요소 수를 제한합니다.

#### `max_running_rollup_job_num_per_table` {#max_running_rollup_job_num_per_table}

기본값：1

동적 변경 가능 여부：true

Master FE 전용：true

Rollup 작업의 동시 실행 한도를 제어합니다.

#### `max_distribution_pruner_recursion_depth` {#max_distribution_pruner_recursion_depth}

기본값：100

동적 변경 가능 여부：true

Master FE 전용：false

해시 분산 프루너의 최대 재귀 깊이를 제한합니다.
예: where a in (5개 요소) and b in (4개 요소) and c in (3개 요소) and d in (2개 요소).
a/b/c/d가 분산 열이면 재귀 깊이는 5 *4* 3 * 2 = 120으로, 100보다 큽니다.
이 경우 분산 프루너가 동작하지 않고 모든 버킷을 반환합니다.
깊이를 늘리면 더 많은 요소에 대해 분산 프루닝을 지원할 수 있지만 CPU 사용량이 증가할 수 있습니다.

#### `enable_local_replica_selection` {#enable_local_replica_selection}

기본값：false

동적 변경 가능 여부：true

true로 설정하면 Planner가 이 Frontend와 동일한 호스트에 있는 tablet 복제본을 선택하려고 시도합니다.
다음 조건에서는 네트워크 전송을 줄일 수 있습니다.

* N개의 호스트에 N개의 Backend와 N개의 Frontend가 배포되어 있습니다.

* 데이터에 N개의 복제본이 있습니다.

* 높은 동시성의 쿼리가 모든 Frontend에 고르게 전송됩니다.

이 경우 모든 Frontend는 로컬 복제본만 사용하여 쿼리를 수행할 수 있습니다. 사용 가능한 로컬 복제본이 없을 때 비로컬 복제본으로 대체하도록 허용하려면 enable_local_replica_selection_fallback을 true로 설정하세요.

#### `enable_local_replica_selection_fallback` {#enable_local_replica_selection_fallback}

기본값：false

동적 변경 가능 여부：true

enable_local_replica_selection과 함께 사용합니다. 로컬 복제본을 사용할 수 없으면 비로컬 복제본으로 대체합니다.

#### `expr_depth_limit` {#expr_depth_limit}

기본값：3000

동적 변경 가능 여부：true

표현식 트리의 깊이를 제한합니다. 이 제한을 초과하면 데이터베이스 읽기 잠금을 유지한 상태로 분석 시간이 길어질 수 있습니다. 이 설정의 영향을 충분히 이해하지 못한다면 변경하지 마세요.

#### `expr_children_limit` {#expr_children_limit}

기본값：10000

동적 변경 가능 여부：true

표현식 트리의 자식 표현식 수를 제한합니다. 이 제한을 초과하면 데이터베이스 읽기 잠금을 유지한 상태로 분석 시간이 길어질 수 있습니다.

#### `be_exec_version` {#be_exec_version}

fragment 간에 블록을 전달할 때 사용할 직렬화 형식을 정의합니다.

코드 변경으로 블록의 데이터 형식이 바뀌는 경우가 있습니다. 롤링 업그레이드 중에도 BE 간 호환성을 유지하려면 FE가 데이터 버전을 배포하여 데이터 전송 형식을 결정해야 합니다.

예를 들어 클러스터에 BE가 2개 있고, 그중 하나는 업그레이드되어 최신 $v_1$을 지원하지만 다른 하나는 $v_0$만 지원한다고 가정해 보겠습니다. 이때 FE는 아직 업그레이드되지 않았으므로 $v_0 is issued uniformly. $와 같이 이전 버전이 일괄 배포되며, BE는 이전 데이터 형식으로 통신합니다. 모든 BE를 업그레이드한 후 FE를 업그레이드합니다. 그러면 새 FE가 $v_1$을 배포하고 클러스터 전체가 새 데이터 형식으로 전환됩니다.

기본값은 `max_be_exec_version`입니다. 특별한 요구 사항이 있으면 형식 버전을 수동으로 낮출 수 있지만, `min_be_exec_version`보다 낮아서는 안 됩니다.

이 변수의 값은 항상 모든 BE의 `BeExecVersionManager::min_be_exec_version`과 `BeExecVersionManager::max_be_exec_version` 사이로 유지해야 합니다. 즉, 업그레이드가 완료된 클러스터를 다운그레이드하려면 먼저 FE를 다운그레이드한 다음 BE를 다운그레이드하거나, 설정에서 이 변수 값을 수동으로 낮춘 다음 BE를 다운그레이드해야 합니다.

#### `max_be_exec_version` {#max_be_exec_version}

현재 지원되는 최신 데이터 버전입니다. 수정할 수 없으며, 대응하는 버전의 BE에 있는 `BeExecVersionManager::max_be_exec_version`과 일치해야 합니다.

#### `min_be_exec_version` {#min_be_exec_version}

현재 지원되는 가장 오래된 데이터 버전입니다. 수정할 수 없으며, 대응하는 버전의 BE에 있는 `BeExecVersionManager::min_be_exec_version`과 일치해야 합니다.

#### `max_query_profile_num` {#max_query_profile_num}

쿼리 profile의 최대 개수입니다.

기본값: 100

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

#### `publish_version_interval_ms` {#publish_version_interval_ms}

기본값：10 （ms）

두 버전 게시 작업 사이의 최소 간격입니다.

#### `publish_version_timeout_second` {#publish_version_timeout_second}

기본값：30 （s）

동적 변경 가능 여부：true

Master FE 전용：true

단일 트랜잭션의 모든 버전 게시 작업이 완료될 때까지 기다리는 최대 시간입니다.

#### `query_colocate_join_memory_limit_penalty_factor` {#query_colocate_join_memory_limit_penalty_factor}

기본값：1

동적 변경 가능 여부：true

Colocote join PlanFragment 인스턴스의 memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num)

#### `rewrite_count_distinct_to_bitmap_hll` {#rewrite_count_distinct_to_bitmap_hll}

기본값: true

이 변수는 세션 변수이며 세션 수준에서 적용됩니다.

* 유형: boolean
* 설명: **AGG 모델 테이블에만 적용됩니다.** 이 변수가 true이고 사용자 쿼리에 count(distinct c1)과 같은 집계 함수가 포함되어 있을 때, c1 열 자체의 유형이 bitmap이면 count distinct를 bitmap_union_count(c1)으로 재작성합니다. c1 열 자체의 유형이 hll이면 count distinct를 hll_union_agg(c1)로 재작성합니다. 이 변수가 false이면 재작성하지 않습니다.

### 데이터 적재 및 내보내기 {#load-and-export}

#### `streaming_cdc_fetch_splits_batch_size` {#streaming_cdc_fetch_splits_batch_size}

기본값: 16 (4.1.5 이전에는 100)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

Streaming CDC 요청마다 가져오는 split 수입니다. 버전 4.1.5에서는 각 요청의 크기를 줄이기 위해 기본값을 100에서 16으로 낮췄습니다.

#### `max_export_history_job_num` {#max_export_history_job_num}

기본값: 1000

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

EXPORT 작업 이력의 정리 임계값입니다. 버전 4.1.5부터 정리 시 `FINISHED` / `CANCELLED` 작업만 제거하고 실행 중인 작업은 유지하므로, 활성 작업으로 인해 전체 기록 수가 이 값을 초과할 수 있습니다.

#### `enable_pipeline_load` {#enable_pipeline_load}

기본값: true

동적 변경 가능 여부: true

Streamload와 같은 데이터 적재 작업을 수행할 때 Pipeline 엔진을 활성화할지 여부입니다.

#### `enable_vectorized_load` {#enable_vectorized_load}

기본값: true

벡터화 데이터 적재를 활성화할지 여부입니다.

#### `enable_new_load_scan_node` {#enable_new_load_scan_node}

기본값: true

파일 스캔 노드를 활성화할지 여부입니다.

#### `default_max_filter_ratio` {#default_max_filter_ratio}

기본값：0

동적 변경 가능 여부：true

Master FE 전용：true

데이터 형식 오류 등의 이유로 필터링할 수 있는 데이터의 최대 비율입니다. 기본값은 0입니다.

#### `max_running_txn_num_per_db` {#max_running_txn_num_per_db}

기본값：1000

동적 변경 가능 여부：true

Master FE 전용：true

동일한 데이터베이스에서 동시에 실행되는 데이터 적재 작업 수를 제어하는 데 주로 사용됩니다.

클러스터에서 실행 중인 데이터 적재 작업이 너무 많으면 새로 제출한 데이터 적재 작업에 다음 오류가 발생할 수 있습니다.

```text
current running txns on db xxx is xx, larger than limit xx
```

이 오류는 현재 클러스터에서 실행 중인 데이터 적재 작업 수가 설정값을 초과했음을 의미합니다. 이 경우 애플리케이션 측에서 기다린 후 데이터 적재 작업을 다시 시도하는 것이 좋습니다.

Connector를 사용하는 경우 이 매개변수 값을 적절히 조정할 수 있으며, 수천 단위로 설정해도 문제없습니다.

#### `using_old_load_usage_pattern` {#using_old_load_usage_pattern}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 INSERT 문 처리 중 오류가 발생해도 사용자에게 label을 반환합니다. 사용자는 이 label로 데이터 적재 작업 상태를 확인할 수 있습니다. 기본값은 false이며, INSERT 작업 중 오류가 발생하면 label 없이 사용자 클라이언트에 예외를 직접 반환합니다.

#### `disable_load_job` {#disable_load_job}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 다음과 같이 동작합니다.

* 대기 중인 모든 데이터 적재 작업은 트랜잭션 시작 API를 호출할 때 실패합니다.
* 준비 상태의 모든 데이터 적재 작업은 트랜잭션 커밋 API를 호출할 때 실패합니다.
* 커밋된 모든 데이터 적재 작업은 게시를 기다립니다.

#### `commit_timeout_second` {#commit_timeout_second}

기본값：30

동적 변경 가능 여부：true

Master FE 전용：true

트랜잭션이 커밋되기 전에 삽입된 모든 데이터를 기다리는 최대 시간입니다.
"commit" 명령의 시간 제한이며 단위는 초입니다.

#### `max_unfinished_load_job` {#max_unfinished_load_job}

기본값：1000

동적 변경 가능 여부：true

Master FE 전용：true

PENDING, ETL, LOADING, QUORUM_FINISHED 상태를 포함한 데이터 적재 작업의 최대 개수입니다. 이 수를 초과하면 데이터 적재 작업을 제출할 수 없습니다.

#### `db_used_data_quota_update_interval_secs` {#db_used_data_quota_update_interval_secs}

기본값：300 (s)

동적 변경 가능 여부：true

Master FE 전용：true

Master의 데몬 스레드가 `db_used_data_quota_update_interval_secs`마다 데이터베이스 트랜잭션 관리자의 데이터베이스 데이터 사용량을 갱신합니다.

데이터 적재 성능을 높이기 위해 적재 전에 데이터베이스의 데이터 사용량이 할당량을 초과했는지 확인할 때, 실제 사용량을 실시간으로 계산하지 않고 데몬 스레드가 주기적으로 갱신한 값을 가져옵니다.

이 구성은 데이터베이스 데이터 사용량 값을 갱신하는 시간 간격을 설정합니다.

#### `disable_show_stream_load` {#disable_show_stream_load}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

SHOW STREAM LOAD를 비활성화하고 메모리의 Stream Load 기록을 지울지 여부입니다.

#### `max_stream_load_record_size` {#max_stream_load_record_size}

기본값：5000

동적 변경 가능 여부：true

Master FE 전용：true

메모리에 저장할 수 있는 최근 Stream Load 기록의 기본 최대 개수입니다.

#### `fetch_stream_load_record_interval_second` {#fetch_stream_load_record_interval_second}

기본값：120

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load 기록을 가져오는 간격입니다.

#### `max_bytes_per_broker_scanner` {#max_bytes_per_broker_scanner}

기본값：`500 * 1024 * 1024 * 1024L`  （500G）

동적 변경 가능 여부：true

Master FE 전용：true

단일 Broker Load 작업에서 Broker scanner가 처리할 수 있는 최대 바이트 수입니다. 일반적으로 각 Backend에는 Broker scanner가 하나 있습니다.

#### `default_load_parallelism` {#default_load_parallelism}

기본값: 8

동적 변경 가능 여부：true

Master FE 전용：true

단일 노드에서 Broker Load 실행 계획의 기본 병렬도입니다.
사용자가 Broker Load 제출 시 병렬도를 설정하면 이 매개변수는 무시됩니다.
이 매개변수는 `max broker concurrency`, `min bytes per broker scanner` 등의 여러 구성과 함께 데이터 적재 작업의 동시성을 결정합니다.

#### `max_broker_concurrency` {#max_broker_concurrency}

기본값：10

동적 변경 가능 여부：true

Master FE 전용：true

Broker scanner의 최대 동시 실행 수입니다.

#### `min_bytes_per_broker_scanner` {#min_bytes_per_broker_scanner}

기본값：67108864L (64M)

동적 변경 가능 여부：true

Master FE 전용：true

단일 Broker scanner가 읽는 최소 바이트 수입니다.

#### `period_of_auto_resume_min` {#period_of_auto_resume_min}

기본값：5 （s）

동적 변경 가능 여부：true

Master FE 전용：true

Routine Load를 자동으로 재개하는 주기입니다.

#### `max_tolerable_backend_down_num` {#max_tolerable_backend_down_num}

기본값：0

동적 변경 가능 여부：true

Master FE 전용：true

BE가 하나라도 중단되면 Routine Load를 자동으로 재개할 수 없습니다.

#### `max_routine_load_task_num_per_be` {#max_routine_load_task_num_per_be}

기본값：5

동적 변경 가능 여부：true

Master FE 전용：true

BE당 동시에 실행할 수 있는 Routine Load 태스크의 최대 개수입니다. BE에 전송하는 Routine Load 태스크 수를 제한하며, BE의 Routine Load 태스크 스레드 풀 크기인 'routine_load_thread_pool_size'(기본값 10)보다 작아야 합니다.

#### `max_routine_load_task_concurrent_num` {#max_routine_load_task_concurrent_num}

기본값：5

동적 변경 가능 여부：true

Master FE 전용：true

단일 Routine Load 작업에서 동시에 실행할 수 있는 Routine Load 태스크의 최대 개수입니다.

#### `max_routine_load_job_num` {#max_routine_load_job_num}

기본값：100

NEED_SCHEDULED, RUNNING, PAUSE 상태를 포함한 Routine Load 작업의 최대 개수입니다.

#### `desired_max_waiting_jobs` {#desired_max_waiting_jobs}

기본값：100

동적 변경 가능 여부：true

Master FE 전용：true

Routine Load와 데이터 적재 버전 2에서 대기 중인 작업의 기본 목표 개수입니다. 목표값이므로 Master 전환과 같은 일부 상황에서는 현재 개수가 desired_max_waiting_jobs를 초과할 수 있습니다.

#### `disable_hadoop_load` {#disable_hadoop_load}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

Hadoop 클러스터를 사용하는 데이터 적재는 향후 더 이상 지원되지 않을 예정입니다. 이 유형의 데이터 적재를 비활성화하려면 true로 설정하세요.

#### `enable_spark_load` {#enable_spark_load}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

Spark Load를 일시적으로 활성화할지 여부입니다. 기본적으로 활성화되지 않습니다.

**참고:** 이 매개변수는 버전 1.2에서 삭제되었으며, spark_load는 기본적으로 활성화됩니다.

#### `spark_load_checker_interval_second` {#spark_load_checker_interval_second}

기본값：60

Spark Load 스케줄러의 실행 간격입니다. 기본값은 60초입니다.

#### `async_loading_load_task_pool_size` {#async_loading_load_task_pool_size}

기본값：10

동적 변경 가능 여부：false

Master FE 전용：true

loading_load 태스크 실행기 풀의 크기입니다. 실행 중인 loading_load 태스크의 최대 개수를 제한합니다.

현재는 Broker Load의 loading_load 태스크만 제한합니다.

#### `async_pending_load_task_pool_size` {#async_pending_load_task_pool_size}

기본값：10

동적 변경 가능 여부：false

Master FE 전용：true

pending_load 태스크 실행기 풀의 크기입니다. 실행 중인 pending_load 태스크의 최대 개수를 제한합니다.

현재는 Broker Load와 Spark Load의 pending_load 태스크만 제한합니다.

'max_running_txn_num_per_db'보다 작아야 합니다.

#### `async_load_task_pool_size` {#async_load_task_pool_size}

기본값：10

동적 변경 가능 여부：false

Master FE 전용：true

이 구성은 이전 버전과의 호환성만을 위한 항목입니다. async_loading_load_task_pool_size로 대체되었으며 향후 제거될 예정입니다.

#### `enable_single_replica_load` {#enable_single_replica_load}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load와 Broker Load에서 단일 복제본 쓰기를 활성화할지 여부입니다.

#### `min_load_timeout_second` {#min_load_timeout_second}

기본값：1 （1s）

동적 변경 가능 여부：true

Master FE 전용：true

모든 데이터 적재 유형에 적용되는 최소 Stream Load 시간 제한입니다.

#### `max_stream_load_timeout_second` {#max_stream_load_timeout_second}

기본값: 259200 (3일)

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load의 시간 제한 설정을 제한하기 위한 구성입니다. 사용자가 시간 제한을 너무 크게 설정하여 실패한 Stream Load 트랜잭션을 짧은 시간 내에 취소할 수 없는 상황을 방지합니다.

#### `max_load_timeout_second` {#max_load_timeout_second}

기본값: 259200 (3일)

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load를 제외한 모든 데이터 적재 유형에 적용되는 최대 시간 제한입니다.

#### `stream_load_default_timeout_second` {#stream_load_default_timeout_second}

기본값: 86400 * 3 (3일)

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load와 스트리밍 Mini Load의 기본 시간 제한입니다.

#### `stream_load_default_precommit_timeout_second` {#stream_load_default_precommit_timeout_second}

기본값：3600（s）

동적 변경 가능 여부：true

Master FE 전용：true

Stream Load의 기본 사전 커밋 시간 제한입니다.

#### `stream_load_default_memtable_on_sink_node` {#stream_load_default_memtable_on_sink_node}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

HTTP 헤더 `memtable_on_sink_node`가 설정되지 않은 경우
Stream Load의 sink 노드에서 memtable을 기본적으로 활성화합니다.

#### `insert_load_default_timeout_second` {#insert_load_default_timeout_second}

기본값: 3600 (1시간)

동적 변경 가능 여부：true

Master FE 전용：true

Insert Load의 기본 시간 제한입니다.

#### `mini_load_default_timeout_second` {#mini_load_default_timeout_second}

기본값: 3600 (1시간)

동적 변경 가능 여부：true

Master FE 전용：true

비스트리밍 Mini Load의 기본 시간 제한입니다.

#### `broker_load_default_timeout_second` {#broker_load_default_timeout_second}

기본값: 14400 (4시간)

동적 변경 가능 여부：true

Master FE 전용：true

Broker Load의 기본 시간 제한입니다.

#### `spark_load_default_timeout_second` {#spark_load_default_timeout_second}

기본값: 86400  (1일)

동적 변경 가능 여부：true

Master FE 전용：true

Spark Load의 기본 시간 제한입니다.

#### `hadoop_load_default_timeout_second` {#hadoop_load_default_timeout_second}

기본값: 86400 * 3   (3일)

동적 변경 가능 여부：true

Master FE 전용：true

Hadoop Load의 기본 시간 제한입니다.

#### `load_running_job_num_limit` {#load_running_job_num_limit}

기본값：0

동적 변경 가능 여부：true

Master FE 전용：true

실행 중인 데이터 적재 작업 수를 제한합니다. 기본값은 0이며, 제한 없음을 의미합니다.

#### `load_input_size_limit_gb` {#load_input_size_limit_gb}

기본값：0

동적 변경 가능 여부：true

Master FE 전용：true

데이터 적재 작업의 입력 데이터 크기를 제한합니다. 기본값은 0이며, 제한 없음을 의미합니다.

#### `load_etl_thread_num_normal_priority` {#load_etl_thread_num_normal_priority}

기본값：10

NORMAL 우선순위 ETL 데이터 적재 작업의 동시 실행 수입니다. 이 설정의 영향을 충분히 이해하지 못한다면 변경하지 마세요.

#### `load_etl_thread_num_high_priority` {#load_etl_thread_num_high_priority}

기본값：3

HIGH 우선순위 ETL 데이터 적재 작업의 동시 실행 수입니다. 이 설정의 영향을 충분히 이해하지 못한다면 변경하지 마세요.

#### `load_pending_thread_num_normal_priority` {#load_pending_thread_num_normal_priority}

기본값：10

NORMAL 우선순위의 대기 중인 데이터 적재 작업 동시 실행 수입니다. 이 설정의 영향을 충분히 이해하지 못한다면 변경하지 마세요.

#### `load_pending_thread_num_high_priority` {#load_pending_thread_num_high_priority}

기본값：3

HIGH 우선순위의 대기 중인 데이터 적재 작업 동시 실행 수입니다. 데이터 적재 작업의 우선순위는 HIGH 또는 NORMAL로 정의됩니다. 모든 미니 배치 데이터 적재 작업은 HIGH 우선순위이며, 다른 유형의 데이터 적재 작업은 NORMAL 우선순위입니다. 우선순위는 느린 데이터 적재 작업이 스레드를 오랫동안 점유하지 않도록 설정됩니다. 이는 내부적으로 최적화된 스케줄링 정책입니다. 현재 작업 우선순위를 수동으로 지정할 수 없으며, 이 설정의 영향을 충분히 이해하지 못한다면 변경하지 마세요.

#### `load_checker_interval_second` {#load_checker_interval_second}

기본값：5 （s）

데이터 적재 스케줄러의 실행 간격입니다. 데이터 적재 작업은 PENDING에서 LOADING을 거쳐 FINISHED 상태로 전환됩니다. 데이터 적재 스케줄러가 PENDING에서 LOADING으로 전환하고, 트랜잭션 콜백이 LOADING에서 FINISHED로 전환합니다. 따라서 동시 실행 수가 상한에 도달하지 않았다면 데이터 적재 작업은 최대 한 번의 실행 간격 내에 완료될 수 있습니다.

#### `s3_load_endpoint_white_list` {#s3_load_endpoint_white_list}

기본값: 비어 있음

동적 설정 가능 여부: false

S3 Load에서 사용할 수 있는 엔드포인트의 허용 목록입니다. 여러 값은 쉼표로 구분합니다. 예를 들면 `s3_load_endpoint_white_list=a,b,c`입니다. 빈 값은 허용 목록이 설정되지 않았음을 의미합니다.

:::caution 동작 변경 (4.1.4)

보안상의 이유로 버전 4.1.4부터 이 구성 항목은 **더 이상 동적으로 수정할 수 없습니다**. `fe.conf`에서만 설정할 수 있으며 FE를 다시 시작한 후 적용됩니다. `ADMIN SET FRONTEND CONFIG`로는 더 이상 변경할 수 없습니다.

:::

#### `resource_group_load_success_quorum` {#resource_group_load_success_quorum}

기본값: 비어 있음

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.4에서 추가되었습니다. 데이터 적재 트랜잭션을 커밋할 때 각 리소스 그룹(즉, BE의 Location Tag)에서 **쓰기 성공이 필요한 최소 복제본 수**를 설정합니다.

값은 쉼표로 구분된 목록이며, 각 항목의 형식은 `<resource_group>:<min_success_replicas>`입니다. 여기서 `<min_success_replicas>`는 음이 아닌 정수입니다. 예:

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

트랜잭션을 커밋할 때 설정된 리소스 그룹에서 쓰기에 성공한 복제본 수가 설정값보다 작으면 커밋이 실패합니다. 구성에 나열되지 않은 리소스 그룹은 확인하지 않습니다. 형식이 잘못된 항목은 무시하고 `fe.log`에 경고를 출력합니다.

여러 데이터 센터 또는 여러 가용 영역에 걸친 배포에서 이 구성을 사용하면 지정한 데이터 센터에 정해진 수의 복제본을 쓴 후에만 데이터 적재를 성공으로 간주하도록 할 수 있습니다.

#### `enable_adaptive_random_bucket_load` {#enable_adaptive_random_bucket_load}

기본값: true

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.4에서 추가되었습니다. 적응형 랜덤 버킷 데이터 적재를 활성화할지 여부입니다.

활성화하면 FE가 tablet 위치 정보를 BE로 보내고, 각 BE는 이 정보를 사용하여 자신이 기본 복제본을 보유한 로컬 버킷 집합을 파악합니다. 단일 tablet에 쓴 데이터양이 임계값(기본값 200 MB)을 초과하면 로컬 버킷을 순환하며 씁니다. 이를 통해 데이터 적재 시 메모리 부담을 줄이고 랜덤 버킷 테이블(`DISTRIBUTED BY RANDOM`)의 적재 처리량을 높입니다. 모든 데이터 적재 방식에 동일하게 적용됩니다.

이 기능은 BE 구성인 `enable_table_memtable_flush_backpressure`와 `table_memtable_flush_pending_count_limit`의 제약도 받습니다. [BE 구성](./be-config)을 참조하세요.

#### `enable_forward_group_commit_stream_load_to_follower` {#enable_forward_group_commit_stream_load_to_follower}

기본값: false

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.4에서 추가되었습니다. Group Commit을 사용하는 Stream Load 요청을 Follower FE로 전달할지 여부입니다.

활성화하면 Group Commit 모드의 Stream Load 요청을 라운드 로빈 방식으로 Follower FE에 전달하여 배치 처리 부담을 여러 FE에 분산합니다.

대상 테이블의 `light_schema_change` 속성이 `false`이면 전달을 지원하지 않으며, 해당 요청은 오류와 함께 실패합니다.

#### `streaming_job_snapshot_offset_persist_interval_sec` {#streaming_job_snapshot_offset_persist_interval_sec}

기본값: 300 (s)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.4에서 추가되었습니다. Streaming Job(연속 데이터 적재 작업)의 전체 스냅샷 단계에서 오프셋을 영구 저장하는 최소 간격입니다. 단위는 초입니다. 값을 줄이면 작업 재시작 후 재생해야 하는 데이터양이 줄어들지만 메타데이터 쓰기 빈도가 높아집니다.

#### `label_keep_max_second` {#label_keep_max_second}

기본값：`3 * 24 * 3600`  (3일)

동적 변경 가능 여부：true

Master FE 전용：true

완료되거나 취소된 데이터 적재 작업의 label은 `label_keep_max_second`가 지나면 제거됩니다.

1. 제거된 label은 다시 사용할 수 있습니다.
2. 보관 시간을 짧게 설정하면 FE 메모리 사용량을 줄일 수 있습니다. 모든 데이터 적재 작업 정보는 제거되기 전까지 메모리에 보관되기 때문입니다.

동시 쓰기가 많은 환경에서 작업이 대량으로 밀리고 Frontend 서비스 호출이 실패하면 로그를 확인하세요. 메타데이터 쓰기의 잠금 대기 시간이 너무 길다면 이 값을 12시간 또는 6시간 이하로 조정할 수 있습니다.

#### `streaming_label_keep_max_second` {#streaming_label_keep_max_second}

기본값: 43200 (12시간)

동적 변경 가능 여부：true

Master FE 전용：true

INSERT, STREAMING LOAD, ROUTINE_LOAD_TASK와 같이 빈도가 높은 일부 데이터 적재 작업에 적용됩니다. 보관 기간이 만료되면 완료된 작업 또는 태스크를 삭제합니다.

#### `label_clean_interval_second` {#label_clean_interval_second}

기본값：1 * 3600  (1시간)

데이터 적재 label 정리기가 *label_clean_interval_second*마다 실행되어 오래된 작업을 정리합니다.

#### `label_regex_length` {#label_regex_length}

기본값: 128 (문자)

데이터 적재 label의 최대 문자 길이입니다. 기본값은 128자입니다.

#### `transaction_clean_interval_second` {#transaction_clean_interval_second}

기본값：30

트랜잭션이 visible 또는 aborted 상태가 되면 transaction_clean_interval_second초 후 정리됩니다. 이 간격은 가능한 한 짧게 하고 각 정리 주기도 최대한 빠르게 완료해야 합니다.

#### `sync_commit_interval_second` {#sync_commit_interval_second}

트랜잭션 커밋의 최대 시간 간격입니다. 이 시간이 지난 후에도 채널에 아직 제출하지 않은 데이터가 있으면 consumer가 채널에 트랜잭션 커밋을 요청합니다.

기본값: 10 (초)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `sync_checker_interval_second` {#sync_checker_interval_second}

데이터 동기화 작업의 실행 상태를 확인하는 간격입니다.

기본값: 10 (s)

#### `max_sync_task_threads_num` {#max_sync_task_threads_num}

데이터 동기화 작업 스레드 풀의 최대 스레드 수입니다.

기본값：10

#### `min_sync_commit_size` {#min_sync_commit_size}

트랜잭션을 커밋하는 데 필요한 최소 이벤트 수입니다. FE가 받은 이벤트 수가 이 값보다 작으면 `sync_commit_interval_second`가 지날 때까지 다음 데이터 배치를 기다립니다. 기본값은 10000개 이벤트입니다. 이 구성을 수정하려면 Canal 측의 `canal.instance.memory.buffer.size` 설정(기본값 16384)보다 작은지 확인하세요. 그렇지 않으면 FE가 ack 전에 저장소 큐 길이보다 많은 이벤트를 가져오려고 하여 저장소 큐가 시간 초과까지 차단됩니다.

기본값: 10000

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `min_bytes_sync_commit` {#min_bytes_sync_commit}

트랜잭션을 커밋하는 데 필요한 최소 데이터 크기입니다. FE가 받은 데이터 크기가 이 값보다 작으면 `sync_commit_interval_second`가 지날 때까지 다음 데이터 배치를 기다립니다. 기본값은 15MB입니다. 이 구성을 수정하려면 Canal 측의 `canal.instance.memory.buffer.size`와 `canal.instance.memory.buffer.memunit`의 곱(기본값 16MB)보다 작은지 확인하세요. 그렇지 않으면 FE가 ack 전에 저장 공간보다 큰 데이터를 가져오려고 하여 저장소 큐가 시간 초과까지 차단됩니다.

기본값: `15*1024*1024` (15M)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `max_bytes_sync_commit` {#max_bytes_sync_commit}

데이터 동기화 작업 스레드 풀의 최대 스레드 수입니다. FE 전체에 스레드 풀이 하나 있으며, FE에서 BE로 데이터를 보내는 모든 데이터 동기화 태스크를 처리합니다. 스레드 풀 구현은 `SyncTaskPool` 클래스에 있습니다.

기본값: 10

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `enable_outfile_to_local` {#enable_outfile_to_local}

기본값：false

outfile 기능으로 결과를 로컬 디스크에 내보내도록 허용할지 여부입니다.

#### `export_tablet_num_per_task` {#export_tablet_num_per_task}

기본값：5

동적 변경 가능 여부：true

Master FE 전용：true

내보내기 쿼리 계획당 tablet 수입니다.

#### `export_task_default_timeout_second` {#export_task_default_timeout_second}

기본값: 2 * 3600   (2시간)

동적 변경 가능 여부：true

Master FE 전용：true

내보내기 작업의 기본 시간 제한입니다.

#### `export_running_job_num_limit` {#export_running_job_num_limit}

기본값：5

동적 변경 가능 여부：true

Master FE 전용：true

실행 중인 내보내기 작업의 동시 실행 수를 제한합니다. 기본값은 5이며, 0은 제한 없음을 의미합니다.

#### `export_checker_interval_second` {#export_checker_interval_second}

기본값：5

내보내기 검사기의 실행 간격입니다.

#### `enable_stream_load_profile` {#enable_stream_load_profile}

기본값: false

Master FE 전용: false

Stream Load profile을 활성화할지 여부입니다.

### 로그 {#log}

#### `log_roll_size_mb` {#log_roll_size_mb}

기본값：1024  （1G）

단일 시스템 로그 및 감사 로그의 최대 크기입니다.

#### `sys_log_dir` {#sys_log_dir}

기본값: DorisFE.DORIS_HOME_DIR + "/log"

FE 로그 디렉터리를 지정합니다. FE는 다음 두 로그 파일을 생성합니다.

fe.log:      FE 프로세스의 모든 로그입니다.
fe.warn.log  FE 프로세스의 모든 WARNING 및 ERROR 로그입니다.

#### `sys_log_level` {#sys_log_level}

기본값：INFO

로그 수준: INFO, WARN, ERROR, FATAL

#### `sys_log_roll_num` {#sys_log_roll_num}

기본값：10

sys_log_roll_interval 내에 보관할 FE 로그 파일의 최대 개수입니다. 기본값은 10이며, 하루에 최대 10개의 로그 파일을 보관한다는 의미입니다.

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

기본값：{}

상세 로그를 출력할 모듈입니다. VERBOSE 수준은 log4j의 DEBUG 수준으로 구현됩니다.

예:
   sys_log_verbose_modules = org.apache.doris.catalog
   이 설정은 org.apache.doris.catalog 패키지와 모든 하위 패키지에 있는 파일의 디버그 로그만 출력합니다.

#### `sys_log_roll_interval` {#sys_log_roll_interval}

기본값：DAY

sys_log_roll_interval:

* DAY:  로그 접미사는 yyyyMMdd입니다.
* HOUR: 로그 접미사는 yyyyMMddHH입니다.

#### `sys_log_delete_age` {#sys_log_delete_age}

기본값：7d

기본값은 7일입니다. 로그의 마지막 수정 시각이 7일 전이면 삭제합니다.

지원 형식:

* 7d      7일
* 10h     10시간
* 60m     60분
* 120s    120초

#### `sys_log_roll_mode` {#sys_log_roll_mode}

기본값：SIZE-MB-1024

로그 파일을 분할하는 크기입니다. 1 G마다 로그 파일을 분할합니다.

#### `sys_log_enable_compress` {#sys_log_enable_compress}

기본값: false

true이면 fe.log와 fe.warn.log를 gzip으로 압축합니다.

#### `audit_log_dir` {#audit_log_dir}

기본값：DORIS_HOME_DIR + "/log"

audit_log_dir:
FE 감사 로그 디렉터리를 지정합니다.
감사 로그 fe.audit.log에는 사용자, 호스트, 소요 시간, 상태 등의 관련 정보와 함께 모든 요청이 기록됩니다.

#### `audit_log_roll_num` {#audit_log_roll_num}

기본값：90

audit_log_roll_interval 내에 보관할 FE 감사 로그 파일의 최대 개수입니다.

#### `audit_log_modules` {#audit_log_modules}

기본값：{"slow_query", "query", "load", "stream_load"}

Slow query에는 소요 시간이 *qe_slow_log_ms*를 초과하는 모든 쿼리가 포함됩니다.

#### `qe_slow_log_ms` {#qe_slow_log_ms}

기본값: 5000 (5초)

쿼리 응답 시간이 이 임계값을 초과하면 감사 로그에 slow_query로 기록됩니다.

#### `audit_log_roll_interval` {#audit_log_roll_interval}

기본값：DAY

DAY:  로그 접미사는 yyyyMMdd입니다.
HOUR: 로그 접미사는 yyyyMMddHH입니다.

#### `audit_log_delete_age` {#audit_log_delete_age}

기본값：30d

기본값은 30일입니다. 로그의 마지막 수정 시각이 30일 전이면 삭제합니다.

지원 형식:
* 7d      7일
* 10h     10시간
* 60m     60분
* 120s    120초

#### `audit_log_enable_compress` {#audit_log_enable_compress}

기본값: false

true이면 fe.audit.log를 gzip으로 압축합니다.

### 스토리지 {#storage}

#### `inverted_index_storage_format` {#inverted_index_storage_format}

기본값: `V3`

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

새 역색인의 기본 저장 형식입니다. 버전 4.1.5부터 V1 역색인 생성과 이 구성을 `V1`으로 동적 설정하는 것이 금지됩니다. `fe.conf` 또는 `fe_custom.conf`의 유효 값이 `V1`이면 FE가 시작되지 않습니다. 업그레이드 전에 `V2` 또는 `V3`으로 변경하세요. 기존 V1 테이블은 계속 읽을 수 있지만 역색인을 추가할 수 없습니다. 새 색인이 필요하면 V2 또는 V3 형식으로 테이블을 다시 생성하세요.

#### `min_replication_num_per_tablet` {#min_replication_num_per_tablet}

기본값: 1

tablet당 최소 복제본 수를 설정합니다.

#### `max_replication_num_per_tablet` {#max_replication_num_per_tablet}

기본값: 32767

tablet당 최대 복제본 수를 설정합니다.

#### `default_db_data_quota_bytes` {#default_db_data_quota_bytes}

기본값：8192PB

동적 변경 가능 여부：true

Master FE 전용：true

데이터베이스의 기본 데이터 할당량을 설정합니다. 개별 데이터베이스의 할당량은 다음과 같이 설정할 수 있습니다.

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `default_db_replica_quota_size` {#default_db_replica_quota_size}

기본값: 1073741824

동적 변경 가능 여부：true

Master FE 전용：true

데이터베이스의 기본 복제본 할당량을 설정합니다. 개별 데이터베이스의 할당량은 다음과 같이 설정할 수 있습니다.

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `recover_with_empty_tablet` {#recover_with_empty_tablet}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

코드 버그나 사용자 조작 실수 등 매우 특수한 상황에서 일부 tablet의 모든 복제본이 손실될 수 있습니다. 이 경우 데이터는 사실상 손실된 상태입니다. 그러나 일부 시나리오에서는 데이터가 손실되더라도 쿼리 오류를 방지하여 사용자에게 미치는 영향을 줄여야 할 수 있습니다. 이때 빈 tablet으로 누락된 복제본을 채워 쿼리가 정상적으로 실행되도록 할 수 있습니다.

true로 설정하면 모든 복제본이 손상되거나 누락된 tablet을 Doris가 자동으로 빈 복제본으로 채웁니다.

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec` {#min_clone_task_timeout_sec-and-max_clone_task_timeout_sec}

기본값: 최소 3분, 최대 두 시간

동적 변경 가능 여부：true

Master FE 전용：true

`mix_clone_task_timeout_sec`와 함께 clone 작업의 최대 및 최소 시간 제한을 제어할 수 있습니다. 일반적으로 clone 작업의 시간 제한은 데이터양과 최소 전송 속도(5MB/s)를 기준으로 추정합니다. 특수한 상황에서는 이 두 구성을 사용하여 clone 작업 시간 제한의 상한과 하한을 설정함으로써 작업이 성공적으로 완료되도록 할 수 있습니다.

#### `disable_storage_medium_check` {#disable_storage_medium_check}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

disable_storage_medium_check가 true이면 ReportHandler가 tablet의 저장 매체를 확인하지 않고 스토리지 cooldown 기능을 비활성화합니다. 기본값은 false입니다. tablet의 저장 매체가 중요하지 않다면 true로 설정할 수 있습니다.

#### `decommission_tablet_check_threshold` {#decommission_tablet_check_threshold}

기본값：5000

동적 변경 가능 여부：true

Master FE 전용：true

Master FE가 decommission된 BE의 tablet 상태를 확인할지 제어합니다. decommission된 BE의 tablet 수가 이 임계값보다 작으면 FE가 주기적으로 확인합니다. 해당 BE의 모든 tablet이 회수되면 FE가 즉시 BE를 제거합니다.

성능을 고려하여 이 구성 값을 너무 높게 설정하지 마세요.

#### `partition_rebalance_max_moves_num_per_selection` {#partition_rebalance_max_moves_num_per_selection}

기본값：10

동적 변경 가능 여부：true

Master FE 전용：true

PartitionRebalancer를 사용할 때만 유효합니다.

#### `partition_rebalance_move_expire_after_access` {#partition_rebalance_move_expire_after_access}

기본값：600   (s)

동적 변경 가능 여부：true

Master FE 전용：true

PartitionRebalancer를 사용할 때만 유효합니다. 값을 변경하면 캐시된 이동 작업이 지워집니다.

#### `tablet_rebalancer_type` {#tablet_rebalancer_type}

기본값：BeLoad

Master FE 전용：true

Rebalancer 유형입니다. 대소문자를 구분하지 않으며 BeLoad, Partition을 지원합니다. 유형을 파싱하지 못하면 기본값인 BeLoad를 사용합니다.

#### `max_balancing_tablets` {#max_balancing_tablets}

기본값：100

동적 변경 가능 여부：true

Master FE 전용：true

TabletScheduler에서 균형 조정 중인 tablet 수가 max_balancing_tablets를 초과하면 더 이상 균형 확인을 수행하지 않습니다.

#### `max_scheduling_tablets` {#max_scheduling_tablets}

기본값：2000

동적 변경 가능 여부：true

Master FE 전용：true

TabletScheduler에서 스케줄링된 tablet 수가 max_scheduling_tablets를 초과하면 확인을 건너뜁니다.

#### `disable_balance` {#disable_balance}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 TabletScheduler가 균형 조정을 수행하지 않습니다.

#### `disable_disk_balance` {#disable_disk_balance}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 TabletScheduler가 디스크 균형 조정을 수행하지 않습니다.

#### `balance_load_score_threshold` {#balance_load_score_threshold}

기본값: 0.1 (10%)

동적 변경 가능 여부：true

Master FE 전용：true

클러스터 부하 균형 점수의 임계값입니다. Backend의 부하 점수가 평균 점수보다 10% 낮으면 LOW 부하로 표시하고, 평균보다 10% 높으면 HIGH 부하로 표시합니다.

#### `capacity_used_percent_high_water` {#capacity_used_percent_high_water}

기본값: 0.75  (75%)

동적 변경 가능 여부：true

Master FE 전용：true

디스크 용량 사용률의 상한 기준입니다. Backend의 부하 점수를 계산하는 데 사용됩니다.

#### `clone_distribution_balance_threshold` {#clone_distribution_balance_threshold}

기본값: 0.2

동적 변경 가능 여부：true

Master FE 전용：true

Backend 간 복제본 수의 균형 임계값입니다.

#### `clone_capacity_balance_threshold` {#clone_capacity_balance_threshold}

기본값: 0.2

동적 변경 가능 여부：true

Master FE 전용：true

* BE 간 데이터 크기의 균형 임계값입니다.

   균형 조정 알고리즘은 다음과 같습니다.

     1. 전체 클러스터의 평균 사용 용량(AUC)을 계산합니다. 전체 데이터 크기를 전체 Backend 수로 나눈 값입니다.

     2. 상한 기준은 (AUC * (1 + clone_capacity_balance_threshold))입니다.

     3. 하한 기준은 (AUC * (1 - clone_capacity_balance_threshold))입니다.

     4. Clone 검사기는 상한 기준에 있는 BE에서 하한 기준에 있는 BE로 복제본을 이동하려고 시도합니다.

#### `disable_colocate_balance` {#disable_colocate_balance}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 colocate 테이블의 자동 재배치 및 균형 조정을 비활성화할 수 있습니다. 'disable_colocate_balance'가 true이면 ColocateTableBalancer가 colocate 테이블의 재배치와 균형 조정을 수행하지 않습니다.

**주의**:

1. 일반적인 상황에서는 균형 조정을 비활성화할 필요가 없습니다.
2. 균형 조정을 비활성화하면 불안정한 colocate 테이블이 복구되지 않을 수 있습니다.
3. 결과적으로 쿼리 시 colocate 계획을 사용할 수 없게 됩니다.

#### `balance_slot_num_per_path` {#balance_slot_num_per_path}

기본값: 1

동적 변경 가능 여부：true

Master FE 전용：true

균형 조정 중 경로당 기본 슬롯 수입니다.

#### `disable_tablet_scheduler` {#disable_tablet_scheduler}

기본값:false

동적 변경 가능 여부：true

Master FE 전용：true

true로 설정하면 tablet 스케줄러가 동작하지 않으므로 모든 tablet 복구 및 균형 조정 작업이 중지됩니다.

#### `enable_force_drop_redundant_replica` {#enable_force_drop_redundant_replica}

기본값: false

동적 설정 가능 여부: true

Master FE 전용: true

true로 설정하면 tablet 스케줄링 로직에서 중복 복제본을 즉시 제거합니다. 해당 복제본에 쓰는 일부 데이터 적재 작업이 실패할 수 있지만 tablet 균형 조정과 복구 속도가 빨라집니다.
클러스터에 균형 조정이나 복구를 기다리는 복제본이 많이 있다면 일부 데이터 적재 성공률을 희생하는 대신 이 구성을 활성화하여 복제본 균형 조정과 복구를 가속할 수 있습니다.

#### `colocate_group_relocate_delay_second` {#colocate_group_relocate_delay_second}

기본값: 1800

동적 설정 가능 여부: true

Master FE 전용: true

colocate 그룹을 재배치하면 클러스터 내에서 많은 tablet이 이동할 수 있습니다. 따라서 재배치가 가능한 한 발생하지 않도록 신중한 전략을 사용해야 합니다.
재배치는 일반적으로 BE 노드가 오프라인 상태가 되거나 중단된 후 발생합니다. 이 매개변수는 BE 노드를 사용할 수 없다고 판단하는 시점을 지연합니다. 기본값은 30분입니다. 즉, BE 노드가 30분 이내에 복구되면 colocate 그룹의 재배치를 트리거하지 않습니다.

#### `allow_replica_on_same_host` {#allow_replica_on_same_host}

기본값: false

동적 설정 가능 여부: false

Master FE 전용: false

동일한 tablet의 여러 복제본을 같은 호스트에 배치하도록 허용할지 여부입니다. 이 매개변수는 주로 로컬 테스트에서 여러 BE를 구성하여 다중 복제본 상황을 테스트하기 쉽게 하는 데 사용합니다. 테스트 외의 환경에서는 사용하지 마세요.

#### `repair_slow_replica` {#repair_slow_replica}

기본값: false

동적 변경 가능 여부：true

Master FE 전용: true

true로 설정하면 compaction이 느린 복제본을 자동으로 감지하여 다른 머신으로 마이그레이션합니다. 감지 조건은 가장 빠른 복제본의 버전 수가 `min_version_count_indicate_replica_compaction_too_slow` 값을 초과하고, 가장 빠른 복제본과의 버전 수 차이 비율이 `valid_version_count_delta_ratio_between_replicas` 값을 초과하는 경우입니다.

#### `min_version_count_indicate_replica_compaction_too_slow` {#min_version_count_indicate_replica_compaction_too_slow}

기본값: 200

동적 설정 가능 여부: true

Master FE 전용: false

복제본 compaction이 너무 느린지 판단하는 데 사용하는 버전 수 임계값입니다.

#### `skip_compaction_slower_replica` {#skip_compaction_slower_replica}

기본값: true

동적 설정 가능 여부: true

Master FE 전용: false

true로 설정하면 쿼리 가능한 복제본을 선택할 때 compaction이 느린 복제본을 건너뜁니다.

#### `valid_version_count_delta_ratio_between_replicas` {#valid_version_count_delta_ratio_between_replicas}

기본값: 0.5

동적 설정 가능 여부: true

Master FE 전용: true

가장 느린 복제본과 가장 빠른 복제본 사이의 버전 수 차이에 대한 유효 비율 임계값입니다. `repair_slow_replica`가 true이면 가장 느린 복제본을 복구할지 판단하는 데 사용됩니다.

#### `min_bytes_indicate_replica_too_large` {#min_bytes_indicate_replica_too_large}

기본값: `2 * 1024 * 1024 * 1024` (2G)

동적 설정 가능 여부: true

Master FE 전용: true

복제본이 너무 큰지 판단하는 데 사용하는 데이터 크기 임계값입니다.

#### `schedule_slot_num_per_hdd_path` {#schedule_slot_num_per_hdd_path}

기본값：4

tablet 스케줄러에서 HDD 경로당 기본 슬롯 수입니다. 이 구성은 제거하고 clone 작업 통계에 따라 동적으로 조정할 예정입니다.

#### `schedule_slot_num_per_ssd_path` {#schedule_slot_num_per_ssd_path}

기본값：8

tablet 스케줄러에서 SSD 경로당 기본 슬롯 수입니다. 이 구성은 제거하고 clone 작업 통계에 따라 동적으로 조정할 예정입니다.

#### `tablet_repair_delay_factor_second` {#tablet_repair_delay_factor_second}

기본값：60 （s）

동적 변경 가능 여부：true

Master FE 전용：true

tablet 복구를 결정하기 전 지연 시간의 계수입니다.

* 우선순위가 VERY_HIGH이면 즉시 복구합니다.
* HIGH: tablet_repair_delay_factor_second * 1만큼 지연합니다.
* NORMAL: tablet_repair_delay_factor_second * 2만큼 지연합니다.
* LOW: tablet_repair_delay_factor_second * 3만큼 지연합니다.

#### `tablet_stat_update_interval_second` {#tablet_stat_update_interval_second}

기본값：300（5분）

tablet 통계 갱신 간격입니다.
모든 Frontend는 이 간격마다 모든 Backend에서 tablet 통계를 가져옵니다.

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

기본값：95 （95%）

동적 변경 가능 여부：true

Master FE 전용：true

##### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

기본값：`1 * 1024 * 1024 * 1024` (1GB)

동적 변경 가능 여부：true

Master FE 전용：true

디스크 용량이 'storage_flood_stage_usage_percent'와 'storage_flood_stage_left_capacity_bytes' 기준에 모두 도달하면 다음 작업이 거부됩니다.

1. 데이터 적재 작업
2. 복원 작업

#### `storage_high_watermark_usage_percent` {#storage_high_watermark_usage_percent}

기본값：85  (85%)

동적 변경 가능 여부：true

Master FE 전용：true

#### `storage_min_left_capacity_bytes` {#storage_min_left_capacity_bytes}

기본값： `2 * 1024 * 1024 * 1024`  (2GB)

동적 변경 가능 여부：true

Master FE 전용：true

'storage_high_watermark_usage_percent'는 Backend 스토리지 경로의 최대 용량 사용률을 제한합니다. 'storage_min_left_capacity_bytes'는 Backend 스토리지 경로의 최소 남은 용량을 제한합니다. 두 제한에 모두 도달하면 해당 스토리지 경로를 tablet 균형 조정의 대상으로 선택할 수 없습니다. 다만 tablet 복구 시에는 데이터 무결성을 최대한 유지하기 위해 이 제한을 초과할 수 있습니다.

#### `catalog_trash_expire_second` {#catalog_trash_expire_second}

기본값: 86400L (1일)

동적 변경 가능 여부：true

Master FE 전용：true

데이터베이스(테이블/파티션)를 삭제한 후 RECOVER 문으로 복구할 수 있습니다. 이 항목은 최대 데이터 보관 시간을 지정합니다. 이 시간이 지나면 데이터가 영구 삭제됩니다.

#### `default_storage_medium` {#default_storage_medium}

기본값：HDD

테이블 또는 파티션을 생성할 때 저장 매체(HDD 또는 SSD)를 지정할 수 있습니다. 지정하지 않으면 이 항목이 생성 시 사용할 기본 저장 매체를 결정합니다.

#### `default_compression_type` {#default_compression_type}

기본값: LZ4F (4.0.3 이전), ZSTD (4.0.3부터)

테이블을 생성할 때 압축 알고리즘을 지정할 수 있습니다. 지정하지 않으면 이 항목이 테이블 생성 시 사용할 기본 압축 유형을 결정합니다. 유효한 값은 LZ4, LZ4F, LZ4HC, ZLIB, ZSTD, SNAPPY, NONE이며 대소문자를 구분하지 않습니다.

#### `enable_storage_policy` {#enable_storage_policy}

* Storage Policy 기능을 활성화할지 여부입니다. 이 구성으로 핫 데이터와 콜드 데이터를 분리할 수 있습니다.
기본값: false

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `check_consistency_default_timeout_second` {#check_consistency_default_timeout_second}

기본값: 600 (10분)

동적 변경 가능 여부：true

Master FE 전용：true

단일 일관성 확인 작업의 기본 시간 제한입니다. tablet 크기에 맞게 충분히 길게 설정하세요.

#### `consistency_check_start_time` {#consistency_check_start_time}

기본값：23

동적 변경 가능 여부：true

Master FE 전용：true

일관성 확인 시작 시각입니다.

일관성 검사기는 *consistency_check_start_time*부터 *consistency_check_end_time*까지 실행됩니다.

두 시각이 같으면 일관성 확인이 실행되지 않습니다.

#### `consistency_check_end_time` {#consistency_check_end_time}

기본값：23

동적 변경 가능 여부：true

Master FE 전용：true

일관성 확인 종료 시각입니다.

일관성 검사기는 *consistency_check_start_time*부터 *consistency_check_end_time*까지 실행됩니다.

두 시각이 같으면 일관성 확인이 실행되지 않습니다.

#### `replica_delay_recovery_second` {#replica_delay_recovery_second}

기본값：0

동적 변경 가능 여부：true

Master FE 전용：true

복제본에 장애가 발생한 후 FE가 clone을 사용하여 복구를 시도하기까지의 최소 지연 시간입니다. 단위는 초입니다.

#### `tablet_create_timeout_second` {#tablet_create_timeout_second}

기본값：1（s）

동적 변경 가능 여부：true

Master FE 전용：true

단일 복제본을 생성할 때 기다리는 최대 시간입니다.

예:
   tablet이 #m개이고 각 tablet에 복제본이 #n개인 테이블을 생성하면,
   테이블 생성 요청은 최대 (m *n* tablet_create_timeout_second) 동안 실행된 후 시간 초과됩니다.

#### `tablet_delete_timeout_second` {#tablet_delete_timeout_second}

기본값：2

동적 변경 가능 여부：true

Master FE 전용：true

*tablet_create_timeout_second*와 의미는 같지만 tablet을 삭제할 때 사용합니다.

#### `delete_job_max_timeout_second` {#delete_job_max_timeout_second}

기본값: 300(s)

동적 변경 가능 여부: true

Master FE 전용: true

삭제 작업의 최대 시간 제한입니다. 단위는 초입니다.

#### `alter_table_timeout_second` {#alter_table_timeout_second}

기본값: 86400 * 30 (1개월)

동적 변경 가능 여부：true

Master FE 전용：true

ALTER TABLE 요청의 최대 시간 제한입니다. 테이블 데이터 크기에 맞게 충분히 길게 설정하세요.

#### `max_replica_count_when_schema_change` {#max_replica_count_when_schema_change}

OlapTable에서 스키마를 변경할 때 허용되는 최대 복제본 수입니다. 복제본이 너무 많으면 FE OOM이 발생할 수 있습니다.

기본값: 100000

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `history_job_keep_max_second` {#history_job_keep_max_second}

기본값：`7 * 24 * 3600` （7일）

동적 변경 가능 여부：true

Master FE 전용：true

스키마 변경 작업과 Rollup 작업 등 일부 작업의 최대 보관 시간입니다.

#### `max_create_table_timeout_second` {#max_create_table_timeout_second}

기본값：60 （s）

동적 변경 가능 여부：true

Master FE 전용：true

테이블 또는 색인 생성 시 너무 오래 기다리지 않도록 최대 시간 제한을 설정합니다.

#### `autobucket_min_buckets` {#autobucket_min_buckets}

기본값: 3 (4.0.8 / 4.1.4 이전에는 1)

동적 변경 가능 여부: true

Master FE 전용: true

자동 버킷팅 전략(`DISTRIBUTED BY ... BUCKETS AUTO`)에서 생성하는 최소 버킷 수입니다.

**Doris 4.0 계열의 버전 4.0.8과 4.1 계열의 버전 4.1.4부터 기본값이 `1`에서 `3`으로 변경되었습니다.** 이전 기본값에서는 작은 파티션이 단일 버킷으로 생성되어 병렬성과 데이터 분산이 충분하지 않았습니다. 변경 후에는 자동 버킷팅으로 생성되는 버킷 수가 3개 미만이 되지 않습니다. 이 변경은 새로 생성되는 파티션에만 영향을 주며, 기존 파티션의 버킷 수는 바뀌지 않습니다.

#### `autobucket_max_buckets` {#autobucket_max_buckets}

기본값: 128

동적 변경 가능 여부: true

Master FE 전용: true

자동 버킷팅 전략에서 생성하는 최대 버킷 수입니다. 계산 결과가 이 값보다 크면 이 값으로 제한됩니다.

### 외부 테이블 {#external-table}

#### `jdbc_driver_url_white_list` {#jdbc_driver_url_white_list}

기본값: 비어 있음

동적 설정 가능 여부: false

JDBC Catalog 생성 시 허용되는 `driver_url` 값의 허용 목록입니다. 여러 값은 쉼표로 구분합니다. 예를 들면 `jdbc_driver_url_white_list=a,b,c`입니다. 빈 값은 허용 목록이 설정되지 않았음을 의미합니다.

:::caution 동작 변경 (4.1.4)

보안상의 이유로 버전 4.1.4부터 이 구성 항목은 **더 이상 동적으로 수정할 수 없습니다**. `fe.conf`에서만 설정할 수 있으며 FE를 다시 시작한 후 적용됩니다. `ADMIN SET FRONTEND CONFIG`로는 더 이상 변경할 수 없습니다.

:::

#### `force_sqlserver_jdbc_encrypt_false` {#force_sqlserver_jdbc_encrypt_false}

기본값: false

동적 설정 가능 여부: false

SQLServer JDBC Catalog의 `encrypt` 매개변수를 `false`로 강제할지 여부입니다.

:::caution 동작 변경 (4.1.4)

이 구성은 SQLServer JDBC의 전송 암호화를 끄므로 보안에 민감한 스위치입니다. 버전 4.1.4부터 **더 이상 동적으로 수정할 수 없습니다**. `fe.conf`에서만 설정할 수 있으며 FE를 다시 시작한 후 적용됩니다.

:::

#### `file_scan_node_split_num` {#file_scan_node_split_num}

기본값：128

동적 변경 가능 여부：true

Master FE 전용：false

멀티 Catalog의 동시 파일 스캔 스레드 수입니다.

#### `file_scan_node_split_size` {#file_scan_node_split_size}

기본값：`256 * 1024 * 1024`

동적 변경 가능 여부：true

Master FE 전용：false

멀티 Catalog의 동시 파일 스캔 크기입니다.

#### `enable_odbc_mysql_broker_table` {#enable_odbc_mysql_broker_table}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：false

버전 2.1부터 ODBC, JDBC 및 Broker 외부 테이블 생성을 더 이상 지원하지 않습니다. ODBC 및 MySQL 외부 테이블 대신 JDBC 테이블 또는 JDBC Catalog를 사용하세요. Broker 테이블 대신 테이블 반환 함수를 사용하세요.

#### `max_hive_partition_cache_num` {#max_hive_partition_cache_num}

Hive 파티션 캐시의 최대 개수입니다.

기본값: 100000

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `hive_metastore_client_timeout_second` {#hive_metastore_client_timeout_second}

Hive Metastore의 기본 연결 시간 제한입니다.

기본값: 10

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

#### `max_external_cache_loader_thread_pool_size` {#max_external_cache_loader_thread_pool_size}

외부 메타데이터 캐시를 로드하는 스레드 풀의 최대 크기입니다.

기본값: 10

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `max_external_file_cache_num` {#max_external_file_cache_num}

외부 테이블에 사용할 파일 캐시의 최대 개수입니다.

기본값: 100000

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `max_external_schema_cache_num` {#max_external_schema_cache_num}

외부 테이블에 사용할 스키마 캐시의 최대 개수입니다.

기본값: 10000

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `external_cache_expire_time_minutes_after_access` {#external_cache_expire_time_minutes_after_access}

마지막 접근 후 캐시 데이터가 만료되기까지의 시간을 설정합니다. 단위는 분입니다.
External Schema Cache와 Hive Partition Cache에 적용됩니다.

기본값: 1440

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

#### `es_state_sync_interval_second` {#es_state_sync_interval_second}

기본값：10

FE가 es_state_sync_interval_secs마다 ES API를 호출하여 ES 색인의 shard 정보를 가져옵니다.

### 외부 리소스 {#external-resources}

#### `ai_resource_allowed_user` {#ai_resource_allowed_user}

기본값: `*`

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

버전 4.1.5부터 지원됩니다. AI Resource를 생성할 수 있는 사용자 ID를 제한합니다. `*`는 사용자 ID에 추가 제한을 두지 않지만, 기존 권한 검사는 계속 적용됩니다. 다른 값은 `'user'@'host'` 형식을 사용하며 현재 사용자 ID와 일치해야 합니다. 변경 후에는 FE를 다시 시작해야 합니다.

#### `dpp_hadoop_client_path` {#dpp_hadoop_client_path}

기본값：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce` {#dpp_bytes_per_reduce}

기본값：`100 * 1024 * 1024L` (100M)

#### `dpp_default_cluster` {#dpp_default_cluster}

기본값：palo-dpp

#### `dpp_default_config_str` {#dpp_default_config_str}

기본값：{
               hadoop_configs : 'mapred.job.priority=NORMAL;mapred.job.map.capacity=50;mapred.job.reduce.capacity=50;mapred.hce.replace.streaming=false;abaci.long.stored.job=true;dce.shuffle.enable=false;dfs.client.authserver.force_stop=true;dfs.client.auth.method=0'
         }

#### `dpp_config_str` {#dpp_config_str}

기본값：{
               palo-dpp : {
                     hadoop_palo_path : '/dir',
                     hadoop_configs : 'fs.default.name=hdfs://host:port;mapred.job.tracker=host:port;hadoop.job.ugi=user,password'
                  }
      }

#### `yarn_config_dir` {#yarn_config_dir}

기본값: DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

기본 YARN 구성 파일 디렉터리입니다. YARN 명령을 실행하기 전에 매번 이 경로에 구성 파일이 있는지 확인하고, 없으면 생성합니다.

#### `yarn_client_path` {#yarn_client_path}

기본값：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

기본 YARN 클라이언트 경로입니다.

#### `spark_launcher_log_dir` {#spark_launcher_log_dir}

기본값： sys_log_dir + "/spark_launcher_log"

Spark launcher 로그 디렉터리를 지정합니다.

#### `spark_resource_path` {#spark_resource_path}

기본값：없음

기본 Spark 종속성 경로입니다.

#### `spark_home_default_dir` {#spark_home_default_dir}

기본값：DORIS_HOME_DIR + "/lib/spark2x"

기본 Spark 홈 디렉터리입니다.

#### `spark_dpp_version` {#spark_dpp_version}

기본값: 1.0.0

기본 Spark DPP 버전입니다.

### 기타 {#else}

#### `tmp_dir` {#tmp_dir}

기본값: DorisFE.DORIS_HOME_DIR + "/temp_dir"

백업 및 복원 등의 프로세스에서 생성되는 중간 결과를 저장하는 임시 디렉터리입니다. 해당 프로세스가 완료되면 이 디렉터리의 파일을 정리합니다.

#### `custom_config_dir` {#custom_config_dir}

기본값: DorisFE.DORIS_HOME_DIR + "/conf"

사용자 지정 구성 파일 디렉터리입니다.

`fe_custom.conf` 파일의 위치를 설정합니다. 기본 위치는 `conf/` 디렉터리입니다.

일부 배포 환경에서는 시스템 업그레이드로 `conf/` 디렉터리를 덮어쓸 수 있습니다. 이 경우 사용자가 수정한 구성 항목도 덮어써집니다. 이를 방지하려면 `fe_custom.conf`를 다른 지정 디렉터리에 저장할 수 있습니다.

#### `plugin_dir` {#plugin_dir}

기본값：DORIS_HOME + "/plugins

플러그인 설치 디렉터리입니다.

#### `plugin_enable` {#plugin_enable}

기본값:true

동적 변경 가능 여부：true

Master FE 전용：true

플러그인을 활성화할지 여부입니다. 기본적으로 활성화됩니다.

#### `small_file_dir` {#small_file_dir}

기본값：DORIS_HOME_DIR/small_files

작은 파일을 저장합니다.

#### `max_small_file_size_bytes` {#max_small_file_size_bytes}

기본값：1M

동적 변경 가능 여부：true

Master FE 전용：true

SmallFileMgr에 저장하는 단일 파일의 최대 크기입니다.

#### `max_small_file_number` {#max_small_file_number}

기본값：100

동적 변경 가능 여부：true

Master FE 전용：true

SmallFileMgr에 저장하는 파일의 최대 개수입니다.

#### `enable_metric_calculator` {#enable_metric_calculator}

기본값：true

true로 설정하면 메트릭 수집기가 데몬 타이머로 실행되어 일정한 간격으로 메트릭을 수집합니다.

#### `report_queue_size` {#report_queue_size}

기본값： 100

동적 변경 가능 여부：true

Master FE 전용：true

FE에 보고 작업이 너무 많이 쌓여 OOM 예외가 발생하는 것을 방지하는 임계값입니다. 예를 들어 Backend가 100개이고 복제본이 천만 개인 대규모 Doris 클러스터에서는 파티션 삭제 등의 메타데이터 변경 후 tablet 보고를 처리하는 데 몇 초가 걸릴 수 있습니다. 각 Backend가 1분마다 tablet 정보를 보고하므로 보고를 무제한으로 수신할 수는 없습니다. 향후 tablet 보고 처리 속도를 최적화할 예정이지만, 현재는 큐 크기가 제한을 초과하면 보고를 버립니다.
   실제 운영 환경의 일부 소요 시간:
      1. 디스크 보고: 0-1 msta
      2. sk 보고: 0-1 ms
      3. tablet 보고
      4. 복제본 10000개: 200ms

#### `backup_job_default_timeout_ms` {#backup_job_default_timeout_ms}

기본값: 86400 * 1000  (1일)

동적 변경 가능 여부：true

Master FE 전용：true

백업 작업의 기본 시간 제한입니다.

#### `backup_upload_snapshot_batch_size` {#backup_upload_snapshot_batch_size}

기본값：10

동적 변경 가능 여부：true

Master FE 전용：true

백업 중 단일 업로드 태스크에 할당되는 스냅샷의 최대 개수입니다. 기본값은 10입니다.

#### `restore_download_snapshot_batch_size` {#restore_download_snapshot_batch_size}

기본값：10

동적 변경 가능 여부：true

Master FE 전용：true

복원 중 단일 다운로드 태스크에 할당되는 스냅샷의 최대 개수입니다. 기본값은 10입니다.

#### `max_backup_restore_job_num_per_db` {#max_backup_restore_job_num_per_db}

기본값: 10

각 데이터베이스에 기록되는 백업/복원 작업 수를 제어하는 데 주로 사용됩니다.

#### `max_backup_tablets_per_job` {#max_backup_tablets_per_job}

기본값: 300000

동적 변경 가능 여부：true

Master FE 전용：true

백업 작업당 포함할 수 있는 tablet의 최대 개수를 제어하여, 메타데이터를 너무 많이 저장해 FE OOM이 발생하는 것을 방지합니다.

#### `enable_quantile_state_type` {#enable_quantile_state_type}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：true

quantile_state 데이터 유형을 활성화할지 여부입니다.

#### `enable_date_conversion` {#enable_date_conversion}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：true

FE가 date/datetime을 datev2/datetimev2(0)으로 자동 변환합니다.

#### `enable_decimal_conversion` {#enable_decimal_conversion}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：true

FE가 DecimalV2를 DecimalV3로 자동 변환합니다.

#### `proxy_auth_magic_prefix` {#proxy_auth_magic_prefix}

기본값：x@8

#### `proxy_auth_enable` {#proxy_auth_enable}

기본값：false

#### `enable_func_pushdown` {#enable_func_pushdown}

기본값：true

동적 변경 가능 여부：true

Master FE 전용：false

ODBC, JDBC 외부 테이블 쿼리를 실행할 때 함수가 포함된 필터 조건을 MySQL로 푸시다운할지 여부입니다.

#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

기본값: `${DORIS_HOME}/jdbc_drivers`;

동적 변경 가능 여부：false

Master FE 전용：false

JDBC 드라이버를 저장하는 기본 디렉터리입니다.

#### `max_error_tablet_of_broker_load` {#max_error_tablet_of_broker_load}

기본값: 3;

동적 변경 가능 여부：true

Master FE 전용：true

Broker Load에서 표시하는 오류 tablet의 최대 개수입니다.

#### `default_db_max_running_txn_num` {#default_db_max_running_txn_num}

기본값：-1

동적 변경 가능 여부：true

Master FE 전용：true

데이터베이스의 기본 트랜잭션 할당량을 설정합니다.

기본값인 -1은 `max_running_txn_num_per_db`를 사용하고 `default_db_max_running_txn_num`을 사용하지 않음을 의미합니다.

개별 데이터베이스의 할당량은 다음과 같이 설정할 수 있습니다.

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `prefer_compute_node_for_external_table` {#prefer_compute_node_for_external_table}

기본값：false

동적 변경 가능 여부：true

Master FE 전용：false

true로 설정하면 외부 테이블 쿼리를 컴퓨팅 노드에 우선 할당합니다. 컴퓨팅 노드의 최대 개수는 `min_backend_num_for_external_table`로 제어합니다.
false로 설정하면 외부 테이블 쿼리를 임의의 노드에 할당합니다.

#### `min_backend_num_for_external_table` {#min_backend_num_for_external_table}

기본값：3

동적 변경 가능 여부：true

Master FE 전용：false

`prefer_compute_node_for_external_table`이 true일 때만 적용됩니다. 컴퓨팅 노드 수가 이 값보다 작으면 외부 테이블 쿼리를 할당할 때 일부 혼합 노드를 추가로 선택하여 전체 노드 수가 이 값에 도달하도록 시도합니다.
컴퓨팅 노드 수가 이 값보다 크면 외부 테이블 쿼리를 컴퓨팅 노드에만 할당합니다.

#### `infodb_support_ext_catalog` {#infodb_support_ext_catalog}

기본값: false

동적 변경 가능 여부: true

Master FE 전용: false

false이면 information_schema 데이터베이스의 테이블을 조회할 때
외부 Catalog에 있는 테이블 정보가 결과에 포함되지 않습니다.
외부 Catalog에 접근할 수 없을 때 쿼리 시간이 길어지는 것을 방지하기 위한 설정입니다.

#### `enable_query_hit_stats` {#enable_query_hit_stats}

기본값: false

동적 변경 가능 여부: true

Master FE 전용: false

쿼리 적중 통계를 활성화할지 제어합니다. 기본값은 false입니다.

#### `div_precision_increment` {#div_precision_increment}

기본값: 4

`/` 연산자로 나눗셈을 수행할 때 결과의 소수 자릿수를
얼마나 늘릴지 나타내는 변수입니다.

#### `enable_convert_light_weight_schema_change` {#enable_convert_light_weight_schema_change}

기본값：true

임시 구성 옵션입니다. 활성화하면 백그라운드 스레드가 시작되어 모든 OLAP 테이블을 light schema change로 자동 전환합니다. 전환 결과는 `show convert_light_schema_change [from db]` 명령으로 확인할 수 있으며, light schema change가 아니었던 모든 테이블의 전환 결과가 표시됩니다.

#### `disable_local_deploy_manager_drop_node` {#disable_local_deploy_manager_drop_node}

기본값：true

cluster.info 파일의 오류로 노드가 제거되는 것을 방지하기 위해 LocalDeployManager의 노드 제거를 금지합니다.

#### `mysqldb_replace_name` {#mysqldb_replace_name}

기본값: mysql

MySQL 생태계와의 호환성을 위해 Doris에는 mysql이라는 기본 제공 데이터베이스가 있습니다. 이 데이터베이스가 사용자의 데이터베이스와 충돌하면 이 필드를 수정하여 Doris 기본 제공 MySQL 데이터베이스의 이름을 다른 이름으로 변경하세요.

#### `max_auto_partition_num` {#max_auto_partition_num}

기본값: 2000

자동 파티션 테이블에서 사용자가 실수로 많은 파티션을 생성하지 않도록 OLAP 테이블당 허용되는 파티션 수를 `max_auto_partition_num`으로 제한합니다. 기본값은 2000입니다.

#### `profile_manager_gc_interval_seconds` {#profile_manager_gc_interval_seconds}

기본값: 1

ProfileManager가 profile 가비지 컬렉션을 수행하는 간격을 제어합니다. 가비지 컬렉션 중에는 메모리를 절약하기 위해 ProfileManager가 메모리와 디스크에서 초과되거나 만료된 profile을 제거합니다.

### 컴퓨팅 및 스토리지 분리 모드 {#compute-and-storage-disaggregated-mode}

#### `cloud_edit_log_roll_interval_second` {#cloud_edit_log_roll_interval_second}

기본값: 3600 (초)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.5부터 지원됩니다. 컴퓨팅 및 스토리지 분리 모드에서 사용하는 시간 기반 Edit Log 롤링 간격으로, 메타데이터 쓰기가 드물어도 주기적인 checkpoint가 진행되도록 합니다. 이 간격은 로그 항목이 추가될 때 확인합니다. 새 항목이 없을 때 롤링을 강제로 수행하는 별도의 타이머는 없습니다. 양수가 아닌 값은 시간 기반 롤링을 비활성화합니다. 로그 항목 수에 따른 롤링은 계속 활성화됩니다.

#### `cloud_version_syncer_interval_second` {#cloud_version_syncer_interval_second}

기본값: 60 (초, 4.1.5 이전에는 20)

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: false

컴퓨팅 및 스토리지 분리 모드에서 모든 FE가 백그라운드로 테이블 및 파티션 버전을 동기화하는 간격입니다. 백그라운드 동기화를 사용하려면 `cloud_enable_version_syncer=true`이고, 전역/기본 테이블 또는 파티션 버전 캐시 TTL 중 하나 이상이 `Long.MAX_VALUE`로 설정되어 있어야 합니다. 유한한 TTL을 가진 캐시는 읽기 시 지연 갱신됩니다. 버전 4.1.5에서는 Meta Service 요청을 줄이기 위해 기본 간격을 20초에서 60초로 늘렸습니다. 변경 후에는 FE를 다시 시작해야 합니다.

#### `cloud_get_version_task_batch_size` {#cloud_get_version_task_batch_size}

기본값: 200 (4.1.5 이전에는 2000)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

컴퓨팅 및 스토리지 분리 모드의 버전 동기화에서 단일 Get Version 배치에 포함되는 테이블 또는 파티션의 최대 개수입니다. 버전 4.1.5에서는 요청 크기를 줄이기 위해 기본값을 2000에서 200으로 낮췄습니다.

#### `cloud_version_syncer_get_version_retry_times` {#cloud_version_syncer_get_version_retry_times}

기본값: 3

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

버전 4.1.5부터 지원됩니다. 컴퓨팅 및 스토리지 분리 모드의 백그라운드 동기화에서 테이블 또는 파티션 버전을 가져오는 최대 시도 횟수이며, 최초 요청을 포함합니다. 기본값은 최초 요청 후 3회 재시도가 아니라 총 3회까지 시도하도록 허용합니다. 이 설정은 포그라운드 쿼리의 Meta Service RPC 재시도 설정과 독립적입니다.

#### `cloud_warm_up_job_scheduler_interval_millisecond` {#cloud_warm_up_job_scheduler_interval_millisecond}

기본값: 1000 (밀리초)

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

캐시 워밍업 작업의 스케줄링 간격입니다. 버전 4.1.5부터 동적 갱신 시 `0`보다 큰 값이어야 합니다. 그렇지 않으면 `cloud_warm_up_job_scheduler_interval_millisecond must be greater than 0`을 반환합니다.

#### `max_active_cloud_warm_up_job` {#max_active_cloud_warm_up_job}

기본값: 10

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: true

동시에 스케줄링하는 캐시 워밍업 작업 수입니다. 버전 4.1.5부터 동적으로 갱신하면 워밍업 실행기의 크기도 조정됩니다. 양수가 아닌 값은 새 워밍업 작업의 스케줄링을 일시 중지합니다.

#### `cluster_id` {#cluster_id-1}

기본값：-1

노드(FE 또는 BE)의 클러스터 id가 같으면 동일한 Doris 클러스터에 속한 것으로 간주합니다. 컴퓨팅 및 스토리지 분리 모드에서는 임의의 정수를 지정해야 합니다.

#### `deploy_mode` {#deploy_mode}

기본값: ""

설명: FE가 실행되는 모드입니다. `cloud`는 스토리지 및 컴퓨팅 분리 모드를 나타냅니다.

#### `meta_service_endpoint` {#meta_service_endpoint}

기본값: ""

Meta Service의 엔드포인트를 'host1:port,host2:port' 형식으로 지정해야 합니다. 스토리지 및 컴퓨팅 분리 모드에 필수적인 구성입니다.

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

기본값: false

동적 변경 가능 여부: true

컴퓨팅 및 스토리지 분리 모드에서 Group Commit을 위한 Stream Load BE 전달을 활성화할지 여부입니다. 분리 모드이며 요청이 Group Commit을 사용하는 경우에만 적용됩니다.

활성화하면 FE가 Stream Load 요청을 `_stream_load_forward` 엔드포인트로 리디렉션하고, 이를 받은 BE가 해당 테이블의 대상 BE로 요청을 전달합니다. 이를 통해 로드 밸런서가 같은 테이블의 Group Commit 배치 처리를 여러 곳으로 분산하는 것을 방지합니다.

동일한 이름의 구성을 FE와 BE 양쪽에서 모두 활성화해야 합니다. **Doris 4.0 계열의 버전 4.0.8과 4.1 계열의 버전 4.1.4부터 BE 측 `_stream_load_forward` 엔드포인트는 BE 구성으로 제어됩니다. 비활성화 상태에서는 `403 Forbidden`을 반환하며, 활성화한 후에는 요청이 인증을 통과하고 전역 `LOAD` 권한을 보유해야 합니다.** [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)과 [BE 구성](./be-config)을 참조하세요.

#### `default_get_version_from_ms_timeout_second` {#default_get_version_from_ms_timeout_second}

기본값: 30 (s)

동적 설정 가능 여부: false

FE가 Meta Service에서 버전을 가져올 때의 시간 제한입니다.

:::caution 동작 변경 (4.1.4)

버전 4.1.4에서 기본값이 `3`초에서 `30`초로 변경되었습니다. 이전에는 Meta Service의 응답 지연이 불규칙하거나 부하가 높을 때 3초의 시간 제한으로 쿼리가 쉽게 실패했습니다. 값을 늘리면서 이러한 간헐적 실패가 크게 줄어듭니다.

:::

#### `enable_cloud_replica_stale_route_clean` {#enable_cloud_replica_stale_route_clean}

기본값: true

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. 메타데이터 이미지를 로드할 때와 tablet 균형 조정 주기 중에, 더 이상 존재하지 않는 Backend를 가리키는 CloudReplica의 기본 및 보조 라우트 기록을 정리할지 여부입니다.

이러한 오래된 기록은 쿼리 시 이미 무시되며 복제본이 다시 해시되어 Backend에 할당됩니다. 따라서 FE 메모리와 메타데이터 이미지 공간만 낭비합니다. 정리하지 않는 기존 동작을 유지하려면 `false`로 설정하세요.

#### `enable_cloud_colocate_consistent_hash` {#enable_cloud_colocate_consistent_hash}

기본값: true

동적 설정 가능 여부: false

Master FE 노드 전용 구성 항목 여부: true

버전 4.1.4에서 추가되었습니다. 컴퓨팅 및 스토리지 분리 모드에서 colocate 테이블의 버킷 배치에 rendezvous consistent hashing을 사용할지 여부입니다. `false`로 설정하면 기존의 나머지 연산 기반 배치로 돌아갑니다. 이 구성은 `fe.conf`에서만 설정할 수 있으며 다시 시작한 후 적용됩니다.

#### `meta_service_rpc_rate_limit_enabled` {#meta_service_rpc_rate_limit_enabled}

기본값: true (4.1.5 이전에는 false)

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. FE에서 Meta Service로 보내는 RPC에 대해 QPS 속도 제한을 평가할지 여부입니다. 버전 4.1.5부터 `meta_service_rpc_rate_limit_dry_run`과 함께 기본적으로 활성화되므로, 기본 동작은 요청을 지연하거나 거부하지 않고 예상 대기와 거부만 기록합니다. 속도 제한을 실제로 적용하려면 이 설정을 `true`로 유지하고 dry-run을 `false`로 설정하세요.

#### `meta_service_rpc_rate_limit_dry_run` {#meta_service_rpc_rate_limit_dry_run}

기본값: true

동적 설정 가능 여부: true

Master FE 노드 전용 구성 항목 여부: false

버전 4.1.5부터 지원됩니다. `meta_service_rpc_rate_limit_enabled=true`일 때만 적용됩니다. `true`이면 요청을 대기시키거나 거부하지 않고 속도 제한을 평가하여 메트릭을 기록합니다. `false`이면 설정된 QPS, 버스트 윈도우, 대기 시간 제한을 실제로 적용합니다. dry-run 모드의 대기 메트릭은 예상 대기 시간을 나타냅니다.

#### `meta_service_rpc_rate_limit_default_qps_per_core` {#meta_service_rpc_rate_limit_default_qps_per_core}

기본값: 50

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. `meta_service_rpc_rate_limit_qps_per_core_config`에서 개별적으로 설정하지 않은 Meta Service RPC 메서드에 허용되는 CPU 코어당 기본 QPS입니다. `0` 이하의 값은 속도 제한이 없음을 의미합니다.

#### `meta_service_rpc_rate_limit_qps_per_core_config` {#meta_service_rpc_rate_limit_qps_per_core_config}

기본값: `getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. Meta Service RPC 메서드별로 개별 설정하는 코어당 QPS 제한입니다. 형식은 `method1:qps1;method2:qps2`입니다. `0` 이하의 값은 해당 메서드에 속도 제한을 적용하지 않음을 의미합니다.

#### `meta_service_rpc_rate_limit_burst_seconds` {#meta_service_rpc_rate_limit_burst_seconds}

기본값: 2 (s)

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. Meta Service RPC 속도 제한의 버스트 윈도우 길이입니다. 단위는 초입니다. 장기 평균 QPS는 유지하면서 이 윈도우 내의 버스트를 허용합니다.

#### `meta_service_rpc_rate_limit_wait_timeout_ms` {#meta_service_rpc_rate_limit_wait_timeout_ms}

기본값: 1000 (ms)

동적 설정 가능 여부: true

버전 4.1.4에서 추가되었습니다. RPC가 속도 제한을 받을 때 기다리는 최대 시간입니다. 단위는 밀리초입니다. `0`은 대기하지 않음을 의미하며, 요청이 즉시 실패합니다.
