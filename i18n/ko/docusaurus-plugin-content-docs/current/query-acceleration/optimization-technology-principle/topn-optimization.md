---
{
    "title": "TOPN 쿼리 최적화: ORDER BY LIMIT 가속 원리와 설정",
    "language": "ko",
    "description": "Doris는 ORDER BY LIMIT 쿼리를 어떻게 가속할까요? 이 문서에서는 TOPN 최적화 원리, 적용 제한 사항, 세션 매개변수, 실행 계획 확인 방법, 스토리지·컴퓨팅 분리 환경에서 지연 물화의 두 번째 단계에 적용되는 File Cache 정책을 설명합니다.",
    "keywords": ["Doris TOPN 최적화", "ORDER BY LIMIT 가속", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "두 단계 읽기", "File Cache", "RuntimePredicate", "Zonemap 필터링"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 한 문장으로 정의 {#one-sentence-definition}

TOPN 쿼리 최적화는 `ORDER BY ... LIMIT n` 쿼리를 자동으로 가속하는 Doris의 기능입니다. 동적 필터링, 범위 가지치기, 지연 물화를 통해 스캔과 정렬에 드는 비용을 크게 줄입니다.

## 읽기 전 확인 사항 {#pre-reading-checklist}

- [ ] SQL이 `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n` 형식이다
- [ ] 테이블 유형이 Duplicate 테이블 또는 Unique MOW 테이블이다(MOR은 제외)
- [ ] `n`이 작다(`topn_opt_limit_threshold`보다 작으며, 기본값은 1024)
- [ ] EXPLAIN과 Profile을 통해 최적화 적용 여부를 확인하려 한다

## 일반적인 SQL 패턴 {#typical-sql-pattern}

TOPN 쿼리는 로그 검색과 같은 상세 조회에서 흔히 사용됩니다. Doris는 다음과 같은 쿼리를 자동으로 인식하고 최적화합니다.

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 세 가지 최적화 방식 {#three-optimization-points}

| 번호 | 최적화 | 원리 | 주요 이점 |
| :--- | :--- | :--- | :--- |
| 최적화 1 | 동적 범위 필터링(RuntimePredicate) | 정렬 중 정렬 열에 대한 범위 조건(예: `c1 >= 10000`)을 동적으로 생성해 스캔 단계로 푸시다운합니다 | Zonemap 인덱스를 사용해 많은 데이터, 경우에 따라 파일 전체를 걸러냅니다 |
| 최적화 2 | 키 접두사 단축 읽기 | 정렬 필드 `c1, c2`가 테이블 키의 접두사와 정확히 일치하면 데이터 파일의 처음 또는 마지막 n개 행만 읽습니다 | 디스크 읽기량을 크게 줄입니다 |
| 최적화 3 | 두 단계 지연 물화 | 첫 번째 단계에서는 정렬 열만 읽어 정렬을 마치고 행 번호를 얻으며, 두 번째 단계에서 나머지 열을 읽습니다 | 읽고 정렬해야 하는 열의 수를 크게 줄입니다 |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 적용 제한 사항 {#applicable-limitations}

1. **테이블 유형 제한**: Duplicate 테이블과 Unique MOW 테이블만 지원합니다. Unique MOR 테이블에 이 최적화를 사용하면 잘못된 결과가 나올 수 있습니다.
2. **n 값 제한**: `n`이 너무 크면 최적화에 필요한 메모리 사용량이 크게 늘어납니다. `n`이 세션 변수 `topn_opt_limit_threshold`를 초과하면 최적화가 활성화되지 않습니다.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **두 단계 읽기 제한**: 4.1.5부터 Doris 내부 테이블의 TopN 지연 물화에는 `light_schema_change`가 필요하며 Aggregate Key 테이블은 지원하지 않습니다. dev에서는 sequence 열 매핑이 있는 테이블도 이 최적화에서 제외됩니다. 이러한 조건을 충족하지 못해도 Doris는 일반 TopN 실행 경로를 사용하므로 쿼리는 계속 실행할 수 있습니다.

## 설정 매개변수 {#configuration-parameters}

다음 네 가지 매개변수는 모두 세션 변수입니다. 개별 SQL 문에 대해 설정하거나 전역으로 설정할 수 있습니다.

| 매개변수 | 기본값 | 효과 | 조정 제안 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n이 이 값보다 작을 때만 TOPN 최적화가 활성화됩니다 | 전체 TOPN 최적화를 비활성화하려면 `0`으로 설정합니다 |
| `enable_two_phase_read_opt` | true | 최적화 3(두 단계 지연 물화)의 활성화 여부를 결정합니다 | 최적화 3만 비활성화하려면 `false`로 설정합니다 |
| `topn_filter_ratio` | 0.5 | LIMIT n과 테이블 전체 데이터의 비율에 대한 임곗값입니다 | LIMIT 건수가 테이블 데이터의 절반을 초과하면 필터를 더 이상 생성하지 않습니다 |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | 스토리지·컴퓨팅 분리 모드에서 Doris 내부 테이블의 지연 물화 두 번째 단계가 File Cache 미스 시 캐시 쓰기를 건너뛸지 결정합니다 | 두 번째 단계에서 읽은 데이터의 재사용률이 낮고 캐시를 오염시킬 가능성이 있을 때만 활성화합니다 |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN 최적화 활성화 여부 확인 {#check-whether-topn-optimization-is-enabled}

**목적**: 실행 계획을 사용해 현재 SQL에 어떤 최적화 방식이 활성화되었는지 확인합니다.

**명령**:

```sql
EXPLAIN <your_sql>;
```

**설명**: Query Plan에서 다음 표시를 확인합니다.

- `TOPN OPT`: **최적화 1**(동적 범위 필터링)이 활성화되었습니다
- `VOlapScanNode` 아래의 `SORT LIMIT`: **최적화 2**(키 접두사 단축 읽기)가 활성화되었습니다
- `MaterializeNode`(또는 이전 실행 계획의 `OPT TWO PHASE`): **최적화 3**(두 단계 지연 물화)이 활성화되었습니다

**예시**:

```sql
  1:VTOP-N(137)
  |  order by: @timestamp18 DESC
  |  TOPN OPT
  |  OPT TWO PHASE
  |  offset: 0
  |  limit: 10
  |  distribute expr lists: applicationName5
  |
  0:VOlapScanNode(106)
     TABLE: log_db.log_core_all_no_index(log_core_all_no_index), PREAGGREGATION: ON
     SORT INFO:
          @timestamp18
     SORT LIMIT: 10
     TOPN OPT:1
     PREDICATES: ZYCFC-TRACE-ID4 like '%flowId-1720055220933%'
     partitions=1/8 (p20240704), tablets=250/250, tabletList=1727094,1727096,1727098 ...
     cardinality=345472780, avgRowSize=0.0, numNodes=1
     pushAggOp=NONE
```

<!-- Knowledge type: configuration + operation + troubleshooting -->
<!-- Applicable scenarios: controlling File Cache writes during TOPN lazy materialization phase 2 in clusters with storage-compute separation -->

## 지연 물화의 두 번째 단계에서 File Cache 쓰기 제어 {#control-file-cache-writes-during-lazy-materialization-phase-2}

스토리지·컴퓨팅 분리 클러스터에서 TOPN 지연 물화의 두 번째 단계는 첫 번째 단계에서 선택한 행 ID를 사용해 나머지 열을 읽습니다. 소수의 결과 행이 여러 Segment에 흩어져 있다면 이러한 산발적인 읽기로 채워진 캐시 블록은 재사용률이 낮고 자주 사용되는 데이터를 캐시에서 밀어낼 수 있습니다. 이 경우 `enable_topn_lazy_mat_phase2_no_write_file_cache`를 활성화하면 두 번째 단계에서 캐시 미스가 발생했을 때 원격 스토리지에서 직접 읽고 File Cache에는 쓰지 않습니다.

이 변수는 쿼리 결과를 변경하지 않습니다. 두 번째 단계에서 File Cache 미스를 처리하는 방식만 변경합니다.

| 설정 | 두 번째 단계의 읽기 동작 |
| :--- | :--- |
| `false`(기본값) | 일반적인 읽기 및 캐시 쓰기 정책을 사용합니다. 캐시 미스가 발생하면 Doris가 원격 데이터를 읽고 File Cache에 씁니다 |
| `true` | `DOWNLOADED` 상태의 캐시 블록이 현재 읽기 범위 전체를 덮을 때만 로컬 캐시에서 읽습니다. 일부라도 캐시되지 않았거나 아직 다운로드 중이면 현재 범위 전체를 원격 스토리지에서 읽으며 캐시 블록을 생성하거나 쓰지 않습니다 |

이 변수를 활성화하기 전에 다음 적용 범위를 확인하세요.

- 스토리지·컴퓨팅 분리 모드에서만 적용되며 Doris 내부 테이블의 TOPN 지연 물화 두 번째 단계만 제어합니다. 현재 외부 테이블의 두 번째 단계 읽기는 제어하지 않습니다.
- 행 저장소의 활성화 여부와 관계없이 Doris 내부 테이블을 지원합니다.
- 기존 캐시 항목을 삭제하거나 첫 번째 단계, 다른 쿼리, 다른 연산자의 캐시 쓰기를 변경하지 않습니다. 따라서 쿼리 전체의 File Cache 쓰기량은 여전히 0보다 클 수 있습니다.
- File Cache가 비활성화되어 있거나 실행 계획에 `MaterializeNode`가 없으면 추가 효과가 없습니다.

### 기본 사용법 {#basic-usage}

다음 예시를 실행하려면 스토리지·컴퓨팅 분리 클러스터, BE에 활성화된 File Cache, 대상 데이터베이스에서 테이블 생성·삭제와 데이터 삽입·조회 권한이 있는 사용자가 필요합니다. 먼저 Duplicate Key 내부 테이블을 생성합니다.

```sql
DROP TABLE IF EXISTS topn_file_cache_demo;

CREATE TABLE topn_file_cache_demo (
    id BIGINT NOT NULL,
    event_time DATETIME NOT NULL,
    payload VARCHAR(128) NOT NULL
)
ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "light_schema_change" = "true"
);

INSERT INTO topn_file_cache_demo VALUES
    (1, '2026-01-01 10:00:00', 'alpha'),
    (2, '2026-01-02 10:00:00', 'beta'),
    (3, '2026-01-03 10:00:00', 'gamma');
```

Profile과 두 번째 단계의 캐시 쓰기 생략 정책을 활성화한 다음 실행 계획을 확인하고 쿼리를 실행합니다.

```sql
SET enable_profile = true;
SET profile_level = 2;
SET enable_sql_cache = false;
SET enable_query_cache = false;
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

EXPLAIN SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;

SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;
```

실행 계획에는 `MaterializeNode`가 포함되어야 합니다. 변수 활성화 여부와 관계없이 쿼리는 다음 결과를 반환합니다.

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

기본 캐시 쓰기 동작으로 복원하려면 다음을 실행합니다.

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Profile에서 캐시 정책 확인 {#verify-the-cache-policy-in-profile}

`profile_level`을 `2`로 설정한 후 Query Profile에서 `MaterializeNode`에 해당하는 실행 연산자 아래의 두 번째 단계 전용 지표를 확인합니다.

| 구분 | 집계 지표 | 의미 |
| :--- | :--- | :--- |
| 읽기 규모 | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | 두 번째 단계에서 읽은 행 수와 접근한 Segment 수 |
| 로컬 캐시 읽기 | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cache에서 읽은 횟수, 바이트 수, 소요 시간 |
| 원격 읽기 | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | 원격 스토리지에서 읽은 횟수, 바이트 수, 소요 시간 |
| 캐시 쓰기 생략 | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cache에 쓰지 않은 원격 읽기 횟수 |
| 캐시 쓰기 | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cache에 쓴 바이트 수와 쓰기에 소요된 시간 |

캐시 쓰기 생략 정책을 활성화했다면 다음 지표 패턴으로 동작을 확인합니다.

| 캐시 상태 | 예상 지표 패턴 |
| :--- | :--- |
| 현재 읽기 범위의 일부가 캐시되지 않음 | `RemoteIOCount`, `RemoteIOBytes`, `SkipCacheIOCount`가 0보다 크고 `WriteCacheBytes`는 0 |
| 다운로드가 완료된 캐시 블록이 현재 읽기 범위 전체를 덮음 | `LocalIOCount`와 `LocalIOBytes`가 0보다 크고 `RemoteIOCount`, `RemoteIOBytes`, `WriteCacheBytes`는 0 |

Profile은 BE별 지표도 제공합니다. `TopNLazyMaterializationSecondPhasePerBackend`에는 BE 목록이 표시됩니다. 다른 지표 이름에는 `SecondPhase` 뒤에 `PerBackend`가 추가됩니다. 예를 들어 `TopNLazyMaterializationSecondPhasePerBackendRowsRead`와 `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`가 있습니다. 배열 원소는 인덱스에 따라 BE 목록과 대응하며, 동일한 쿼리에서 여러 차례 발생한 두 번째 단계 데이터 가져오기의 값을 누적합니다.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes`는 지연 물화의 두 번째 단계만 집계합니다. 일반 File Cache 지표에 여전히 쓰기가 표시된다면 먼저 첫 번째 단계나 다른 연산자에서 발생한 쓰기인지 확인하세요. Profile을 얻는 방법은 [Query Profile 분석](../query-profile.md)을 참조하세요.
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN 최적화의 실행 효과 확인 {#check-the-execution-effect-of-topn-optimization}

**목적**: 실행 시간과 Profile 지표를 비교해 TOPN 최적화의 실제 필터링 효과를 확인합니다.

**단계**:

1. `topn_opt_limit_threshold`를 `0`으로 설정해 최적화를 비활성화하고 실행 시간을 기록합니다.
2. 기본값으로 복원해 최적화를 활성화한 후 실행 시간을 기록하고 비교합니다.
3. Query Profile에서 `RuntimePredicate`를 검색하고 아래 표의 주요 지표를 확인합니다.

**주요 지표**:

| 지표 | 의미 | 기대하는 경향 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicate로 걸러낸 행 수 | 클수록 좋습니다 |
| `NumSegmentFiltered` | 걸러낸 데이터 파일(Segment) 수 | 클수록 좋습니다 |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate가 데이터를 필터링하는 데 걸린 시간 | 작을수록 좋습니다 |

> 참고: 2.0.3 이전 버전에서는 `RuntimePredicate` 지표가 별도로 집계되지 않습니다. 일반 Zonemap 지표를 통해 대략적인 효과를 확인할 수 있습니다.

**Profile 예시**:

```sql
    SegmentIterator:
          -  BitmapIndexFilterTimer:  46.54us
          -  BlockConditionsFilteredBloomFilterTime:  10.352us
          -  BlockConditionsFilteredDictTime:  7.299us
          -  BlockConditionsFilteredTime:  202.23ms
          -  BlockConditionsFilteredZonemapRuntimePredicateTime:  0ns
          -  BlockConditionsFilteredZonemapTime:  402.917ms
          -  BlockInitSeekCount:  399
          -  BlockInitSeekTime:  11.309ms
          -  BlockInitTime:  215.59ms
          -  BlockLoadTime:  7s567ms
          -  BlocksLoad:  392.97K  (392970)
          -  CachedPagesNum:  0
          -  CollectIteratorMergeTime:  0ns
          -  CollectIteratorNormalTime:  0ns
          -  CompressedBytesRead:  29.76  MB
          -  DecompressorTimer:  427.713ms
          -  ExprFilterEvalTime:  3s930ms
          -  FirstReadSeekCount:  392.921K  (392921)
          -  FirstReadSeekTime:  528.287ms
          -  FirstReadTime:  1s134ms
          -  IOTimer:  51.286ms
          -  InvertedIndexFilterTime:  49.457us
          -  InvertedIndexQueryBitmapCopyTime:  0ns
          -  InvertedIndexQueryBitmapOpTime:  0ns
          -  InvertedIndexQueryCacheHit:  0
          -  InvertedIndexQueryCacheMiss:  0
          -  InvertedIndexQueryTime:  0ns
          -  InvertedIndexSearcherOpenTime:  0ns
          -  InvertedIndexSearcherSearchTime:  0ns
          -  LazyReadSeekCount:  0
          -  LazyReadSeekTime:  0ns
          -  LazyReadTime:  106.952us
          -  NumSegmentFiltered:  0
          -  NumSegmentTotal:  50
          -  OutputColumnTime:  61.987ms
          -  OutputIndexResultColumnTimer:  12.345ms
          -  RawRowsRead:  3.929151M  (3929151)
          -  RowsBitmapIndexFiltered:  0
          -  RowsBloomFilterFiltered:  0
          -  RowsConditionsFiltered:  6.38976M  (6389760)
          -  RowsDictFiltered:  0
          -  RowsInvertedIndexFiltered:  0
          -  RowsKeyRangeFiltered:  0
          -  RowsShortCircuitPredFiltered:  0
          -  RowsShortCircuitPredInput:  0
          -  RowsStatsFiltered:  6.38976M  (6389760)
          -  RowsVectorPredFiltered:  0
          -  RowsVectorPredInput:  0
          -  RowsZonemapRuntimePredicateFiltered:  6.38976M  (6389760)
          -  SecondReadTime:  0ns
          -  ShortPredEvalTime:  0ns
          -  TotalPagesNum:  2.301K  (2301)
          -  UncompressedBytesRead:  137.99  MB
          -  VectorPredEvalTime:  0ns
```

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting -->

## 자주 묻는 질문(FAQ / 문제 해결) {#frequently-asked-questions-faq--troubleshooting}

**Q1: EXPLAIN에 `TOPN OPT`가 표시되지 않는 이유는 무엇인가요?**

- LIMIT n이 `topn_opt_limit_threshold`(기본값 1024)보다 큽니다.
- LIMIT n과 테이블 전체 행 수의 비율이 `topn_filter_ratio`(기본값 0.5)를 초과합니다.
- 테이블이 이 최적화를 사용할 수 없는 Unique MOR 테이블입니다.

**Q2: 최적화를 활성화한 뒤 SQL이 더 느려진 이유는 무엇인가요?**

- `n`이 너무 커서 메모리 사용량이 늘어났는지 확인하세요. 필요에 따라 `topn_opt_limit_threshold`를 낮출 수 있습니다.
- Profile의 `RowsZonemapRuntimePredicateFiltered`로 필터링 효과를 확인하세요. 걸러낸 행 수가 0이면 최적화로 인한 이점이 없습니다.

**Q3: 최적화 1과 2는 유지하면서 최적화 3(두 단계 읽기)만 비활성화하려면 어떻게 하나요?**

`enable_two_phase_read_opt = false`로 설정합니다.

**Q4: MOR 테이블에서 ORDER BY LIMIT 쿼리가 잘못된 결과를 반환하는 이유는 무엇인가요?**

MOR 테이블에 TOPN 최적화가 활성화되지 않았는지 확인하세요. MOR 테이블에서는 MOW 모델을 사용하거나 이 최적화 경로가 실행되지 않도록 하세요.

**Q5: 두 번째 단계의 캐시 쓰기 생략 정책을 활성화했는데도 쿼리가 File Cache에 쓰는 이유는 무엇인가요?**

이 정책은 Doris 내부 테이블의 TOPN 지연 물화 두 번째 단계만 제어합니다. 첫 번째 단계, 다른 연산자, 외부 테이블 읽기에서는 여전히 File Cache에 쓸 수 있습니다. 쿼리 전체의 쓰기량 대신 `TopNLazyMaterializationSecondPhaseWriteCacheBytes`로 두 번째 단계에서 캐시 쓰기가 발생했는지 확인하세요.

### LIMIT 값이 큰 쿼리를 위해 1024 임곗값을 높일 수 있나요? {#larger-topn-limits}

가능합니다. `topn_opt_limit_threshold`의 기본값은 1024이며 여러 TopN 최적화 경로를 제어합니다. 이 값은 SQL `LIMIT`에서 지원하는 최댓값이 아니며, 각 경로가 임곗값 자체를 포함하는지도 동일하지 않습니다. `LIMIT 5000` 쿼리를 평가하려면 먼저 현재 세션에서 임곗값을 높입니다.

```sql
SET topn_opt_limit_threshold = 10000;
```

변경 전후에 동일한 쿼리의 `EXPLAIN`과 Profile을 비교하세요. 후보 행이 늘어나면 정렬 CPU 사용량, 최대 메모리 사용량, 두 단계 물화에서 다시 읽는 행 수가 증가할 수 있습니다. 스토리지·컴퓨팅 분리 모드에서는 산발적인 두 번째 단계 읽기로 원격 I/O도 증가할 수 있습니다. 테이블 유형, 정렬 키, 선택도 및 다른 최적화 조건은 여전히 적용됩니다. 임곗값을 높여도 모든 TopN 최적화가 강제로 활성화되지는 않습니다.

실제 사용 환경을 대표하는 동시 실행 부하에서 쿼리 지연 시간, 스캔한 행 수, 최대 메모리 사용량을 확인하고, 지표가 제공된다면 두 번째 읽기 시간과 원격 읽기 바이트 수도 확인하세요. 실험 후 `SET topn_opt_limit_threshold = 1024;`로 기본값을 복원합니다. 작업 부하에서 이점이 확인되기 전에는 전역 값을 높이지 마세요.

## 관련 매개변수 빠른 참조 {#quick-reference-for-related-parameters}

| 원하는 효과 | 설정 |
| :--- | :--- |
| TOPN 최적화 전체 비활성화 | `SET topn_opt_limit_threshold = 0;` |
| 두 단계 지연 물화만 비활성화 | `SET enable_two_phase_read_opt = false;` |
| 더 많은 쿼리에 적용되도록 LIMIT 상한 완화 | `topn_opt_limit_threshold`를 적절히 높입니다 |
| 필터 생성 비율의 임곗값 조정 | `topn_filter_ratio`를 변경합니다 |
| 두 번째 단계에서 캐시 미스가 발생할 때 File Cache에 쓰지 않음 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| 두 번째 단계의 기본 캐시 쓰기 동작 복원 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
