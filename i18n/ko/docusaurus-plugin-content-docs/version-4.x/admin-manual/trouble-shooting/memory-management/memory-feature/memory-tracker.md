---
{
    "title": "Memory Tracker",
    "language": "ko",
    "description": "Doris BE는 Memory Tracker를 사용하여 프로세스의 메모리 사용량을 기록합니다. 여기에는 쿼리, 데이터 적재, compaction 등의 작업 수명 주기 동안 사용하는 메모리가 포함됩니다."
}
---

Doris BE는 Memory Tracker를 사용하여 프로세스의 메모리 사용량을 기록합니다. 여기에는 쿼리, 데이터 적재, compaction, 스키마 변경 등의 작업 수명 주기 동안 사용하는 메모리와 다양한 캐시에서 사용하는 메모리가 포함됩니다. 웹 페이지에서 실시간으로 확인할 수 있으며, 메모리 관련 오류가 보고되면 해당 정보를 BE 로그에 출력하여 메모리 분석과 메모리 문제 해결에 활용합니다.

Memory Tracker를 확인하는 방법, 각 Memory Tracker에 표시된 과도한 메모리 사용량의 원인, 메모리 사용량을 줄이기 위한 분석 방법은 Doris BE 메모리 구조와 함께 [개요](./../overview.md)에서 설명했습니다. 이 문서에서는 Memory Tracker의 원리와 구조, 몇 가지 일반적인 문제만 소개합니다.

## 메모리 추적 원리 {#memory-tracking-principle}

Memory Tracker는 Doris Allocator를 통해 메모리가 할당되고 해제될 때마다 이를 추적합니다. Doris Allocator에 대한 소개는 [메모리 제어 전략](./memory-control-strategy.md)을 참고하세요.

프로세스 메모리: Doris BE는 시스템에서 Doris BE 프로세스의 메모리 사용량을 주기적으로 가져오며, Cgroup과도 호환됩니다.

태스크 메모리: 쿼리, 데이터 적재, compaction 등의 각 태스크는 초기화 시 고유한 Memory Tracker를 생성하고, 실행 중에는 이를 TLS(Thread Local Storage)에 넣습니다. Doris의 주요 메모리 자료 구조는 Allocator를 상속합니다. Allocator는 메모리를 할당하고 해제할 때마다 TLS의 Memory Tracker에 기록합니다.

연산자 메모리: Join/Agg/Sink 등 태스크의 각 실행 연산자도 자체 Memory Trakcer를 생성합니다. 메모리를 수동으로 추적하거나 이를 TLS에 넣어 `Doris Allocator`가 기록하도록 할 수 있습니다. 이 정보는 실행 로직을 제어하고 Query Profile에서 연산자별 메모리 사용량을 분석하는 데 사용됩니다.

전역 메모리: 전역 메모리는 주로 Cache와 메타데이터로 구성되며, 여러 태스크가 공유합니다. 각 Cache에는 고유한 Memory Tracker가 있으며, `Doris Allocator`를 통해 또는 수동으로 추적합니다. 현재 메타데이터 메모리는 완전히 집계되지 않으므로, 추가 분석은 Metrics와 Bvar에서 집계하는 다양한 메타데이터 Counter에 더 많이 의존합니다.

이 중 Doris BE 프로세스 메모리는 운영 체제에서 가져오므로 완전히 정확하다고 볼 수 있습니다. 구현상의 제약으로 인해 다른 Memory Tracker가 추적하는 메모리는 대개 실제 메모리의 일부에 불과합니다. 따라서 대부분의 경우 모든 Memory Tracker의 합은 Doris BE 프로세스의 물리 메모리 사용량보다 작습니다. 일부 누락이 있지만, Memory Tracker가 기록하는 메모리는 대부분의 경우 신뢰할 수 있으므로 메모리 분석에 안심하고 사용할 수 있습니다. 또한 Memory Tracker가 실제로 추적하는 것은 가상 메모리이며, 일반적으로 더 관심을 두는 물리 메모리와는 일정한 차이가 있습니다.

## Memory Tracker 구조 {#memory-tracker-structure}

Memory Tracker는 용도에 따라 두 가지 유형으로 나뉩니다. 첫 번째 유형인 Memory Tracker Limiter는 쿼리, 데이터 적재, Compaction 등의 각 태스크와 전역 Cache, TabletMeta마다 하나씩 존재하며, 메모리 사용량을 관찰하고 제어하는 데 사용됩니다. 두 번째 유형인 Memory Tracker는 주로 쿼리 실행 중 메모리 사용이 집중되는 지점을 추적합니다. 예를 들어 Join/Aggregation/Sort/윈도 함수에서 사용하는 HashTable, 직렬화된 중간 데이터 등을 추적하여 쿼리 내 연산자별 메모리 사용량을 분석하고, 데이터 적재 시 데이터를 플러시할 때 메모리를 제어하는 데 사용됩니다.

두 유형 사이의 부모-자식 관계는 스냅샷 출력에만 사용되며, 레이블 이름으로 연결되므로 소프트 링크와 같습니다. 메모리 사용량을 함께 반영할 때 부모-자식 관계에 의존하지 않고, 서로의 수명 주기에도 영향을 주지 않으므로 이해하고 사용하는 데 드는 부담이 줄어듭니다. 모든 Memory Tracker는 맵 집합에 저장됩니다. 모든 Memory Tracker 유형의 스냅샷 출력, 쿼리/데이터 적재/compaction 등의 태스크 스냅샷 출력, 현재 메모리를 가장 많이 사용하는 쿼리/데이터 적재 그룹 조회, 현재 메모리 초과 사용량이 가장 큰 쿼리/데이터 적재 그룹 조회 등의 메서드를 제공합니다.

![Memory Tracker 구현](/images/memory-tracker-implement.png)

## Memory Tracker 통계 누락 {#memory-tracker-statistics-missing}

Memory Tracker 통계 누락 현상은 Doris 2.1 이전 버전과 이후 버전에서 다르게 나타납니다.

### Memory Tracker 통계 누락 현상 {#memory-tracker-statistics-missing-phenomenon}

1. Doris 2.1 이후에는 Memory Tracker 통계 누락이 두 가지 현상으로 나타납니다.

- `Label=process resident memory` Memory Tracker와 `Label=sum of all trackers` Memory Tracker의 차이가 너무 큽니다.

- Orphan Memory Tracker의 값이 너무 큽니다.

2. Doris 2.1 이전에는 Orphan Memory Tracker의 값이 너무 크면 Memory Tracker 통계가 누락되었다는 뜻입니다.

### Memory Tracker 통계 누락 분석 {#memory-tracker-statistics-missing-analysis}

> Doris 2.1.5 이전 버전에서 Memory Tracker 통계가 누락되거나 BE 프로세스 메모리 사용량이 줄어들지 않는다면, [캐시 메모리 분석](./../memory-analysis/doris-cache-memory-analysis.md)을 참고하여 SegmentCache 메모리 사용량을 분석하고, 테스트를 계속하기 전에 Segment Cache를 비활성화해 보세요.

> Doris 2.1.5 이전 버전에서는 Segment Cache Memory Tacker가 정확하지 않습니다. Primary Key Index를 비롯한 일부 Index의 메모리 통계가 정확하지 않기 때문입니다. 이로 인해 Segment Cache의 메모리 사용량이 효과적으로 제한되지 않아 메모리를 과도하게 사용하는 경우가 많습니다. 특히 열이 수백 개 또는 수천 개인 대형 와이드 테이블에서 이런 문제가 두드러집니다. [메타데이터 메모리 분석](./../memory-analysis/metadata-memory-analysis.md)을 참고하세요. Doris BE Metrics에서 `doris_be_cache_usage{name="SegmentCache"}`의 값은 크지 않은데 Doris BE Bvar에서 `doris_column_reader_num`의 값이 크다면 Segment Cache의 메모리 사용량을 의심해 보아야 합니다. Heap Profile에서 메모리 사용량이 큰 호출 스택에 `Segment` 및 `ColumnReader` 필드가 보이면 Segment Cache가 많은 메모리를 차지한다고 거의 확신할 수 있습니다.

위 현상이 관찰되고 클러스터를 쉽게 재시작할 수 있으며 현상을 재현할 수 있다면, [Heap Profile 메모리 분석](./../memory-analysis/heap-profile-memory-analysis.md)을 참고하여 Jemalloc Heap Profile로 프로세스 메모리를 분석하세요.

그렇지 않다면 먼저 [메타데이터 메모리 분석](./../memory-analysis/metadata-memory-analysis.md)을 참고하여 Doris BE의 메타데이터 메모리를 분석할 수 있습니다.

### Memory Tracker 통계가 누락되는 원인 {#reasons-for-missing-memory-tracker-statistics}

다음은 Memory Tracker 통계가 누락되는 원인을 설명합니다. 이는 Memory Tracker의 구현과 관련된 내용으로, 일반적으로는 신경 쓰지 않아도 됩니다.

#### Doris 2.1 및 이후 버전 {#doris-21-and-later}

1. `Label=process resident memory` Memory Tracker와 `Label=sum of all trackers` Memory Tracker의 차이가 너무 큽니다.

`Label=sum of all trackers` Memory Tracker의 값이 `Label=process resident memory` Memory Tracker 값의 70%를 넘으면, 대개 Memory Tracker가 Doris BE 프로세스 메모리의 대부분을 집계했다는 뜻입니다. 이 경우 일반적으로 Memory Tracker만 분석해도 메모리가 사용되는 곳을 찾을 수 있습니다.

`Label=sum of all trackers` Memory Tracker의 값이 `Label=process resident memory` Memory Tracker 값의 70% 미만이면, Memory Tracker 통계에 누락이 있다는 뜻입니다. 이 경우 Memory Tracker만으로는 메모리가 사용되는 곳을 정확하게 찾지 못할 수 있습니다.

`Label=process resident memory` Memory Tracker와 `Label=sum of all trackers` Memory Tracker의 차이는 `Doris Allocator`를 통해 할당되지 않은 메모리입니다. Doris의 주요 메모리 자료 구조는 `Doris Allocator`를 상속하지만, 메타데이터 메모리, RPC 메모리 등 `Doris Allocator`를 통해 할당되지 않는 메모리도 일부 존재합니다. 메모리 누수일 가능성도 있습니다. 이 경우 메모리 값이 큰 Memory Tracker를 분석하는 것 외에도 메타데이터의 메모리 사용량이 적절한지, 메모리 누수가 있는지 확인해야 하는 경우가 많습니다.

2. Orphan Memory Tracker의 값이 너무 큽니다.

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker는 기본 Memory Tracker입니다. 양수나 음수의 값은 Doris Allocator가 할당한 메모리를 정확하게 추적하지 못하고 있음을 뜻합니다. 값이 클수록 Memory Tracker의 전체 통계 결과에 대한 신뢰도가 낮아집니다. 이 통계값의 출처는 두 가지입니다.

- 스레드가 시작될 때 Memory Tracker가 TLS에 연결되어 있지 않으면 Doris Allocator는 기본적으로 메모리를 Orphan Memory Tracker에 기록합니다. 이는 해당 메모리의 용도를 알 수 없다는 뜻입니다. Doris Allocator가 메모리를 기록하는 원리는 위의 [메모리 추적 원리]를 참고하세요.

- 쿼리나 데이터 적재 같은 태스크의 Memory Tracker가 소멸할 때 값이 0이 아니면, 일반적으로 해당 메모리가 아직 해제되지 않았다는 뜻입니다. 남은 메모리는 Orphan Memory Tracker에 기록되며, 이는 남은 메모리를 Orphan Memory Tracker가 계속 추적하도록 하는 것과 같습니다. 이렇게 하면 Orphan Memory Tracker와 다른 Memory Tracker의 합이 Doris Allocator가 할당한 전체 메모리와 같아집니다.

이상적으로 Orphan Memory Tracker의 값은 0에 가까워야 합니다. 따라서 모든 스레드가 시작 시점에 쿼리 또는 데이터 적재 Memory Tracker와 같이 Orphan이 아닌 Memory Tracker를 연결하는 것이 바람직합니다. 또한 모든 쿼리 또는 데이터 적재 Memory Tracker는 소멸할 때 값이 0이어야 합니다. 이는 소멸 시점에 쿼리 또는 데이터 적재를 실행하는 동안 사용한 메모리가 해제되었음을 뜻합니다.

Orphan Memory Tracker의 값이 0이 아니면서 크다면, 용도를 알 수 없는 메모리가 많이 해제되지 않았거나 쿼리와 데이터 적재가 실행된 후에도 많은 메모리가 해제되지 않았다는 뜻입니다.

#### Doris 2.1 이전 버전 {#before-doris-21}

Doris 2.1 이전에는 용도를 알 수 없는 모든 메모리를 `Label=Orphan` Memory Tracker에 집계했습니다. 따라서 Orphan Memory Tracker의 값이 크면 Memory Tracker 통계가 누락되었다는 뜻입니다.
