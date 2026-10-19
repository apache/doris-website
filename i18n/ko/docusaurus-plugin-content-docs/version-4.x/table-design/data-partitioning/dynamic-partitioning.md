---
{
    "title": "동적 파티셔닝",
    "sidebar_label": "동적 파티셔닝",
    "language": "ko",
    "description": "동적 파티셔닝은 일정에 따라 파티션을 생성하고 삭제하여 테이블의 파티션 수명 주기 관리(TTL)를 제공합니다. 만료된 데이터를 자동으로 정리해야 하는 로그 및 시계열 데이터 등의 시나리오에 적합합니다."
}
---

:::info 파티션 관리 방식 선택
동적 파티셔닝은 일정에 따라 파티션을 생성하고 삭제합니다. 데이터가 들어올 때 필요에 따라 파티션을 생성해야 한다면 [자동 파티셔닝](./auto-partitioning)을 사용하세요. 시간 범위를 기준으로 보관할지, 과거 파티션 개수를 기준으로 보관할지에 따라 보관 방식을 선택하세요.
:::

<!-- Knowledge type: Feature introduction + Operating procedure + Configuration parameters -->
<!-- Applicable scenarios: Log management / Time-series data / Data lifecycle management -->

동적 파티셔닝은 설정된 규칙에 따라 파티션을 추가하고 삭제하여 테이블의 파티션 수명 주기 관리(TTL)를 제공하고 데이터 저장 부담을 줄입니다. 로그 관리 및 시계열 데이터 관리 등의 시나리오에서는 만료된 데이터를 순차적으로 삭제하는 데 동적 파티셔닝을 주로 사용합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오                    | 설명                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| 로그 데이터 관리         | 일별 또는 시간별로 최근 N일의 로그를 보관하고 만료된 파티션을 자동으로 삭제합니다 |
| 시계열 데이터 관리 | 모니터링, IoT 등의 시나리오에서 시간 축을 따라 파티션을 자동으로 관리합니다 |
| 데이터 수명 주기 관리   | TTL로 데이터 보관 범위를 제어하고 저장 비용을 줄입니다              |
| 미래 파티션 사전 생성 | 향후 N일에 해당하는 파티션을 미리 생성하여 파티션 누락으로 인한 쓰기 실패를 방지합니다 |

다음 그림은 동적 파티셔닝을 사용한 수명 주기 관리 예제입니다. 이 예제에서는 다음 규칙을 지정합니다.

- 스케줄링 단위인 `dynamic_partition.time_unit`은 `DAY`로, 일별로 파티션을 구성합니다.
- 시작 오프셋인 `dynamic_partition.start`는 `-1`로 설정하여 하루 전의 파티션을 보관합니다.
- 종료 오프셋인 `dynamic_partition.end`는 `2`로 설정하여 향후 이틀에 해당하는 파티션을 보관합니다.

이 규칙에 따라 시간이 지나도 하루 전의 파티션, 당일의 파티션, 향후 이틀에 해당하는 파티션까지 항상 네 개의 파티션이 유지됩니다.

![동적 파티션](/images/getting-started/dynamic-partition.png)

## 제한 사항 {#limitations}

동적 파티셔닝에는 다음 제한 사항이 적용됩니다.

- 동적 파티셔닝은 `DATE` / `DATETIME` 컬럼을 사용하는 Range 파티셔닝만 지원합니다.
- 동적 파티셔닝은 단일 파티션 키만 지원합니다.

## 동적 파티션 테이블 생성 {#creating-a-dynamic-partitioned-table}

<!-- Knowledge type: Operating procedure -->

테이블 생성 시 `dynamic_partition` 속성을 지정하여 동적 파티션 테이블을 생성할 수 있습니다.

```sql
CREATE TABLE test_dynamic_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 10
PROPERTIES(
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);
```

`dynamic_partition` 매개변수에 대한 자세한 내용은 [동적 파티션 속성](#dynamic-partition-properties)을 참조하세요.

## 동적 파티션 관리 {#managing-dynamic-partitions}

### 동적 파티션 속성 수정 {#modifying-dynamic-partition-properties}

:::info 팁
`ALTER TABLE` 문으로 동적 파티션을 수정해도 즉시 적용되지는 않습니다. Doris는 `dynamic_partition_check_interval_seconds`로 지정한 간격으로 동적 파티션을 확인하고 필요한 파티션 생성 및 삭제 작업을 수행합니다.
:::

다음 예제에서는 `ALTER TABLE` 문을 사용하여 동적 파티셔닝을 사용하지 않는 파티션 테이블을 동적 파티션 테이블로 전환합니다.

```sql
CREATE TABLE test_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 10;

ALTER TABLE test_partition SET (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);
```

### 동적 파티션 스케줄링 상태 확인 {#viewing-dynamic-partition-scheduling-status}

[SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES)을 사용하여 현재 데이터베이스에 있는 모든 동적 파티션 테이블의 스케줄링 상태를 확인할 수 있습니다.

```sql
SHOW DYNAMIC PARTITION TABLES;
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
7 rows in set (0.02 sec)
```

### 과거 파티션 관리 {#managing-historical-partitions}

`start` 및 `end` 속성으로 동적 파티션의 개수를 지정하면, 모든 파티션을 한 번에 생성할 때 발생하는 긴 대기 시간을 방지하기 위해 기본적으로 과거 파티션을 생성하지 않습니다. 현재 시점 이후의 파티션만 생성됩니다. 모든 파티션을 한 번에 생성하려면 `create_history_partition` 매개변수를 활성화하세요.

예를 들어 현재 날짜가 2024-10-11이고 `start = -2`, `end = 2`로 지정한 경우:

- `create_history_partition = true`이면 5개의 파티션이 `[10-09, 10-13]` 범위에 대해 즉시 생성됩니다.
- `create_history_partition = false`이면 3개의 파티션만 `[10-11, 10-13]` 범위에 대해 생성됩니다.

## 동적 파티션 매개변수 {#dynamic-partition-parameters}

### 동적 파티션 속성 {#dynamic-partition-properties}

<!-- Knowledge type: Configuration parameters -->

동적 파티션 규칙 매개변수에는 `dynamic_partition` 접두사가 사용됩니다. 다음 규칙 매개변수를 사용할 수 있습니다.

| 매개변수                                       | 필수 여부 | 설명                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable`                      | 아니요       | 동적 파티셔닝 기능의 활성화 여부입니다. `TRUE` 또는 `FALSE`로 설정할 수 있습니다. 다른 필수 동적 파티션 매개변수를 지정하면 기본값은 `TRUE`입니다.                                                                                                    |
| `dynamic_partition.time_unit`                   | 예      | 동적 파티셔닝의 스케줄링 단위입니다. `HOUR`, `DAY`, `WEEK`, `MONTH` 또는 `YEAR`로 설정할 수 있으며, 각각 시간, 일, 주, 월 또는 연 단위로 파티션을 생성하거나 삭제함을 의미합니다.                                                                   |
| `dynamic_partition.start`                       | 아니요       | 동적 파티셔닝의 시작 오프셋으로, 음수로 지정합니다. 기본값은 `-2147483648`이며, 과거 파티션을 삭제하지 않음을 의미합니다. `time_unit` 속성에 따라 현재 일(주 / 월)을 기준으로 이 오프셋보다 앞선 범위의 파티션을 삭제합니다. 이 오프셋과 현재 시점 사이의 과거 파티션이 존재하지 않을 때 생성할지는 `dynamic_partition.create_history_partition`으로 제어합니다. |
| `dynamic_partition.end`                         | 예      | 동적 파티셔닝의 종료 오프셋으로, 양수로 지정합니다. `time_unit` 속성에 따라 현재 일(주 / 월)을 기준으로 해당 범위의 파티션을 미리 생성합니다.                                                              |
| `dynamic_partition.prefix`                      | 예      | 동적으로 생성되는 파티션 이름의 접두사입니다.                                                                                                                                                                                                                  |
| `dynamic_partition.buckets`                     | 아니요       | 동적으로 생성되는 파티션의 버킷 수입니다. 이 매개변수를 설정하면 `DISTRIBUTED`에 지정된 버킷 수를 재정의합니다.                                                                                                                                     |
| `dynamic_partition.replication_num`             | 아니요       | 동적으로 생성되는 파티션의 복제본 수입니다. 지정하지 않으면 테이블 생성 시 지정한 복제본 수가 기본값으로 사용됩니다.                                                                                                                     |
| `dynamic_partition.create_history_partition`    | 아니요       | 기본값은 `false`입니다. `true`로 설정하면 Doris는 아래에 설명된 규칙에 따라 모든 파티션을 자동으로 생성합니다. 이때 FE 매개변수인 `max_dynamic_partition_num`으로 전체 파티션 수를 제한하여 한 번에 너무 많은 파티션이 생성되는 것을 방지합니다. 생성할 파티션 수가 `max_dynamic_partition_num`을 초과하면 작업이 거부됩니다. 이 매개변수는 `start` 속성을 지정하지 않으면 적용되지 않습니다. |
| `dynamic_partition.history_partition_num`       | 아니요       | `create_history_partition`이 `true`일 때 생성할 과거 파티션 수를 지정합니다. 기본값은 `-1`이며, 설정되지 않았음을 의미합니다. 이 변수는 `dynamic_partition.start`와 동일한 효과가 있으므로 한 번에 둘 중 하나만 설정하는 것이 좋습니다. |
| `dynamic_partition.start_day_of_week`           | 아니요       | `time_unit`이 `WEEK`일 때 한 주의 시작일을 지정합니다. 유효 범위는 1~7이며, 1은 월요일, 7은 일요일을 의미합니다. 기본값은 1로, 월요일이 한 주의 시작입니다.                                                                  |
| `dynamic_partition.start_day_of_month`          | 아니요       | `time_unit`이 `MONTH`일 때 한 달의 시작일을 지정합니다. 유효 범위는 1~28이며, 1은 매월 1일을, 28은 매월 28일을 의미합니다. 기본값은 1로, 매월 1일이 한 달의 시작입니다. 윤년이나 월별 일수 차이로 인한 모호함을 방지하기 위해 29일, 30일, 31일은 시작일로 지원하지 않습니다. |
| `dynamic_partition.reserved_history_periods`    | 아니요       | 보관할 과거 파티션의 시간 범위입니다. `dynamic_partition.time_unit`이 `DAY` / `WEEK` / `MONTH` / `YEAR`이면 값을 `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 형식으로 설정합니다. `dynamic_partition.time_unit`이 `HOUR`이면 값을 `[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 형식으로 설정합니다. 설정하지 않으면 기본값은 `"NULL"`입니다. |
| `dynamic_partition.time_zone`                   | 아니요       | 동적 파티셔닝에 사용할 시간대입니다. 기본값은 현재 서버의 시스템 시간대이며, 예를 들어 `Asia/Shanghai`입니다. 시간대 설정에 대한 자세한 내용은 [시간대 관리](../../admin-manual/cluster-management/time-zone)를 참조하세요.                                      |

### FE 설정 매개변수 {#fe-configuration-parameters}

FE의 동적 파티션 매개변수는 FE 설정 파일이나 `ADMIN SET FRONTEND CONFIG` 명령을 통해 수정할 수 있습니다.

| 매개변수                                  | 기본값 | 설명                                                                                |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `dynamic_partition_enable`                 | false   | Doris에서 동적 파티셔닝 기능을 활성화할지 여부입니다. 이 매개변수는 동적 파티션 테이블의 파티션 작업에만 영향을 주며, 일반 테이블에는 영향을 주지 않습니다. |
| `dynamic_partition_check_interval_seconds` | 600     | 동적 파티션 스레드의 실행 주기입니다. 단위는 초입니다.                       |
| `max_dynamic_partition_num`                | 500     | 동적 파티션 테이블 생성 시 생성할 수 있는 최대 파티션 수를 제한하여 한 번에 너무 많은 파티션이 생성되는 것을 방지합니다. |

## 동적 파티셔닝 모범 사례 {#dynamic-partitioning-best-practices}

### 예제 1: 로그 데이터의 순환 보관 {#example-1-rolling-retention-of-log-data}

일별로 파티션을 구성하고, 최근 7일과 당일의 데이터만 보관하며, 향후 3일에 해당하는 파티션을 미리 생성합니다.

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32"
);
```

### 예제 2: 월별 파티셔닝 및 전체 이력 보관 {#example-2-partitioning-by-month-and-retaining-all-history}

월별로 파티션을 구성하고, 과거 파티션은 삭제하지 않으며, 향후 2개월에 해당하는 파티션을 미리 생성하고, 매월 3일을 시작일로 설정합니다.

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.start_day_of_month" = "3"
);
```

### 예제 3: 지정한 과거 시간 범위 보관 {#example-3-retaining-specified-historical-time-ranges}

일별로 파티션을 구성하고, 지난 10일과 향후 10일의 파티션을 보관하며, 추가로 `[2020-06-01, 2020-06-20]` 및 `[2020-10-31, 2020-11-15]` 기간의 과거 데이터를 보관합니다.

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-10",
    "dynamic_partition.end" = "10",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.reserved_history_periods" = "[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"
);
```
