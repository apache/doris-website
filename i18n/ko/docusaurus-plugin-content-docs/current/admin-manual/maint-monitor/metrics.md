---
{
    "title": "모니터링 지표",
    "language": "ko",
    "description": "Doris FE 및 BE의 프로세스, JVM, 머신 모니터링 지표를 포괄적으로 정리하고 P0 우선순위를 표시하여 클러스터 상태 모니터링과 알림 설정을 지원하는 참고 문서입니다."
}
---

# 모니터링 지표 {#monitoring-metrics}

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

Doris의 FE 및 BE 프로세스에는 모니터링 지표가 내장되어 있으며, 기본적으로 Prometheus 호환 형식으로 노출됩니다. 이 문서는 관찰할 수 있는 모든 지표를 체계적으로 나열하고 우선순위(Priority)를 표시합니다. Prometheus + Grafana와 연동한 뒤 모니터링 및 알림 시스템을 빠르게 구축하는 데 활용할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 목적 |
| --- | --- |
| 클러스터 상태 모니터링 | P0 지표로 FE/BE 노드의 이상을 빠르게 감지 |
| 알림 설정 | QPS, 오류율, Compaction Score 등의 지표에 임계값 기반 알림 설정 |
| 성능 문제 해결 | 쿼리 지연 시간, 스레드 풀 대기열, 메모리 사용량 지표로 병목 지점 파악 |
| 용량 계획 | 디스크 사용량, tablet 수, 연결 수로 클러스터 부하 평가 |
| 장애 분석 | 머신 지표(CPU, IO, 네트워크)와 프로세스 지표를 함께 살펴 장애의 근본 원인 분석 |

## 지표 분류 {#metric-categories}

Doris 모니터링 지표는 관찰 대상에 따라 두 범주로 나뉩니다.

1. **프로세스 모니터링**: 쿼리 수, 트랜잭션 수, Compaction 상태 등 Doris 프로세스 자체의 실행 지표를 보여줍니다.
2. **노드 모니터링**: CPU, 메모리, IO, 네트워크 등 Doris 프로세스가 실행되는 머신의 리소스 지표를 보여줍니다.

## 모니터링 지표 가져오기 {#retrieving-monitoring-metrics}

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

`type=json` 매개변수를 사용하면 JSON 형식으로 지표를 가져올 수 있습니다.

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

### bvar 지표 {#bvar-metrics}

BE 및 Meta Service / Recycler 프로세스는 brpc 서비스를 통해서도 bvar 지표를 내보냅니다. Prometheus 호환 출력에는 `/brpc_metrics`를 사용하고, 이름별 진단 정보 확인에는 `/vars`를 사용합니다.

```shell
curl http://be_host:brpc_port/brpc_metrics
curl http://be_host:brpc_port/vars
curl http://cloud_host:brpc_listen_port/brpc_metrics
```

이 엔드포인트는 BE의 `brpc_port`(기본값 `8060`) 또는 Meta Service / Recycler의 `brpc_listen_port`(기본값 `5000`)를 사용합니다. 앞서 설명한 FE / BE의 HTTP 모니터링 포트와는 다릅니다. 아래 bvar 이름은 등록된 이름을 그대로 사용하므로 모두 `doris_be_` 접두사를 갖는 것은 아닙니다.

#### 버전 식별 {#version-identification}

버전 4.1.5부터 BE 및 Meta Service / Recycler의 버전 지표에는 `/brpc_metrics`에서 다음 레이블이 포함됩니다.

| 지표 | 유형 | 레이블 | 의미 |
| --- | --- | --- | --- |
| `doris_be_version` | Gauge | `version`, `major`, `minor`, `patch`, `hotfix`, `short_hash` | BE 빌드 버전과 커밋 식별자 |
| `doris_cloud_version` | Gauge | 위와 동일 | Meta Service / Recycler 빌드 버전과 커밋 식별자 |

각 프로세스는 버전 샘플을 하나씩 내보냅니다. 지표 값은 기존 버전 인코딩을 유지합니다. 전체 버전은 `version` 레이블에서, 커밋 식별자는 `short_hash`에서 확인하세요. `doris_cloud_version`은 프로세스가 Meta Service, Recycler 또는 둘 다 실행하는지를 구분하지 않습니다. 역할을 식별하려면 스크레이프 대상 레이블을 추가하세요.

프로세스의 `bvar_max_dump_multi_dimension_metric_num` 설정은 다차원 bvar 샘플의 수를 제한합니다. 기본값은 `5000`이며, `0`으로 설정하면 버전 지표와 같은 샘플이 비활성화됩니다. BE는 버전 4.1.5부터 이 설정을 지원하며, 변경 사항을 적용하려면 재시작해야 합니다. [BE 설정](../config/be-config.md#bvar_max_dump_multi_dimension_metric_num)을 참조하세요.

## 모니터링 우선순위 및 권장 사항 {#monitoring-priority-and-best-practices}

<!-- Knowledge type: Best practices -->

- 각 지표 표의 마지막 열은 우선순위(Priority)입니다. **P0이 가장 중요**하며, 값이 클수록 중요도가 낮습니다. P0 지표부터 연동하세요.
- 모니터링 지표의 대다수는 Counter(누적값) 유형입니다. **일정 간격(예: 15초)으로 샘플링하고 단위 시간당 기울기를 계산해야 유용한 정보를 얻을 수 있습니다**.

    예를 들어 `doris_fe_query_err`의 기울기를 계산하면 쿼리 오류율(초당 오류 수)을 구할 수 있습니다.

> 더 포괄적이고 유용한 모니터링 지표를 제공할 수 있도록 이 표에 기여해 주세요.

## FE 모니터링 지표 {#fe-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### 프로세스 모니터링 {#process-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | Num | 새로 추가된 Partition Cache의 누적 개수 |  |  |
|  | {type="sql"} | Num | 새로 추가된 SQL Cache의 누적 개수 |  |  |
| `doris_fe_cache_hit` | {type="partition"} | Num | Partition Cache 적중 횟수 |  |  |
|  | {type="sql"} | Num | SQL Cache 적중 횟수 |  |  |
| `doris_fe_connection_total` |  | Num | 현재 FE의 MySQL 포트 연결 수 | 쿼리 연결 수를 모니터링하는 데 사용합니다. 연결 수가 한도를 초과하면 새 연결을 받을 수 없습니다 | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | Num | SQL BLOCK RULE에 의해 차단된 쿼리 수 |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | Num | 이전 메타데이터 로그 정리 실패 횟수 | 실패해서는 안 됩니다. 실패하면 수동으로 조치해야 합니다 | P0 |
|  | {type="success"} | Num | 이전 메타데이터 로그 정리 성공 횟수 |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | Bytes | 메타데이터 로그 쓰기량의 누적값 | 기울기를 계산해 쓰기 속도를 구하고 메타데이터 쓰기 지연 여부를 살펴봅니다 | P0 |
|  | {type="current_bytes"} | Bytes | 메타데이터 로그의 현재 값 | editlog 크기를 모니터링하는 데 사용합니다. 크기가 한도를 초과하면 수동으로 조치해야 합니다 | P0 |
|  | {type="read"} | Num | 메타데이터 로그 읽기 횟수 | 기울기로 메타데이터 읽기 빈도가 정상인지 살펴봅니다 | P0 |
|  | {type="write"} | Num | 메타데이터 로그 쓰기 횟수 | 기울기로 메타데이터 쓰기 빈도가 정상인지 살펴봅니다 | P0 |
|  | {type="current"} | Num | 현재 메타데이터 로그 수 | editlog 수를 모니터링하는 데 사용합니다. 수가 한도를 초과하면 수동으로 조치해야 합니다 | P0 |
| `doris_fe_editlog_write_latency_ms` |  | Milliseconds | 메타데이터 로그 쓰기 지연 시간의 백분위 통계. 예를 들어 {quantile="0.75"}는 75번째 백분위의 쓰기 지연 시간을 나타냅니다 |  |  |
| `doris_fe_image_clean` | {type="failed"} | Num | 이전 메타데이터 이미지 파일 정리 실패 횟수 | 실패해서는 안 됩니다. 실패하면 수동으로 조치해야 합니다 | P0 |
|  | {type="success"} | Num | 이전 메타데이터 이미지 파일 정리 성공 횟수 |  |  |
| `doris_fe_image_push` | {type="failed"} | Num | 메타데이터 이미지 파일을 다른 FE 노드로 전송하다 실패한 횟수 |  |  |
|  | {type="success"} | Num | 메타데이터 이미지 파일을 다른 FE 노드로 전송한 성공 횟수 |  |  |
| `doris_fe_image_write` | {type="failed"} | Num | 메타데이터 이미지 파일 생성 실패 횟수 | 실패해서는 안 됩니다. 실패하면 수동으로 조치해야 합니다 | P0 |
|  | {type="success"} | Num | 메타데이터 이미지 파일 생성 성공 횟수 |  |  |
| `doris_fe_job` |  | Num | 유형과 상태별 작업 수. 예를 들어 {job="load", type="INSERT", state="LOADING"}은 LOADING 상태인 INSERT 유형 데이터 적재 작업의 수를 나타냅니다 | 필요에 따라 클러스터의 유형별 작업 수를 살펴봅니다 | P0 |
| `doris_fe_max_journal_id` |  | Num | 현재 FE 노드의 최대 메타데이터 로그 ID. Master FE에서는 현재까지 기록된 최대 ID이고, Master가 아닌 FE에서는 현재까지 재생된 메타데이터 로그의 최대 ID입니다 | 여러 FE의 ID 차이가 지나치게 큰지 살펴보는 데 사용합니다. 차이가 크면 메타데이터 동기화에 문제가 있음을 나타냅니다 | P0 |
| `doris_fe_max_tablet_compaction_score` |  | Num | 모든 BE 노드 중 최대 Compaction Score 값 | 현재 클러스터의 최대 Compaction Score가 지나치게 높은지 살펴봅니다. 값이 높으면 쿼리 또는 쓰기 지연이 발생할 수 있습니다 | P0 |
| `doris_fe_qps` |  | Num/Sec | 현재 FE의 초당 쿼리 수(쿼리 요청만 집계) | QPS | P0 |
| `doris_fe_query_err` |  | Num | 실패한 쿼리의 누적 수 |  |  |
| `doris_fe_query_err_rate` |  | Num/Sec | 초당 실패한 쿼리 수 | 클러스터에서 쿼리 오류가 발생하는지 살펴봅니다 | P0 |
| `doris_fe_query_latency_ms` |  | Milliseconds | 쿼리 요청 지연 시간의 백분위 통계. 예를 들어 {quantile="0.75"}는 75번째 백분위의 쿼리 지연 시간을 나타냅니다 | 각 백분위의 쿼리 지연 시간을 자세히 살펴봅니다 | P0 |
| `doris_fe_query_latency_ms_db` |  | Milliseconds | 각 DB의 쿼리 요청 지연 시간 백분위 통계. 예를 들어 {quantile="0.75",db="test"}는 DB test의 75번째 백분위 쿼리 지연 시간을 나타냅니다 | DB별 각 백분위의 쿼리 지연 시간을 자세히 살펴봅니다 | P0 |
| `doris_fe_query_olap_table` |  | Num | 내부 테이블(OlapTable)에 대한 쿼리 요청 수 |  |  |
| `doris_fe_query_total` |  | Num | 모든 쿼리 요청의 누적 수 |  |  |
| `doris_fe_report_queue_size` |  | Num | BE에서 보내는 여러 정기 보고 작업에 대한 FE 측 대기열 길이 | Master FE 노드에서 보고 작업이 막히는 정도를 나타냅니다. 값이 클수록 FE의 처리 용량이 부족합니다 | P0 |
| `doris_fe_request_total` |  | Num | MySQL 포트를 통해 받은 모든 작업 요청(쿼리 및 기타 명령문 포함) |  |  |
| `doris_fe_routine_load_error_rows` |  | Num | 클러스터의 모든 Routine Load 작업에서 발생한 오류 행의 총수 |  |  |
| `doris_fe_routine_load_receive_bytes` |  | Bytes | Routine Load 작업이 받은 소스 메시지 페이로드의 누적 바이트 수. WHERE 필터링 전에 측정하므로 WHERE에서 제외된 데이터도 포함합니다. 테이블에 기록된 바이트 수를 나타내지는 않습니다. |  |  |
| `doris_fe_routine_load_rows` |  | Num | 클러스터의 모든 Routine Load 작업이 받은 데이터 행의 총수 |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | Milliseconds | 클러스터의 모든 Routine Load 작업에서 메타데이터를 가져오는 데 걸린 지연 시간 |  |  |
| `doris_fe_routine_load_get_meta_count` |  | Num | 클러스터의 모든 Routine Load 작업에서 메타데이터를 가져온 횟수 |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | Num | 클러스터의 모든 Routine Load 작업에서 메타데이터를 가져오다 실패한 횟수 |  |  |
| `doris_fe_routine_load_task_execute_time` |  | Milliseconds | 클러스터의 모든 Routine Load 태스크 실행 시간 |  |  |
| `doris_fe_routine_load_task_execute_count` |  | Num | 클러스터의 모든 Routine Load 태스크 실행 횟수 |  |  |
| `doris_fe_routine_load_lag` |  | Milliseconds | 클러스터의 모든 Routine Load 작업의 소비 지연 시간 |  |  |
| `doris_fe_routine_load_progress` |  | Milliseconds | 클러스터의 모든 Routine Load 작업의 소비 진행 정도 |  |  |
| `doris_fe_routine_load_abort_task_num` |  | Num | 클러스터의 모든 Routine Load 작업에서 실패한 태스크 수 |  |  |
| `doris_fe_rps` |  | Num | 현재 FE의 초당 요청 수(쿼리 및 기타 유형의 명령문 포함) | QPS와 함께 사용하여 클러스터가 처리하는 요청량을 확인합니다 | P0 |
| `doris_fe_scheduled_tablet_num` |  | Num | Master FE 노드가 스케줄링 중인 tablet 수. 복구 중인 복제본과 균형 조정 중인 복제본을 포함합니다 | 현재 클러스터에서 마이그레이션 중인 tablet 수를 나타냅니다. 장시간 0이 아닌 값이 유지되면 클러스터가 불안정하다는 뜻입니다 | P0 |
| `doris_fe_tablet_max_compaction_score` |  | Num | 각 BE 노드가 보고한 Compaction Score. 예를 들어 {backend="172.21.0.1:9556"}은 "172.21.0.1:9556"의 BE가 보고한 값을 나타냅니다 |  |  |
| `doris_fe_tablet_num` |  | Num | 각 BE 노드의 전체 tablet 수. 예를 들어 {backend="172.21.0.1:9556"}은 "172.21.0.1:9556"의 BE에 있는 현재 tablet 수를 나타냅니다 | tablet 분포가 고른지, 절대적인 수가 적절한지 확인합니다 | P0 |
| `doris_fe_tablet_status_count` |  | Num | Master FE 노드의 Tablet 스케줄러가 스케줄링한 tablet의 누적 수 |  |  |
|  | {type="added"} | Num | Master FE 노드의 Tablet 스케줄러가 스케줄링한 tablet의 누적 수. "added"는 스케줄링된 tablet 수를 나타냅니다 |  |  |
|  | {type="in_sched"} | Num | 위와 동일. 반복해서 스케줄링된 tablet 수를 나타냅니다 | 이 값이 빠르게 증가하면 일부 tablet이 오랫동안 비정상 상태에 머물러 스케줄러가 반복해서 스케줄링하고 있다는 뜻입니다 |  |
|  | {type="not_ready"} | Num | 위와 동일. 아직 스케줄링 트리거 조건을 충족하지 못한 tablet 수를 나타냅니다 | 이 값이 빠르게 증가하면 많은 tablet이 비정상 상태이지만 스케줄링할 수 없다는 뜻입니다 |  |
|  | {type="total"} | Num | 위와 동일. 검사된 tablet의 누적 수를 나타내며, 반드시 스케줄링되었음을 뜻하지는 않습니다 |  |  |
|  | {type="unhealthy"} | Num | 위와 동일. 검사된 비정상 tablet의 누적 수를 나타냅니다 |  |  |
| `doris_fe_thread_pool` |  | Num | 여러 스레드 풀의 작업 스레드 및 대기열 통계. `active_thread_num`은 현재 실행 중인 태스크 수, `pool_size`는 풀의 전체 스레드 수, `task_in_queue`는 현재 대기 중인 태스크 수를 나타냅니다 |  |  |
|  | {name="agent-task-pool"} | Num | Master FE가 BE에 Agent Task를 보내는 데 사용하는 스레드 풀 |  |  |
|  | {name="connect-scheduler-check-timer"} | Num | 유휴 MySQL 연결의 시간 초과 여부를 확인하는 스레드 풀 |  |  |
|  | {name="connect-scheduler-pool"} | Num | MySQL 연결 요청을 받는 스레드 풀 |  |  |
|  | {name="mysql-nio-pool"} | Num | NIO MySQL Server가 태스크를 처리하는 데 사용하는 스레드 풀 |  |  |
|  | {name="export-exporting-job-pool"} | Num | exporting 상태인 export 작업의 스케줄링 스레드 풀 |  |  |
|  | {name="export-pending-job-pool"} | Num | pending 상태인 export 작업의 스케줄링 스레드 풀 |  |  |
|  | {name="heartbeat-mgr-pool"} | Num | Master FE가 각 노드의 하트비트를 처리하는 데 사용하는 스레드 풀 |  |  |
|  | {name="loading-load-task-scheduler"} | Num | Master FE가 Broker Load 작업의 loading 태스크를 스케줄링하는 데 사용하는 스레드 풀 |  |  |
|  | {name="pending-load-task-scheduler"} | Num | Master FE가 Broker Load 작업의 pending 태스크를 스케줄링하는 데 사용하는 스레드 풀 |  |  |
|  | {name="schema-change-pool"} | Num | Master FE가 스키마 변경 작업을 스케줄링하는 데 사용하는 스레드 풀 |  |  |
|  | {name="thrift-server-pool"} | Num | FE 측 ThriftServer의 작업 스레드 풀. fe.conf의 `rpc_port`에 해당하며 BE와 통신하는 데 사용합니다 |  |  |
| `doris_fe_txn_counter` |  | Num | 상태별 데이터 적재 트랜잭션의 누적 수 | 데이터 적재 트랜잭션의 실행 상태를 살펴봅니다 | P0 |
|  | {type="begin"} | Num | 시작된 트랜잭션 수 |  |  |
|  | {type="failed"} | Num | 실패한 트랜잭션 수 |  |  |
|  | {type="reject"} | Num | 거부된 트랜잭션 수(예: 현재 실행 중인 트랜잭션 수가 임계값을 초과해 새 트랜잭션이 거부된 경우) |  |  |
|  | {type="success"} | Num | 성공한 트랜잭션 수 |  |  |
| `doris_fe_txn_status` |  | Num | 현재 각 상태에 있는 데이터 적재 트랜잭션 수. 예를 들어 {type="committed"}는 committed 상태의 트랜잭션 수를 나타냅니다 | 상태별 데이터 적재 트랜잭션 수를 살펴보고 적체 여부를 판단합니다 | P0 |
| `doris_fe_query_instance_num` |  | Num | 특정 사용자가 현재 요청 중인 fragment instance 수. 예를 들어 {user="test_u"}는 사용자 test_u가 현재 요청 중인 instance 수를 나타냅니다 | 특정 사용자가 쿼리 리소스를 지나치게 많이 사용하고 있는지 살펴봅니다 | P0 |
| `doris_fe_query_instance_begin` |  | Num | 특정 사용자가 요청을 시작한 fragment instance 수. 예를 들어 {user="test_u"}는 사용자 test_u가 요청을 시작한 instance 수를 나타냅니다 | 특정 사용자가 지나치게 많은 쿼리를 제출했는지 살펴봅니다 | P0 |
| `doris_fe_query_rpc_total` |  | Num | 특정 BE에 보낸 RPC 수. 예를 들어 {be="192.168.10.1"}은 IP가 192.168.10.1인 BE에 보낸 RPC 수를 나타냅니다 | 특정 BE에 지나치게 많은 RPC를 제출했는지 살펴봅니다 |  |
| `doris_fe_query_rpc_failed` |  | Num | 특정 BE에 보낸 RPC 중 실패한 수. 예를 들어 {be="192.168.10.1"}은 IP가 192.168.10.1인 BE에 보낸 RPC 중 실패한 수를 나타냅니다 | 특정 BE에 RPC 문제가 있는지 살펴봅니다 |  |
| `doris_fe_query_rpc_size` |  | Num | 특정 BE의 RPC 데이터 크기. 예를 들어 {be="192.168.10.1"}은 IP가 192.168.10.1인 BE에 보낸 RPC 데이터의 바이트 수를 나타냅니다 | 특정 BE에 지나치게 큰 RPC를 제출했는지 살펴봅니다 |  |
| `doris_fe_txn_exec_latency_ms` |  | Milliseconds | 트랜잭션 실행 시간의 백분위 통계. 예를 들어 {quantile="0.75"}는 75번째 백분위의 트랜잭션 실행 시간을 나타냅니다 | 각 백분위의 트랜잭션 실행 시간을 자세히 살펴봅니다 | P0 |
| `doris_fe_txn_publish_latency_ms` |  | Milliseconds | 트랜잭션 publish 시간의 백분위 통계. 예를 들어 {quantile="0.75"}는 75번째 백분위의 트랜잭션 publish 시간을 나타냅니다 | 각 백분위의 트랜잭션 publish 시간을 자세히 살펴봅니다 | P0 |
| `doris_fe_txn_num` |  | Num | 특정 DB에서 현재 실행 중인 트랜잭션 수. 예를 들어 {db="test"}는 DB test에서 현재 실행 중인 트랜잭션 수를 나타냅니다 | 특정 DB에 많은 트랜잭션이 제출되었는지 살펴봅니다 | P0 |
| `doris_fe_publish_txn_num` |  | Num | 특정 DB에서 현재 publish 중인 트랜잭션 수. 예를 들어 {db="test"}는 DB test에서 현재 publish 중인 트랜잭션 수를 나타냅니다 | 특정 DB의 publish 중인 트랜잭션 수를 살펴봅니다 | P0 |
| `doris_fe_txn_replica_num` |  | Num | 특정 DB에서 현재 실행 중인 트랜잭션이 연 복제본 수. 예를 들어 {db="test"}는 DB test에서 현재 실행 중인 트랜잭션이 연 복제본 수를 나타냅니다 | 특정 DB가 복제본을 지나치게 많이 열어 다른 트랜잭션의 실행에 영향을 줄 수 있는지 살펴봅니다 | P0 |
| `doris_fe_thrift_rpc_total` |  | Num | FE thrift 인터페이스의 각 메서드가 받은 RPC 요청 수. 예를 들어 {method="report"}는 report 메서드가 받은 RPC 요청 수를 나타냅니다 | 특정 thrift rpc 메서드의 부하를 살펴봅니다 |  |
| `doris_fe_thrift_rpc_latency_ms` |  | Milliseconds | FE thrift 인터페이스의 각 메서드에서 RPC 요청을 처리하는 데 걸린 시간. 예를 들어 {method="report"}는 report 메서드의 RPC 요청 처리 시간을 나타냅니다 | 특정 thrift rpc 메서드의 부하를 살펴봅니다 |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | Num | 특정 External Catalog의 스키마 캐시에 있는 항목 수 |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | Num |  |  |  |
|  | `{type="partition_value"}` | Num | 특정 External Hive Metastore Catalog의 파티션 값 캐시에 있는 항목 수 |  |  |
|  | `{type="partition"}` | Num | 특정 External Hive Metastore Catalog의 파티션 캐시에 있는 항목 수 |  |  |
|  | `{type="file"}` | Num | 특정 External Hive Metastore Catalog의 파일 캐시에 있는 항목 수 |  |  |
| `doris_fe_virtual_compute_group_switch_total` | `{virtual_compute_group_id, virtual_compute_group_name, src_compute_group_id, src_compute_group_name, dst_compute_group_id, dst_compute_group_name}` | Num | 가상 컴퓨팅 그룹의 활성·대기 전환 누적 횟수. 버전 4.0.8부터 지원하며 컴퓨팅과 스토리지가 분리된 모드에서만 생성됩니다 | 기울기로 가상 컴퓨팅 그룹이 자주 전환되는지 확인할 수 있습니다. 전환이 잦으면 대개 기본 컴퓨팅 그룹이 불안정하다는 뜻입니다 |  |

### JVM 모니터링 {#jvm-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | Bytes | JVM 메모리 모니터링. 레이블에는 max, used, committed가 포함되며 각각 최대 메모리, 사용 중인 메모리, 할당된 메모리에 해당합니다 | JVM 메모리 사용량을 살펴봅니다 | P0 |
| `jvm_non_heap_size_bytes` |  | Bytes | JVM 힙 외부 메모리 통계 |  |  |
| `<GarbageCollector>` |  |  | GC 모니터링 | GarbageCollector는 특정 가비지 컬렉터를 가리킵니다 | P0 |
|  | {type="count"} | Num | 누적 GC 횟수 |  |  |
|  | {type="time"} | Milliseconds | 누적 GC 시간 |  |  |
| `jvm_old_size_bytes` |  | Bytes | JVM Old Generation 메모리 통계 |  | P0 |
| `jvm_thread` |  | Num | JVM 스레드 수 통계 | JVM 스레드 수가 적절한지 살펴봅니다 | P0 |
| `jvm_young_size_bytes` |  | Bytes | JVM Young Generation 메모리 통계 |  | P0 |

### 머신 모니터링 {#machine-monitoring}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | Bytes | FE 노드 머신의 메모리 모니터링. `/proc/meminfo`에서 수집합니다. `buffers`, `cached`, `memory_available`, `memory_free`, `memory_total`을 포함합니다 |  |  |
| `system_snmp` |  |  | FE 노드 머신의 네트워크 모니터링. `/proc/net/snmp`에서 수집합니다 |  |  |
|  | `{name="tcp_in_errs"}` | Num | tcp 패킷 수신 오류 수 |  |  |
|  | `{name="tcp_in_segs"}` | Num | 수신한 tcp 패킷 수 |  |  |
|  | `{name="tcp_out_segs"}` | Num | 전송한 tcp 패킷 수 |  |  |
|  | `{name="tcp_retrans_segs"}` | Num | tcp 패킷 재전송 수 |  |  |

## BE 모니터링 지표 {#be-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### 프로세스 모니터링 {#process-monitoring-1}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | Num | 외부 시스템이 직접 열어 현재 사용 중인 scanner 수 |  |  |
| `doris_be_add_batch_task_queue_size` |  | Num | 데이터 적재 중 batch를 받는 스레드 풀의 대기열 크기 | 0보다 크면 데이터 적재 태스크의 수신 측에 적체가 있습니다 | P0 |
| `agent_task_queue_size` |  | Num | 각 Agent Task 처리 대기열의 길이. 예를 들어 `{type="CREATE_TABLE"}`은 CREATE_TABLE 태스크 대기열의 길이를 나타냅니다 |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | Num | BE 간 통신에 사용하기 위해 생성된 brpc stub 수 |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | Num | Remote RPC와의 통신에 사용하기 위해 생성된 brpc stub 수 |  |  |
| `doris_be_cache_capacity` |  |  | 특정 LRU Cache의 용량 |  |  |
| `doris_be_cache_usage` |  |  | 특정 LRU Cache의 사용량 | 메모리 사용량을 살펴봅니다 | P0 |
| `doris_be_cache_usage_ratio` |  |  | 특정 LRU Cache의 사용 비율 |  |  |
| `doris_be_cache_lookup_count` |  |  | 특정 LRU Cache의 조회 횟수 |  |  |
| `doris_be_cache_hit_count` |  |  | 특정 LRU Cache의 적중 횟수 |  |  |
| `doris_be_cache_hit_ratio` |  |  | 특정 LRU Cache의 적중률 | 캐시가 효과적으로 작동하는지 살펴봅니다 | P0 |
|  | {name="DataPageCache"} | Num | DataPageCache는 데이터의 Data Page를 캐시합니다 | 데이터 캐시로, 쿼리 효율에 직접 영향을 줍니다 | P0 |
|  | {name="IndexPageCache"} | Num | IndexPageCache는 데이터의 Index Page를 캐시합니다 | 인덱스 캐시로, 쿼리 효율에 직접 영향을 줍니다 | P0 |
|  | {name="LastSuccessChannelCache"} | Num | LastSuccessChannelCache는 데이터 적재 수신 측의 LoadChannel을 캐시합니다 |  |  |
|  | {name="SegmentCache"} | Num | SegmentCache는 인덱스 정보와 같이 열린 Segment를 캐시합니다 |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | Num | ChunkAllocator에서 바인딩된 코어의 메모리 대기열에서 메모리를 할당한 횟수 |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | Num | ChunkAllocator에서 다른 코어의 메모리 대기열에서 메모리를 할당한 횟수 |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | Bytes | ChunkAllocator에 예약된 메모리 크기 |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | Nanoseconds | SystemAllocator의 메모리 할당에 걸린 누적 시간 | 기울기로 메모리 할당에 드는 시간을 살펴봅니다 | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | Num | SystemAllocator가 메모리를 할당한 횟수 |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | Nanoseconds | SystemAllocator의 메모리 해제에 걸린 누적 시간 | 기울기로 메모리 해제에 드는 시간을 살펴봅니다 | P0 |
| `doris_be_chunk_pool_system_free_count` |  | Num | SystemAllocator가 메모리를 해제한 횟수 |  |  |
| `doris_be_compaction_bytes_total` |  | Bytes | Compaction이 처리한 데이터의 누적 크기 | Compaction 태스크에서 입력 rowset의 디스크 크기를 기록합니다. 기울기로 Compaction 속도를 살펴봅니다 | P0 |
|  | {type="base"} | Bytes | Base Compaction이 처리한 데이터의 누적 크기 |  |  |
|  | {type="cumulative"} | Bytes | Cumulative Compaction이 처리한 데이터의 누적 크기 |  |  |
| `doris_be_compaction_deltas_total` |  | Num | Compaction이 처리한 rowset의 누적 수 | Compaction 태스크의 입력 rowset 수를 기록합니다 |  |
|  | {type="base"} | Num | Base Compaction이 처리한 rowset의 누적 수 |  |  |
|  | {type="cumulative"} | Num | Cumulative Compaction이 처리한 rowset의 누적 수 |  |  |
| `doris_be_disks_compaction_num` |  | Num | 특정 데이터 디렉터리에서 현재 실행 중인 Compaction 태스크 수. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리에서 현재 실행 중인 태스크 수를 나타냅니다 | 각 디스크의 Compaction 태스크 수가 적절한지 살펴봅니다 | P0 |
| `doris_be_disks_compaction_score` |  | Num | 특정 데이터 디렉터리에서 현재 실행 중인 Compaction 토큰 수. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리에서 현재 실행 중인 토큰 수를 나타냅니다 |  |  |
| `doris_be_compaction_used_permits` |  | Num | Compaction 태스크가 이미 사용한 토큰 수 | Compaction의 리소스 소비량을 나타냅니다 |  |
| `doris_be_compaction_waitting_permits` |  | Num | Compaction 토큰을 기다리는 항목 수 |  |  |
| `doris_be_data_stream_receiver_count` |  | Num | 수신 측 데이터 Receiver 수 | FIXME: 벡터화 엔진에는 이 지표가 없습니다 |  |
| `doris_be_disks_avail_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크의 남은 공간. 예를 들어 `{path="/path1/"}`은 `/path1` 디렉터리가 위치한 디스크의 남은 공간을 나타냅니다 |  | P0 |
| `doris_be_disks_local_used_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크에서 로컬로 사용 중인 공간 |  |  |
| `doris_be_disks_remote_used_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크에 대응하는 원격 디렉터리의 사용 공간 |  |  |
| `doris_be_disks_state` |  | Boolean | 특정 데이터 디렉터리의 디스크 상태. 1은 정상, 0은 비정상을 나타냅니다 |  |  |
| `doris_be_disks_total_capacity` |  | Bytes | 특정 데이터 디렉터리가 위치한 디스크의 전체 용량 | `doris_be_disks_avail_capacity`와 함께 사용해 디스크 사용률을 계산합니다 | P0 |
| `doris_be_engine_requests_total` |  | Num | BE에서 여러 태스크의 실행 상태별 누적 횟수 |  |  |
|  | {status="failed",type="xxx"} | Num | xxx 유형 태스크의 누적 실패 횟수 |  |  |
|  | {status="total",type="xxx"} | Num | xxx 유형 태스크의 누적 전체 실행 횟수 | 필요에 따라 여러 태스크 유형의 실패 횟수를 모니터링합니다 | P0 |
|  | `{status="skip",type="report_all_tablets"}` | Num | xxx 유형 태스크가 건너뛰어진 누적 횟수 |  |  |
| `doris_be_fragment_endpoint_count` |  | Num | `doris_be_data_stream_receiver_count`와 동일 | FIXME: `doris_be_data_stream_receiver_count`와 같은 수를 나타냅니다. 벡터화 엔진에는 이 지표도 없습니다 |  |
| `doris_be_fragment_request_duration_us` |  | Microseconds | 모든 fragment instance의 누적 실행 시간 | 기울기로 instance 실행 시간을 살펴봅니다 | P0 |
| `doris_be_fragment_requests_total` |  | Num | 실행된 fragment instance의 누적 수 |  |  |
| `doris_be_load_channel_count` |  | Num | 현재 열려 있는 데이터 적재 채널 수 | 값이 클수록 현재 실행 중인 데이터 적재 태스크가 많습니다 | P0 |
| `doris_be_local_bytes_read_total` |  | Bytes | `LocalFileReader`가 읽은 바이트 수 |  | P0 |
| `doris_be_local_bytes_written_total` |  | Bytes | `LocalFileWriter`가 쓴 바이트 수 |  | P0 |
| `doris_be_local_file_reader_total` |  | Num | 열린 `LocalFileReader` 인스턴스의 누적 수 |  |  |
| `doris_be_local_file_open_reading` |  | Num | 현재 열려 있는 `LocalFileReader` 인스턴스 수 |  |  |
| `doris_be_local_file_writer_total` |  | Num | 열린 `LocalFileWriter` 인스턴스의 누적 수 |  |  |
| `doris_be_mem_consumption` |  | Bytes | 특정 모듈의 현재 메모리 사용량. 예를 들어 {type="compaction"}은 Compaction 모듈의 현재 전체 메모리 사용량을 나타냅니다 | 같은 유형의 MemTracker에서 값을 가져옵니다. FIXME |  |
| `doris_be_memory_allocated_bytes` |  | Bytes | `/proc/self/status/VmRSS`에서 가져온 BE 프로세스의 물리 메모리 크기 |  | P0 |
| `doris_be_memory_jemalloc` |  | Bytes | `je_mallctl`에서 가져온 Jemalloc 통계 | 의미는 https://jemalloc.net/jemalloc.3.html 에서 확인하세요 | P0 |
| `doris_be_memory_pool_bytes_total` |  | Bytes | 현재 모든 MemPool이 차지하는 메모리 크기. 실제 메모리 사용량을 나타내는 값은 아닙니다 |  |  |
| `doris_be_memtable_flush_duration_us` |  | Microseconds | memtable을 디스크에 쓰는 데 걸린 누적 시간 | 기울기로 쓰기 지연 시간을 살펴봅니다 | P0 |
| `doris_be_memtable_flush_total` |  | Num | 디스크에 기록한 memtable의 누적 수 | 기울기로 파일 쓰기 빈도를 계산합니다 | P0 |
| `doris_be_meta_request_duration` |  | Microseconds | RocksDB의 meta에 접근하는 데 걸린 누적 시간 | 기울기로 BE 메타데이터 읽기/쓰기 지연 시간을 살펴봅니다 | P0 |
|  | {type="read"} | Microseconds | 읽기 시간 |  |  |
|  | {type="write"} | Microseconds | 쓰기 시간 |  |  |
| `doris_be_meta_request_total` |  | Num | RocksDB의 meta에 접근한 누적 횟수 | 기울기로 BE 메타데이터 접근 빈도를 살펴봅니다 | P0 |
|  | {type="read"} | Num | 읽기 횟수 |  |  |
|  | {type="write"} | Num | 쓰기 횟수 |  |  |
| `doris_be_fragment_instance_count` |  | Num | 현재 수신한 fragment instance 수 | instance가 쌓이는지 살펴봅니다 | P0 |
| `doris_be_process_fd_num_limit_hard` |  | Num | BE 프로세스의 파일 핸들 수에 대한 하드 한도. `/proc/pid/limits`에서 수집합니다 |  |  |
| `doris_be_process_fd_num_limit_soft` |  | Num | BE 프로세스의 파일 핸들 수에 대한 소프트 한도. `/proc/pid/limits`에서 수집합니다 |  |  |
| `doris_be_process_fd_num_used` |  | Num | BE 프로세스가 사용 중인 파일 핸들 수. `/proc/self/fd`의 항목을 세어 수집합니다 |  |  |
| `doris_be_process_thread_num` |  | Num | BE 프로세스의 스레드 수. `/proc/pid/task`에서 수집합니다 |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | Bytes | Query Cache가 차지하는 바이트 수 |  |  |
| `doris_be_query_cache_partition_total_count` |  | Num | 현재 Partition Cache에 있는 항목 수 |  |  |
| `doris_be_query_cache_sql_total_count` |  | Num | 현재 SQL Cache에 있는 항목 수 |  |  |
| `doris_be_query_scan_bytes` |  | Bytes | 읽은 데이터의 누적 크기. Olap 테이블에서 읽은 데이터만 집계합니다 |  |  |
| `doris_be_query_scan_bytes_per_second` |  | Bytes/Sec | `doris_be_query_scan_bytes`에서 계산한 읽기 속도 | 쿼리 속도를 살펴봅니다 | P0 |
| `doris_be_query_scan_rows` |  | Num | 읽은 행의 누적 수. Olap 테이블에서 읽은 데이터만 집계합니다. RawRowsRead 값이므로 인덱스에 의해 건너뛰어 실제로 읽지 않은 데이터 행도 이 값에 포함될 수 있습니다 | 기울기로 쿼리 속도를 살펴봅니다 | P0 |
| `doris_be_result_block_queue_count` |  | Num | 현재 쿼리 결과 캐시에 있는 fragment instance 수 | 외부 시스템이 직접 읽을 때만 이 대기열을 사용합니다. 예를 들어 Spark on Doris는 external scan을 통해 데이터를 쿼리합니다 |  |
| `doris_be_result_buffer_block_count` |  | Num | 현재 쿼리 결과 캐시에 있는 쿼리 수 | 현재 BE에서 FE가 소비하기를 기다리는 쿼리 결과가 얼마나 있는지 나타냅니다 | P0 |
| `doris_be_routine_load_task_count` |  | Num | 현재 실행 중인 Routine Load 태스크 수 |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | Num | 마지막 시작 이후 새로 추가되어 사용 중인 rowset ID 수 |  |  |
| `doris_be_s3_bytes_read_total` |  | Num | `S3FileReader`가 열린 누적 횟수 |  |  |
| `doris_be_s3_file_open_reading` |  | Num | 현재 열려 있는 `S3FileReader` 인스턴스 수 |  |  |
| `doris_be_s3_bytes_read_total` |  | Bytes | `S3FileReader`가 읽은 누적 바이트 수 |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | Num | OlapScanner에 사용하는 스레드 풀의 현재 대기열 크기 | 값이 0보다 크면 Scanner가 쌓이기 시작했음을 나타냅니다 | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | Num | 읽은 segment의 누적 수 |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | Num | segment에서 읽은 행의 누적 수 | 인덱스에 의해 필터링된 행도 포함합니다. 읽은 segment 수에 각 segment의 전체 행 수를 곱한 값과 같습니다 |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | Num | 데이터 적재 중 데이터 패킷을 보내는 스레드 풀의 대기열 크기 | 값이 0보다 크면 적체가 있음을 나타냅니다 | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | Num | 데이터 적재 중 데이터 패킷을 보내는 스레드 풀의 스레드 수 |  |  |
| `doris_be_small_file_cache_count` |  | Num | 현재 BE에 캐시된 작은 파일 수 |  |  |
| `doris_be_streaming_load_current_processing` |  | Num | 현재 실행 중인 Stream Load 태스크 수 | curl 명령으로 보낸 태스크만 포함합니다 |  |
| `doris_be_streaming_load_duration_ms` |  | Milliseconds | 모든 Stream Load 태스크의 누적 실행 시간 |  |  |
| `doris_be_streaming_load_requests_total` |  | Num | Stream Load 태스크의 누적 수 | 기울기로 태스크 제출 빈도를 살펴봅니다 | P0 |
| `doris_be_stream_load_pipe_count` |  | Num | 현재 Stream Load 데이터 파이프 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 |  |
| `doris_be_stream_load` | {type="load_rows"} | Num | Stream Load로 최종 데이터 적재된 행의 누적 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | Bytes | Stream Load가 받은 누적 바이트 수 | Stream Load가 HTTP로 받은 데이터와 Routine Load가 Kafka에서 읽은 데이터를 포함합니다 | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | Num | 현재 최대 Base Compaction Score | 이 값은 실시간으로 바뀌므로 최고값을 놓칠 수 있습니다. 값이 높을수록 Compaction 적체가 심합니다 | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | Num | 모든 Cumulative Compaction 전략의 현재 최대 Compaction Score | 전략 전체의 집계 최대값으로 유지됩니다 |  |
| `doris_be_tablet_version_num_distribution` |  | Num | tablet 버전 수의 히스토그램 | tablet 버전 수의 분포를 보여줍니다 | P0 |
| `doris_be_thrift_connections_total` |  | Num | 생성된 thrift 연결의 누적 수. 예를 들어 `{name="heartbeat"}`은 하트비트 서비스에 대한 누적 연결 수를 나타냅니다 | BE가 서버 측으로 동작하는 thrift server의 연결을 나타냅니다 |  |
| `doris_be_thrift_current_connections` |  | Num | 현재 thrift 연결 수. 예를 들어 `{name="heartbeat"}`은 하트비트 서비스에 대한 현재 연결 수를 나타냅니다 | 위와 동일 |  |
| `doris_be_thrift_opened_clients` |  | Num | 현재 열려 있는 thrift 클라이언트 수. 예를 들어 `{name="frontend"}`는 FE 서비스에 접근하는 클라이언트 수를 나타냅니다 |  |  |
| `doris_be_thrift_used_clients` |  | Num | 현재 사용 중인 thrift 클라이언트 수. 예를 들어 `{name="frontend"}`는 FE 서비스에 접근하는 데 현재 사용 중인 클라이언트 수를 나타냅니다 |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | Num | 시간 초과로 취소된 fragment instance의 누적 수 | 이 값은 여러 번 기록될 수 있습니다. 예를 들어 일부 fragment instance는 여러 번 취소될 수 있습니다 | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | Num | 시작된 Stream Load 트랜잭션의 누적 수 | Stream Load 및 Routine Load 태스크를 모두 포함합니다 |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | Num | 성공적으로 커밋된 Stream Load 트랜잭션의 누적 수 | 위와 동일 |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | Num | 실패한 Stream Load 트랜잭션의 누적 수 | 위와 동일 |  |
| `doris_be_unused_rowsets_count` |  | Num | 현재 사용이 중단된 rowset 수 | 정상적인 경우 이러한 rowset은 주기적으로 삭제됩니다 |  |
| `doris_be_upload_fail_count` |  | Num | 계층형 스토리지 기능에서 rowset을 원격 스토리지에 업로드하다 실패한 누적 횟수 |  |  |
| `doris_be_upload_rowset_count` |  | Num | 계층형 스토리지 기능에서 rowset을 원격 스토리지에 성공적으로 업로드한 누적 횟수 |  |  |
| `doris_be_upload_total_byte` |  | Bytes | 계층형 스토리지 기능에서 원격 스토리지에 성공적으로 업로드한 rowset 데이터의 누적 크기 |  |  |
| `doris_be_load_bytes` |  | Bytes | tablet sink를 통해 보낸 누적 바이트 수 | 데이터 적재량을 살펴봅니다 | P0 |
| `doris_be_load_rows` |  | Num | tablet sink를 통해 보낸 누적 행 수 | 데이터 적재량을 살펴봅니다 | P0 |
| `fragment_thread_pool_queue_size` |  | Num | 쿼리 실행 스레드 풀의 현재 대기열 길이 | 0보다 크면 쿼리 스레드가 소진되어 쿼리가 쌓이고 있다는 뜻입니다 | P0 |
| `doris_be_all_rowsets_num` |  | Num | 현재 모든 rowset의 총수 |  | P0 |
| `doris_be_all_segments_num` |  | Num | 현재 모든 segment의 총수 |  | P0 |
| `doris_be_heavy_work_max_threads` |  | Num | brpc heavy 스레드 풀의 스레드 수 |  | P0 |
| `doris_be_light_work_max_threads` |  | Num | brpc light 스레드 풀의 스레드 수 |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | Num | brpc heavy 스레드 풀의 최대 대기열 길이. 이를 초과하면 작업 제출이 차단됩니다 |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | Num | brpc light 스레드 풀의 최대 대기열 길이. 이를 초과하면 작업 제출이 차단됩니다 |  | P0 |
| `doris_be_heavy_work_active_threads` |  | Num | brpc heavy 스레드 풀에서 활성 상태인 스레드 수 |  | P0 |
| `doris_be_light_work_active_threads` |  | Num | brpc light 스레드 풀에서 활성 상태인 스레드 수 |  | P0 |
| `routine_load_get_msg_latency` |  | Milliseconds | Routine Load가 Kafka 메시지를 가져오는 데 걸리는 지연 시간 |  |  |
| `routine_load_get_msg_count` |  | Num | Routine Load가 Kafka 메시지를 가져온 횟수 |  |  |
| `routine_load_consume_bytes` |  | Bytes | Routine Load가 Kafka에서 소비한 데이터의 크기 |  |  |
| `routine_load_consume_rows` |  | Num | Routine Load가 Kafka에서 소비한 행 수 |  |  |
| `doris_be_tablet_size_based_max_compaction_score` |  | Num | Size-based 전략의 현재 최대 Cumulative Compaction Score | Gauge이며 버전 4.1.5에서 추가되었습니다. 통합 모드와 컴퓨팅·스토리지 분리 모드를 지원합니다 |  |
| `doris_be_tablet_time_series_max_compaction_score` |  | Num | Time-series 전략의 현재 최대 Cumulative Compaction Score | Gauge이며 버전 4.1.5에서 추가되었습니다. 통합 모드와 컴퓨팅·스토리지 분리 모드를 지원합니다 |  |
| `doris_be_hdfs_file_open_reading` |  | Num | 현재 실제로 열려 있는 HDFS 파일 핸들 수 | Gauge입니다. 버전 4.1.5부터 reader 객체가 아닌 공유 파일 핸들을 셉니다 |  |
| `doris_be_hdfs_file_reader_total` |  | Num | HDFS 파일 핸들을 성공적으로 연 누적 횟수 | Counter입니다. 버전 4.1.5부터 파일을 열지 않은 reader는 값을 늘리지 않으며, 캐시된 핸들을 다시 사용해도 재집계하지 않습니다 |  |

전략별 Compaction Score 두 값은 모두 최대값입니다. 두 값을 더하거나 Counter의 변화율을 적용하지 마세요. 전체 검사가 끝난 뒤 대상 tablet이 없는 전략의 값은 0으로 재설정될 수 있습니다. 통합 모드의 검사에서 디스크 용량 제한으로 일부 디렉터리를 건너뛴 경우, 그 이유만으로 이전 관측값을 낮추지는 않습니다.

### 머신 모니터링 {#machine-monitoring-1}

| 이름 | 레이블 | 단위 | 의미 | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | Num | `/proc/stat`에서 수집하는 CPU 관련 모니터링 지표. 각 논리 코어의 값을 수집합니다. 예를 들어 `{device="cpu0",mode="nice"}`는 cpu0의 nice 값을 나타냅니다 | 이 값으로 CPU 사용률을 계산할 수 있습니다 | P0 |
| `doris_be_disk_bytes_read` |  | Bytes | 누적 디스크 읽기량. `/proc/diskstats`에서 디스크별로 수집합니다. 예를 들어 `{device="vdd"}`는 vdd 디스크의 값을 나타냅니다 |  |  |
| `doris_be_disk_bytes_written` |  | Bytes | 누적 디스크 쓰기량. 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_io_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 | 이 값으로 IO Util을 계산할 수 있습니다 | P0 |
| `doris_be_disk_io_time_weighted` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_reads_completed` |  | Num | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_read_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_writes_completed` |  | Num | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_disk_write_time_ms` |  | Milliseconds | 위와 같은 방식으로 수집합니다 |  |  |
| `doris_be_fd_num_limit` |  | Num | 시스템 파일 핸들 수의 상한. `/proc/sys/fs/file-nr`에서 수집합니다 |  |  |
| `doris_be_fd_num_used` |  | Num | 시스템이 사용 중인 파일 핸들 수. `/proc/sys/fs/file-nr`에서 수집합니다 |  |  |
| `doris_be_file_created_total` |  | Num | 로컬 파일을 생성한 누적 횟수 | `local_file_writer`를 호출하고 최종적으로 닫은 모든 파일을 셉니다 |  |
| `doris_be_load_average` |  | Num | 머신의 Load Avg 모니터링 지표. 예를 들어 {mode="15_minutes"}는 15분 Load Avg입니다 | 머신의 전체 부하를 살펴봅니다 | P0 |
| `doris_be_max_disk_io_util_percent` |  | Percentage | 모든 디스크에서 계산된 IO UTIL 값 중 최대값 |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | Bytes/Sec | 모든 네트워크 인터페이스에서 계산된 수신 속도 중 최대값 |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | Bytes/Sec | 모든 네트워크 인터페이스에서 계산된 전송 속도 중 최대값 |  | P0 |
| `doris_be_memory_pgpgin` |  | Bytes | 시스템이 디스크에서 메모리 페이지로 기록한 데이터의 크기 |  |  |
| `doris_be_memory_pgpgout` |  | Bytes | 시스템이 메모리 페이지에서 디스크로 기록한 데이터의 크기 |  |  |
| `doris_be_memory_pswpin` |  | Bytes | 시스템이 디스크에서 메모리로 스왑해 들여온 데이터의 크기 | 일반적으로 스왑을 비활성화해야 하므로 이 값은 0이어야 합니다 |  |
| `doris_be_memory_pswpout` |  | Bytes | 시스템이 메모리에서 디스크로 스왑해 내보낸 데이터의 크기 | 일반적으로 스왑을 비활성화해야 하므로 이 값은 0이어야 합니다 |  |
| `doris_be_network_receive_bytes` |  | Bytes | 네트워크 인터페이스별 누적 수신 바이트 수. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_receive_packets` |  | Num | 네트워크 인터페이스별 누적 수신 패킷 수. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_send_bytes` |  | Bytes | 네트워크 인터페이스별 누적 전송 바이트 수. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_network_send_packets` |  | Num | 네트워크 인터페이스별 누적 전송 패킷 수. `/proc/net/dev`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | Num | 누적 CPU 컨텍스트 스위치 수. `/proc/stat`에서 수집합니다 | 비정상적인 컨텍스트 스위치가 있는지 살펴봅니다 | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | Num | 누적 CPU 인터럽트 수. `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | Num | 현재 시스템에서 차단된 프로세스 수(예: IO 대기). `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | Num | 현재 시스템에서 실행 중인 프로세스 수. `/proc/stat`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_in_errs` |  | Num | tcp 패킷 수신 오류 수. `/proc/net/snmp`에서 수집합니다 | 재전송 및 패킷 손실 같은 네트워크 오류를 살펴봅니다. 다른 snmp 지표와 함께 사용하세요 | P0 |
| `doris_be_snmp_tcp_in_segs` |  | Num | 수신한 tcp 패킷 수. `/proc/net/snmp`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_out_segs` |  | Num | 전송한 tcp 패킷 수. `/proc/net/snmp`에서 수집합니다 |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | Num | tcp 패킷 재전송 수. `/proc/net/snmp`에서 수집합니다 |  |  |

## bvar 진단 지표 {#bvar-diagnostic-metrics}

다음 지표는 버전 4.1.5부터 지원하며 앞서 설명한 brpc 포트를 사용합니다. Counter는 프로세스 시작 이후의 누적값이고 Gauge는 현재 값을 나타냅니다.

| 이름 또는 접두사 | 프로세스 | 유형 | 의미 |
| --- | --- | --- | --- |
| `sync_tablets_meta_num` | 컴퓨팅·스토리지 분리 모드의 BE | Counter | 백그라운드에서 tablet 메타데이터 동기화를 시도한 누적 횟수. 호출 전에 집계하므로 성공한 호출 수를 나타내지 않습니다 |
| `sync_tablets_rowsets_num` | 컴퓨팅·스토리지 분리 모드의 BE | Counter | 백그라운드에서 tablet rowset 동기화를 시도한 누적 횟수. 호출 전에 집계하므로 성공한 호출 수를 나타내지 않습니다 |
| `vertical_compaction_active_segment_contexts` | BE | Gauge | 수직 Compaction이 현재 보유한 활성 Segment 컨텍스트 수 |
| `hdfs_get_path_info` | BE | 지연 시간 통계, 마이크로초 | HDFS 파일 메타데이터 접근을 진단하는 `hdfsGetPathInfo` 지연 시간 지표의 접두사 |
| `ms_repair_tablet_index` | Meta Service | Counter | 트랜잭션 커밋 중 누락된 `db_id`를 추가하기 위해 복구한 이전 Tablet Index 레코드의 누적 수. 커밋이 성공한 뒤에만 집계합니다 |
| `file_cache_ttl_mgr_ttl_info_map_size` (캐시 경로 접두사 포함) | BE | Gauge | 현재 메모리에서 추적하는 tablet TTL 정보 항목 수. 캐시 블록 수는 아닙니다 |

캐시 경로 접두사와 제거 지표는 [파일 캐시 모니터링](../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics)을 참조하세요. 수직 Compaction이 끝나면 BE INFO 로그의 `vertical_compaction_active_segment_contexts_peak` 필드에 해당 태스크의 최대 컨텍스트 수가 기록됩니다. 이 값은 로그 필드이며 별도의 프로세스 수준 Gauge는 아닙니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: 모니터링 엔드포인트가 404를 반환합니다. 어떻게 해야 하나요? {#q-the-monitoring-endpoint-returns-404-what-should-i-do}

FE의 `http_port` 또는 BE의 `webserver_port`에 접속했는지 확인하고, `fe.conf` / `be.conf`에서 실제 포트 값을 확인하세요.

### Q: Counter 지표가 감소하지 않고 계속 증가합니다. 정상인가요? {#q-counter-metrics-only-increase-and-never-decrease-is-this-normal}

정상입니다. Counter는 누적값을 나타냅니다. 일정 간격으로 샘플링하고 기울기(예: PromQL의 `rate()`)를 계산해야 순간 속도를 얻을 수 있습니다.

### Q: 여러 FE의 `doris_fe_max_journal_id` 차이가 너무 큽니다. 어떻게 해야 하나요? {#q-the-gap-of-doris_fe_max_journal_id-between-multiple-fes-is-too-large-what-should-i-do}

메타데이터 동기화가 지연되고 있음을 나타냅니다. Master FE를 기준으로 Follower / Observer FE의 네트워크 연결 상태와 로그 재생 속도를 확인하세요.

### Q: Compaction Score가 계속 너무 높습니다. 어떻게 문제를 진단하나요? {#q-compaction-score-remains-too-high-how-do-i-troubleshoot}

`doris_be_tablet_base_max_compaction_score`와 `doris_be_tablet_cumulative_max_compaction_score`를 중점적으로 살펴보고, 디스크 IO 및 Compaction 태스크 수와 함께 분석해 병목 지점을 파악하세요.

### Q: 쿼리 또는 데이터 적재 작업이 쌓입니다. 어떻게 문제를 진단하나요? {#q-queries-or-loads-are-accumulating-how-do-i-troubleshoot}

`fragment_thread_pool_queue_size`, `doris_be_scanner_thread_pool_queue_size`, `doris_be_send_batch_thread_pool_queue_size`와 같은 스레드 풀 대기열 지표를 확인하세요.
