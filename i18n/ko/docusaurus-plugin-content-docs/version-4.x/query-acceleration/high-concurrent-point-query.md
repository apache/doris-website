---
{
    "title": "고동시성 포인트 쿼리",
    "language": "ko",
    "description": "Doris에서 고동시성 포인트 쿼리를 활성화하는 방법은 무엇일까요? 행 저장소, short-circuit 경로, PreparedStatement, 행 캐시를 통해 기본 키 포인트 쿼리의 QPS와 응답 지연 시간을 크게 개선할 수 있습니다.",
    "keywords": [
        "Doris 고동시성 포인트 쿼리",
        "기본 키 포인트 쿼리 최적화",
        "PreparedStatement",
        "행 저장소 store_row_column",
        "Merge-On-Write 포인트 쿼리",
        "SHORT-CIRCUIT 단축 경로",
        "행 캐시",
        "FE CPU 사용량 과다로 인한 포인트 쿼리 병목"
    ]
}
---

<!-- Knowledge type: Capability definition / Configuration parameter / Performance tuning -->
<!-- Applicable scenarios: High-concurrency primary-key point queries, KV-style queries, low-latency online services -->

## 고동시성 포인트 쿼리란 {#what-is-a-high-concurrency-point-query}

고동시성 포인트 쿼리는 Doris에서 **기본 키 동등 조건 쿼리**를 위해 제공하는 전용 최적화 기능입니다. 동시성이 높은 서비스 환경에서 사용자는 기본 키를 사용해 시스템에서 한 행의 전체 데이터를 가져오고자 합니다. 하지만 Doris의 기본 열 지향 저장 형식과 쿼리 계획 경로는 이러한 KV 방식의 요청에 적합하지 않습니다.

이를 해결하기 위해 Doris는 다음 계층에 최적화를 적용합니다.

| 최적화 | 해결하는 문제 |
| -------------------- | ----------------------------------------------------------- |
| 행 저장소 | 열이 많은 테이블에서 행 전체를 읽으면 열 지향 스토리지의 랜덤 IO가 증가합니다. 행 저장소는 IO 오버헤드를 줄입니다 |
| Short-Circuit 쿼리 경로(SHORT-CIRCUIT) | 단순한 쿼리에서는 FE의 쿼리 계획 및 파싱 작업이 지나치게 무겁습니다. short-circuit 경로는 일반적인 계획 수립 과정을 우회합니다 |
| PreparedStatement | SQL 파싱과 표현식 평가가 FE CPU를 소모합니다. 계획과 표현식을 캐시하면 오버헤드가 줄어듭니다 |
| 행 캐시 | Page Cache는 대규모 쿼리로 인해 쉽게 축출됩니다. 전용 행 캐시는 적중률을 높입니다 |

## 빠른 활성화를 위한 체크리스트 {#quick-enablement-checklist}

고동시성 포인트 쿼리를 사용하기 전에 다음 조건을 모두 충족하는지 확인하세요.

- 테이블이 **Unique Key 모델**을 사용하며 `enable_unique_key_merge_on_write = true`가 활성화되어 있어야 합니다
- 테이블 생성 시 `store_row_column = true`를 설정해 행 저장소를 활성화해야 합니다
- 테이블 생성 시 `light_schema_change = true`를 활성화해야 합니다
- 쿼리에는 **Key 열에 대한 동등 조건만** 포함되어야 하며, 조인이나 중첩 서브쿼리가 없어야 합니다
- JDBC URL에서 `useServerPrepStmts=true`를 활성화해 PreparedStatement를 사용해야 합니다
- (선택 사항) BE 설정 `disable_storage_row_cache = false`를 지정해 행 캐시를 활성화합니다
- `EXPLAIN`을 사용해 실행 계획에 `SHORT-CIRCUIT` 표시가 포함되어 있는지 확인합니다

## 행 저장소 {#row-store}

<!-- Knowledge type: Configuration parameter -->

행 저장소 모드는 열이 많은 테이블에서 행 전체를 읽을 때 발생하는 랜덤 IO 오버헤드를 줄이는 데 사용됩니다. 현재 구현은 한 행의 데이터를 인코딩하여 별도의 열에 저장합니다.

- **테이블 생성 시에만** 활성화할 수 있으며 이후에는 변경할 수 없습니다.
- 다음 속성을 `PROPERTIES`에 지정하여 `CREATE TABLE` 문에 포함합니다.

```sql
"store_row_column" = "true"
```

- 행 저장소를 활성화하면 저장 공간 사용량이 증가합니다. **Doris 3.0부터** 일부 열만 쿼리하면 되는 경우에는 `row_store_columns`를 사용해 필요한 열만 행 저장소에 포함하는 것을 권장합니다.

```sql
"row_store_columns" = "key,v1,v2"
```

다음 예와 같이 쿼리에서 해당 열에만 접근하면 됩니다.

```sql
SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1;
```

## Unique 모델의 포인트 쿼리 최적화 {#point-query-optimization-under-the-unique-model}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Primary-key point-query table creation -->

Unique 모델에서 Merge-On-Write와 행 저장소를 모두 활성화하면 기본 키 포인트 쿼리는 자동으로 **short-circuit 경로**를 사용합니다. 이를 통해 SQL 실행이 최적화되어 한 번의 RPC만으로 쿼리를 완료할 수 있습니다.

### 테이블 생성 예제 {#table-creation-example}

```sql
CREATE TABLE `tbl_point_query` (
    `k1` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k1`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```

### 주요 제약 조건 및 참고 사항 {#key-constraints-and-notes}

| 제약 조건 / 속성 | 설명 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `enable_unique_key_merge_on_write` | 반드시 활성화해야 합니다. 스토리지 엔진은 이 속성을 기반으로 기본 키 포인트 쿼리를 빠르게 처리합니다 |
| `light_schema_change` | 반드시 활성화해야 합니다. 기본 키 포인트 쿼리는 이 기능의 `column unique id`를 사용해 열을 찾습니다 |
| 쿼리 조건 | 단일 테이블의 Key 열에 대한 **동등 조건 쿼리**만 지원합니다. 조인과 중첩 서브쿼리는 지원하지 않습니다 |
| 조건식 형태 | `WHERE` 절에는 **Key 열에 대한 동등 조건만** 포함되어야 하며, 이는 KV 방식의 쿼리로 볼 수 있습니다 |
| 행 저장소 공간 | 행 저장소를 활성화하면 저장 공간 사용량이 증가합니다. 3.0+ 버전에서는 `row_store_columns`를 사용해 일부 열만 지정하는 것을 권장합니다 |

예를 들어 `SELECT * FROM tbl_point_query WHERE k1 = 123`은 조건을 충족하므로 short-circuit 최적화 경로를 사용합니다.

## PreparedStatement 사용 {#using-preparedstatement}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE CPU becomes the point-query bottleneck -->

SQL 파싱과 표현식 평가의 오버헤드를 줄이기 위해 Doris는 FE 측에서 MySQL 프로토콜과 **완전히 호환되는** `PreparedStatement` 기능을 제공합니다(현재는 기본 키 포인트 쿼리만 지원).

- 활성화하면 SQL과 표현식을 미리 계산하여 세션 수준의 메모리 캐시에 저장합니다.
- 이후 쿼리는 캐시된 객체를 직접 재사용하여 반복적인 파싱과 계산을 방지합니다.
- CPU가 기본 키 포인트 쿼리의 병목일 때 `PreparedStatement`를 활성화하면 **4배를 넘는** 성능 향상을 얻을 수 있습니다.

### 1단계: JDBC URL에서 서버 측 PreparedStatement 활성화 {#step-1-enable-server-side-preparedstatement-in-the-jdbc-url}

```text
url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
```

### 2단계: 코드에서 PreparedStatement 사용 {#step-2-use-preparedstatement-in-code}

```java
// use `?` for placement holders, readStatement should be reused
PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
...
readStatement.setInt(1, 1234);
ResultSet resultSet = readStatement.executeQuery();
...
readStatement.setInt(1, 1235);
resultSet = readStatement.executeQuery();
...
```

## 행 캐시 활성화 {#enabling-row-cache}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Low row-store hit rate, Page Cache easily evicted -->

Doris는 기본적으로 **페이지 단위 캐시**를 제공합니다. 각 페이지는 단일 열의 데이터를 저장하므로 Page Cache는 열 지향적입니다. 행 저장소에서는 한 행에 여러 열이 포함되며, 대규모 쿼리로 인해 캐시가 비워질 수 있습니다.

적중률을 높이기 위해 Doris는 LRU Cache 메커니즘을 재사용하여 메모리 사용량을 제어하는 별도의 **행 캐시**를 제공합니다. 다음 BE 설정으로 활성화할 수 있습니다.

| 설정 | 기본값 | 설명 |
| ---------------------------- | ---------- | --------------------------------- |
| `disable_storage_row_cache` | `true` (기본적으로 비활성화) | 행 캐시를 비활성화할지 여부입니다. 활성화하려면 `false`로 설정합니다 |
| `row_cache_mem_limit` | `20%` | 행 캐시가 사용하는 메모리의 비율 |

## 성능 튜닝 권장 사항 {#performance-tuning-recommendations}

<!-- Knowledge type: Performance tuning -->

위 기능을 활성화한 후 배포 아키텍처에 따라 포인트 쿼리 처리량과 안정성을 추가로 개선할 수 있습니다.

1. **Observer 노드 수 늘리기**: Observer를 추가하는 것은 일반적으로 쿼리 처리 용량을 높이는 효과적인 방법입니다.
2. **쿼리 부하 분산**: 포인트 쿼리 요청을 받는 FE의 CPU 사용량이 높거나 처리 속도가 느려지면 JDBC Load Balance를 사용해 요청을 여러 노드로 분산하세요. Nginx나 ProxySQL 같은 다른 솔루션을 사용할 수도 있습니다.
3. **포인트 쿼리 요청을 Observer로 전달하기**: FE Master로 전송되는 포인트 쿼리 요청 수를 줄이면 일반적으로 FE Master의 쿼리 지연 시간 변동이 완화되어 성능과 안정성이 향상됩니다.

## 자주 묻는 질문 {#faqs}

### Q1: 설정이 올바르고 고동시성 포인트 쿼리가 short-circuit 최적화를 사용하는지 어떻게 확인하나요? {#q1-how-can-i-confirm-that-the-configuration-is-correct-and-that-high-concurrency-point-queries-use-the-short-circuit-optimization}

`EXPLAIN`을 실행하세요. 실행 계획에 `SHORT-CIRCUIT`이 표시되면 short-circuit 최적화가 사용되고 있는 것입니다.

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                             |
|     `test`.`tbl_point_query`.`v1`                                                             |
|     `test`.`tbl_point_query`.`v2`                                                             |
|     `test`.`tbl_point_query`.`v3`                                                             |
|     `test`.`tbl_point_query`.`v4`                                                             |
|     `test`.`tbl_point_query`.`v5`                                                             |
|     `test`.`tbl_point_query`.`v6`                                                             |
|     `test`.`tbl_point_query`.`v7`                                                             |
|   PARTITION: UNPARTITIONED                                                                    |
|                                                                                               |
|   HAS_COLO_PLAN_NODE: false                                                                   |
|                                                                                               |
|   VRESULT SINK                                                                                |
|      MYSQL_PROTOCAL                                                                           |
|                                                                                               |
|   0:VOlapScanNode                                                                             |
|      TABLE: test.tbl_point_query(tbl_point_query), PREAGGREGATION: ON                         |
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0  |
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
```

### Q2: PreparedStatement가 적용되었는지 어떻게 확인하나요? {#q2-how-can-i-confirm-that-preparedstatement-is-in-effect}

Doris에 요청을 보낸 후 `fe.audit.log`에서 해당 쿼리 요청을 찾으세요. `Stmt=EXECUTE()`가 표시되면 PreparedStatement가 적용된 것입니다.

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVariables=
```

### Q3: 기본 키를 사용하지 않는 쿼리도 고동시성 포인트 쿼리 전용 최적화를 사용할 수 있나요? {#q3-can-non-primary-key-queries-use-the-special-high-concurrency-point-query-optimization}

아니요. 고동시성 포인트 쿼리는 **Key 열에 대한 동등 조건 쿼리**만 대상으로 하며, 쿼리에 **조인이나 중첩 서브쿼리가 포함되어서는 안 됩니다**.

### Q4: `useServerPrepStmts`는 일반 쿼리에도 유용한가요? {#q4-is-useserverprepstmts-useful-for-ordinary-queries}

현재 PreparedStatement는 **기본 키 포인트 쿼리에만** 적용됩니다.

### Q5: 옵티마이저 선택을 전역으로 설정해야 하나요? {#q5-do-i-need-to-set-the-optimizer-choice-globally}

아니요. PreparedStatement로 쿼리하면 Doris가 성능이 가장 좋은 쿼리 방식을 자동으로 선택하므로 옵티마이저를 수동으로 설정할 필요가 없습니다.

### Q6: FE가 병목이 되면 어떻게 해야 하나요? {#q6-what-should-i-do-when-the-fe-becomes-the-bottleneck}

FE CPU 사용량이 너무 높으면(`%CPU`가 높은 경우) JDBC URL에서 다음 부하 분산 및 캐시 설정을 활성화하는 것을 권장합니다.

```text
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```

| 매개변수 | 용도 |
| ----------------------- | ---------------------------------------------------------- |
| `loadbalance` | 여러 FE가 요청을 처리할 수 있도록 합니다. FE가 많을수록 좋습니다(노드마다 인스턴스 하나씩 배포) |
| `useServerPrepStmts` | FE의 파싱 및 계획 수립 오버헤드를 줄입니다 |
| `cachePrepStmts` | 클라이언트 측에 PreparedStatement를 캐시하여 FE로 준비 요청이 빈번하게 전송되는 것을 방지합니다 |
| `prepStmtCacheSize` | 캐시할 수 있는 쿼리 템플릿의 최대 개수를 설정합니다 |
| `prepStmtCacheSqlLimit` | 캐시되는 개별 SQL 템플릿의 최대 길이를 설정합니다 |

### Q7: 스토리지와 컴퓨팅을 분리한 배포 환경에서 쿼리 성능을 어떻게 최적화할 수 있나요? {#q7-how-can-i-optimize-query-performance-under-the-storage-compute-separation-deployment}

다음 두 가지 방향으로 조정할 수 있습니다.

- **스냅샷 포인트 쿼리 비활성화**:

    ```sql
    SET GLOBAL enable_snapshot_point_query = false;
    ```

    포인트 쿼리가 Meta Service에서 버전을 가져오면 추가 RPC가 발생하며, QPS가 높을 때 Meta Service가 쉽게 병목이 될 수 있습니다. 이 값을 `false`로 설정하면 쿼리가 빨라지지만 데이터 가시성이 낮아집니다(**성능과 가시성 사이의 균형을 고려하세요**).

- **Base Compaction 출력 캐시 활성화**: BE 매개변수 `enable_file_cache_keep_base_compaction_output=1`을 설정하면 Base Compaction 이후의 결과 데이터가 캐시에 저장되어 원격 접근으로 인한 쿼리 성능 변동을 방지할 수 있습니다.
