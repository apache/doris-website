---
{
    "title": "자동 파티셔닝",
    "language": "ko",
    "description": "Doris의 자동 파티셔닝(AUTO PARTITION)은 데이터 적재 중 파티션 열의 값에 따라 RANGE 또는 LIST 파티션을 자동으로 생성하여, 데이터가 불연속적이거나 파티션 수가 매우 많아 파티션을 미리 정의하기 어려운 문제를 해결합니다."
}
---

<!-- Knowledge type: Feature / Procedure -->
<!-- Use cases: Partitioned table design / Large-scale partition management / Data lifecycle management -->

Doris는 자동 파티셔닝(AUTO PARTITION)을 통해 데이터 적재 중 파티션 열의 값에 따라 파티션을 자동으로 생성할 수 있습니다. 이 기능은 다음과 같은 문제를 해결합니다:

- 파티션 열의 데이터가 흩어져 있고 예측하기 어려워 테이블 생성 시 필요한 파티션을 정확히 나열할 수 없습니다.
- 파티션 수가 너무 많아 수동으로 생성하기 어렵습니다.
- 파티션 열이 시스템 시간과 관련이 없어 동적 파티셔닝으로는 처리할 수 없습니다.

Doris는 두 가지 유형의 자동 파티셔닝을 지원합니다:

| 유형 | 파티셔닝 방식 | 파티션 함수 | 지원되는 파티션 열 자료형 |
| --- | --- | --- | --- |
| AUTO **RANGE** PARTITION | 범위별 자동 파티셔닝 | `date_trunc` | `DATE`, `DATETIME` |
| AUTO **LIST** PARTITION | 열거 값별 자동 파티셔닝 | 함수 호출 미지원 | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` |

## 사용 사례 {#use-cases}

시간 자료형을 사용하는 파티션 열을 예로 들어 보겠습니다:

- 동적 파티셔닝을 사용하면 Doris가 일정한 시간 주기에 따라 새 파티션을 자동으로 생성하여 실시간 데이터를 저장할 수 있습니다. 실시간 사용자 행동 로그와 같은 시나리오에서는 일반적으로 이 기능으로 요구 사항을 충족할 수 있습니다.
- 하지만 더 복잡한 시나리오에서는(예: 비실시간 데이터 처리) 파티션 열이 현재 시스템 시간과 관련이 없고 불연속적인 값을 많이 포함합니다. 이 열을 기준으로 파티션을 나누고 싶어도 필요한 파티션을 미리 알 수 없거나 파티션 수가 너무 많을 수 있습니다.

이러한 경우에는 동적 파티셔닝과 수동 파티셔닝 모두 요구 사항을 충족하지 못하지만, 자동 파티셔닝으로는 효과적으로 처리할 수 있습니다.

### 예시 시나리오: 거래 이력 테이블 {#example-scenario-trade-history-table}

거래 날짜별로 파티션을 나눈 거래 이력 테이블이 있다고 가정해 보겠습니다. 수동 파티셔닝을 사용하면 DDL은 일반적으로 다음과 같습니다:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT 'Trade date',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT 'Trade ID',
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
PARTITION BY RANGE(`TRADE_DATE`)
(
    PARTITION p_2000 VALUES [('2000-01-01'), ('2001-01-01')),
    PARTITION p_2001 VALUES [('2001-01-01'), ('2002-01-01')),
    PARTITION p_2002 VALUES [('2002-01-01'), ('2003-01-01')),
    PARTITION p_2003 VALUES [('2003-01-01'), ('2004-01-01')),
    PARTITION p_2004 VALUES [('2004-01-01'), ('2005-01-01')),
    PARTITION p_2005 VALUES [('2005-01-01'), ('2006-01-01')),
    PARTITION p_2006 VALUES [('2006-01-01'), ('2007-01-01')),
    PARTITION p_2007 VALUES [('2007-01-01'), ('2008-01-01')),
    PARTITION p_2008 VALUES [('2008-01-01'), ('2009-01-01')),
    PARTITION p_2009 VALUES [('2009-01-01'), ('2010-01-01')),
    PARTITION p_2010 VALUES [('2010-01-01'), ('2011-01-01')),
    PARTITION p_2011 VALUES [('2011-01-01'), ('2012-01-01')),
    PARTITION p_2012 VALUES [('2012-01-01'), ('2013-01-01')),
    PARTITION p_2013 VALUES [('2013-01-01'), ('2014-01-01')),
    PARTITION p_2014 VALUES [('2014-01-01'), ('2015-01-01')),
    PARTITION p_2015 VALUES [('2015-01-01'), ('2016-01-01')),
    PARTITION p_2016 VALUES [('2016-01-01'), ('2017-01-01')),
    PARTITION p_2017 VALUES [('2017-01-01'), ('2018-01-01')),
    PARTITION p_2018 VALUES [('2018-01-01'), ('2019-01-01')),
    PARTITION p_2019 VALUES [('2019-01-01'), ('2020-01-01')),
    PARTITION p_2020 VALUES [('2020-01-01'), ('2021-01-01')),
    PARTITION p_2021 VALUES [('2021-01-01'), ('2022-01-01'))
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

이 방식에는 다음과 같은 문제가 있습니다:

1. 테이블 생성 시 모든 파티션을 수동으로 나열해야 합니다.
2. 파티션 열의 값 범위가 변경되면(예: 2022년 데이터 추가) [ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION)을 통해 파티션을 수정해야 하므로 번거롭습니다.
3. 파티션을 변경하거나 더 세분화해야 할 경우 수정 비용이 큽니다.

AUTO PARTITION을 사용하면 DDL을 다음과 같이 간소화할 수 있습니다:

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL,
    `TRADE_ID`                varchar(40) NOT NULL,
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
AUTO PARTITION BY RANGE (date_trunc(`TRADE_DATE`, 'year'))
(
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

새로 생성한 테이블에는 기본 파티션이 없습니다:

```sql
show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

데이터를 삽입하면 해당 파티션이 자동으로 생성됩니다:

```sql
insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);

show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
```

자동 파티셔닝으로 생성한 파티션은 수동으로 생성한 파티션과 기능이 같습니다.

## 구문 {#syntax}

`partitions_definition` 부분을 작성할 때는 [CREATE-TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)의 다음 구문을 사용합니다.

### AUTO RANGE PARTITION {#auto-range-partition}

```sql
[AUTO] PARTITION BY RANGE(<partition_expr>)
<origin_partitions_definition>
```

이때 다음과 같이 정의합니다:

```sql
partition_expr ::= date_trunc(<partition_column>, '<interval>')
```

:::tip
AUTO RANGE PARTITION에서는 `AUTO` 키워드를 생략해도 자동 파티셔닝의 의미가 유지됩니다.
:::

예시:

```sql
CREATE TABLE `date_table` (
    `TIME_STAMP` datev2 NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`TIME_STAMP`)
AUTO PARTITION BY RANGE (date_trunc(`TIME_STAMP`, 'month'))
(
)
DISTRIBUTED BY HASH(`TIME_STAMP`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### AUTO LIST PARTITION {#auto-list-partition}

```sql
AUTO PARTITION BY LIST(`partition_col1` [, `partition_col2`, ...])
<origin_partitions_definition>
```

LIST 자동 파티셔닝은 다중 열 파티셔닝을 지원하며, 일반 LIST 파티션과 동일한 구문을 사용합니다: `AUTO PARTITION BY LIST(`col1`, `col2`, ...)`. 해당 파티션이 아직 없는 파티션 열의 값마다 독립적인 새 파티션이 생성됩니다.

예시:

```sql
CREATE TABLE `str_table` (
    `str` varchar not null
) ENGINE=OLAP
DUPLICATE KEY(`str`)
AUTO PARTITION BY LIST (`str`)
()
DISTRIBUTED BY HASH(`str`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 제약 조건 비교 {#constraint-comparison}

| 제약 조건 | AUTO RANGE PARTITION | AUTO LIST PARTITION |
| --- | --- | --- |
| 지원되는 파티션 함수 | `date_trunc`만 지원 | 함수 호출 미지원 |
| 지원되는 파티션 열 자료형 | `DATE`, `DATETIME` | `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` |
| 다중 열 파티셔닝 지원 여부 | 미지원 | 지원 |
| 파티션 이름 길이 제한 | - | 50자를 초과할 수 없음(파티션 열의 내용을 이어 붙이고 이스케이프하여 생성하므로 실제 허용 길이는 더 짧을 수 있음) |
| 파티션 값 규칙 | `date_trunc`로 잘라낸 시간 범위에 따라 구분 | 기존 파티션이 없는 새 열거 값마다 독립적인 새 파티션 생성 |

## NULL 값 파티셔닝 {#null-value-partitioning}

세션 변수 `allow_partition_column_nullable`을 활성화하면 두 자동 파티셔닝 유형의 NULLABLE 열 지원 여부는 다음과 같이 다릅니다:

| 자동 파티셔닝 유형 | NULLABLE 파티션 열 지원 여부 |
| --- | --- |
| AUTO LIST PARTITION | 지원. NULL을 쓰면 NULL 파티션이 정상적으로 생성됩니다. |
| AUTO RANGE PARTITION | 미지원 |

### AUTO LIST PARTITION: NULLABLE 열 지원 {#auto-list-partition-nullable-column-supported}

```sql
create table auto_null_list(
    k0 varchar null
)
auto partition by list (k0)
(
)
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties("replication_num" = "1");

insert into auto_null_list values (null);

select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+

select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
```

### AUTO RANGE PARTITION: NULLABLE 열 미지원 {#auto-range-partition-nullable-column-not-supported}

```sql
CREATE TABLE `range_table_nullable` (
    `k1` INT,
    `k2` DATETIMEV2(3),
    `k3` DATETIMEV2(6)
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
()
DISTRIBUTED BY HASH(`k1`) BUCKETS 16
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

## 수명 주기 관리 {#lifecycle-management}

:::info
Doris는 자동 파티셔닝과 동적 파티셔닝을 함께 사용한 수명 주기 관리를 지원하지만, 이 조합은 더 이상 권장하지 않습니다.
:::

AUTO RANGE PARTITION 테이블은 `partition.retention_count` 속성을 통해 과거 파티션의 수명 주기를 관리할 수 있습니다. 이 속성에는 양의 정수 `N`을 지정하며, **파티션 값이 가장 큰 과거 파티션 `N`개만 유지합니다**. 현재 및 미래 파티션은 모두 유지됩니다.

사용 제한 사항:

- AUTO RANGE PARTITION 테이블에서만 이 속성을 설정할 수 있습니다. 그렇지 않으면 `Only AUTO RANGE PARTITION table could set partition.retention_count` 오류와 함께 구문 실행이 실패합니다.
- **이미 활성화된 동적 파티셔닝과 함께 사용할 수 없습니다**(`dynamic_partition.enable = true`). 함께 사용하면 `Can not use partition.retention_count and dynamic_partition properties at the same time` 오류와 함께 구문 실행이 실패합니다. 동적 파티셔닝으로 파티션을 생성하는 방식과 유지 개수를 기준으로 파티션을 정리하는 방식은 함께 사용할 수 없는 스케줄링 모드입니다. 이 제한은 버전 4.1.4부터 컴퓨팅-스토리지 통합 모드와 컴퓨팅-스토리지 분리 모드 모두에 적용됩니다.
- 버전 4.1.4부터는 컴퓨팅-스토리지 분리 모드에서도 `ALTER TABLE ... SET ("partition.retention_count" = "N")`을 사용하여 이 속성을 변경할 수 있습니다. 4.1.4 이전에는 컴퓨팅-스토리지 분리 모드에서 이 `ALTER`가 거부되거나 아무 효과가 없었습니다.

### 개념 정의 {#concept-definitions}

- **과거 파티션**: 상한이 현재 시각보다 작거나 같은 파티션입니다.
- **현재 및 미래 파티션**: 하한이 현재 시각보다 크거나 같은 파티션입니다.
- **파티션 값 비교**: RANGE 파티션은 서로 겹치지 않으므로, "파티션 A의 값이 파티션 B의 값보다 크다"는 것은 "파티션 A의 하한이 파티션 B의 상한보다 크다"와 같으며, "파티션 A의 상한이 파티션 B의 상한보다 크다"와도 같습니다.

### 예시 {#example}

```sql
create table auto_recycle(
    k0 datetime(6) not null
)
AUTO PARTITION BY RANGE (date_trunc(k0, 'day')) ()
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties(
    "partition.retention_count" = "3"
);
```

이 설정은 날짜 값이 가장 큰 과거 파티션 3개만 유지한다는 뜻입니다. 현재 날짜가 `2025-10-21`이고 `2025-10-16`부터 `2025-10-23`까지 각 날짜의 데이터를 삽입한다고 가정해 보겠습니다. 한 차례 정리가 끝나면 아래와 같이 파티션 6개가 남습니다:

![파티션 정리](/images/blogs/auto-partition-lifetime1.png)

남아 있는 파티션 목록:

- p20251018000000
- p20251019000000
- p20251020000000 (이 파티션 및 위의 파티션: 과거 파티션은 세 개만 유지됨)
- p20251021000000 (이 파티션 및 아래의 파티션: 현재 및 미래 파티션에는 영향을 주지 않음)
- p20251022000000
- p20251023000000

## 자동 버킷팅과 함께 사용 {#used-together-with-auto-bucketing}

AUTO RANGE PARTITION만 [자동 버킷팅](./data-bucketing.md#2-automatically-set-the-number-of-buckets) 기능과 함께 사용할 수 있습니다.

이 조합을 사용할 때 Doris는 데이터가 시간순으로 테이블에 증분 적재되고 각 데이터 적재가 하나의 파티션만 대상으로 한다고 가정합니다. 따라서 **데이터를 배치 단위로 증분 적재하는 테이블에만 이 조합을 권장합니다**.

:::warning 참고
데이터 적재 방식이 위 패턴을 따르지 않는 상태에서 자동 파티셔닝과 자동 버킷팅을 함께 사용하면 새 파티션의 버킷 수가 매우 부적절하게 설정되어 쿼리 성능에 큰 영향을 줄 수 있습니다.
:::

## 파티션 관리 {#partition-management}

자동 파티셔닝을 활성화하면 다음 두 도구로 파티션을 정확히 찾을 수 있습니다:

- `auto_partition_name` 함수: 파티션 열 값을 파티션 이름에 매핑합니다.
- `partitions` 테이블 함수: 파티션 이름으로 파티션의 상세 정보를 조회합니다.

앞서 사용한 `DAILY_TRADE_VALUE` 테이블에 데이터를 삽입한 후 특정 레코드가 속한 파티션을 쿼리해 보겠습니다:

```sql
select * from partitions("catalog"="internal","database"="optest","table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

이 방식을 사용하면 각 파티션의 ID와 값을 정확히 선택하여 이후 파티션별 작업(예: `insert overwrite partition`)을 수행할 수 있습니다.

상세 구문:

- [auto_partition_name 함수 참조](../../sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name)
- [partitions 테이블 함수 참조](../../sql-manual/sql-functions/table-valued-functions/partitions)

## 참고 사항 {#notes}

| 참고 사항 | 설명 |
| --- | --- |
| 다중 열 파티셔닝 지원 | AUTO LIST PARTITION은 다중 열 파티셔닝을 지원하며, 일반 LIST 파티션과 동일한 구문을 사용합니다. |
| 실패한 데이터 적재에서 생성된 파티션은 자동으로 정리되지 않음 | 데이터 삽입 또는 데이터 적재 중에 파티션이 생성되었으나 전체 데이터 적재가 완료되지 않은 경우(실패하거나 취소된 경우), 생성된 파티션은 자동으로 삭제되지 않습니다. |
| 일반 파티션과 동일한 사용 방식 | AUTO PARTITION을 사용하는 테이블은 파티션 생성 방식만 수동에서 자동으로 바뀝니다. 테이블과 파티션을 사용하는 나머지 방식은 AUTO PARTITION을 사용하지 않는 테이블과 동일합니다. |
| 최대 파티션 수 제한 | 테이블당 최대 파티션 수는 `max_auto_partition_num`이라는 [FE 구성](../../admin-manual/config/fe-config) 항목으로 제어합니다. 실수로 너무 많은 파티션이 생성되지 않도록 필요에 따라 조정하세요. |
| 데이터 전송 폴링 간격 | AUTO PARTITION 테이블에 데이터를 적재할 때 Coordinator가 데이터를 전송하는 폴링 간격은 일반 테이블과 다릅니다. 이 간격은 `olap_table_sink_send_interval_auto_partition_factor`라는 [BE 구성](../../admin-manual/config/be-config) 항목으로 제어합니다. sink-node memtable을 활성화하면(`enable_memtable_on_sink_node = true`) 이 변수는 적용되지 않습니다. |
| INSERT OVERWRITE 동작 | AUTO PARTITION 테이블에서 [insert-overwrite](../../sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE)를 사용하여 데이터를 삽입할 때의 구체적인 동작은 INSERT OVERWRITE 문서를 참조하세요. |
| 메타데이터 충돌로 인한 데이터 적재 실패 가능성 | 데이터 적재로 파티션을 생성할 때 테이블에서 다른 메타데이터 작업(예: Schema Change 또는 Rebalance)이 진행 중이면 데이터 적재가 실패할 수 있습니다. |
