---
{
    "title": "로컬 디스크 계층형 스토리지",
    "language": "ko",
    "description": "Doris의 SSD 및 HDD 계층형 스토리지 소개: 핫 데이터는 SSD에 유지하고 동적 파티션을 기반으로 콜드 데이터를 HDD로 자동 마이그레이션하여 쿼리 성능과 스토리지 비용의 균형을 맞춥니다.",
    "keywords": [
        "Doris 계층형 스토리지",
        "SSD HDD 핫 데이터와 콜드 데이터 분리",
        "동적 파티션",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "핫 데이터와 콜드 데이터 마이그레이션"
    ]
}
---

<!-- Knowledge type: Feature introduction + Configuration parameters + Operation steps -->
<!-- Applicable scenarios: Hot-cold data separation / Storage cost optimization / Query performance assurance -->

Doris는 SSD와 HDD 간 계층형 스토리지를 지원합니다. 동적 파티션과 함께 사용하면 시스템이 데이터의 핫/콜드 특성에 따라 핫 데이터는 SSD에 유지하고 콜드 데이터는 HDD로 자동 마이그레이션하여, 핫 데이터의 고성능 읽기 및 쓰기를 보장하면서 전체 스토리지 비용을 줄일 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

이 문서는 다음 시나리오에 적용됩니다.

- 테이블 데이터가 시간별로 파티셔닝되어 있고 핫 데이터와 콜드 데이터의 접근 특성이 뚜렷합니다.
- 클러스터에 SSD와 HDD 스토리지 매체가 모두 있습니다.
- SSD로 최근 핫 데이터의 쿼리 속도를 높이고 HDD로 과거 콜드 데이터의 저장 비용을 줄이려 합니다.
- 수동 마이그레이션 없이 동적 파티션으로 데이터 수명 주기를 자동 관리하려 합니다.

## 빠른 탐색 {#quick-navigation}

- [핵심 개념](#core-concepts): 동적 파티션과 계층형 스토리지의 관계.
- [매개변수 참조](#parameter-reference): `hot_partition_num`과 `storage_medium` 사용 방법.
- [사용 예제](#usage-example): 테이블 생성 SQL과 파티션 분포 확인.
- [자주 묻는 질문](#faq): 사용 중 자주 묻는 질문.
- [문제 해결](#troubleshooting): 파티션 생성 실패 등의 예외 처리.

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Feature introduction -->

계층형 스토리지는 동적 파티션을 기반으로 구현됩니다. Doris는 파티션의 활성도에 따라 스토리지 매체를 자동으로 선택하고, 쿨다운 시간에 도달하면 데이터를 대상 매체로 마이그레이션합니다.

### 핫 파티션과 콜드 파티션 {#hot-partitions-and-cold-partitions}

| 유형           | 설명                                                 | 스토리지 매체  | 성능 특성                   |
| -------------- | ---------------------------------------------------- | -------------- | --------------------------- |
| 핫 파티션      | 최근에 활성화되어 자주 접근하는 파티션                | SSD            | 높은 IOPS, 낮은 지연 시간   |
| 콜드 파티션    | 접근 빈도가 낮은 과거 데이터                         | HDD            | 대용량, 저비용              |

### 작동 방식 {#how-it-works}

계층형 스토리지의 실행 흐름은 다음과 같습니다.

1. 테이블 생성 시 동적 파티션을 활성화하고 `dynamic_partition.storage_medium = HDD`를 설정합니다.
2. `dynamic_partition.hot_partition_num`을 사용하여 최근 N개 파티션을 SSD에 저장할 핫 파티션으로 지정합니다.
3. 시스템이 각 핫 파티션에 `storage_cooldown_time`을 설정합니다.
4. 쿨다운 시간에 도달하면 파티션 데이터가 SSD에서 HDD로 자동 마이그레이션됩니다.

동적 파티션에 대한 자세한 내용은 [데이터 파티셔닝 - 동적 파티션](../../table-design/data-partitioning/dynamic-partitioning)을 참조하세요.

## 매개변수 참조 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

계층형 스토리지는 다음 두 가지 동적 파티션 매개변수를 사용합니다.

| 매개변수                               | 용도                                                                     | 기본값  | 참고                                                             |
| -------------------------------------- | ------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------- |
| `dynamic_partition.hot_partition_num`  | 최근 파티션 중 SSD에 저장할 핫 파티션의 개수를 지정합니다                 | 없음    | `storage_medium = HDD`와 함께 사용해야 합니다                    |
| `dynamic_partition.storage_medium`     | 동적 파티션의 최종 스토리지 매체를 지정합니다                             | HDD     | SSD로 설정하면 `hot_partition_num`이 더 이상 적용되지 않습니다   |

### dynamic_partition.hot_partition_num {#dynamic_partitionhot_partition_num}

- **기능**: 최근 N개 파티션을 핫 파티션으로 지정합니다. 이 파티션들은 SSD에 저장되고 나머지 파티션은 HDD에 저장됩니다.
- **사용 조건**:
    - `dynamic_partition.storage_medium = HDD`도 설정해야 합니다. 그렇지 않으면 이 매개변수가 적용되지 않습니다.
    - 스토리지 경로에 SSD 장치가 있어야 합니다. 그렇지 않으면 파티션 생성이 실패합니다.

**예제**:

현재 날짜가 **2021-05-20**이고 일 단위로 파티셔닝하며 동적 파티션 구성이 다음과 같다고 가정합니다.

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

시스템은 다음 파티션을 자동으로 생성하고 각 파티션의 스토리지 매체와 쿨다운 시간을 아래와 같이 설정합니다.

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

### dynamic_partition.storage_medium {#dynamic_partitionstorage_medium}

- **기능**: 동적 파티션의 최종 스토리지 매체를 지정합니다. 유효한 값은 `HDD`(기본값) 또는 `SSD`입니다.
- **참고**:
    - `SSD`로 설정하면 `hot_partition_num` 매개변수는 무시됩니다.
    - 이 경우 모든 파티션이 SSD 스토리지를 사용하고 쿨다운 시간이 모두 `9999-12-31 23:59:59`로 설정되어 마이그레이션이 발생하지 않습니다.

## 사용 예제 {#usage-example}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

다음 단계에서는 계층형 스토리지를 지원하는 테이블을 생성하고 파티션의 스토리지 매체 분포를 확인하는 방법을 설명합니다.

### 1단계: 계층형 스토리지 테이블 생성 {#step-1-create-a-tiered-storage-table}

목표: 최근 2개 파티션은 SSD를 사용하고 나머지는 HDD를 사용하도록 SSD/HDD 계층형 스토리지를 활성화한 테이블을 생성합니다.

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

### 2단계: 파티션 스토리지 매체 확인 {#step-2-check-the-partition-storage-medium}

목표: 파티션이 예상대로 SSD와 HDD에 할당되었는지 확인합니다.

```sql
SHOW PARTITIONS FROM tiered_table;
```

예상 출력: 총 7개의 파티션 중 5개는 SSD를 사용하고 2개는 HDD를 사용합니다.

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

### Q1: `hot_partition_num`이 적용되지 않으면 어떻게 해야 하나요? {#q1-what-if-hot_partition_num-does-not-take-effect}

`dynamic_partition.storage_medium = HDD`도 설정되어 있는지 확인하세요. 핫 파티션 구성은 최종 매체가 HDD일 때만 적용됩니다.

### Q2: SSD 스토리지만 사용할 수 있나요? {#q2-can-i-use-ssd-storage-only}

네. `dynamic_partition.storage_medium`을 `SSD`로 설정하면 모든 파티션이 SSD를 사용하며 쿨다운에 따른 마이그레이션이 발생하지 않습니다. 이 경우 `hot_partition_num`을 구성할 필요가 없습니다.

### Q3: 쿨다운 시간에 도달하면 데이터는 어떻게 마이그레이션되나요? {#q3-how-is-data-migrated-after-the-cooldown-time-is-reached}

파티션의 `storage_cooldown_time`에 도달하면 시스템이 수동 개입 없이 파티션 데이터를 SSD에서 HDD로 자동 마이그레이션합니다.

### Q4: 계층형 스토리지와 핫/콜드 데이터 아카이빙(예: 오브젝트 스토리지)의 차이점은 무엇인가요? {#q4-what-is-the-difference-between-tiered-storage-and-hot-cold-data-archiving-such-as-object-storage}

SSD/HDD 계층형 스토리지는 서로 다른 로컬 디스크 매체 간에 데이터를 이동하는 데 사용되며, 단기에서 중기에 걸친 핫 데이터와 콜드 데이터 분리에 적합합니다. 과거 데이터를 오브젝트 스토리지(S3, HDFS 등)에 아카이빙하려면 핫/콜드 계층형 스토리지 문서를 참조하세요.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| 오류 증상                                      | 가능한 원인                                 | 해결 방법                                                                         |
| ---------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| 파티션 생성 실패                               | 스토리지 경로에 SSD 장치가 없음             | BE 노드에 SSD 스토리지 경로를 구성하거나 HDD 전용 스토리지로 전환합니다             |
| `hot_partition_num`이 적용되지 않음            | `storage_medium = HDD`가 설정되지 않음      | `dynamic_partition.storage_medium = HDD`도 구성합니다                             |
| 모든 파티션이 SSD에 있고 쿨다운 후 HDD로 이동하지 않음 | `storage_medium`이 `SSD`로 설정됨      | `storage_medium`을 `HDD`로 변경하고 `hot_partition_num`을 구성합니다                |
| 데이터가 예상대로 HDD로 마이그레이션되지 않음   | `storage_cooldown_time`에 도달하지 않음     | 쿨다운 시간에 도달할 때까지 기다리거나 시간 설정이 올바른지 확인합니다              |
