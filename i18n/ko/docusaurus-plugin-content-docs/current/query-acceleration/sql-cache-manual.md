---
{
    "title": "SQL Cache 쿼리 캐시 가이드",
    "sidebar_label": "SQL Cache",
    "language": "ko",
    "description": "Doris에서 SQL Cache를 어떻게 활성화하나요? 캐시 미적중과 무효화 문제는 어떻게 해결하나요? 이 가이드에서는 원리, 구성, 모니터링, 문제 해결 방법을 설명합니다.",
    "keywords": ["Doris SQL Cache", "쿼리 캐시", "쿼리 가속", "캐시 적중", "캐시 무효화", "enable_sql_cache", "T+1 쿼리 최적화"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: users who want to accelerate repeated queries by caching query results -->

SQL Cache는 Doris가 제공하는 쿼리 결과 캐싱 메커니즘입니다. SQL 텍스트와 데이터 버전 등의 메타데이터를 키로 사용해 쿼리 결과를 캐싱하므로, 이후 동일한 쿼리가 들어오면 캐시에서 결과를 바로 반환합니다. 이를 통해 반복 계산에 드는 오버헤드를 크게 줄입니다.

## 사전 확인 사항 {#pre-reading-checklist}

이 가이드를 읽기 전에 다음 사항을 이해하고 있거나 준비했는지 확인하세요.

- 쿼리 시나리오가 캐싱에 적합한지 여부(예: T+1 오프라인 분석 또는 갱신 빈도가 낮은 데이터)
- 현재 Doris 버전에서 `explain plan`을 통해 SQL Cache를 확인할 수 있는지 여부(2.1.3+ 권장)
- SQL Cache가 OlapTable 내부 테이블과 Hive 외부 테이블만 지원한다는 점
- 비결정적 함수(예: `now()`와 `random()`)가 캐시 적중률에 영향을 준다는 점
- FE/BE 구성을 수정할 권한이 있는지 여부(메모리 제어 및 전역 활성화 설정에 사용)

SQL Cache 활성화 여부를 결정하기 전에 쿼리가 다음 조건을 충족하는지 항목별로 확인하세요.

- SQL 문이 높은 빈도로 **반복 실행됨**
- 데이터가 **드물게 갱신됨**(높은 캐시 적중률)
- 쿼리에 임의의 값을 반환하는 함수(예: `random()`)가 **포함되지 않음**
- 각 쿼리의 **지표 필드가 일관됨**(동적으로 추가하거나 제거하지 않음)

## 1. 개념 소개 {#1-concept-introduction}

<!-- Knowledge type: concept -->
<!-- Applicable scenario: first-time understanding of how SQL Cache works -->

SQL Cache는 **데이터 갱신 빈도가 낮은** 쿼리 시나리오에 적합합니다. 쿼리 결과를 캐싱해 반복 계산을 방지합니다.

### 캐시 적중의 주요 요소 {#key-factors-for-cache-hits}

SQL Cache는 다음 요소의 조합을 기반으로 캐싱된 데이터를 고유하게 식별합니다.

| 주요 요소                            | 설명                                          |
| ------------------------------------- | ---------------------------------------------------- |
| SQL 텍스트                              | 완전히 동일한 SQL 문자열                      |
| 뷰 정의                       | 관련된 뷰의 DDL 정의             |
| 테이블 및 파티션 버전          | 데이터 변경 여부                    |
| 사용자 변수와 해당 값       | SQL에서 참조하는 변수의 현재 값 |
| 비결정적 함수와 해당 결과 | `now()`와 `random()` 같은 함수의 계산 결과 |
| Row Policy 정의                 | Row Policy 구성                             |
| Data Masking 정의               | Data Masking 구성                           |

> 요소 중 하나라도 변경되면(예: SQL 재작성, 쿼리 필드 또는 조건 변경, 데이터 갱신에 따른 버전 변경) 캐시가 적중하지 않습니다. 여러 테이블을 Join하는 쿼리에서는 **어느 한 테이블이라도** 갱신되면 파티션 ID 또는 버전 번호가 변경되어 캐시가 적중하지 않습니다.

### 적합한 시나리오 {#applicable-scenarios}

- **적극 권장**: T+1 갱신 시나리오. 데이터가 야간에 갱신됩니다. 첫 번째 쿼리는 BE에서 결과를 가져와 캐시에 기록하고, 이후 동일한 쿼리에는 캐시에서 결과를 바로 반환합니다.
- **선택적으로 사용**: 실시간으로 갱신되는 데이터. SQL Cache를 활성화할 수는 있지만 적중률은 낮습니다.
- **지원 범위**: 현재 OlapTable 내부 테이블과 Hive 외부 테이블을 지원합니다.

## 2. 제한 사항 {#2-limitations}

<!-- Knowledge type: limitation -->
<!-- Applicable scenario: optimizing the cache hit rate when writing SQL -->

### 비결정적 함수의 영향 {#impact-of-nondeterministic-functions}

**정의**: 비결정적 함수는 결과와 입력 매개변수 사이에 고정된 관계가 없는 함수입니다.

| 함수       | 동작                                                  | 캐시 사용 가능 여부             |
| -------------- | --------------------------------------------------------- | -------------------------------- |
| `now()`        | 현재 시간을 초 단위로 반환하며, 매초 값이 변경됨 | 같은 초 내에서 재사용 가능 |
| `date(now())`  | 초 단위 시간을 일 단위로 변환       | 같은 날 내에서 재사용 가능(권장) |
| `random()`     | 호출할 때마다 다른 결과를 반환                  | 캐시가 거의 적중하지 않음      |

**최적화 팁**: 세밀한 단위의 시간을 더 큰 단위의 시간으로 변환하세요. 예를 들어, `select * from tbl where dt = date(now())`를 `select * from tbl where dt = now()` 대신 사용하면 같은 날의 모든 쿼리가 캐시에 적중할 수 있습니다. 쿼리에서 `random()`처럼 비결정성이 강한 함수는 사용하지 마세요.

### 지표 필드 확장의 영향 {#impact-of-metric-field-expansion}

SQL Cache는 조회한 필드를 기준으로 결과를 엄격하게 캐싱합니다. 지표가 적은 캐시로 지표가 더 많은 쿼리를 처리하는 것은 **지원하지 않습니다**.

| 시나리오                                                       | 동작                                                  | 영향                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| 지표 2개의 결과가 캐싱된 상태에서 새 쿼리가 지표 3개를 요청함 | 캐시를 재사용할 수 없어 쿼리를 다시 실행해야 함 | 적중률이 낮아지고 새 결과가 새 캐시 항목에 기록됨 |

**최적화 팁**: 업무 보고서와 쿼리 템플릿의 지표 필드를 일정하게 유지하세요. 지표를 추가해야 한다면 임시로 확장하기보다 쿼리 템플릿을 수정해 캐시를 사용할 수 없게 되는 상황을 방지하세요.

## 3. 구현 원리 {#3-implementation-principles}

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding cache hit behavior and locating anomalies -->

### FE 구현 {#fe-implementation}

FE가 쿼리 요청을 받은 후의 처리 흐름은 다음과 같습니다.

1. **메타데이터 조회**: SQL 문자열을 키로 사용해 메모리에서 메타데이터를 조회합니다(메타데이터에는 테이블/파티션 버전이 포함됨).
2. **버전 비교**: 메타데이터가 그대로라면 데이터가 변경되지 않은 것이므로 캐시를 재사용할 수 있습니다.
3. **구문 분석 생략**: SQL 구문 분석 및 최적화 과정을 건너뛰고 consistent hashing을 기반으로 해당 BE를 찾습니다.
4. **결과 반환**:
    - BE에서 캐시 적중: 결과를 클라이언트에 바로 반환합니다.
    - 캐시 미적중: SQL 구문 분석, 최적화, 계산 과정을 모두 실행합니다.
5. **결과 저장**: BE가 계산을 완료하면 FE는 결과를 해당 BE에 저장하고, 다음 쿼리에서 재사용할 수 있도록 메타데이터를 자체 메모리에 기록합니다.

> 특별 최적화: SQL 최적화 단계에서 결과가 0행 또는 1행뿐이라고 판단되면 FE는 결과를 자체 메모리에 직접 저장해 이후 동일한 쿼리를 가속합니다.

### BE 구현 {#be-implementation}

- **consistent hashing**으로 결과를 저장할 BE를 선택합니다. 결과는 BE 메모리에 **HashMap** 구조로 저장됩니다.
- 캐시를 읽거나 쓸 때 SQL 문자열 등의 메타데이터 다이제스트를 키로 사용해 결과 데이터를 빠르게 조회합니다.

## 4. 빠른 시작 {#4-quick-start}

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: enabling SQL Cache and verifying cache hits -->

### 1단계: SQL Cache 활성화 또는 비활성화 {#step-1-enable-or-disable-sql-cache}

**목적**: 세션 또는 전역 수준에서 SQL Cache를 활성화합니다(기본값은 비활성화).

```sql
-- Turn on SQL Cache in the current session; it is off by default
set enable_sql_cache=true;
-- Turn off SQL Cache in the current session
set enable_sql_cache=false;

-- Turn on SQL Cache globally; it is off by default
set global enable_sql_cache=true;
-- Turn off SQL Cache globally
set global enable_sql_cache=false;
```

**참고**: 세션 수준 구성은 현재 세션에만 적용됩니다. 전역 구성은 새로 생성되는 모든 세션에 적용됩니다.

### 2단계: 쿼리의 SQL Cache 적중 여부 확인 {#step-2-check-whether-a-query-hits-the-sql-cache}

#### 방법 A: `explain plan` 사용(Doris 2.1.3+에 적용) {#method-a-use-explain-plan-applicable-to-doris-213}

**목적**: 쿼리 계획으로 캐시 적중 여부를 확인합니다.
**명령**: `explain plan <your SQL>`을 실행합니다.
**참고**: 쿼리 계획 트리에 `LogicalSqlCache` 또는 `PhysicalSqlCache` 노드가 나타나면 해당 쿼리가 SQL Cache에 적중한 것입니다.

```sql
> explain plan select * from t2;

+------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                            |
+------------------------------------------------------------------------------------------------------------+
| ========== PARSED PLAN (time: 28ms) ==========                                                             |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== ANALYZED PLAN  ==========                                                                       |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== REWRITTEN PLAN  ==========                                                                      |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== OPTIMIZED PLAN  ==========                                                                      |
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
+------------------------------------------------------------------------------------------------------------+
```

#### 방법 B: Profile 확인(Doris 2.1.3 이전 버전에 적용) {#method-b-view-the-profile-applicable-to-versions-before-doris-213}

**목적**: `explain plan`을 지원하지 않는 버전에서 캐시 적중 여부를 확인합니다.
**명령**: Profile을 활성화하고 Execution Summary를 확인합니다.
**참고**: `Is Cached:` 필드에 `Yes`가 표시되면 해당 쿼리가 SQL Cache에 적중한 것입니다.

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```

## 5. 지표 모니터링 {#5-metric-monitoring}

<!-- Knowledge type: observability -->
<!-- Applicable scenario: monitoring cache usage and evaluating optimization effects -->

### FE 모니터링 지표 {#fe-monitoring-metrics}

**엔드포인트**: `http://${FE_IP}:${FE_HTTP_PORT}/metrics`
**참고**: 지표 통계는 **단조 증가**합니다. FE를 재시작하면 카운트가 0부터 다시 시작됩니다.

```Plain
# 1 SQL has been written to the cache
doris_fe_cache_added{type="sql"} 1

# The SQL Cache has been hit 2 times
doris_fe_cache_hit{type="sql"} 2
```

### BE 모니터링 지표 {#be-monitoring-metrics}

**엔드포인트**: `http://${BE_IP}:${BE_HTTP_PORT}/metrics`
**참고**: 캐시마다 서로 다른 BE에 저장될 수 있습니다. 전체 현황을 파악하려면 **모든 BE**에서 지표를 수집해야 합니다.

```Plain
# There are currently 1205 caches in the memory of this BE
doris_be_query_cache_sql_total_count 1205

# All caches currently take up about 44KB of BE memory
doris_be_query_cache_memory_total_byte 44101
```

## 6. 메모리 제어 {#6-memory-control}

<!-- Knowledge type: parameter configuration -->
<!-- Applicable scenario: limiting the memory used by SQL Cache -->

### FE 메모리 제어 {#fe-memory-control}

FE의 캐시 메타데이터는 **약한 참조**를 사용합니다. FE의 메모리가 부족해지면 가장 오랫동안 사용하지 않은 메타데이터가 자동으로 해제됩니다. 메모리 사용량을 제한하기 위한 다음 매개변수도 지원합니다.

| 매개변수                          | 기본값   | 설명                                                            |
| ---------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `sql_cache_manage_num`             | 100             | 메타데이터 항목 수의 상한. 초과하면 가장 오랫동안 사용하지 않은 항목이 자동으로 해제됨 |
| `expire_sql_cache_in_fe_second`    | 300             | 메타데이터 만료 시간(초). 이 시간 동안 접근하지 않으면 자동으로 해제됨 |
| `cache_result_max_row_count`       | 3000            | 결과 행 수의 상한. 초과하면 SQL Cache를 생성하지 않음 |
| `cache_result_max_data_size`       | 31457280 (30MB) | 결과 크기의 상한(바이트). 초과하면 SQL Cache를 생성하지 않음 |

**구성 명령**(즉시 적용되며 모든 FE에서 구성해야 함. 영구적으로 적용하려면 `fe.conf`에 기록):

```sql
-- Store at most 100 cache metadata entries
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');

-- Automatically release a cache metadata entry that has not been accessed for 300 seconds
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');

-- Do not create SQL Cache when the result has more than 3000 rows by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');

-- Do not create SQL Cache when the result is larger than 30MB by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### BE 메모리 제어 {#be-memory-control}

| 매개변수                          | 기본값(예시) | 설명                                                            |
| ---------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `query_cache_max_size_mb`          | 256                     | 캐시가 사용하는 메모리의 안정 상태 상한                     |
| `query_cache_elasticity_size_mb`   | 128                     | 탄력적 확장 공간. 사용량이 max + elasticity를 초과하면 제거가 시작되며, 사용량이 max 미만으로 떨어질 때까지 계속됨 |

**구성 파일**: `be.conf`(수정 후 BE를 재시작해야 함).

```conf
-- When the cache memory usage exceeds query_cache_max_size_mb + query_cache_elasticity_size_mb,
-- release the least recently used cache entries until the memory usage drops below query_cache_max_size_mb.
query_cache_max_size_mb = 256
query_cache_elasticity_size_mb = 128
```

## 7. 문제 해결: 캐시 무효화 원인 조사 {#7-troubleshooting-investigating-cache-invalidation}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: locating the cause when a query does not hit the SQL Cache -->

다음 표는 캐시 미적중 또는 무효화의 일반적인 원인과 각 원인에 대한 조사 방향을 정리한 것입니다.

| 번호 | 무효화 원인             | 대표적인 작업                                                | 조사 팁                                  |
| --- | --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| 1   | 테이블 또는 뷰 구조 변경    | `drop table`, `replace table`, `alter table`, `alter view`       | 테이블과 뷰의 최근 DDL 이력 확인      |
| 2   | 테이블 데이터 변경                 | `insert`, `delete`, `update`, `truncate`                         | 데이터 적재 및 변경 로그를 확인해 데이터 버전 변경 여부 확인 |
| 3   | 사용자 권한 취소          | `revoke`                                                         | 쿼리 계정의 권한 변경 사항 확인    |
| 4   | 비결정적 함수 사용 | `select random()`, `select now()` 등                          | 더 큰 단위의 함수 또는 상수 매개변수로 전환 |
| 5   | 변수 값 변경             | `select * from tbl where dt = @dt_var`                           | 세션 변수 값이 일관적인지 확인 |
| 6   | Row Policy / Data Masking 변경  | 행 정책 또는 마스킹 정책 조정                        | 정책의 최근 변경 기록 확인    |
| 7   | 결과 행 수가 제한 초과 | `cache_result_max_row_count` 초과(기본값 3000행)     | 임계값을 조정하거나 결과 집합 범위 축소     |
| 8   | 결과 크기가 제한 초과     | `cache_result_max_data_size` 초과(기본값 30MB)          | 임계값을 조정하거나 반환 필드 축소 |

## 8. 자주 묻는 질문 {#8-faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: answering common questions during use -->

**Q1: SQL Cache는 기본적으로 활성화되어 있나요?**
A: 기본적으로 비활성화되어 있습니다. 세션 수준에서는 `set enable_sql_cache=true`로, 전역으로는 `set global enable_sql_cache=true`로 활성화할 수 있습니다.

**Q2: SQL Cache는 어떤 테이블 유형을 지원하나요?**
A: 현재 OlapTable 내부 테이블과 Hive 외부 테이블을 지원합니다.

**Q3: 실시간으로 갱신되는 데이터에도 SQL Cache를 사용할 수 있나요?**
A: 사용할 수 있지만, 데이터가 갱신될 때마다 파티션 버전이 변경되어 캐시가 무효화되므로 적중률이 낮습니다. SQL Cache는 T+1 오프라인 분석 시나리오에 더 적합합니다.

**Q4: 여러 테이블을 Join하는 쿼리에서는 캐시가 어떻게 무효화되나요?**
A: Join에 참여하는 **어느 한 테이블이라도** 데이터가 변경되면 파티션 ID 또는 버전 번호가 변경되어 전체 쿼리 캐시가 적중하지 않습니다.

**Q: 이전에 두 개의 지표가 캐싱되었습니다. 이제 세 개의 지표를 요청하는 쿼리에서도 캐시를 재사용할 수 있나요?**
A: 재사용할 수 없습니다. SQL Cache는 조회한 필드를 기준으로 결과를 엄격하게 캐싱합니다. 지표가 적은 캐시는 지표가 더 많은 쿼리 요청을 처리할 수 없으므로 쿼리를 다시 실행해야 합니다.

**Q5: `now()` 함수는 캐시를 완전히 무효화하나요?**
A: 캐시를 완전히 무효화하지는 않습니다. `now()`는 초 단위 시간을 반환하므로 같은 초 내에서 실행되는 동일한 쿼리는 캐시를 재사용할 수 있습니다. 캐시가 적중할 수 있는 시간 범위를 늘리려면 `date(now())`로 일 단위로 변환하세요.

**Q6: 캐싱된 데이터는 어디에 저장되나요?**
A: 대부분의 결과는 BE 메모리에 HashMap 구조로 저장됩니다. 결과가 0행 또는 1행뿐이면 FE가 자체 메모리에 직접 저장합니다.

**Q7: FE를 재시작한 후에도 캐시를 사용할 수 있나요?**
A: FE의 메타데이터가 사라지고 모니터링 지표도 0으로 초기화됩니다. BE 메모리의 결과도 재시작 후 무효화됩니다.

## 9. 비교 및 추가 참고 자료 {#9-comparison-and-further-reading}

<!-- Knowledge type: comparison -->
<!-- Applicable scenario: choosing an appropriate caching strategy -->

| 비교 항목          | SQL Cache                               | Partition Cache(해당하는 경우)            |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| 캐시 단위  | 전체 SQL의 결과 집합         | 파티션별로 중간 결과를 캐싱      |
| 적합한 갱신 패턴 | T+1, 낮은 빈도의 갱신       | 일부 파티션은 자주 갱신되지만 다른 파티션은 안정적으로 유지됨 |
| 적중 조건      | SQL 텍스트와 모든 종속 메타데이터가 변경되지 않음 | 관련 파티션의 버전이 변경되지 않음 |
| 무효화 단위 | 종속 요소 중 하나라도 변경되면 전체 캐시가 무효화됨 | 캐시가 적중하지 않은 파티션만 다시 계산하면 됨 |

> 참고: 이 표의 Partition Cache 열은 비교 참고용입니다. 실제 사용 가능 여부는 현재 Doris 버전의 기능에 따라 달라집니다.
