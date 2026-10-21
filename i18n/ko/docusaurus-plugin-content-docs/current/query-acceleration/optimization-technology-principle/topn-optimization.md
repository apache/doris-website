---
{
    "title": "TOPN 쿼리 최적화: ORDER BY LIMIT 가속 원리와 구성",
    "language": "ko",
    "description": "Doris는 ORDER BY LIMIT 쿼리를 어떻게 가속할까요? 이 문서에서는 TOPN 최적화 원리, 적용 제약 사항, 세션 매개변수, 실행 계획 확인 방법, 스토리지와 컴퓨팅이 분리된 배포 환경에서 지연 구체화를 위한 2단계 File Cache 정책을 설명합니다.",
    "keywords": ["Doris TOPN 최적화", "ORDER BY LIMIT 가속", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "두 단계 읽기", "File Cache", "RuntimePredicate", "Zonemap 필터링"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 한 문장 정의 {#one-sentence-definition}

TOPN 쿼리 최적화는 Doris가 `ORDER BY ... LIMIT n` 쿼리를 자동으로 가속하는 기능입니다. 동적 필터링, 범위 프루닝, 지연 구체화를 통해 스캔과 정렬의 오버헤드를 크게 줄입니다.

## 읽기 전 확인 사항 {#pre-reading-checklist}

- [ ] 내 SQL은 `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n` 형식입니다
- [ ] 테이블 유형은 Duplicate 테이블 또는 Unique MOW 테이블입니다(MOR 제외)
- [ ] `n`이 작습니다(`topn_opt_limit_threshold` 미만, 기본값 1024)
- [ ] EXPLAIN과 Profile로 최적화 적용 여부를 확인하려고 합니다

## 대표적인 SQL 패턴 {#typical-sql-pattern}

TOPN 쿼리는 로그 검색과 같이 상세 데이터를 조회하는 시나리오에서 자주 사용됩니다. Doris는 이러한 쿼리를 자동으로 인식하고 최적화합니다.

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 세 가지 최적화 방식 {#three-optimization-points}

| 번호 | 최적화 | 원리 | 주요 이점 |
| :--- | :--- | :--- | :--- |
| 최적화 1 | 동적 범위 필터링(RuntimePredicate) | 정렬 중에 정렬 열의 범위 조건(예: `c1 >= 10000`)을 동적으로 생성하여 스캔으로 푸시다운 | Zonemap 인덱스를 사용하여 대량의 데이터뿐 아니라 파일 전체도 필터링으로 제외 |
| 최적화 2 | 키 접두사 단축 읽기 | 정렬 필드 `c1, c2`가 테이블 키의 접두사와 정확히 일치하면 데이터 파일의 처음 또는 마지막 n개 행만 읽음 | 디스크 읽기를 크게 줄임 |
| 최적화 3 | 두 단계 지연 구체화 | 첫 번째 단계에서는 정렬 열만 읽어 정렬을 완료하고 행 번호를 얻으며, 두 번째 단계에서는 나머지 열을 읽음 | 읽고 정렬해야 하는 열의 수를 크게 줄임 |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 적용 시 제약 사항 {#applicable-limitations}

1. **테이블 유형 제한**: Duplicate 테이블과 Unique MOW 테이블만 지원합니다. Unique MOR 테이블에 이 최적화를 사용하면 잘못된 결과가 나올 수 있습니다.
2. **n 값 제한**: `n`이 너무 크면 최적화에 필요한 메모리 사용량이 크게 증가합니다. `n`이 세션 변수 `topn_opt_limit_threshold`를 초과하면 최적화가 활성화되지 않습니다.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **두 단계 읽기 제한**: 4.1.5부터 Doris 내부 테이블에 TopN 지연 구체화를 적용하려면 `light_schema_change`가 필요하며, Aggregate Key 테이블은 지원하지 않습니다. dev에서는 시퀀스 열 매핑이 있는 테이블도 이 최적화의 대상에서 제외됩니다. 이러한 조건을 충족하지 않으면 Doris는 일반 TopN 실행 경로를 사용하며, 쿼리는 계속 실행할 수 있습니다.

## 구성 매개변수 {#configuration-parameters}

다음 네 가지 매개변수는 모두 세션 변수입니다. 단일 SQL 문에 적용하거나 전역으로 설정할 수 있습니다.

| 매개변수 | 기본값 | 효과 | 조정 권장 사항 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n이 이 값보다 작을 때만 TOPN 최적화를 활성화 | `0`으로 설정하면 TOPN 최적화 전체를 비활성화 |
| `enable_two_phase_read_opt` | true | 최적화 3(두 단계 지연 구체화)의 활성화 여부 | `false`로 설정하면 최적화 3만 비활성화 |
| `topn_filter_ratio` | 0.5 | 테이블 전체 데이터 대비 LIMIT n의 비율 임계값 | LIMIT 개수가 테이블 데이터의 절반을 초과하면 필터를 더 이상 생성하지 않음 |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | 스토리지와 컴퓨팅이 분리된 모드에서 Doris 내부 테이블의 지연 구체화 2단계에 File Cache 미스가 발생할 때 캐시에 쓰는 과정을 생략할지 제어 | 2단계에서 읽은 데이터의 재사용률이 낮고 캐시를 오염시킬 가능성이 있을 때만 활성화 |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN 최적화 활성화 여부 확인 {#check-whether-topn-optimization-is-enabled}

**목적**: 실행 계획을 사용하여 현재 SQL에 어떤 최적화가 활성화되어 있는지 확인합니다.

**명령**:

```sql
EXPLAIN <your_sql>;
```

**설명**: Query Plan에서 다음 표시를 확인합니다.

- `TOPN OPT`: **최적화 1**(동적 범위 필터링)이 활성화됨
- `SORT LIMIT`가 `VOlapScanNode` 아래에 표시됨: **최적화 2**(키 접두사 단축 읽기)가 활성화됨
- `MaterializeNode`(이전 실행 계획에서는 `OPT TWO PHASE`): **최적화 3**(두 단계 지연 구체화)이 활성화됨

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

## 지연 구체화 2단계의 File Cache 쓰기 제어 {#control-file-cache-writes-during-lazy-materialization-phase-2}

스토리지와 컴퓨팅이 분리된 클러스터에서 TOPN 지연 구체화의 2단계는 1단계에서 선택한 행 ID를 기준으로 나머지 열을 읽습니다. 소수의 결과 행이 여러 Segment에 분산되어 있으면 이러한 희소 읽기로 채워진 캐시 블록은 재사용이 거의 되지 않으면서 자주 사용하는 데이터를 캐시에서 밀어낼 수 있습니다. 이 경우 `enable_topn_lazy_mat_phase2_no_write_file_cache`를 활성화하면 2단계에서 캐시 미스가 발생한 데이터를 원격 스토리지에서 직접 읽고 File Cache에는 쓰지 않습니다.

이 변수는 쿼리 결과를 변경하지 않습니다. 2단계에서 File Cache 미스를 처리하는 방식만 변경합니다.

| 설정 | 2단계 읽기 동작 |
| :--- | :--- |
| `false`(기본값) | 일반적인 read-through 및 writeback 정책을 사용합니다. 캐시 미스가 발생하면 Doris가 원격 데이터를 읽고 해당 데이터를 File Cache에 씁니다 |
| `true` | `DOWNLOADED` 상태의 캐시 블록이 현재 읽기 범위 전체를 포함할 때만 로컬 캐시를 읽습니다. 일부라도 캐시되지 않았거나 아직 다운로드 중이면 Doris는 캐시 블록을 생성하거나 쓰지 않고 현재 범위 전체를 원격 스토리지에서 읽습니다 |

이 변수를 활성화하기 전에 다음 적용 범위를 확인하세요.

- 스토리지와 컴퓨팅이 분리된 모드에서만 적용되며, Doris 내부 테이블의 TOPN 지연 구체화 2단계만 제어합니다. 현재 외부 테이블의 2단계 읽기는 제어하지 않습니다.
- 행 저장 활성화 여부와 관계없이 Doris 내부 테이블을 지원합니다.
- 기존 캐시 항목을 제거하지 않으며, 1단계나 다른 쿼리 또는 다른 연산자의 캐시 쓰기도 변경하지 않습니다. 따라서 쿼리의 전체 File Cache 쓰기량은 여전히 영보다 클 수 있습니다.
- File Cache가 비활성화되어 있거나 실행 계획에 `MaterializeNode`가 없으면 추가적인 효과가 없습니다.

### 기본 사용법 {#basic-usage}

다음 예시에는 스토리지와 컴퓨팅이 분리된 클러스터, BE에서 활성화된 File Cache, 대상 데이터베이스에서 테이블 생성 및 삭제와 데이터 삽입 및 조회를 수행할 수 있는 사용자가 필요합니다. 먼저 Duplicate Key 내부 테이블을 생성합니다.

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

Profile과 2단계 캐시 쓰기 생략 정책을 활성화한 뒤 실행 계획을 확인하고 쿼리를 실행합니다.

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

실행 계획에는 `MaterializeNode`가 포함되어야 합니다. 변수의 활성화 여부와 관계없이 쿼리는 다음 결과를 반환합니다.

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

`profile_level`을 `2`로 설정한 후, Query Profile에서 `MaterializeNode`에 해당하는 실행 연산자 아래의 다음 2단계 전용 지표를 확인합니다.

| 구분 | 집계 지표 | 의미 |
| :--- | :--- | :--- |
| 읽기 규모 | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | 2단계에서 읽은 행 수와 접근한 Segment 수 |
| 로컬 캐시 읽기 | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cache 읽기 횟수, 바이트 수, 소요 시간 |
| 원격 읽기 | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | 원격 스토리지 읽기 횟수, 바이트 수, 소요 시간 |
| 캐시 우회 | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cache에 쓰지 않은 원격 읽기 횟수 |
| 캐시 쓰기 | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cache에 쓴 바이트 수와 쓰기에 소요된 시간 |

캐시 쓰기 생략 정책을 활성화했으면 다음 패턴으로 동작을 확인합니다.

| 캐시 상태 | 예상 지표 패턴 |
| :--- | :--- |
| 현재 읽기 범위가 완전히 캐시되지 않음 | `RemoteIOCount`, `RemoteIOBytes`, `SkipCacheIOCount`는 0보다 크고, `WriteCacheBytes`는 0 |
| 다운로드가 완료된 캐시 블록이 현재 읽기 범위 전체를 포함함 | `LocalIOCount`와 `LocalIOBytes`는 0보다 크고, `RemoteIOCount`, `RemoteIOBytes`, `WriteCacheBytes`는 0 |

Profile은 BE별 지표도 제공합니다. `TopNLazyMaterializationSecondPhasePerBackend`에는 BE 목록이 표시됩니다. 다른 지표 이름은 `PerBackend`를 `SecondPhase` 뒤에 추가합니다. 예를 들면 `TopNLazyMaterializationSecondPhasePerBackendRowsRead`와 `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`입니다. 배열 요소는 인덱스별로 BE 목록에 대응하며, 같은 쿼리에서 수행한 여러 2단계 가져오기 작업의 데이터를 누적합니다.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes`는 지연 구체화의 2단계만 집계합니다. 일반 File Cache 지표에서 여전히 쓰기가 보고되면 먼저 1단계나 다른 연산자에서 발생한 것인지 확인합니다. Profile을 확인하는 방법은 [쿼리 Profile 분석](../query-profile.md)을 참고하세요.
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN 최적화 실행 효과 확인 {#check-the-execution-effect-of-topn-optimization}

**목적**: 실행 시간과 Profile 지표를 비교하여 TOPN 최적화의 실제 필터링 효과를 확인합니다.

**절차**:

1. `topn_opt_limit_threshold`를 `0`으로 설정하여 최적화를 비활성화하고 실행 시간을 기록합니다.
2. 기본값으로 복원하여 최적화를 활성화하고 실행 시간을 기록한 뒤 비교합니다.
3. Query Profile에서 `RuntimePredicate`를 검색하고 아래 표의 주요 지표를 확인합니다.

**주요 지표**:

| 지표 | 의미 | 기대 방향 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicate로 필터링하여 제외한 행 수 | 클수록 좋음 |
| `NumSegmentFiltered` | 필터링하여 제외한 데이터 파일(Segment) 수 | 클수록 좋음 |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate가 데이터를 필터링하는 데 걸린 시간 | 작을수록 좋음 |

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

**Q1: EXPLAIN에 `TOPN OPT`가 표시되지 않습니다. 원인이 무엇일까요?**

- LIMIT n이 `topn_opt_limit_threshold`(기본값 1024)보다 큽니다.
- 테이블의 전체 행 수 대비 LIMIT n의 비율이 `topn_filter_ratio`(기본값 0.5)를 초과합니다.
- 테이블이 이 최적화를 사용할 수 없는 Unique MOR 테이블입니다.

**Q2: 최적화를 활성화한 뒤 SQL이 더 느려졌습니다. 이유가 무엇일까요?**

- `n`이 너무 커서 메모리 오버헤드가 증가했는지 확인합니다. `topn_opt_limit_threshold`를 적절히 낮출 수 있습니다.
- Profile의 `RowsZonemapRuntimePredicateFiltered`로 필터링 효과를 확인합니다. 필터링으로 제외된 행 수가 0이면 최적화의 이점이 없습니다.

**Q3: 최적화 3(두 단계 읽기)만 비활성화하고 최적화 1과 2는 유지하려면 어떻게 해야 하나요?**

`enable_two_phase_read_opt = false`로 설정합니다.

**Q4: MOR 테이블의 ORDER BY LIMIT 쿼리가 잘못된 결과를 반환합니다. 이유가 무엇일까요?**

MOR 테이블에서 TOPN 최적화가 활성화되어 있지 않은지 확인합니다. MOR 테이블에서는 MOW 모델을 사용하거나 이 최적화 경로가 실행되지 않도록 합니다.

**Q5: 2단계 캐시 쓰기 생략 정책을 활성화한 뒤에도 쿼리가 File Cache에 쓰는 이유는 무엇인가요?**

이 정책은 Doris 내부 테이블의 TOPN 지연 구체화 2단계만 제어합니다. 1단계, 다른 연산자, 외부 테이블 읽기는 여전히 File Cache에 쓸 수 있습니다. 쿼리의 전체 쓰기량에 의존하지 말고 `TopNLazyMaterializationSecondPhaseWriteCacheBytes`를 사용하여 2단계에서 캐시 쓰기가 발생했는지 확인합니다.

## 관련 매개변수 빠른 참조 {#quick-reference-for-related-parameters}

| 원하는 효과 | 설정 |
| :--- | :--- |
| TOPN 최적화를 완전히 비활성화 | `SET topn_opt_limit_threshold = 0;` |
| 두 단계 지연 구체화만 비활성화 | `SET enable_two_phase_read_opt = false;` |
| 더 많은 쿼리에 적용되도록 LIMIT 상한 완화 | `topn_opt_limit_threshold`를 적절히 높임 |
| 필터 생성에 사용하는 비율 임계값 조정 | `topn_filter_ratio` 수정 |
| 2단계에서 캐시 미스가 발생한 데이터를 File Cache에 쓰지 않음 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| 기본 2단계 캐시 쓰기 동작 복원 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
