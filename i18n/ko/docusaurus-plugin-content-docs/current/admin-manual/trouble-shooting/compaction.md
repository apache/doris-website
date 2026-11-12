---
{
    "title": "컴팩션(Compaction)",
    "language": "ko",
    "description": "Doris는 LSM-Tree와 유사한 구조를 통해 데이터를 기록합니다."
}
---

# 컴팩션(Compaction) {#compaction}

Doris는 LSM-Tree와 유사한 구조를 통해 데이터를 기록하며, 백그라운드에서 컴팩션을 통해 작은 파일을 정렬된 큰 파일로 지속적으로 병합합니다. 컴팩션은 삭제 및 업데이트와 같은 작업을 처리합니다.

컴팩션 전략을 적절히 조정하면 데이터 적재 및 쿼리 효율을 크게 향상할 수 있습니다. Doris는 튜닝을 위해 다음 컴팩션 전략을 제공합니다:


## 수직 컴팩션(Vertical compaction) {#vertical-compaction}

수직 컴팩션은 Doris 1.2.2에서 구현된 새로운 컴팩션 알고리즘으로, 대규모 와이드 테이블 시나리오에서 컴팩션 실행 효율과 리소스 오버헤드를 최적화하는 데 사용됩니다. 컴팩션의 메모리 오버헤드를 효과적으로 줄이고 컴팩션 실행 속도를 높일 수 있습니다. 테스트 결과 수직 컴팩션의 메모리 사용량은 기존 컴팩션 알고리즘의 1/10에 불과하며, 컴팩션 속도는 15% 향상됩니다.

수직 컴팩션에서는 행 단위 병합을 열 그룹 단위 병합으로 변경합니다. 각 병합의 세분성이 열 그룹으로 바뀌어 단일 컴팩션에 관여하는 데이터 양과 컴팩션 중 메모리 사용량을 줄입니다.

BE 구성:
- `enable_vertical_compaction = true`를 설정하면 수직 컴팩션이 활성화됩니다.
- `vertical_compaction_num_columns_per_group = 5`: 각 열 그룹에 포함되는 열 수입니다. 테스트 결과 기본값인 열 5개 그룹이 효율과 메모리 사용 측면에서 더 적합합니다.
- `vertical_compaction_max_segment_size`: 수직 컴팩션 후 디스크 파일 크기를 구성하는 데 사용되며, 기본값은 268435456(바이트)입니다.


## 세그먼트 컴팩션(Segment compaction) {#segment-compaction}

세그먼트 컴팩션은 주로 대규모 데이터 적재를 처리합니다. 세그먼트 컴팩션은 데이터 적재 중에 실행되어 작업 내부의 세그먼트를 병합하며, 일반 컴팩션 및 수직 컴팩션과는 다릅니다. 이 메커니즘은 생성되는 세그먼트 수를 효과적으로 줄이고 -238 (OLAP_ERR_TOO_MANY_SEGMENTS) 오류를 방지할 수 있습니다.

세그먼트 컴팩션은 다음 기능을 제공합니다:
- 데이터 적재로 생성되는 세그먼트 수를 줄입니다.
- 병합 프로세스가 데이터 적재 프로세스와 병렬로 실행되므로 데이터 적재 시간이 늘어나지 않습니다.
- 데이터 적재 중 메모리 사용량과 컴퓨팅 리소스가 증가하지만, 긴 데이터 적재 프로세스 전체에 고르게 분산되므로 증가 폭은 비교적 작습니다.
- 세그먼트 컴팩션 후 데이터는 후속 쿼리와 일반 컴팩션에서 리소스 및 성능상의 이점을 제공합니다.

BE 구성:
- `enable_segcompaction=true`를 설정하면 활성화됩니다.
- `segcompaction_batch_size`는 병합 간격을 구성하는 데 사용됩니다. 기본값 10은 세그먼트 파일 10개마다 세그먼트 컴팩션을 트리거한다는 뜻입니다. 10 - 30 사이로 설정하는 것이 좋습니다. 값이 클수록 세그먼트 컴팩션의 메모리 사용량이 증가합니다.

세그먼트 컴팩션을 권장하는 상황:

- 대량 데이터 적재가 OLAP_ ERR_ TOO_ MANY_ SEGMENTS (errcode - 238) 오류로 실패합니다. 이 경우 데이터 적재 중 세그먼트 수를 줄이도록 세그먼트 컴팩션을 활성화하는 것이 좋습니다.
- 데이터 적재 중 작은 파일이 너무 많이 생성됩니다. 데이터 적재량이 적절하더라도 낮은 카디널리티 또는 메모리 제약으로 memtable이 조기에 플러시되면 작은 세그먼트 파일이 대량으로 생성되어 적재 작업이 실패할 수 있습니다. 이 경우 이 기능을 활성화하는 것이 좋습니다.
- 데이터 적재 직후 쿼리합니다. 데이터 적재가 막 끝났고 표준 컴팩션이 완료되지 않은 경우 세그먼트 파일이 많으면 후속 쿼리 효율에 영향을 줍니다. 적재 직후 쿼리해야 한다면 이 기능을 활성화하는 것이 좋습니다.
- 데이터 적재 후 일반 컴팩션의 부담이 큽니다. 세그먼트 컴팩션은 일반 컴팩션 부담의 일부를 데이터 적재 프로세스에 균등하게 분산합니다. 이때 이 기능을 활성화하는 것이 좋습니다.

세그먼트 컴팩션을 권장하지 않는 상황:
- 데이터 적재 작업 자체에서 메모리 리소스를 이미 소진한 경우, 메모리 압박이 더 커져 적재 작업이 실패할 수 있으므로 세그먼트 컴팩션을 사용하지 않는 것이 좋습니다.

세그먼트 컴팩션의 구현 및 테스트 결과에 대한 자세한 내용은 [이 링크](https://github.com/apache/doris/pull/12866)를 참조하세요.

## 컴팩션 전략(Compaction strategy) {#compaction-strategy}

컴팩션 전략은 언제 어떤 작은 파일을 큰 파일로 병합할지 결정합니다. Doris는 현재 두 가지 컴팩션 전략을 제공하며, 테이블 속성의 `compaction_policy` 매개변수로 지정합니다.

### 크기 기반 컴팩션 전략(Size-based compaction strategy) {#size-based-compaction-strategy}

크기 기반 컴팩션 전략은 기본 전략이며 대부분의 시나리오에 적합합니다.
```
"compaction_policy" = "size_based"
```

### 시계열 컴팩션 전략(Time series compaction strategy) {#time-series-compaction-strategy}

시계열 컴팩션 전략은 로그 및 시계열 데이터와 같은 시나리오에 최적화되어 있습니다. 시계열 데이터의 시간적 지역성을 활용해 인접한 시간에 기록된 작은 파일을 큰 파일로 병합합니다. 각 파일은 컴팩션에 한 번만 참여하므로 반복 컴팩션으로 인한 쓰기 증폭을 줄입니다.

```
"compaction_policy" = "time_series"
```

시계열 컴팩션 전략은 다음 조건 중 하나라도 충족되면 트리거됩니다:
- 병합되지 않은 파일 크기가 `time_series_compaction_goal_size_mbytes`를 초과합니다(기본값 1 GB).
- 병합되지 않은 파일 수가 `time_series_compaction_file_count_threshold`를 초과합니다(기본값 2000).
- 마지막 컴팩션 후 경과 시간이 `time_series_compaction_time_threshold_seconds`를 초과합니다(기본값 1시간).

이 매개변수는 테이블의 PROPERTIES에 설정하며, 테이블 생성 시 지정하거나 다음을 사용해 나중에 수정할 수 있습니다:
```
ALTER TABLE table_name SET("name" = "value");
```

## 컴팩션 동시성 제어(Compaction concurrency control) {#compaction-concurrency-control}

컴팩션은 백그라운드에서 실행되며 CPU 및 IO 리소스를 소비합니다. 동시 컴팩션 스레드 수를 조정해 리소스 소비를 제어할 수 있습니다.

동시 컴팩션 스레드 수는 BE 구성 파일에서 설정하며, 다음 매개변수가 포함됩니다:
- `max_base_compaction_threads`: 기본 컴팩션 스레드 수이며 기본값은 4입니다.
- `max_cumu_compaction_threads`: 누적 컴팩션 스레드 수이며 기본값은 -1입니다. 디스크마다 스레드 1개를 의미합니다.

## 대형 MOW Tablet의 컴팩션 메모리 오버헤드(Compaction memory overhead) {#mow-compaction-memory}

merge-on-write(MOW)를 사용하는 Unique Key 테이블은 컴팩션 중 메모리 내 행 ID 변환 맵(rowid conversion map)을 유지합니다. 이 맵은 입력 rowset의 행 위치를 출력 rowset의 새 위치에 연결하여 delete bitmap을 업데이트할 수 있게 합니다. 행이 많은 Tablet, 특히 대량의 과거 데이터를 포함하는 Base Compaction에서는 이 맵이 상당한 메모리를 사용할 수 있으며 메모리가 부족하면 컴팩션이 실패할 수 있습니다.

### 행 수에 따른 메모리 사용량 증가 방식 {#how-memory-usage-grows-with-row-count}

맵은 병합되는 입력 세그먼트의 각 물리적 행에 대해 항목 하나를 미리 할당합니다. 각 항목은 대상 세그먼트 위치와 행 ID를 각각 32비트 정수로 기록하므로, 기본 저장 공간은 행당 약 8바이트입니다. 다음과 같이 메모리를 추정할 수 있습니다:

```text
Main mapping storage ≈ Total physical input rows participating in this compaction × 8 bytes
```

물리적 입력 행에는 컴팩션이 아직 제거하지 않은 과거 버전이 포함됩니다. 오래된 행이 삭제로 표시되어 출력 rowset에 기록되지 않더라도 미리 할당된 항목은 여전히 메모리를 차지합니다. 따라서 쿼리가 반환하는 유효 행 수를 이 추정에서 물리적 입력 행 수로 직접 대체할 수 없습니다. 맵은 컴팩션 작업이 완료될 때까지 유지되며 각 읽기 배치 후 해제되지 않습니다.

이 추정치는 맵의 기본 저장 공간만 포함합니다. 실제 컴팩션 메모리에는 컨테이너 오버헤드, 읽기 버퍼, 쓰기 버퍼 및 인덱스도 포함됩니다. Tablet의 압축 데이터 크기와 물리적 행 수 사이에는 고정된 비율이 없습니다. 따라서 폭이 좁은 테이블이나 압축률이 높은 테이블은 디스크상의 크기가 비교적 작더라도 큰 맵이 필요할 수 있습니다.

### 계산 예시 {#calculation-example}

MOW Tablet의 기본 rowset에 물리적 행이 1 billion개 포함되어 있고, 이번 Base Compaction에서 물리적 행 100 million개를 포함하는 증분 rowset도 병합한다고 가정합니다. 이 100 million개의 증분 행이 모두 기존 키를 업데이트하고 출력에 유효한 행이 1 billion개만 포함되더라도, 맵은 물리적 입력 행 1.1 billion개에 대해 할당됩니다:

```text
Physical input rows = 1 billion + 100 million = 1.1 billion
Main mapping storage ≈ 1.1 billion × 8 bytes = 8.8 × 10^9 bytes ≈ 8.2 GiB
```

동일한 BE에서 이 입력 크기의 컴팩션 작업 네 개를 동시에 실행하면 이러한 맵의 기본 저장 공간만 약 32.8 GiB를 사용합니다. 이는 다른 컴팩션 메모리와 쿼리, 데이터 적재 및 기타 작업이 사용하는 메모리를 제외한 값입니다. 계산 예시이며 실제 사용량은 각 작업의 입력 크기와 동시 실행 수에 따라 달라집니다.

### 문제 해결 및 완화 {#troubleshooting-and-mitigation}

- 테이블을 생성하거나 파티션을 추가할 때 압축된 데이터 크기뿐 아니라 예상 행 수에 따라 파티션 및 버킷 수를 선택합니다. 데이터를 고르게 분산하는 버킷 키를 선택하여 단일 Tablet에 행이 너무 많이 누적되지 않도록 합니다. [데이터 버킷](../../table-design/data-partitioning/data-bucketing.md)을 참조하세요. 기존 파티션의 버킷 수는 직접 변경할 수 없으므로, 이미 과도하게 큰 Tablet에는 테이블을 다시 만들고 데이터를 마이그레이션하는 방안을 고려합니다.
- 메모리가 제한된 경우 Base Compaction 동시 실행 수를 줄여 각 작업에 더 많은 메모리를 남겨 두는 것을 고려합니다. 이렇게 하면 동일한 BE에서 여러 작업이 합쳐져 발생하는 메모리 피크만 줄어들며 개별 작업의 맵 크기는 줄어들지 않습니다. 단일 맵이 이미 사용 가능한 메모리를 초과한다면 동시 실행 수만 줄여도 충분하지 않을 수 있습니다.
- 수직 컴팩션, 더 작은 `compaction_batch_size` 또는 `vertical_compaction_num_columns_per_group`의 더 적은 열 수는 열 그룹을 읽고 처리하는 데 사용되는 메모리를 줄일 수 있지만, 전체 rowid 맵의 크기는 줄이지 않습니다. `compaction_memory_bytes_limit`은 읽기 배치 크기를 추정하는 데 사용되며 rowid 맵이나 전체 컴팩션 작업에 대한 하드 상한을 적용하지 않습니다.
