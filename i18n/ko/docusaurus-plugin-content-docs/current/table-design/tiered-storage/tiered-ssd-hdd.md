---
{
    "title": "로컬 디스크 계층형 스토리지",
    "language": "ko",
    "description": "Doris의 SSD 및 HDD 계층형 스토리지 소개: 동적 파티션을 기반으로 핫 데이터를 SSD에 유지하고 콜드 데이터를 HDD로 자동 이전하여 쿼리 성능과 스토리지 비용의 균형을 맞춥니다.",
    "keywords": [
        "Doris 계층형 스토리지",
        "SSD HDD 핫·콜드 데이터 분리",
        "동적 파티션",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "핫·콜드 데이터 이전"
    ]
}
---

<!-- Knowledge type: Feature introduction + Configuration parameters + Operation steps -->
<!-- Applicable scenarios: Hot-cold data separation / Storage cost optimization / Query performance assurance -->

Doris는 SSD와 HDD 간 계층형 스토리지를 지원합니다. 동적 파티션을 함께 사용하면 데이터의 접근 특성에 따라 핫 데이터를 SSD에 유지하고 콜드 데이터를 HDD로 자동 이전할 수 있습니다. 이를 통해 핫 데이터의 높은 읽기·쓰기 성능을 유지하면서 전체 스토리지 비용을 줄일 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

이 문서는 다음 시나리오에 적용됩니다.

- 테이블 데이터가 시간별로 파티셔닝되어 있고, 접근 빈도에 따라 핫 데이터와 콜드 데이터가 뚜렷하게 구분됩니다.
- 클러스터에 SSD와 HDD 스토리지 매체가 모두 있습니다.
- 최근 핫 데이터의 쿼리는 SSD로 가속하고, 과거 콜드 데이터는 HDD에 저장해 비용을 절감하려고 합니다.
- 수동 이전 없이 동적 파티션으로 데이터 수명 주기를 자동 관리하려고 합니다.

## 빠른 탐색 {#quick-navigation}

- [핵심 개념](#core-concepts): 동적 파티션과 계층형 스토리지의 관계.
- [파라미터 설명](#parameter-reference): `hot_partition_num`과 `storage_medium`의 사용법.
- [사용 예시](#usage-example): 테이블 생성 SQL과 파티션별 스토리지 매체 확인.
- [자주 묻는 질문](#faq): 사용 중 자주 묻는 질문.
- [문제 해결](#troubleshooting): 파티션 생성 실패 등의 문제 해결.

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Feature introduction -->

계층형 스토리지는 동적 파티션을 기반으로 구현됩니다. Doris는 파티션의 활성도에 따라 스토리지 매체를 자동으로 선택하고, 쿨다운 시간이 되면 데이터를 대상 매체로 이전합니다.

### 핫 파티션과 콜드 파티션 {#hot-partitions-and-cold-partitions}

| 유형 | 설명 | 스토리지 매체 | 성능 특성 |
| --- | --- | --- | --- |
| 핫 파티션 | 최근까지 활발하게 사용되었고 자주 접근하는 파티션 | SSD | 높은 IOPS, 짧은 지연 시간 |
| 콜드 파티션 | 접근 빈도가 낮은 과거 데이터의 파티션 | HDD | 큰 용량, 낮은 비용 |

### 작동 방식 {#how-it-works}

계층형 스토리지는 다음 순서로 작동합니다.

1. 테이블을 생성할 때 동적 파티션을 활성화하고 `dynamic_partition.storage_medium = HDD`를 설정합니다.
2. `dynamic_partition.hot_partition_num`을 사용해 현재 파티션, 이전 `N - 1`개 시간 간격의 파티션, 모든 미래 파티션을 SSD에 유지합니다.
3. 시스템이 각 핫 파티션에 `storage_cooldown_time`을 설정합니다.
4. 쿨다운 시간이 되면 파티션 데이터가 SSD에서 HDD로 자동 이전됩니다.

동적 파티션에 관한 자세한 내용은 [데이터 파티셔닝 - 동적 파티션](../../table-design/data-partitioning/dynamic-partitioning)을 참조하세요.

## 파라미터 설명 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

계층형 스토리지는 다음 두 가지 동적 파티션 파라미터를 사용합니다.

| 파라미터 | 용도 | 기본값 | 참고 |
| --- | --- | --- | --- |
| `dynamic_partition.hot_partition_num` | 현재 파티션, 이전 `N - 1`개 시간 간격의 파티션, 모든 미래 파티션을 SSD에 유지함(`N > 0`인 경우) | 없음 | `storage_medium = HDD`와 함께 사용해야 함 |
| `dynamic_partition.storage_medium` | 동적 파티션의 최종 스토리지 매체 지정 | HDD | SSD로 설정하면 `hot_partition_num`이 더 이상 적용되지 않음 |

### dynamic_partition.hot_partition_num {#dynamic_partitionhot_partition_num}

- **기능**: 양수 `N`을 지정하면 현재 파티션, 이전 `N - 1`개 시간 간격의 파티션, 모든 미래 파티션을 SSD에 유지합니다. 더 오래된 파티션은 HDD를 사용합니다.
- **사용 조건**:
    - `dynamic_partition.storage_medium = HDD`도 설정해야 합니다. 그렇지 않으면 이 파라미터가 적용되지 않습니다.
    - 스토리지 경로에 SSD 장치가 있어야 합니다. 그렇지 않으면 파티션 생성에 실패합니다.

**예시**:

현재 날짜가 **2021-05-20**이고 일별로 파티셔닝하며, 동적 파티션 구성이 다음과 같다고 가정합니다.

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

시스템은 다음 파티션을 자동으로 생성하고 각 파티션에 해당 스토리지 매체와 쿨다운 시간을 설정합니다.

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

일별 파티션에서 현재 날짜의 오프셋은 `0`입니다. `hot_partition_num = N > 0`이고 최종 스토리지 매체가 `HDD`이면 오프셋이 `-N`보다 큰 파티션이 SSD를 사용합니다. 여기에는 현재 날짜, 이전 `N - 1`일, `dynamic_partition.end`에 따라 생성되는 모든 미래 파티션이 포함됩니다. 오프셋이 `i`인 SSD 파티션의 쿨다운 시간은 현재 날짜를 기준으로 `i + N`일째가 시작되는 시각입니다.

이 예시에서는 오프셋 `-3`과 `-2`가 HDD를 사용하고, `-1`부터 `3`까지는 SSD를 사용합니다. **2021-05-20**에는 `hot_partition_num = 2`여도 다섯 개의 파티션이 SSD를 사용합니다. 과거 파티션을 생성하려면 아래의 전체 테이블 정의와 같이 `dynamic_partition.create_history_partition = true`도 설정해야 합니다.

### dynamic_partition.storage_medium {#dynamic_partitionstorage_medium}

- **기능**: 동적 파티션의 최종 스토리지 매체를 지정합니다. 유효한 값은 `HDD`(기본값)와 `SSD`입니다.
- **참고**:
    - `SSD`로 설정하면 `hot_partition_num` 파라미터가 무시됩니다.
    - 이 경우 모든 파티션이 SSD 스토리지를 사용하며, 쿨다운 시간이 일괄적으로 `9999-12-31 23:59:59`로 설정되어 이전이 발생하지 않습니다.

## 사용 예시 {#usage-example}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

다음 단계에서는 계층형 스토리지를 지원하는 테이블을 생성하고 파티션별 스토리지 매체를 확인하는 방법을 보여 줍니다.

### 1단계: 계층형 스토리지 테이블 생성 {#step-1-create-a-tiered-storage-table}

목표: SSD/HDD 계층형 스토리지가 활성화된 테이블을 생성합니다. `hot_partition_num = 2`이면 현재 날짜와 전날의 파티션, 모든 미래 파티션이 SSD를 사용하고 더 오래된 파티션은 HDD를 사용합니다.

```sql
CREATE TABLE tiered_table (k DATE)
PARTITION BY RANGE(k)()
DISTRIBUTED BY HASH (k) BUCKETS 5
PROPERTIES
(
    "dynamic_partition.storage_medium" = "hdd",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = "2",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "5",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.start" = "-3"
);
```

### 2단계: 파티션의 스토리지 매체 확인 {#step-2-check-the-partition-storage-medium}

목표: 파티션이 예상대로 SSD와 HDD에 할당되었는지 확인합니다.

```sql
SHOW PARTITIONS FROM tiered_table;
```

테이블을 **2021-05-20**에 생성했다고 가정하면 관련 파티션 속성은 다음과 같습니다. 총 7개 파티션 중 5개는 SSD를, 2개는 HDD를 사용합니다.

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

### Q1: `hot_partition_num`이 적용되지 않으면 어떻게 하나요? {#q1-what-if-hot_partition_num-does-not-take-effect}

`dynamic_partition.storage_medium = HDD`도 설정했는지 확인하세요. 최종 스토리지 매체가 HDD일 때만 핫 파티션 구성이 적용됩니다.

### Q2: SSD 스토리지만 사용할 수 있나요? {#q2-can-i-use-ssd-storage-only}

가능합니다. `dynamic_partition.storage_medium`을 `SSD`로 설정하면 모든 파티션이 SSD를 사용하며, 쿨다운에 따른 이전은 발생하지 않습니다. 이 경우 `hot_partition_num`을 설정할 필요가 없습니다.

### Q3: 쿨다운 시간이 되면 데이터는 어떻게 이전되나요? {#q3-how-is-data-migrated-after-the-cooldown-time-is-reached}

파티션의 `storage_cooldown_time`이 되면 시스템이 수동 개입 없이 해당 파티션의 데이터를 SSD에서 HDD로 자동 이전합니다.

### Q4: 계층형 스토리지와 핫·콜드 데이터 아카이빙(예: 객체 스토리지)은 어떻게 다른가요? {#q4-what-is-the-difference-between-tiered-storage-and-hot-cold-data-archiving-such-as-object-storage}

SSD/HDD 계층형 스토리지는 서로 다른 로컬 디스크 매체 간에 데이터를 이동하는 방식으로, 단기에서 중기까지의 핫·콜드 데이터 분리에 적합합니다. 과거 데이터를 객체 스토리지(S3, HDFS 등)에 아카이빙하려면 핫·콜드 계층형 스토리지 문서를 참조하세요.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| 오류 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| 파티션 생성 실패 | 스토리지 경로에 SSD 장치가 없음 | BE 노드에 SSD 스토리지 경로를 구성하거나 HDD만 사용하도록 전환 |
| `hot_partition_num`이 적용되지 않음 | `storage_medium = HDD`가 설정되지 않음 | `dynamic_partition.storage_medium = HDD`도 설정 |
| 모든 파티션이 SSD를 사용하고 HDD로 이전되지 않음 | `storage_medium`이 `SSD`로 설정됨 | `storage_medium`을 `HDD`로 변경하고 `hot_partition_num`을 설정 |
| 데이터가 예상대로 HDD로 이전되지 않음 | `storage_cooldown_time`이 아직 되지 않음 | 쿨다운 시간이 될 때까지 기다리거나 시간 설정이 올바른지 확인 |
