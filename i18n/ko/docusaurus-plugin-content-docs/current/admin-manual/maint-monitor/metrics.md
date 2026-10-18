---
{
    "title": "모니터링 지표",
    "language": "ko",
    "description": "Doris FE 및 BE의 프로세스, JVM, 머신 모니터링 지표를 종합적으로 정리한 참고 문서입니다. 클러스터 상태 모니터링과 알림 설정에 활용할 수 있도록 P0 우선순위를 표시합니다."
}
---

# 모니터링 지표 {#monitoring-metrics}

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

Doris의 FE 및 BE 프로세스에는 모니터링 지표가 내장되어 있으며, 기본적으로 Prometheus 호환 형식으로 노출됩니다. 이 문서는 관측 가능한 모든 지표를 체계적으로 나열하고 우선순위(Priority)를 표시하여, Prometheus + Grafana와 연동한 후 모니터링 및 알림 시스템을 빠르게 구축할 수 있도록 돕습니다.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 목적 |
| --- | --- |
| 클러스터 상태 모니터링 | P0 지표를 통해 FE/BE 노드의 이상을 빠르게 감지 |
| 알림 설정 | QPS, 오류율, Compaction Score 등의 지표에 임계값 기반 알림 설정 |
| 성능 문제 해결 | 쿼리 지연 시간, 스레드 풀 대기열, 메모리 사용량 지표를 활용하여 병목 지점 파악 |
| 용량 계획 | 디스크 사용량, tablet 수, 연결 수를 활용하여 클러스터 부하 평가 |
| 장애 회고 | 머신 지표(CPU, IO, 네트워크)와 프로세스 지표를 함께 분석하여 장애의 근본 원인 파악 |

## 지표 분류 {#metric-categories}

Doris 모니터링 지표는 관측 대상에 따라 두 가지로 나뉩니다.

1. **프로세스 모니터링**: 쿼리 수, 트랜잭션 수, Compaction 상태 등 Doris 프로세스 자체의 실행 지표를 보여 줍니다.
2. **노드 모니터링**: CPU, 메모리, IO, 네트워크 등 Doris 프로세스가 실행되는 머신의 리소스 지표를 보여 줍니다.

## 모니터링 지표 조회 {#retrieving-monitoring-metrics}

### Prometheus 호환 형식(기본값) {#prometheus-compatible-format-default}

FE 또는 BE 노드의 HTTP 포트에 직접 접속합니다.

```shell
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```

응답 예시:

```text
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```

### JSON 형식 {#json-format}

`type=json` 매개변수를 사용하여 JSON 형식으로 지표를 조회합니다.

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

### bvar 지표 {#bvar-metrics}

BE 및 Meta Service / Recycler 프로세스도 brpc 서비스를 통해 bvar 지표를 노출합니다. Prometheus 호환 출력에는 `/brpc_metrics`를 사용하고, 이름별 진단 정보를 확인하려면 `/vars`를 사용합니다.

```shell
curl http://be_host:brpc_port/brpc_metrics
curl http://be_host:brpc_port/vars
curl http://cloud_host:brpc_listen_port/brpc_metrics
```

이 엔드포인트는 BE의 `brpc_port`(기본값 `8060`) 또는 Meta Service / Recycler의 `brpc_listen_port`(기본값 `5000`)를 사용하며, 위에서 설명한 FE / BE HTTP 모니터링 포트와 다릅니다. 아래의 bvar 이름은 등록된 이름을 따르며, 모든 이름에 `doris_be_` 접두사가 붙는 것은 아닙니다.

#### 버전 식별 {#version-identification}

버전 4.1.5부터 BE 및 Meta Service / Recycler 버전 지표에는 `/brpc_metrics`에서 다음 레이블이 포함됩니다.

| 지표 | 유형 | 레이블 | 의미 |
| --- | --- | --- | --- |
| `doris_be_version` | Gauge | `version`, `major`, `minor`, `patch`, `hotfix`, `short_hash` | BE 빌드 버전 및 커밋 식별자 |
| `doris_cloud_version` | Gauge | 위와 동일 | Meta Service / Recycler 빌드 버전 및 커밋 식별자 |

각 프로세스는 버전 샘플 하나를 노출합니다. 지표 값은 기존 버전 인코딩을 유지합니다. 전체 버전은 `version` 레이블에서, 커밋 식별자는 `short_hash`에서 확인합니다. `doris_cloud_version`은 프로세스가 Meta Service, Recycler 또는 둘 다 실행하는지 구분하지 않습니다. 역할을 식별하려면 스크레이프 대상 레이블을 추가합니다.

프로세스의 `bvar_max_dump_multi_dimension_metric_num` 설정은 다차원 bvar 샘플 수를 제한합니다. 기본값은 `5000`이며, `0`으로 설정하면 버전 지표와 같은 샘플이 비활성화됩니다. BE는 버전 4.1.5부터 이 설정을 지원하며, 변경 사항을 적용하려면 재시작해야 합니다. [BE 설정](../config/be-config.md#bvar_max_dump_multi_dimension_metric_num)을 참고하세요.

## 모니터링 우선순위 및 모범 사례 {#monitoring-priority-and-best-practices}

<!-- Knowledge type: Best practices -->

- 각 지표 테이블의 마지막 열은 우선순위(Priority)입니다. **P0가 가장 중요하며**, 값이 클수록 중요도가 낮습니다. P0 지표부터 연동하세요.
- 대부분의 모니터링 지표는 Counter 유형(누적값)입니다. **유용한 정보를 얻으려면 일정 간격(예: 15초마다)으로 샘플링하고 단위 시간당 기울기를 계산해야 합니다**.

    예를 들어 `doris_fe_query_err`의 기울기를 계산하면 쿼리 오류율(초당 오류 수)을 구할 수 있습니다.

> 더 포괄적이고 유용한 모니터링 지표를 제공할 수 있도록 이 테이블에 기여해 주세요.

## FE 모니터링 지표 {#fe-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### 프로세스 모니터링 {#process-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | Num | 새로 추가된 Partition Cache의 누적 수 |  |  |
|  | {type="sql"} | Num | 새로 추가된 SQL Cache의 누적 수 |  |  |
| `doris_fe_cache_hit` | {type="partition"} | Num | Partition Cache 적중 횟수 |  |  |
|  | {type="sql"} | Num | SQL Cache 적중 횟수 |  |  |
| `doris_fe_connection_total` |  | Num | FE의 현재 MySQL 포트 연결 수 | 쿼리 연결 수를 모니터링하는 데 사용합니다. 연결 수가 한도를 초과하면 새 연결을 수락할 수 없습니다 | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | Num | SQL BLOCK RULE에 의해 차단된 쿼리 수 |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | Num | 과거 메타데이터 로그 정리 실패 횟수 | 실패가 발생해서는 안 됩니다. 실패하면 수동 조치가 필요합니다 | P0 |
|  | {type="success"} | Num | 과거 메타데이터 로그 정리 성공 횟수 |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | Bytes | 메타데이터 로그 쓰기 양의 누적값 | 기울기를 계산하여 쓰기 속도를 구하고 메타데이터 쓰기가 지연되는지 확인합니다 | P0 |
|  | {type="current_bytes"} | Bytes | 메타데이터 로그의 현재 크기 | editlog 크기를 모니터링하는 데 사용합니다. 크기가 한도를 초과하면 수동 조치가 필요합니다 | P0 |
|  | {type="read"} | Num | 메타데이터 로그 읽기 횟수 | 기울기를 통해 메타데이터 읽기 빈도가 정상인지 확인합니다 | P0 |
|  | {type="write"} | Num | 메타데이터 로그 쓰기 횟수 | 기울기를 통해 메타데이터 쓰기 빈도가 정상인지 확인합니다 | P0 |
|  | {type="current"} | Num | 현재 메타데이터 로그 수 | editlog 수를 모니터링하는 데 사용합니다. 수가 한도를 초과하면 수동 조치가 필요합니다 | P0 |
| `doris_fe_editlog_write_latency_ms` |  | Milliseconds | 메타데이터 로그 쓰기 지연 시간의 백분위수 통계입니다. 예를 들어 {quantile="0.75"}는 75번째 백분위수의 쓰기 지연 시간을 나타냅니다 |  |  |
| `doris_fe_image_clean` | {type="failed"} | Num | 과거 메타데이터 이미지 파일 정리 실패 횟수 | 실패가 발생해서는 안 됩니다. 실패하면 수동 조치가 필요합니다 | P0 |
|  | {type="success"} | Num | 과거 메타데이터 이미지 파일 정리 성공 횟수 |  |  |
| `doris_fe_image_push` | {type="failed"} | Num | 다른 FE 노드로 메타데이터 이미지 파일을 전송하는 데 실패한 횟수 |  |  |
|  | {type="success"} | Num | 다른 FE 노드로 메타데이터 이미지 파일을 전송하는 데 성공한 횟수 |  |  |
| `doris_fe_image_write` | {type="failed"} | Num | 메타데이터 이미지 파일 생성 실패 횟수 | 실패가 발생해서는 안 됩니다. 실패하면 수동 조치가 필요합니다 | P0 |
|  | {type="success"} | Num | 메타데이터 이미지 파일 생성 성공 횟수 |  |  |
| `doris_fe_job` |  | Num | 유형 및 상태별 작업 수입니다. 예를 들어 {job="load", type="INSERT", state="LOADING"}는 LOADING 상태인 INSERT 유형 데이터 적재 작업 수를 나타냅니다 | 필요에 따라 클러스터의 유형별 작업 수를 확인합니다 | P0 |
| `doris_fe_max_journal_id` |  | Num | 현재 FE 노드의 최대 메타데이터 로그 ID입니다. Master FE에서는 현재 기록된 최대 ID이며, Master가 아닌 FE에서는 현재 재생된 메타데이터 로그의 최대 ID입니다 | 여러 FE 간 ID 차이가 큰지 확인하는 데 사용합니다. 차이가 크면 메타데이터 동기화에 문제가 있음을 나타냅니다 | P0 |
| `doris_fe_max_tablet_compaction_score` |  | Num | 모든 BE 노드에서 가장 큰 Compaction Score 값 | 현재 클러스터의 최대 Compaction Score를 확인하고 값이 너무 높은지 판단하는 데 사용합니다. 값이 높으면 쿼리 또는 쓰기 지연이 발생할 수 있습니다 | P0 |
| `doris_fe_qps` |  | Num/Sec | 현재 FE의 초당 쿼리 수(쿼리 요청만 집계) | QPS | P0 |
| `doris_fe_query_err` |  | Num | 실패한 쿼리의 누적 수 |  |  |
| `doris_fe_query_err_rate` |  | Num/Sec | 초당 실패한 쿼리 수 | 클러스터에서 쿼리 오류가 발생하는지 확인합니다 | P0 |
| `doris_fe_query_latency_ms` |  | Milliseconds | 쿼리 요청 지연 시간의 백분위수 통계입니다. 예를 들어 {quantile="0.75"}는 75번째 백분위수의 쿼리 지연 시간을 나타냅니다 | 각 백분위수의 쿼리 지연 시간을 자세히 확인합니다 | P0 |
| `doris_fe_query_latency_ms_db` |  | Milliseconds | DB별 쿼리 요청 지연 시간의 백분위수 통계입니다. 예를 들어 {quantile="0.75",db="test"}는 DB test의 75번째 백분위수 쿼리 지연 시간을 나타냅니다 | DB별로 각 백분위수의 쿼리 지연 시간을 자세히 확인합니다 | P0 |
| `doris_fe_query_olap_table` |  | Num | 내부 테이블(OlapTable)에 대한 쿼리 요청 수 |  |  |
| `doris_fe_query_total` |  | Num | 모든 쿼리 요청의 누적 수 |  |  |
| `doris_fe_report_queue_size` |  | Num | BE의 다양한 주기적 보고 작업을 처리하는 FE 측 대기열의 길이 | 이 값은 Master FE 노드에서 보고 작업이 정체된 정도를 나타냅니다. 값이 클수록 FE의 처리 여력이 부족합니다 | P0 |
| `doris_fe_request_total` |  | Num | MySQL 포트를 통해 수신한 모든 작업 요청(쿼리 및 기타 문 포함) |  |  |
| `doris_fe_routine_load_error_rows` |  | Num | 클러스터의 모든 Routine Load 작업에서 발생한 오류 행의 총수 |  |  |
| `doris_fe_routine_load_receive_bytes` |  | Bytes | 클러스터의 모든 Routine Load 작업이 수신한 총 데이터 양 |  |  |
| `doris_fe_routine_load_rows` |  | Num | 클러스터의 모든 Routine Load 작업이 수신한 데이터 행의 총수 |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | Milliseconds | 클러스터의 모든 Routine Load 작업에 대한 메타데이터 조회 지연 시간 |  |  |
| `doris_fe_routine_load_get_meta_count` |  | Num | 클러스터의 모든 Routine Load 작업에 대한 메타데이터 조회 횟수 |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | Num | 클러스터의 모든 Routine Load 작업에 대한 메타데이터 조회 실패 횟수 |  |  |
| `doris_fe_routine_load_task_execute_time` |  | Milliseconds | 클러스터의 모든 Routine Load 태스크 실행 시간 |  |  |
| `doris_fe_routine_load_task_execute_count` |  | Num | 클러스터의 모든 Routine Load 태스크 실행 횟수 |  |  |
| `doris_fe_routine_load_lag` |  | Milliseconds | 클러스터의 모든 Routine Load 작업의 소비 지연 |  |  |
| `doris_fe_routine_load_progress` |  | Milliseconds | 클러스터의 모든 Routine Load 작업의 소비 진행 상황 |  |  |
| `doris_fe_routine_load_abort_task_num` |  | Num | 클러스터의 모든 Routine Load 작업에서 실패한 태스크 수 |  |  |
| `doris_fe_rps` |  | Num | 현재 FE의 초당 요청 수(쿼리 및 기타 유형의 문 포함) | QPS와 함께 사용하여 클러스터가 처리하는 요청량을 확인합니다 | P0 |
| `doris_fe_scheduled_tablet_num` |  | Num | Master FE 노드에서 스케줄링 중인 tablet 수로, 복구 중인 복제본과 균형 조정 중인 복제본을 포함합니다 | 이 값은 클러스터에서 현재 마이그레이션 중인 tablet 수를 나타냅니다. 이 값이 오랫동안 영이 아닌 상태로 유지되면 클러스터가 불안정함을 나타냅니다 | P0 |
| `doris_fe_tablet_max_compaction_score` |  | Num | 각 BE 노드가 보고한 Compaction Score입니다. 예를 들어 {backend="172.21.0.1:9556"}는 "172.21.0.1:9556"의 BE가 보고한 값을 나타냅니다 |  |  |
| `doris_fe_tablet_num` |  | Num | 각 BE 노드의 총 tablet 수입니다. 예를 들어 {backend="172.21.0.1:9556"}는 "172.21.0.1:9556"의 BE에 있는 현재 tablet 수를 나타냅니다 | tablet이 균등하게 분포되어 있는지, 절대적인 수가 적절한지 확인합니다 | P0 |
| `doris_fe_tablet_status_count` |  | Num | Master FE 노드의 Tablet 스케줄러가 스케줄링한 tablet의 누적 수 |  |  |
|  | {type="added"} | Num | Master FE 노드의 Tablet 스케줄러가 스케줄링한 tablet의 누적 수입니다. "added"는 스케줄링된 tablet 수를 나타냅니다 |  |  |
|  | {type="in_sched"} | Num | 위와 동일합니다. 반복해서 스케줄링된 tablet 수를 나타냅니다 | 이 값이 빠르게 증가하면 일부 tablet이 오랫동안 비정상 상태에 있어 스케줄러가 반복해서 스케줄링하고 있음을 의미합니다 |  |
|  | {type="not_ready"} | Num | 위와 동일합니다. 아직 스케줄링 트리거 조건을 충족하지 못한 tablet 수를 나타냅니다 | 이 값이 빠르게 증가하면 많은 tablet이 비정상 상태이지만 스케줄링할 수 없음을 의미합니다 |  |
|  | {type="total"} | Num | 위와 동일합니다. 검사된 tablet의 누적 수를 나타냅니다(반드시 스케줄링된 것은 아님) |  |  |
|  | {type="unhealthy"} | Num | 위와 동일합니다. 검사된 비정상 tablet의 누적 수를 나타냅니다 |  |  |
| `doris_fe_thread_pool` |  | Num | 다양한 스레드 풀의 작업 스레드 및 대기열 통계입니다. `active_thread_num`은 현재 실행 중인 태스크 수를 나타냅니다. `pool_size`는 풀의 총 스레드 수를 나타냅니다. `task_in_queue`는 현재 대기열에 있는 태스크 수를 나타냅니다 |  |  |
|  | {name="agent-task-pool"} | Num | Master FE가 BE에 Agent Task를 전송하는 데 사용하는 스레드 풀 |  |  |
|  | {name="connect-scheduler-check-timer"} | Num | MySQL 유휴 연결의 시간 초과 여부를 확인하는 스레드 풀 |  |  |
|  | {name="connect-scheduler-pool"} | Num | MySQL 연결 요청을 수신하는 스레드 풀 |  |  |
|  | {name="mysql-nio-pool"} | Num | NIO MySQL Server가 태스크를 처리하는 데 사용하는 스레드 풀 |  |  |
|  | {name="export-exporting-job-pool"} | Num | exporting 상태의 내보내기 작업을 위한 스케줄링 스레드 풀 |  |  |
|  | {name="export-pending-job-pool"} | Num | pending 상태의 내보내기 작업을 위한 스케줄링 스레드 풀 |  |  |
|  | {name="heartbeat-mgr-pool"} | Num | Master FE가 각 노드의 heartbeat를 처리하는 데 사용하는 스레드 풀 |  |  |
|  | {name="loading-load-task-scheduler"} | Num | Master FE가 Broker Load 작업의 loading 태스크를 스케줄링하는 데 사용하는 스케줄링 스레드 풀 |  |  |
|  | {name="pending-load-task-scheduler"} | Num | Master FE가 Broker Load 작업의 pending 태스크를 스케줄링하는 데 사용하는 스케줄링 스레드 풀 |  |  |
|  | {name="schema-change-pool"} | Num | Master FE가 스키마 변경 작업을 스케줄링하는 데 사용하는 스레드 풀 |  |  |
|  | {name="thrift-server-pool"} | Num | FE 측 ThriftServer의 작업 스레드 풀입니다. fe.conf의 `rpc_port`에 해당하며 BE와 통신하는 데 사용합니다 |  |  |
| `doris_fe_txn_counter` |  | Num | 상태별 데이터 적재 트랜잭션의 누적 수 | 데이터 적재 트랜잭션의 실행 상태를 확인합니다 | P0 |
|  | {type="begin"} | Num | 시작된 트랜잭션 수 |  |  |
|  | {type="failed"} | Num | 실패한 트랜잭션 수 |  |  |
|  | {type="reject"} | Num | 거부된 트랜잭션 수입니다(예를 들어 현재 실행 중인 트랜잭션 수가 임계값을 초과하면 새 트랜잭션이 거부됨) |  |  |
|  | {type="success"} | Num | 성공한 트랜잭션 수 |  |  |
| `doris_fe_txn_status` |  | Num | 현재 각 상태에 있는 데이터 적재 트랜잭션 수입니다. 예를 들어 {type="committed"}는 committed 상태의 트랜잭션 수를 나타냅니다 | 상태별 데이터 적재 트랜잭션 수를 확인하여 적체 여부를 판단합니다 | P0 |
| `doris_fe_query_instance_num` |  | Num | 특정 사용자가 현재 요청 중인 fragment 인스턴스 수입니다. 예를 들어 {user="test_u"}는 사용자 test_u가 현재 요청 중인 인스턴스 수를 나타냅니다 | 특정 사용자가 쿼리 리소스를 과도하게 사용하고 있는지 확인하는 데 사용합니다 | P0 |
| `doris_fe_query_instance_begin` |  | Num | 특정 사용자가 요청을 시작한 fragment 인스턴스 수입니다. 예를 들어 {user="test_u"}는 사용자 test_u가 요청을 시작한 인스턴스 수를 나타냅니다 | 특정 사용자가 쿼리를 과도하게 제출했는지 확인하는 데 사용합니다 | P0 |
| `doris_fe_query_rpc_total` |  | Num | 특정 BE로 전송한 RPC 수입니다. 예를 들어 {be="192.168.10.1"}는 IP가 192.168.10.1인 BE로 전송한 RPC 수를 나타냅니다 | 특정 BE에 RPC가 과도하게 제출되었는지 확인하는 데 사용합니다 |  |
| `doris_fe_query_rpc_failed` |  | Num | 특정 BE로 전송한 RPC의 실패 횟수입니다. 예를 들어 {be="192.168.10.1"}는 IP가 192.168.10.1인 BE로 전송한 RPC의 실패 횟수를 나타냅니다 | 특정 BE에 RPC 문제가 있는지 확인하는 데 사용합니다 |  |
| `doris_fe_query_rpc_size` |  | Num | 특정 BE에 대한 RPC 데이터 크기입니다. 예를 들어 {be="192.168.10.1"}는 IP가 192.168.10.1인 BE로 전송한 RPC 데이터의 바이트 수를 나타냅니다 | 특정 BE에 지나치게 큰 RPC가 제출되었는지 확인하는 데 사용합니다 |  |
| `doris_fe_txn_exec_latency_ms` |  | Milliseconds | 트랜잭션 실행 시간의 백분위수 통계입니다. 예를 들어 {quantile="0.75"}는 75번째 백분위수의 트랜잭션 실행 시간을 나타냅니다 | 각 백분위수의 트랜잭션 실행 시간을 자세히 확인합니다 | P0 |
| `doris_fe_txn_publish_latency_ms` |  | Milliseconds | 트랜잭션 게시 시간의 백분위수 통계입니다. 예를 들어 {quantile="0.75"}는 75번째 백분위수의 트랜잭션 게시 시간을 나타냅니다 | 각 백분위수의 트랜잭션 게시 시간을 자세히 확인합니다 | P0 |
| `doris_fe_txn_num` |  | Num | 특정 DB에서 현재 실행 중인 트랜잭션 수입니다. 예를 들어 {db="test"}는 DB test에서 현재 실행 중인 트랜잭션 수를 나타냅니다 | 특정 DB가 많은 트랜잭션을 제출했는지 확인하는 데 사용합니다 | P0 |
| `doris_fe_publish_txn_num` |  | Num | 특정 DB에서 현재 게시 중인 트랜잭션 수입니다. 예를 들어 {db="test"}는 DB test에서 현재 게시 중인 트랜잭션 수를 나타냅니다 | 특정 DB의 게시 중인 트랜잭션 수를 확인하는 데 사용합니다 | P0 |
| `doris_fe_txn_replica_num` |  | Num | 특정 DB에서 현재 실행 중인 트랜잭션이 연 복제본 수입니다. 예를 들어 {db="test"}는 DB test에서 현재 실행 중인 트랜잭션이 연 복제본 수를 나타냅니다 | 특정 DB가 복제본을 과도하게 열어 다른 트랜잭션의 실행에 영향을 주는지 확인하는 데 사용합니다 | P0 |
| `doris_fe_thrift_rpc_total` |  | Num | FE thrift 인터페이스의 각 메서드가 수신한 RPC 요청 수입니다. 예를 들어 {method="report"}는 report 메서드가 수신한 RPC 요청 수를 나타냅니다 | 특정 thrift rpc 메서드의 부하를 확인하는 데 사용합니다 |  |
| `doris_fe_thrift_rpc_latency_ms` |  | Milliseconds | FE thrift 인터페이스의 각 메서드에 대한 RPC 요청 처리 시간입니다. 예를 들어 {method="report"}는 report 메서드의 RPC 요청 처리 시간을 나타냅니다 | 특정 thrift rpc 메서드의 부하를 확인하는 데 사용합니다 |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | Num | 특정 External Catalog의 스키마 캐시 항목 수 |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | Num |  |  |  |
|  | `{type="partition_value"}` | Num | 특정 External Hive Metastore Catalog의 파티션 값 캐시 항목 수 |  |  |
|  | `{type="partition"}` | Num | 특정 External Hive Metastore Catalog의 파티션 캐시 항목 수 |  |  |
|  | `{type="file"}` | Num | 특정 External Hive Metastore Catalog의 파일 캐시 항목 수 |  |  |
| `doris_fe_virtual_compute_group_switch_total` | `{virtual_compute_group_id, virtual_compute_group_name, src_compute_group_id, src_compute_group_name, dst_compute_group_id, dst_compute_group_name}` | Num | 가상 컴퓨팅 그룹의 활성-대기 전환 누적 횟수입니다. 버전 4.0.8부터 지원하며, 컴퓨팅과 스토리지 분리 모드에서만 생성됩니다 | 기울기를 통해 가상 컴퓨팅 그룹의 전환이 빈번한지 확인할 수 있습니다. 전환이 빈번하면 일반적으로 기본 컴퓨팅 그룹이 불안정함을 의미합니다 |  |

### JVM 모니터링 {#jvm-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | Bytes | JVM 메모리 모니터링입니다. 레이블에는 max, used, committed가 있으며, 각각 최대 메모리, 사용 중인 메모리, 커밋된 메모리에 해당합니다 | JVM 메모리 사용량을 확인합니다 | P0 |
| `jvm_non_heap_size_bytes` |  | Bytes | JVM 힙 외부 메모리 통계 |  |  |
| `<GarbageCollector>` |  |  | GC 모니터링 | GarbageCollector는 특정 가비지 컬렉터를 가리킵니다 | P0 |
|  | {type="count"} | Num | 누적 GC 횟수 |  |  |
|  | {type="time"} | Milliseconds | 누적 GC 시간 |  |  |
| `jvm_old_size_bytes` |  | Bytes | JVM old generation 메모리 통계 |  | P0 |
| `jvm_thread` |  | Num | JVM 스레드 수 통계 | JVM 스레드 수가 적절한지 확인합니다 | P0 |
| `jvm_young_size_bytes` |  | Bytes | JVM young generation 메모리 통계 |  | P0 |

### 머신 모니터링 {#machine-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | Bytes | FE 노드 머신의 메모리 모니터링입니다. `/proc/meminfo`에서 수집합니다. `buffers`, `cached`, `memory_available`, `memory_free`, `memory_total`을 포함합니다 |  |  |
| `system_snmp` |  |  | FE 노드 머신의 네트워크 모니터링입니다. `/proc/net/snmp`에서 수집합니다 |  |  |
|  | `{name="tcp_in_errs"}` | Num | tcp 패킷 수신 오류 수 |  |  |
|  | `{name="tcp_in_segs"}` | Num | 수신한 tcp 패킷 수 |  |  |
|  | `{name="tcp_out_segs"}` | Num | 전송한 tcp 패킷 수 |  |  |
|  | `{name="tcp_retrans_segs"}` | Num | tcp 패킷 재전송 횟수 |  |  |

## BE 모니터링 지표 {#be-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### 프로세스 모니터링 {#process-monitoring-1}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | Num | 외부 시스템이 현재 직접 연 scanner 수를 보여 줍니다 |  |  |
| `doris_be_add_batch_task_queue_size` |  | Num | 데이터 적재 중 배치를 수신하는 스레드 풀의 대기열 크기를 기록합니다 | 0보다 크면 데이터 적재 태스크의 수신 측에 적체가 있음을 나타냅니다 | P0 |
| `agent_task_queue_size` |  | Num | 각 Agent Task 처리 대기열의 길이를 보여 줍니다. 예를 들어 `{type="CREATE_TABLE"}`은 CREATE_TABLE 태스크 대기열의 길이를 나타냅니다 |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | Num | BE 간 통신에 사용하기 위해 생성된 brpc stub 수 |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | Num | Remote RPC와의 통신에 사용하기 위해 생성된 brpc stub 수 |  |  |
| `doris_be_cache_capacity` |  |  | 특정 LRU Cache의 용량을 기록합니다 |  |  |
| `doris_be_cache_usage` |  |  | 특정 LRU Cache의 사용량을 기록합니다 | 메모리 사용량을 확인합니다 | P0 |
| `doris_be_cache_usage_ratio` |  |  | 특정 LRU Cache의 사용률을 기록합니다 |  |  |
| `doris_be_cache_lookup_count` |  |  | 특정 LRU Cache의 조회 횟수를 기록합니다 |  |  |
| `doris_be_cache_hit_count` |  |  | 특정 LRU Cache의 적중 횟수를 기록합니다 |  |  |
| `doris_be_cache_hit_ratio` |  |  | 특정 LRU Cache의 적중률을 기록합니다 | 캐시가 효과적으로 동작하는지 확인합니다 | P0 |
|  | {name="DataPageCache"} | Num | DataPageCache는 데이터의 Data Page를 캐시합니다 | 데이터 캐시로, 쿼리 효율에 직접적인 영향을 줍니다 | P0 |
|  | {name="IndexPageCache"} | Num | IndexPageCache는 데이터의 Index Page를 캐시합니다 | 인덱스 캐시로, 쿼리 효율에 직접적인 영향을 줍니다 | P0 |
|  | {name="LastSuccessChannelCache"} | Num | LastSuccessChannelCache는 데이터 적재 수신 측의 LoadChannel을 캐시합니다 |  |  |
|  | {name="SegmentCache"} | Num | SegmentCache는 인덱스 정보 등 열린 Segment를 캐시합니다 |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | Num | ChunkAllocator에서 바인딩된 코어의 메모리 큐로부터 메모리를 할당한 횟수 |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | Num | ChunkAllocator에서 다른 코어의 메모리 큐로부터 메모리를 할당한 횟수 |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | Bytes | ChunkAllocator에 예약된 메모리 크기 |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | Nanoseconds | SystemAllocator의 메모리 할당에 소요된 누적 시간 | 기울기를 통해 메모리 할당에 드는 시간을 확인합니다 | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | Num | SystemAllocator의 메모리 할당 횟수 |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | Nanoseconds | SystemAllocator의 메모리 해제에 소요된 누적 시간 | 기울기를 통해 메모리 해제에 드는 시간을 확인합니다 | P0 |
| `doris_be_chunk_pool_system_free_count` |  | Num | SystemAllocator의 메모리 해제 횟수 |  |  |
| `doris_be_compaction_bytes_total` |  | Bytes | Compaction이 처리한 누적 데이터 양 | Compaction 태스크의 입력 rowset이 차지하는 디스크 크기를 기록합니다. 기울기를 통해 Compaction 처리 속도를 확인합니다 | P0 |
|  | {type="base"} | Bytes | Base Compaction의 누적 데이터 양 |  |  |
|  | {type="cumulative"} | Bytes | Cumulative Compaction의 누적 데이터 양 |  |  |
| `doris_be_compaction_deltas_total` |  | Num | Compaction이 처리한 rowset의 누적 수 | Compaction 태스크의 입력 rowset 수를 기록합니다 |  |
|  | {type="base"} | Num | Base Compaction이 처리한 rowset의 누적 수 |  |  |
|  | {type="cumulative"} | Num | Cumulative Compaction이 처리한 rowset의 누적 수 |  |  |
| `doris_be_disks_compaction_num` |  | Num | 특정 데이터 디렉터리에서 현재 실행 중인 Compaction 태스크 수입니다. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리에서 현재 실행 중인 태스크 수를 나타냅니다 | 각 디스크의 Compaction 태스크 수가 적절한지 확인합니다 | P0 |
| `doris_be_disks_compaction_score` |  | Num | 특정 데이터 디렉터리에서 현재 실행 중인 Compaction 토큰 수입니다. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리에서 현재 실행 중인 토큰 수를 나타냅니다 |  |  |
| `doris_be_compaction_used_permits` |  | Num | Compaction 태스크가 이미 사용 중인 토큰 수 | Compaction의 리소스 소비량을 나타냅니다 |  |
| `doris_be_compaction_waitting_permits` |  | Num | Compaction 토큰을 기다리는 항목 수 |  |  |
| `doris_be_data_stream_receiver_count` |  | Num | 수신 측의 데이터 Receiver 수 | FIXME: 벡터화 엔진에는 이 지표가 없습니다 |  |
| `doris_be_disks_avail_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크의 남은 공간입니다. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리가 위치한 디스크의 남은 공간을 나타냅니다 |  | P0 |
| `doris_be_disks_local_used_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크에서 로컬로 사용 중인 공간 |  |  |
| `doris_be_disks_remote_used_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크에 대응하는 원격 디렉터리의 사용 공간 |  |  |
| `doris_be_disks_state` |  | Boolean | 특정 데이터 디렉터리의 디스크 상태입니다. 1은 정상, 0은 비정상을 나타냅니다 |  |  |
| `doris_be_disks_total_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크의 총용량 | `doris_be_disks_avail_capacity`와 함께 사용하여 디스크 사용량을 계산합니다 | P0 |
| `doris_be_engine_requests_total` |  | Num | BE의 다양한 태스크 실행 상태별 누적 횟수 |  |  |
|  | {status="failed",type="xxx"} | Num | xxx 유형 태스크의 누적 실패 횟수 |  |  |
|  | {status="total",type="xxx"} | Num | xxx 유형 태스크의 누적 총 실행 횟수 | 필요에 따라 다양한 태스크 유형의 실패 횟수를 모니터링합니다 | P0 |
|  | `{status="skip",type="report_all_tablets"}` | Num | xxx 유형 태스크를 건너뛴 누적 횟수 |  |  |
| `doris_be_fragment_endpoint_count` |  | Num | `doris_be_data_stream_receiver_count`와 동일 | FIXME: `doris_be_data_stream_receiver_count`와 같은 수를 나타냅니다. 이 지표도 벡터화 엔진에는 없습니다 |  |
| `doris_be_fragment_request_duration_us` |  | Microseconds | 모든 fragment 인스턴스의 누적 실행 시간 | 기울기를 통해 인스턴스 실행 시간을 확인합니다 | P0 |
| `doris_be_fragment_requests_total` |  | Num | 실행된 fragment 인스턴스의 누적 수 |  |  |
| `doris_be_load_channel_count` |  | Num | 현재 열려 있는 데이터 적재 채널 수 | 값이 클수록 현재 실행 중인 데이터 적재 태스크가 많습니다 | P0 |
| `doris_be_local_bytes_read_total` |  | Bytes | `LocalFileReader`가 읽은 바이트 수 |  | P0 |
| `doris_be_local_bytes_written_total` |  | Bytes | `LocalFileWriter`가 쓴 바이트 수 |  | P0 |
| `doris_be_local_file_reader_total` |  | Num | 열린 `LocalFileReader` 인스턴스의 누적 수 |  |  |
| `doris_be_local_file_open_reading` |  | Num | 현재 열려 있는 `LocalFileReader` 인스턴스 수 |  |  |
| `doris_be_local_file_writer_total` |  | Num | 열린 `LocalFileWriter` 인스턴스의 누적 수 |  |  |
| `doris_be_mem_consumption` |  | Bytes | 특정 모듈의 현재 메모리 사용량입니다. 예를 들어 {type="compaction"}은 Compaction 모듈의 현재 총 메모리 사용량을 나타냅니다 | 같은 유형의 MemTracker에서 가져온 값입니다. FIXME |  |
| `doris_be_memory_allocated_bytes` |  | Bytes | BE 프로세스의 물리 메모리 크기로, `/proc/self/status/VmRSS`에서 가져옵니다 |  | P0 |
| `doris_be_memory_jemalloc` |  | Bytes | `je_mallctl`에서 가져온 Jemalloc 통계 | 의미는 다음을 참고하세요: https://jemalloc.net/jemalloc.3.html | P0 |
| `doris_be_memory_pool_bytes_total` |  | Bytes | 현재 모든 MemPool이 차지하는 메모리 크기입니다. 실제 메모리 사용량을 나타내지는 않는 통계값입니다 |  |  |
| `doris_be_memtable_flush_duration_us` |  | Microseconds | memtable을 디스크에 쓰는 데 소요된 누적 시간 | 기울기를 통해 쓰기 지연 시간을 확인합니다 | P0 |
| `doris_be_memtable_flush_total` |  | Num | 디스크에 기록된 memtable의 누적 수 | 기울기를 통해 파일 쓰기 빈도를 계산합니다 | P0 |
| `doris_be_meta_request_duration` |  | Microseconds | RocksDB의 메타데이터 접근에 소요된 누적 시간 | 기울기를 통해 BE 메타데이터 읽기/쓰기 지연 시간을 확인합니다 | P0 |
|  | {type="read"} | Microseconds | 읽기 시간 |  |  |
|  | {type="write"} | Microseconds | 쓰기 시간 |  |  |
| `doris_be_meta_request_total` |  | Num | RocksDB의 메타데이터에 접근한 누적 횟수 | 기울기를 통해 BE 메타데이터 접근 빈도를 확인합니다 | P0 |
|  | {type="read"} | Num | 읽기 횟수 |  |  |
|  | {type="write"} | Num | 쓰기 횟수 |  |  |
| `doris_be_fragment_instance_count` |  | Num | 현재 수신된 fragment 인스턴스 수 | 인스턴스가 적체되는지 확인합니다 | P0 |
| `doris_be_process_fd_num_limit_hard` |  | Num | BE 프로세스의 파일 핸들 수에 대한 하드 한도입니다. `/proc/pid/limits`에서 수집합니다 |  |  |
| `doris_be_process_fd_num_limit_soft` |  | Num | BE 프로세스의 파일 핸들 수에 대한 소프트 한도입니다. `/proc/pid/limits`에서 수집합니다 |  |  |
| `doris_be_process_fd_num_used` |  | Num | BE 프로세스가 사용하는 파일 핸들 수입니다. `/proc/self/fd`의 항목 수를 세어 수집합니다 |  |  |
| `doris_be_process_thread_num` |  | Num | BE 프로세스의 스레드 수입니다. `/proc/pid/task`에서 수집합니다 |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | Bytes | Query Cache가 차지하는 바이트 수 |  |  |
| `doris_be_query_cache_partition_total_count` |  | Num | Partition Cache의 현재 항목 수 |  |  |
| `doris_be_query_cache_sql_total_count` |  | Num | SQL Cache의 현재 항목 수 |  |  |
| `doris_be_query_scan_bytes` |  | Bytes | 읽은 데이터의 누적 양입니다. Olap 테이블에서 읽은 데이터만 집계합니다 |  |  |
| `doris_be_query_scan_bytes_per_second` |  | Bytes/Sec | `doris_be_query_scan_bytes`로 계산한 읽기 속도 | 쿼리 처리 속도를 확인합니다 | P0 |
| `doris_be_query_scan_rows` |  | Num | 읽은 행의 누적 수입니다. Olap 테이블에서 읽은 데이터만 집계합니다. 이 값은 RawRowsRead입니다(일부 데이터 행은 인덱스에 의해 건너뛰어 실제로 읽지 않을 수 있지만, 이 값에는 여전히 포함됨) | 기울기를 통해 쿼리 처리 속도를 확인합니다 | P0 |
| `doris_be_result_block_queue_count` |  | Num | 현재 쿼리 결과 캐시에 있는 fragment 인스턴스 수 | 이 대기열은 외부 시스템이 직접 읽는 경우에만 사용합니다. 예를 들어 Spark on Doris는 external scan을 통해 데이터를 쿼리합니다 |  |
| `doris_be_result_buffer_block_count` |  | Num | 현재 쿼리 결과 캐시에 있는 쿼리 수 | 이 값은 현재 BE에서 FE의 소비를 기다리는 쿼리 결과 수를 나타냅니다 | P0 |
| `doris_be_routine_load_task_count` |  | Num | 현재 실행 중인 Routine Load 태스크 수 |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | Num | 마지막 시작 이후 새로 추가되어 사용 중인 rowset ID 수 |  |  |
| `doris_be_s3_bytes_read_total` |  | Num | `S3FileReader`를 연 누적 횟수 |  |  |
| `doris_be_s3_file_open_reading` |  | Num | 현재 열려 있는 `S3FileReader` 인스턴스 수 |  |  |
| `doris_be_s3_bytes_read_total` |  | Bytes | `S3FileReader`가 읽은 누적 바이트 수 |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | Num | OlapScanner에 사용하는 스레드 풀의 현재 대기열 크기 | 값이 양수이면 Scanner가 적체되기 시작했음을 나타냅니다 | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | Num | 읽은 segment의 누적 수 |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | Num | segment에서 읽은 행의 누적 수 | 이 값에는 인덱스로 필터링된 행도 포함됩니다. 읽은 segment 수에 segment당 총 행 수를 곱한 값에 해당합니다 |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | Num | 데이터 적재 중 데이터 패킷을 전송하는 스레드 풀의 대기열 크기 | 값이 0보다 크면 적체가 있음을 나타냅니다 | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | Num | 데이터 적재 중 데이터 패킷을 전송하는 스레드 풀의 스레드 수 |  |  |
| `doris_be_small_file_cache_count` |  | Num | 현재 BE에 캐시된 작은 파일 수 |  |  |
| `doris_be_streaming_load_current_processing` |  | Num | 현재 실행 중인 Stream Load 태스크 수 | curl 명령으로 전송한 태스크만 포함합니다 |  |
| `doris_be_streaming_load_duration_ms` |  | Milliseconds | 모든 Stream Load 태스크의 누적 실행 시간 |  |  |
| `doris_be_streaming_load_requests_total` |  | Num | Stream Load 태스크의 누적 수 | 기울기를 통해 태스크 제출 빈도를 확인합니다 | P0 |
| `doris_be_stream_load_pipe_count` |  | Num | 현재 Stream Load 데이터 파이프 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 |  |
| `doris_be_stream_load` | {type="load_rows"} | Num | Stream Load로 최종 적재된 행의 누적 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | Bytes | Stream Load가 수신한 누적 바이트 수 | Stream Load가 HTTP를 통해 수신한 데이터와 Routine Load가 Kafka에서 읽은 데이터를 포함합니다 | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | Num | 현재 최대 Base Compaction Score | 이 값은 실시간으로 변하므로 최고점을 놓칠 수 있습니다. 값이 높을수록 Compaction 적체가 심합니다 | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | Num | 모든 Cumulative Compaction 전략에서 현재 가장 큰 Compaction Score | 모든 전략을 통틀어 가장 큰 값을 나타내는 지표로 유지됩니다 |  |
| `doris_be_tablet_version_num_distribution` |  | Num | tablet 버전 수의 히스토그램 | tablet 버전 수의 분포를 나타냅니다 | P0 |
| `doris_be_thrift_connections_total` |  | Num | 생성된 thrift 연결의 누적 수입니다. 예를 들어 `{name="heartbeat"}`는 heartbeat 서비스에 대한 누적 연결 수를 나타냅니다 | 이 값은 BE가 서버 역할을 하는 thrift 서버에 대한 값입니다 |  |
| `doris_be_thrift_current_connections` |  | Num | 현재 thrift 연결 수입니다. 예를 들어 `{name="heartbeat"}`는 heartbeat 서비스에 대한 현재 연결 수를 나타냅니다 | 위와 동일 |  |
| `doris_be_thrift_opened_clients` |  | Num | 현재 열려 있는 thrift 클라이언트 수입니다. 예를 들어 `{name="frontend"}`는 FE 서비스에 접근하는 클라이언트 수를 나타냅니다 |  |  |
| `doris_be_thrift_used_clients` |  | Num | 현재 사용 중인 thrift 클라이언트 수입니다. 예를 들어 `{name="frontend"}`는 FE 서비스에 접근하는 데 현재 사용 중인 클라이언트 수를 나타냅니다 |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | Num | 시간 초과로 취소된 fragment 인스턴스의 누적 수 | 이 값은 중복 기록될 수 있습니다. 예를 들어 일부 fragment 인스턴스는 여러 번 취소될 수 있습니다 | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | Num | 시작된 Stream Load 트랜잭션의 누적 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | Num | 성공적으로 커밋된 Stream Load 트랜잭션의 누적 수 | 위와 동일 |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | Num | 실패한 Stream Load 트랜잭션의 누적 수 | 위와 동일 |  |
| `doris_be_unused_rowsets_count` |  | Num | 현재 더 이상 사용하지 않는 rowset 수 | 이 rowset은 정상적인 상황에서는 주기적으로 삭제됩니다 |  |
| `doris_be_upload_fail_count` |  | Num | 계층형 스토리지 기능에서 rowset을 원격 스토리지에 업로드하는 데 실패한 누적 횟수 |  |  |
| `doris_be_upload_rowset_count` |  | Num | 계층형 스토리지 기능에서 rowset을 원격 스토리지에 성공적으로 업로드한 누적 횟수 |  |  |
| `doris_be_upload_total_byte` |  | Bytes | 계층형 스토리지 기능에서 원격 스토리지에 성공적으로 업로드한 rowset의 누적 데이터 양 |  |  |
| `doris_be_load_bytes` |  | Bytes | tablet sink를 통해 전송한 누적 바이트 수 | 데이터 적재량을 확인합니다 | P0 |
| `doris_be_load_rows` |  | Num | tablet sink를 통해 전송한 행의 누적 수 | 데이터 적재량을 확인합니다 | P0 |
| `fragment_thread_pool_queue_size` |  | Num | 쿼리 실행 스레드 풀의 현재 대기열 길이 | 값이 양수이면 쿼리 스레드가 모두 사용 중이며 쿼리가 적체되고 있음을 나타냅니다 | P0 |
| `doris_be_all_rowsets_num` |  | Num | 현재 모든 rowset의 총수 |  | P0 |
| `doris_be_all_segments_num` |  | Num | 현재 모든 segment의 총수 |  | P0 |
| `doris_be_heavy_work_max_threads` |  | Num | brpc heavy 스레드 풀의 스레드 수 |  | P0 |
| `doris_be_light_work_max_threads` |  | Num | brpc light 스레드 풀의 스레드 수 |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | Num | brpc heavy 스레드 풀의 최대 대기열 길이입니다. 이를 초과하면 작업 제출이 차단됩니다 |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | Num | brpc light 스레드 풀의 최대 대기열 길이입니다. 이를 초과하면 작업 제출이 차단됩니다 |  | P0 |
| `doris_be_heavy_work_active_threads` |  | Num | brpc heavy 스레드 풀의 활성 스레드 수 |  | P0 |
| `doris_be_light_work_active_threads` |  | Num | brpc light 스레드 풀의 활성 스레드 수 |  | P0 |
| `routine_load_get_msg_latency` |  | Milliseconds | Routine Load의 Kafka 메시지 조회 지연 시간 |  |  |
| `routine_load_get_msg_count` |  | Num | Routine Load의 Kafka 메시지 조회 횟수 |  |  |
| `routine_load_consume_bytes` |  | Bytes | Routine Load가 Kafka에서 소비한 데이터 양 |  |  |
| `routine_load_consume_rows` |  | Num | Routine Load가 Kafka에서 소비한 행 수 |  |  |
| `doris_be_tablet_size_based_max_compaction_score` |  | Num | Size-based 전략의 현재 최대 Cumulative Compaction Score | Gauge이며, 4.1.5에서 추가되었습니다. 통합 모드와 컴퓨팅과 스토리지 분리 모드를 지원합니다 |  |
| `doris_be_tablet_time_series_max_compaction_score` |  | Num | Time-series 전략의 현재 최대 Cumulative Compaction Score | Gauge이며, 4.1.5에서 추가되었습니다. 통합 모드와 컴퓨팅과 스토리지 분리 모드를 지원합니다 |  |
| `doris_be_hdfs_file_open_reading` |  | Num | 실제로 열려 있는 현재 HDFS 파일 핸들 수 | Gauge입니다. 버전 4.1.5부터 reader 객체 대신 공유 파일 핸들을 집계합니다 |  |
| `doris_be_hdfs_file_reader_total` |  | Num | HDFS 파일 핸들을 성공적으로 연 누적 횟수 | Counter입니다. 버전 4.1.5부터 파일을 전혀 열지 않는 reader는 이 값을 증가시키지 않으며, 캐시된 핸들을 재사용할 때도 다시 집계하지 않습니다 |  |

전략별 두 Compaction Score는 최댓값입니다. 두 값을 더하거나 Counter의 증가율 계산을 적용하지 마세요. 전체 검사를 마친 후 적격 tablet이 없는 전략의 값은 영으로 재설정될 수 있습니다. 통합 모드 검사에서 디스크 용량 제한으로 일부 디렉터리를 건너뛰는 경우에는 이를 이유로 이전에 관측된 값을 낮추지 않습니다.

### 머신 모니터링 {#machine-monitoring-1}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | Num | `/proc/stat`에서 수집한 CPU 관련 모니터링 지표입니다. 각 논리 코어의 값을 수집합니다. 예를 들어 `{device="cpu0",mode="nice"}`는 cpu0의 nice 값을 나타냅니다 | 이 값으로 CPU 사용률을 계산할 수 있습니다 | P0 |
| `doris_be_disk_bytes_read` |  | Bytes | 누적 디스크 읽기 양입니다. `/proc/diskstats`에서 수집합니다. 각 디스크의 값을 수집합니다. 예를 들어 `{device="vdd"}`는 vdd 디스크의 값을 나타냅니다 |  |  |
| `doris_be_disk_bytes_written` |  | Bytes | 누적 디스크 쓰기 양입니다. 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_io_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 | 이 값으로 IO Util을 계산할 수 있습니다 | P0 |
| `doris_be_disk_io_time_weighted` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_reads_completed` |  | Num | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_read_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_writes_completed` |  | Num | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_write_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_fd_num_limit` |  | Num | 시스템 파일 핸들 수의 상한입니다. `/proc/sys/fs/file-nr`에서 수집합니다 |  |  |
| `doris_be_fd_num_used` |  | Num | 시스템이 사용하는 파일 핸들 수입니다. `/proc/sys/fs/file-nr`에서 수집합니다 |  |  |
| `doris_be_file_created_total` |  | Num | 로컬 파일 생성의 누적 횟수 | `local_file_writer`를 호출하고 최종적으로 닫힌 모든 파일을 집계합니다 |  |
| `doris_be_load_average` |  | Num | 머신의 Load Avg 지표를 모니터링합니다. 예를 들어 {mode="15_minutes"}는 15분 Load Avg입니다 | 머신의 전체 부하를 확인합니다 | P0 |
| `doris_be_max_disk_io_util_percent` |  | Percentage | 모든 디스크에서 계산된 IO UTIL의 최댓값 |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | Bytes/Sec | 모든 네트워크 인터페이스에서 계산된 수신 속도의 최댓값 |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | Bytes/Sec | 모든 네트워크 인터페이스에서 계산된 전송 속도의 최댓값 |  | P0 |
| `doris_be_memory_pgpgin` |  | Bytes | 시스템이 디스크에서 메모리 페이지로 기록한 데이터 양 |  |  |
| `doris_be_memory_pgpgout` |  | Bytes | 시스템 메모리 페이지에서 디스크로 기록한 데이터 양 |  |  |
| `doris_be_memory_pswpin` |  | Bytes | 시스템이 디스크에서 메모리로 스왑 인한 양 | 일반적으로 swap을 비활성화해야 하므로 이 값은 0이어야 합니다 |  |
| `doris_be_memory_pswpout` |  | Bytes | 시스템이 메모리에서 디스크로 스왑 아웃한 양 | 일반적으로 swap을 비활성화해야 하므로 이 값은 0이어야 합니다 |  |
| `doris_be_network_receive_bytes` |  | Bytes | 각 네트워크 인터페이스의 누적 수신 바이트 수입니다. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_receive_packets` |  | Num | 각 네트워크 인터페이스의 누적 수신 패킷 수입니다. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_send_bytes` |  | Bytes | 각 네트워크 인터페이스의 누적 전송 바이트 수입니다. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_send_packets` |  | Num | 각 네트워크 인터페이스의 누적 전송 패킷 수입니다. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | Num | CPU 컨텍스트 전환의 누적 횟수입니다. `/proc/stat`에서 수집합니다 | 비정상적인 컨텍스트 전환이 있는지 확인합니다 | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | Num | CPU 인터럽트의 누적 횟수입니다. `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | Num | 시스템에서 현재 차단된 프로세스 수입니다(예: IO 대기). `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | Num | 시스템에서 현재 실행 중인 프로세스 수입니다. `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_in_errs` |  | Num | tcp 패킷 수신 오류 수입니다. `/proc/net/snmp`에서 수집합니다 | 재전송, 패킷 손실 등의 네트워크 오류를 확인합니다. 다른 snmp 지표와 함께 사용합니다 | P0 |
| `doris_be_snmp_tcp_in_segs` |  | Num | 수신한 tcp 패킷 수입니다. `/proc/net/snmp`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_out_segs` |  | Num | 전송한 tcp 패킷 수입니다. `/proc/net/snmp`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | Num | tcp 패킷 재전송 횟수입니다. `/proc/net/snmp`에서 수집합니다 |  |  |

## bvar 진단 지표 {#bvar-diagnostic-metrics}

다음 지표는 버전 4.1.5부터 지원하며, 앞서 설명한 brpc 포트를 사용합니다. Counter는 프로세스 시작 시점부터 누적되며, Gauge는 현재 값을 나타냅니다.

| 이름 또는 접두사 | 프로세스 | 유형 | 의미 |
| --- | --- | --- | --- |
| `sync_tablets_meta_num` | 컴퓨팅과 스토리지 분리 모드의 BE | Counter | 백그라운드에서 tablet 메타데이터 동기화를 시도한 누적 횟수입니다. 호출 전에 집계하므로 성공한 호출 수를 나타내지는 않습니다 |
| `sync_tablets_rowsets_num` | 컴퓨팅과 스토리지 분리 모드의 BE | Counter | 백그라운드에서 tablet rowset 동기화를 시도한 누적 횟수입니다. 호출 전에 집계하므로 성공한 호출 수를 나타내지는 않습니다 |
| `vertical_compaction_active_segment_contexts` | BE | Gauge | 수직 Compaction이 보유한 활성 Segment 컨텍스트의 현재 수 |
| `hdfs_get_path_info` | BE | 지연 시간 통계, 마이크로초 | HDFS 파일 메타데이터 접근을 진단하기 위한 `hdfsGetPathInfo` 지연 시간 지표의 접두사 |
| `ms_repair_tablet_index` | Meta Service | Counter | 트랜잭션 커밋 중 누락된 `db_id`를 추가하여 복구한 과거 Tablet Index 레코드의 누적 수입니다. 커밋이 성공한 후에만 집계합니다 |
| `file_cache_ttl_mgr_ttl_info_map_size` (캐시 경로 접두사 포함) | BE | Gauge | 메모리에서 추적 중인 tablet TTL 정보 항목의 현재 수이며, 캐시 블록 수를 나타내지는 않습니다 |

캐시 경로 접두사와 축출 지표는 [File Cache 모니터링](../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics)을 참고하세요. 수직 Compaction이 끝나면 BE INFO 로그 필드 `vertical_compaction_active_segment_contexts_peak`에 해당 태스크의 최대 컨텍스트 수가 기록됩니다. 이는 로그 필드이며 별도의 프로세스 수준 Gauge가 아닙니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: 모니터링 엔드포인트에서 404가 반환됩니다. 어떻게 해야 하나요? {#q-the-monitoring-endpoint-returns-404-what-should-i-do}

FE의 `http_port` 또는 BE의 `webserver_port`에 접속하고 있는지 확인하고, `fe.conf` / `be.conf`에서 실제 포트 값을 확인하세요.

### Q: Counter 지표는 증가하기만 하고 감소하지 않습니다. 정상인가요? {#q-counter-metrics-only-increase-and-never-decrease-is-this-normal}

정상입니다. Counter는 누적값을 나타냅니다. 순간 증가율을 구하려면 일정 간격으로 샘플링하고 기울기를 계산해야 합니다(예: PromQL의 `rate()`).

### Q: 여러 FE 간 `doris_fe_max_journal_id` 차이가 너무 큽니다. 어떻게 해야 하나요? {#q-the-gap-of-doris_fe_max_journal_id-between-multiple-fes-is-too-large-what-should-i-do}

메타데이터 동기화가 지연되고 있음을 나타냅니다. Master FE에 대한 Follower / Observer FE의 네트워크 연결 상태와 로그 재생 속도를 확인하세요.

### Q: Compaction Score가 계속 너무 높습니다. 어떻게 문제를 해결하나요? {#q-compaction-score-remains-too-high-how-do-i-troubleshoot}

`doris_be_tablet_base_max_compaction_score`와 `doris_be_tablet_cumulative_max_compaction_score`를 중점적으로 살펴보고, 디스크 IO 및 Compaction 태스크 수와 함께 분석하여 병목 지점을 파악하세요.

### Q: 쿼리나 데이터 적재가 적체되고 있습니다. 어떻게 문제를 해결하나요? {#q-queries-or-loads-are-accumulating-how-do-i-troubleshoot}

`fragment_thread_pool_queue_size`, `doris_be_scanner_thread_pool_queue_size`, `doris_be_send_batch_thread_pool_queue_size` 등의 스레드 풀 대기열 지표를 확인하세요.
