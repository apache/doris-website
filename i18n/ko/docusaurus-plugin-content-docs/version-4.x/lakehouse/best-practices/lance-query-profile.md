---
{
    "title": "Lance 쿼리 Profile 참조",
    "sidebar_label": "Lance 쿼리 Profile",
    "language": "ko",
    "description": "Apache Doris Lance 쿼리 Profile의 FE 메타데이터 및 계획 수립, BE 인덱스 및 스캔 지표, 캐시 통계, 시간 측정 범위, 두 번째 단계의 row-ID 조회를 해석하는 방법을 설명합니다.",
    "keywords": [
        "Lance",
        "쿼리 Profile",
        "성능 분석",
        "벡터 검색",
        "인덱스 캐시"
    ]
}
---

이 문서는 일반 Lance 스캔, 벡터 검색, 전문 검색, 두 번째 단계의 row-ID 조회에 대한 Profile 지표를 설명합니다. Profile 수집, 조회 및 일반적인 연산자 분석은 [쿼리 Profile 분석 가이드](../../query-acceleration/query-profile.md)를 참조하세요. Lance 액세스는 [Lance Catalog](../catalogs/lance-catalog.mdx)를 사용하여 구성하세요.

:::note
Lance Catalog는 실험적 기능이며 Apache Doris 4.2부터 지원됩니다. 아래 지표는 실행 중인 FE/BE와 번들로 제공되는 Lance 버전에 따라 달라집니다.
:::

Lance 쿼리를 실행하기 전에 쿼리 프로파일링을 활성화하세요.

```sql
SET enable_profile = true;
```

다음 이름은 현재 Lance 계측 항목을 나타냅니다.

## FE 메타데이터 및 계획 수립 {#fe-metadata-and-planning}

일반 스캔, `COUNT`, 벡터 검색 및 전문 검색을 포함한 Catalog 쿼리에서는 `Lance Metadata Metrics`를 `Execution Summary`에서 확인하세요.

| 타이머 | 의미 |
|---|---|
| `MetadataReadTime` | 테이블 액세스 확인, Dataset 액세스, 리소스 정리를 포함한 Catalog 메타데이터 읽기의 총 시간입니다. |
| `TableAccessResolveTime` | Namespace 액세스, 자격 증명, 스토리지 옵션을 포함하여 테이블 액세스를 확인하는 시간입니다. |
| `DatasetOpenTime` | FE에서 Dataset을 여는 시간입니다. 과거 시점 쿼리에서는 여러 번 열어야 할 수 있습니다. |
| `VersionResolveTime` | 필요한 경우 요청된 과거 스냅샷을 확인하는 시간입니다. |
| `SchemaReadTime` | Arrow 스키마를 읽는 시간입니다. |
| `FragmentMetadataReadTime` | Fragment 메타데이터를 읽고 행 수 설명자를 구성하는 시간입니다. |
| `FieldIdsReadTime` | Lance 필드 ID를 읽고 매핑하는 시간입니다. |
| `IndexMetadataReadTime` | 논리 인덱스를 찾고 인덱스 세그먼트 메타데이터를 읽는 시간입니다. |
| `SplitPlanningTime` | 일반 스캔, 메타데이터 기반 개수 집계, 벡터 검색 또는 전문 검색을 위한 스캔 split을 계획하는 시간입니다. |

실행된 각 작업이나 단계에는 `Calls` 카운터도 대응하며, `DatasetOpenCalls`가 그 예입니다. `MetadataReadFailures`와 `SplitPlanningFailures`는 실패한 작업을 집계하며, 실패한 작업의 경과 시간도 측정에 포함됩니다. 이 카운터는 실패한 SQL 문 수를 나타내지 않습니다. 실행되지 않은 메타데이터 단계에는 카운터가 생성되지 않습니다. 이 그룹은 SQL 문 내에서 여러 테이블과 반복 읽기에 걸쳐 수행된 Catalog 작업을 누적합니다. 독립적인 파일 TVF와 `SHOW INDEX`는 이 그룹에 값을 기록하지 않습니다.

`MetadataReadTime`에는 메타데이터 하위 단계의 시간이 포함됩니다. `SplitPlanningTime`은 별도로 측정됩니다. 일반 지표인 `External Table Get Table Meta Time`, `External Table Get File Scan Tasks Time`, `External Table Meta Time`에는 해당 작업이 포함되므로, 이를 Lance 세부 타이머나 상위 분석/계획 시간에 다시 더하지 마세요. FE의 `DatasetOpenTime`과 BE의 `LanceDatasetOpenTime`은 서로 다른 프로세스에서 수행되는 작업을 나타냅니다.

## BE 그룹 및 통계 측정 범위 {#be-groups-and-statistics-boundaries}

스캔 Profile에서 `TableReader` → `LanceReader`를 찾으세요. 각 그룹은 타이머가 아닌 레이블이며, 계층 구조가 있다고 해서 하위 항목의 시간을 서로 더할 수 있는 것은 아닙니다.

| 그룹 | 내용 |
|---|---|
| `LanceTiming` | Dataset 열기, Scanner 구성 및 읽기, Runtime Filter 변환, Arrow 변환, row-ID 조회입니다. |
| `LanceIO` | 계측된 실행 스트림의 읽기 작업 수, 요청 수 및 바이트 수입니다. |
| `LanceIndex` | 인덱스 객체/구성 요소 로드, 캐시 조회, 비교, 인덱스 열기 및 검색한 파티션 수입니다. |
| `LanceVectorIndex` | IVF 파티션 선택, 벡터 인덱스 델타, ANN 단계 및 벡터 거리 계산입니다. |
| `LanceScalarIndex` | 스칼라 인덱스 평가, 세그먼트 검색, 후보, 폴백 및 결과 직렬화입니다. |
| `LanceExecutionPlan` | Lance 실행 계획의 정렬, 병합 및 Take 작업입니다. |
| `LanceScan` | Fragment/범위/행 스캔, 스캔 작업 대기 및 row-ID Prefilter 구성입니다. |
| `LanceSearchPlan` | 리더에 할당된 검색 세그먼트/Fragment 수입니다. |
| `LanceDataCache` | Dataset 핸들의 데이터 파일 캐시 및 원본 스토리지 요청 바이트 수입니다. |

Doris 타이머는 측정 대상 호출을 감싸서 시간을 기록합니다. Lance 실행 카운터는 스트림이 EOF에 도달한 후 통계 콜백을 통해 누적됩니다. 실패, 취소 또는 조기 종료가 발생하면 실행 통계가 불완전할 수 있습니다. Scanner 지표는 선택적 네이티브 지표를 포함하여 미리 등록됩니다. 값이 영이면 네이티브 경로에서 해당 지표를 보고하지 않았다는 의미일 수 있습니다. 지표가 없거나 값이 영이라는 사실만으로 인덱스, 필터 또는 I/O 경로가 사용되지 않았다고 판단할 수는 없습니다. 메타데이터만 사용하는 `COUNT`와 row-ID 조회는 일반 Scanner 콜백 경로를 사용하지 않습니다.

시간은 여러 호출과 병렬 작업에 걸쳐 누적되므로 SQL의 실제 경과 시간보다 클 수 있습니다. 가장 느린 Scanner를 스케줄링, 종속성 대기, FE 결과 처리 및 클라이언트 지연 시간과 함께 살펴보세요. 쿼리 지연 시간을 계산하려고 모든 Scanner나 중첩된 타이머를 합산하지 마세요.

## 리더 시간 측정 {#reader-timing}

| 타이머 | 의미 |
|---|---|
| `LanceDatasetOpenTime` | BE의 공유 Session을 통해 Dataset을 여는 시간으로, 필요한 메타데이터 액세스가 포함됩니다. 리더에서 이미 열어 둔 Dataset을 재사용할 때는 열기 작업이 추가로 집계되지 않습니다. |
| `LanceScannerConfigureTime` | Scanner, 프로젝션, 필터, 콜백 및 split/검색 옵션을 구성하는 시간입니다. 읽기 시점까지 지연되는 작업은 이후에 측정됩니다. |
| `LanceRuntimeFilterSqlTranslationTime` | Doris Runtime Filter를 Lance SQL로 변환하고 결합하는 시간으로, 변환 캐시 조회가 포함됩니다. 필터를 실행하는 데 걸린 시간은 아닙니다. |
| `LanceScannerNextTime` | 배치 읽기 호출의 누적 시간으로, 초기 준비, 인덱스 계산, I/O, 디코딩 및 대기가 포함됩니다. 이후의 Arrow에서 Doris로의 변환은 제외됩니다. |
| `LanceArrowToDorisBlockTime` | 반환된 Arrow 배치를 Doris Block으로 변환하는 시간으로, 스캔과 row-ID 조회 모두에 적용됩니다. |

`LanceScannerNextTime`은 아래의 내부 인덱스, 스캔 및 실행 계획 타이머와 중첩됩니다. 이 값이 크다는 사실만으로 스토리지가 병목이라고 판단할 수는 없습니다.

## I/O, 인덱스 로드 및 캐시 조회 {#io-index-loading-and-cache-lookups}

| 카운터 | 의미 |
|---|---|
| `LanceIOReadOps` | 계측된 읽기 작업 수입니다. 초당 작업 수나 HTTP 요청 수가 아닙니다. |
| `LanceIOReadRequests` | 계측된 스토리지 읽기 요청 수입니다. 범위 병합/분할로 인해 `LanceIOReadOps`와 다를 수 있습니다. |
| `LanceIOReadBytes` | 실행 계획에서 보고한 읽기 바이트 수로, 계측된 데이터/인덱스 경로가 포함됩니다. 캐시에서 제공된 읽기도 포함될 수 있습니다. 실제 측정한 원격 트래픽이나 디코딩 후 메모리 크기는 아닙니다. |
| `LanceIndexObjectLoads` | 로드된 최상위 인덱스 객체 수입니다. 세그먼트 수나 객체 내부의 페이지 로드 횟수가 아닙니다. |
| `LanceIndexComponentsLoaded` | 페이지, 파티션 또는 포스팅 등 로드된 내부 인덱스 구성 요소 수입니다. 인덱스 캐시 미스 카운터가 아니며, 로드/병합 방식과 계측 방식에 따라 집계 수가 달라질 수 있습니다. |
| `LanceIndexCacheHits`, `LanceIndexCacheMisses` | 이번 실행에서 계측된 인덱스 경로가 보고한 캐시 조회 수입니다. BE 전체 Session의 적중/미스 총계와는 별개입니다. 일부 스트리밍 경로는 로드한 내용을 보관하지 않으므로, 미스가 계속 발생한다는 사실만으로 캐시 용량이 부족하다고 판단할 수 없습니다. |
| `LanceIndexComparisons` | 각 인덱스 구현에서 정의한 비교/조회 작업량입니다. 후보 행 수가 아니며, 인덱스 유형 전반에서 동일하게 해석할 수 있는 CPU 비용 단위도 아닙니다. |

이 카운터는 계측된 벡터, 스칼라 및 전문 인덱스 경로에 적용됩니다. 인덱스 객체가 캐시에 남아 있더라도 해당 페이지나 파티션은 로드해야 할 수 있습니다. 용량을 늘리기 전에 캐시 사용량, 반복 가능한 콜드/웜 워크로드 및 I/O를 함께 확인하세요. 별도의 디스크 데이터 캐시와 BE 전체 지표는 [캐시 효과 확인](../catalogs/lance-catalog.mdx#checking-cache-effectiveness)을 참조하세요.

## Row-ID Prefilter 및 스칼라 인덱스 작업 {#row-id-prefilter-and-scalar-index-work}

Row-ID Prefilter 지표는 row-ID를 소비하여 허용 행 마스크를 구성하는 로더를 나타냅니다. 모든 TVF `filter`, 모든 스칼라 인덱스 조회 또는 최종 ANN/FTS 결과 수를 측정하는 것은 아닙니다.

| 카운터 또는 타이머 | 의미 |
|---|---|
| `RowIdPrefilterLoads` | 물리적 row-ID 로더 실행 횟수입니다. 반복되는 쿼리 노드는 로드를 반복해서 수행할 수 있습니다. |
| `RowIdPrefilterInputRows`, `RowIdPrefilterInputBatches` | 로더가 소비한 null이 아닌 입력 row-ID 수와 배치 수입니다. |
| `RowIdPrefilterIds` | 구성된 마스크에 보관된 허용 row-ID 수입니다. 쿼리 전체에서 중복을 제거하지 않고 로더별로 누적합니다. |
| `RowIdPrefilterLoadTime` | 입력 폴링과 마스크 구성을 포함한 전체 로더 시간입니다. |
| `RowIdPrefilterInputTime`, `RowIdPrefilterBuildTime` | 입력 스트림 대기/읽기 시간과 마스크 구성 시간입니다. 둘 다 `RowIdPrefilterLoadTime`에 포함되므로 총시간을 세부 시간에 다시 더하지 마세요. |
| `LanceScalarIndexQueryTime` | 스칼라 인덱스 표현식 평가 시간으로, 여러 인덱스 검색과 집합 연산이 포함될 수 있습니다. |
| `LanceScalarIndexResultSerializationTime` | 후속 Lance 노드에 전달할 스칼라 인덱스 결과를 직렬화하는 시간입니다. 네트워크 직렬화나 Arrow에서 Doris로의 변환 시간은 아닙니다. |
| `LanceScalarIndexSegmentsRequested`, `LanceScalarIndexSegmentsSearched` | 명시적 스칼라 세그먼트 경로에 대한 요청 수와 완료된 세그먼트 평가 수입니다. 중복을 제거한 테이블 세그먼트 수가 아니라 실행 횟수입니다. |
| `LanceScalarIndexSegmentFallbacks` | 명시적 스칼라 세그먼트 가속이 할당된 Fragment 범위 내의 전체 필터 스캔으로 폴백한 횟수입니다. 검색된 세그먼트도 폴백할 수 있습니다. |
| `LanceScalarIndexCandidateRows` | 후보 마스크의 크기를 알 수 있을 때 보고하는 값으로, 리더가 Fragment 범위와 전체 조건식을 적용하기 전의 크기입니다. SQL 결과 수가 아니며, 값이 영이면 카디널리티를 확인할 수 없음을 나타낼 수도 있습니다. |
| `LanceScalarIndexCandidateEvaluationTime` | 스칼라 세그먼트 후보를 준비/평가/적용하는 시간으로, 인덱스 열기/검색과 폴백 준비가 포함됩니다. 이후의 데이터 스캔은 제외됩니다. |
| `LanceScalarIndexSegmentSearchTime` | 선택한 세그먼트의 인덱스 표현식을 평가하는 시간으로, 로드와 집합 연산이 포함됩니다. `LanceScalarIndexCandidateEvaluationTime`에 포함됩니다. |

세그먼트는 단일 작업이 읽는 범위보다 더 많은 Fragment를 포함할 수 있으며, 반복되는 작업은 같은 후보를 다시 집계할 수 있습니다. `CandidateRows`를 개별 작업 내에서 조건에 일치한 행 수로 해석하지 마세요. 일반 스칼라 표현식 경로와 명시적 세그먼트 경로는 서로 다른 타이머를 사용하므로 보고하는 값이 다를 수 있습니다. 캐시가 웜 상태여도 크기가 큰 마스크나 반복되는 세그먼트 평가는 CPU와 메모리를 소모할 수 있습니다.

## 벡터 및 실행 계획 작업 {#vector-and-execution-plan-work}

| 카운터 또는 타이머 | 의미 |
|---|---|
| `LanceIVFPartitionsConsidered` | 선택 과정에서 검토한 IVF 파티션 수로, 선택된 인덱스 델타 전체에 걸쳐 누적됩니다. 실행된 probe 수는 아닙니다. |
| `LanceIVFPartitionSelectionTime` | 쿼리에 사용할 IVF 파티션을 선택하는 시간입니다. 이를 감싸는 인덱스 열기 작업은 제외됩니다. |
| `LanceIndexPartitionsSearched` | 인덱스 실행에서 실제로 보고한 파티션 검색 횟수입니다. FTS도 이 지표를 보고하므로 `LanceSearchType`을 기준으로 해석하세요. 쿼리 전체에서 중복을 제거한 파티션 수는 아닙니다. |
| `LanceVectorIndexDeltasSearched` | ANN 파티션 경로에 제출된 벡터 인덱스 델타 수입니다. 모든 델타가 검색을 완료했음을 보장하지는 않습니다. |
| `LanceIndexOpenTime` | 인덱스 핸들을 여는 시간으로, 캐시 조회와 메타데이터 액세스가 포함됩니다. |
| `LanceIndexPartitionLoadTime`, `LanceIndexPartitionPrepareTime` | 파티션 로드에는 캐시 조회, 캐시가 채워질 때까지의 대기, 캐시 미스 시 로드/디코딩이 포함됩니다. 파티션 준비에는 로드와 필터 준비가 포함되므로 두 타이머는 중첩됩니다. |
| `LanceIndexPrefilterWaitTime` | 인덱스 Prefilter가 준비될 때까지 기다리는 시간입니다. row-ID 마스크를 구성하는 시간과는 별개입니다. |
| `LanceIndexCpuQueueWaitTime` | 파티션 검색 작업을 제출한 시점부터 해당 CPU 작업이 시작될 때까지의 대기 시간입니다. |
| `LanceIndexSearchTime` | 준비된 파티션을 CPU에서 검색하는 시간으로, 쿼리 준비와 결과 구성이 포함됩니다. |
| `LanceIndexQueryPrepareTime` | 거리 계산기와 쿼리 조회 테이블을 구성하는 시간입니다. |
| `LanceIndexDistanceTopKTime` | 후보 필터링, 거리 평가 및 Top-K 힙 갱신을 통합하여 수행하는 시간입니다. 순수한 거리 계산이나 refinement 시간만 측정하는 타이머는 아닙니다. |
| `LanceIndexResultMaterializeTime` | 검색 결과 힙을 Arrow 배열/배치로 변환하는 시간입니다. Doris의 두 번째 단계 출력 데이터 조회 시간은 아닙니다. |
| `LanceANNPartitionExecTime`, `LanceANNSubIndexExecTime`, `LanceANNBatchExecTime` | 계측된 ANN 실행 노드의 계산 시간입니다. 세부 인덱스 타이머와 중첩될 수 있습니다. |
| `LanceVectorDistanceComputeTime` | 벡터 거리 실행 노드가 보고한 계산 시간입니다. 인덱스를 이용한 모든 거리 계산을 포함하지는 않습니다. |
| `LanceSortComputeTime`, `LanceSortMergeComputeTime`, `LanceTakeExecTime` | Lance 실행 노드의 정렬, 병합 및 Take 계산 시간입니다. Doris TopN이나 두 번째 단계 조회 전체의 시간은 아닙니다. |

파티션 작업은 동시에 실행되며 타이머는 중첩되거나 측정 범위가 겹칠 수 있습니다. `LanceIndexSearchTime`에 그 일부인 쿼리 준비, 거리/Top-K 및 결과 구성 시간을 더하지 마세요. probe 수, CPU 큐 대기, Prefilter 대기 및 I/O를 비교한 뒤 `nprobes`, `ef` 또는 `refine_factor`를 변경하세요. 지연 시간과 함께 재현율도 측정하세요.

## 계획된 작업, 스캔한 행 및 출력 데이터 조회 {#planned-work-scanned-rows-and-output-fetch}

| 카운터 또는 타이머 | 의미 |
|---|---|
| `LancePlannedIndexSegmentCount` | 리더에 할당된 검색 인덱스 세그먼트 수로, split을 구성할 때 누적됩니다. 검색 완료를 보장하지는 않습니다. |
| `LancePlannedIndexedFragmentCount` | 인덱스를 사용하는 벡터/전문 검색 split에 할당된 Fragment 수입니다. |
| `LancePlannedFlatSearchFragmentCount` | 벡터 Flat Search split에 할당된 Fragment 수입니다. FTS는 이 카운터를 등록하지 않습니다. |
| `LanceFragmentsScanned`, `LanceRowOffsetRangesScanned`, `LanceRowsScanned` | FilteredRead 경로에서 보고한 Fragment 수, 행 오프셋 범위 수 및 행 수입니다. 모든 읽기 경로에서 이 값을 기록하는 것은 아닙니다. 테이블 전체에서 중복을 제거한 수나 최종 SQL 결과 행 수가 아닙니다. |
| `LanceScanTaskWaitTime` | FilteredRead 소비자가 읽기 작업을 기다리는 시간입니다. Doris Scanner 스케줄링 시간이나 전체 I/O 대기 시간의 합계는 아닙니다. |
| `LanceRowIdFetchCalls`, `LanceRowIdFetchRows` | 두 번째 단계의 `take_rows` 호출 횟수와 조회한 행 수입니다. |
| `LanceRowIdTakeReadTime` | row-ID Take 스트림을 생성하고 소비하는 시간으로, 지연된 읽기가 포함됩니다. Arrow에서 Doris로의 변환은 제외됩니다. |
| `LanceRowIdFetchTotalTime` | 비어 있지 않은 row-ID 조회의 전체 처리 시간으로, Dataset 열기, Take 읽기, 변환 및 결과 검사가 포함됩니다. 앞서 설명한 하위 단계를 포함하며, 종단 간 RPC/Materialization 오버헤드는 제외합니다. |

검색 계획을 살펴볼 때는 `EXPLAIN` 필드인 `lanceSearchIndexSegments`, `lanceSearchIndexFragments`, `lanceSearchUnindexedFragments`를 `LanceSearchPlan` 카운터와 비교하세요. 일반 스칼라 세그먼트 스캔에는 `lanceGroupingIndexSegments`, `lanceGroupingIndexedFragments`, `lanceGroupingUnindexedFragments`를 사용하세요. 이들은 BE Profile 카운터가 아닌 FE 계획 필드입니다. Fragment 수는 작업별로 누적되며 중복이 제거되지 않을 수 있습니다.

두 단계 조회는 별도의 리더를 사용하며 Scanner 실행 통계 콜백을 등록하지 않습니다. 이 조회의 타이머, 조회 횟수 및 `LanceDataCacheBytesReadFromCache`/`LanceDataCacheBytesReadFromRemote`는 row-ID 조회/구체화 Profile 정보에도 보고됩니다. 여기에 `LanceIOReadBytes`가 없다고 해서 I/O가 발생하지 않았다는 의미는 아닙니다. 스캔과 조회의 범위를 구분하고, 동일하게 내보내진 조회 통계를 두 번 집계하지 마세요.

`LanceDatasetVersion`과 `LanceDatasetUri`를 사용하여 실행에 사용된 스냅샷을 식별하고, `LanceSearchType`을 사용하여 벡터 검색과 전문 검색을 구분하세요. `LanceTopK`, `LanceOffset`, `LanceFtsCoverageMode`, `LanceFtsQueryType`, `LanceFtsMatchOperator`, `LanceFtsMaxFuzzyDistance`, `LanceFtsPhraseSlop`, `LancePushdownFormat` 및 Runtime Filter ID 항목은 구성이나 푸시다운 상태를 나타냅니다. 이들은 합산할 수 있는 카운터가 아닌 정보 문자열입니다. `LanceTopK`와 `LanceOffset`은 split별 요청을 나타냅니다. `top_k=K`와 `offset=n`인 TVF 쿼리에서 검색 split은 최대 `K+n`개의 후보를 로컬 오프셋 `0`으로 요청하며, 최종 Doris TopN이 사용자 오프셋을 적용합니다.
