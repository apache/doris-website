---
{
    "title": "자동 증가 열",
    "language": "ko",
    "description": "Doris의 자동 증가 열(AUTO_INCREMENT)은 각 행에 고유한 BIGINT 값을 자동으로 생성하여 기본 키 생성, 사전 인코딩, 효율적인 페이지네이션 등의 시나리오에서 데이터 적재를 간소화합니다."
}
---

<!-- Knowledge type: Feature concept + procedure + use cases -->

Doris의 자동 증가 열(Auto Increment Column)은 고유한 숫자 값을 자동으로 생성하는 기능입니다. 일반적으로 기본 키처럼 각 행을 고유하게 식별하는 값을 만드는 데 사용합니다. 새 레코드를 삽입할 때마다 자동 증가 열에 증가하는 값이 자동으로 할당되므로 번호를 일일이 지정할 필요가 없습니다. Doris의 자동 증가 열을 사용하면 데이터의 고유성과 일관성을 보장하고, 데이터 삽입 과정을 간소화하며, 수동 작업으로 인한 오류를 줄이고 데이터 관리 효율을 높일 수 있습니다. 따라서 사용자 ID처럼 고유 식별자가 필요한 시나리오에 적합합니다.

## 핵심 기능 {#core-features}

### 쓰기 동작 {#write-behavior}

자동 증가 열이 있는 테이블에서 Doris는 데이터 쓰기를 다음과 같이 처리합니다.

| 쓰기 시나리오                                                                | 처리 방식                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 쓰는 데이터에 자동 증가 열이 **포함되지 않음**               | Doris가 고유한 값을 자동으로 생성하여 해당 열에 채웁니다 |
| 쓰는 데이터에 자동 증가 열이 **포함되어 있고** 값이 NULL임     | Doris가 NULL 값을 시스템에서 생성한 고유한 값으로 대체합니다      |
| 쓰는 데이터에 자동 증가 열이 **포함되어 있고** 값이 NULL이 아님 | 사용자가 제공한 값을 그대로 유지합니다                          |

:::caution 중요
사용자가 제공한 NULL이 아닌 값으로 인해 자동 증가 열의 고유성이 깨질 수 있습니다.
:::

### 고유성 {#uniqueness}

Doris는 자동 증가 열에서 생성한 값이 **테이블 수준에서 고유함**을 보장합니다. 단, 다음 사항에 유의해야 합니다.

- **고유성 보장**: 시스템에서 생성한 값에만 적용됩니다.
- **사용자가 제공한 값**: Doris는 사용자가 자동 증가 열에 지정한 값의 고유성을 검증하거나 강제하지 않으므로 중복 항목이 생길 수 있습니다.

### 조밀도 {#density}

Doris가 생성하는 자동 증가 값은 일반적으로 **조밀**하지만, 다음 사항을 고려해야 합니다.

- **값 사이에 공백이 생길 수 있음**: 성능 최적화로 인해 값 사이에 공백이 생길 수 있습니다. 각 백엔드 노드(BE)는 효율성을 위해 고유한 값의 블록을 미리 할당하며, 노드 간에 할당된 블록은 서로 겹치지 않습니다.
- **시간 순서와 일치하지 않는 값**: Doris는 나중에 쓰는 작업에서 생성한 값이 이전에 쓰는 작업에서 생성한 값보다 크다고 보장하지 않습니다.

:::info 참고
자동 증가 값으로 쓰기 작업의 시간 순서를 추론할 수 없습니다.
:::

## 자동 증가 열 생성 {#creating-an-auto-increment-column}

<!-- Knowledge type: Syntax + constraints -->

### 구문 {#syntax}

자동 증가 열을 사용하려면 해당 열에 `AUTO_INCREMENT` 속성을 지정하여 [CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)을 실행합니다.

- 시작 값을 지정하지 않으면 기본 시작 값은 `1`입니다.
- 테이블을 생성할 때 `AUTO_INCREMENT(start_value)`로 자동 증가 열의 시작 값을 직접 지정할 수 있습니다.

### 제약 조건 및 제한 사항 {#constraints-and-limitations}

1. Duplicate 모델 테이블과 Unique 모델 테이블에만 자동 증가 열을 사용할 수 있습니다.
2. 테이블에는 자동 증가 열을 최대 하나만 사용할 수 있습니다.
3. 자동 증가 열은 `BIGINT` 타입이어야 하며 `NOT NULL`이어야 합니다.
4. 자동 증가 열의 시작 값을 직접 지정할 경우 0 이상이어야 합니다.

### 테이블 생성 예제 {#table-creation-examples}

**예제 1: 키 열이 자동 증가 열인 Duplicate 모델 테이블**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**예제 2: 키 열이 시작 값 100의 자동 증가 열인 Duplicate 모델 테이블**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT(100),
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**예제 3: 값 열이 자동 증가 열인 Duplicate 모델 테이블**

```sql
CREATE TABLE `demo`.`tbl` (
    `uid` BIGINT NOT NULL,
    `name` BIGINT NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`uid`, `name`)
DISTRIBUTED BY HASH(`uid`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**예제 4: 키 열이 자동 증가 열인 Unique 모델 테이블**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**예제 5: 값 열이 자동 증가 열인 Unique 모델 테이블**

```sql
CREATE TABLE `demo`.`tbl` (
    `text` varchar(65533) NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`text`)
DISTRIBUTED BY HASH(`text`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 데이터 적재 {#data-ingestion}

<!-- Use cases: regular ingestion / partial column update -->

### 일반 데이터 적재 {#regular-ingestion}

다음 테이블을 예로 살펴보겠습니다.

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 시나리오 1: 자동 증가 열을 지정하지 않는 INSERT INTO {#scenario-1-insert-into-without-specifying-the-auto-increment-column}

`insert into` 문으로 데이터를 적재할 때 자동 증가 열인 `id`를 지정하지 않으면 Doris가 생성한 값을 `id` 열에 자동으로 채웁니다.

```sql
insert into tbl(name, value) values("Bob", 10), ("Alice", 20), ("Jack", 30);

select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+
```

#### 시나리오 2: 자동 증가 열을 지정하지 않는 Stream Load {#scenario-2-stream-load-without-specifying-the-auto-increment-column}

마찬가지로 Stream Load를 사용해 `test.csv` 파일을 가져올 때 자동 증가 열인 `id`를 지정하지 않으면 Doris가 생성한 값을 `id` 열에 자동으로 채웁니다.

`test.csv`의 내용:

```text
Tom,40
John,50
```

데이터 적재 명령을 실행합니다.

```shell
curl --location-trusted -u user:passwd \
    -H "columns:name,value" \
    -H "column_separator:," \
    -T ./test.csv \
    http://{host}:{port}/api/{db}/tbl/_stream_load
```

결과를 쿼리합니다.

```sql
select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
|    4 | Tom   |    40 |
|    5 | John  |    50 |
+------+-------+-------+
```

#### 시나리오 3: 자동 증가 열에 NULL 값을 지정하는 INSERT INTO {#scenario-3-insert-into-specifying-the-auto-increment-column-with-null-values}

자동 증가 열인 `id`를 지정하여 `insert into`를 실행하면 해당 열의 `null` 값은 생성된 값으로 대체됩니다.

```sql
insert into tbl(id, name, value) values(null, "Doris", 60), (null, "Nereids", 70);

select * from tbl order by id;
+------+---------+-------+
| id   | name    | value |
+------+---------+-------+
|    1 | Bob     |    10 |
|    2 | Alice   |    20 |
|    3 | Jack    |    30 |
|    4 | Tom     |    40 |
|    5 | John    |    50 |
|    6 | Doris   |    60 |
|    7 | Nereids |    70 |
+------+---------+-------+
```

### 부분 열 업데이트 {#partial-column-update}

자동 증가 열이 있는 merge-on-write Unique 테이블에서 부분 열 업데이트를 수행할 때의 동작은 자동 증가 열이 키 열인지에 따라 달라집니다.

| 자동 증가 열의 위치 | 업데이트 동작                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **키 열**                 | 사용자가 키 열을 명시적으로 지정해야 하며, 부분 업데이트 대상 열에 자동 증가 열을 포함해야 합니다. 데이터 적재 동작은 일반적인 부분 열 업데이트와 같습니다.                 |
| **키가 아닌 열**             | 자동 증가 열을 지정하지 않으면 테이블의 기존 행에서 해당 값을 가져와 채웁니다. 지정한 경우에는 `null` 값을 생성된 값으로 대체하고, `null`이 아닌 값은 그대로 유지한 뒤 부분 열 업데이트 방식으로 데이터를 삽입합니다. |

#### 예제 1: 자동 증가 열이 키 열인 경우 {#example-1-auto-increment-column-as-a-key-column}

```sql
CREATE TABLE `demo`.`tbl2` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL DEFAULT "0"
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl2(id, name, value) values(1, "Bob", 10), (2, "Alice", 20), (3, "Jack", 30);

select * from tbl2 order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl2(id, name) values(1, "modified"), (4, "added");

select * from tbl2 order by id;
+------+----------+-------+
| id   | name     | value |
+------+----------+-------+
|    1 | modified |    10 |
|    2 | Alice    |    20 |
|    3 | Jack     |    30 |
|    4 | added    |     0 |
+------+----------+-------+
```

#### 예제 2: 자동 증가 열이 키가 아닌 열인 경우 {#example-2-auto-increment-column-as-a-non-key-column}

```sql
CREATE TABLE `demo`.`tbl3` (
    `id` BIGINT NOT NULL,
    `name` varchar(100) NOT NULL,
    `score` BIGINT NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl3(id, name, score) values(1, "Doris", 100), (2, "Nereids", 200), (3, "Bob", 300);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   100 |    0 |
|    2 | Nereids |   200 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl3(id, score) values(1, 999), (2, 888);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 |    0 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

insert into tbl3(id, aid) values(1, 1000), (3, 500);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 | 1000 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |  500 |
+------+---------+-------+------+
```

## 대표적인 사용 사례 {#typical-use-cases}

<!-- Use cases: dictionary encoding / efficient pagination -->

### 사용 사례 1: 사전 인코딩 {#use-case-1-dictionary-encoding}

**적용 업무**: 비트맵으로 코호트 분석을 수행하는 사용자 프로파일링 시나리오에서는 각 사용자를 고유한 정수 사전 값에 매핑하는 사용자 사전이 필요합니다. 사전 값이 조밀할수록 비트맵 성능이 향상됩니다.

다음은 오프라인 UV/PV 분석 시나리오를 통해 절차를 설명합니다.

#### 1단계: 사용자 행동 상세 테이블 생성 {#step-1-create-the-user-behavior-detail-table}

다음 사용자 행동 테이블에 상세 데이터가 저장되어 있다고 가정합니다.

```sql
CREATE TABLE `demo`.`dwd_dup_tbl` (
    `user_id` varchar(50) NOT NULL,
    `dim1` varchar(50) NOT NULL,
    `dim2` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim4` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `visit_time` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 2단계: 자동 증가 열을 사용하여 사전 테이블 생성 {#step-2-create-the-dictionary-table-using-an-auto-increment-column}

```sql
CREATE TABLE `demo`.`dictionary_tbl` (
    `user_id` varchar(50) NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);
```

#### 3단계: 데이터를 적재하여 인코딩 매핑 구성 {#step-3-load-data-to-build-the-encoding-mapping}

기존 데이터의 `user_id` 값을 사전 테이블에 적재하여 `user_id`를 정수 값에 매핑합니다.

```sql
insert into dictionary_tbl(user_id)
select user_id from dwd_dup_tbl group by user_id;
```

또는 다음 방법으로 증분 데이터의 `user_id` 값만 사전 테이블에 적재할 수 있습니다.

```sql
insert into dictionary_tbl(user_id)
select dwd_dup_tbl.user_id from dwd_dup_tbl left join dictionary_tbl
on dwd_dup_tbl.user_id = dictionary_tbl.user_id
where dwd_dup_tbl.visit_time > '2023-12-10' and dictionary_tbl.user_id is NULL;
```

:::tip
실제 환경에서는 Flink Connector를 사용하여 Doris에 데이터를 쓸 수도 있습니다.
:::

#### 4단계: 집계 결과 테이블 생성 {#step-4-create-the-aggregate-result-table}

`dim1`, `dim3`, `dim5`가 분석하려는 통계 차원이라고 가정합니다. 집계 결과를 저장할 다음 집계 테이블을 생성합니다.

```sql
CREATE TABLE `demo`.`dws_agg_tbl` (
    `dim1` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `user_id_bitmap` BITMAP BITMAP_UNION NOT NULL,
    `pv` BIGINT SUM NOT NULL
) ENGINE=OLAP
AGGREGATE KEY(`dim1`,`dim3`,`dim5`)
DISTRIBUTED BY HASH(`dim1`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### 5단계: 데이터 집계 및 쿼리 실행 {#step-5-aggregate-the-data-and-run-queries}

데이터를 집계하고 결과를 집계 결과 테이블에 저장합니다.

```sql
insert into dws_agg_tbl
select dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5, BITMAP_UNION(TO_BITMAP(dictionary_tbl.aid)), COUNT(1)
from dwd_dup_tbl INNER JOIN dictionary_tbl on dwd_dup_tbl.user_id = dictionary_tbl.user_id
group by dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5;
```

UV 및 PV 쿼리를 실행합니다.

```sql
select dim1, dim3, dim5, bitmap_count(user_id_bitmap) as uv, pv from dws_agg_tbl;
```

### 사용 사례 2: 효율적인 페이지네이션 {#use-case-2-efficient-pagination}

**배경**: 페이지에 데이터를 표시할 때는 페이지네이션이 필요한 경우가 많습니다. 기존의 페이지네이션은 일반적으로 SQL의 `limit`, `offset`, `order by`를 사용합니다. 하지만 페이지를 깊이 탐색할 때, 즉 offset이 매우 클 때는 실제로 필요한 행이 적더라도 모든 데이터를 메모리로 읽어 들여 전체 정렬을 수행한 후 처리를 계속하므로 비효율적입니다.

**최적화 방안**: 자동 증가 열을 통해 각 행에 고유한 값을 부여할 수 있습니다. 쿼리할 때 이전 페이지의 최댓값 `max_value`를 기록합니다. 이 값은 `unique_value` 열의 최댓값이며, 이후 `where unique_value > max_value limit rows_per_page`를 사용하면 조건자 푸시다운으로 많은 데이터를 초기에 걸러내어 페이지네이션 효율을 높일 수 있습니다.

#### 기존 페이지네이션 방식(비효율적) {#traditional-pagination-inefficient}

다음 업무 테이블에 페이지네이션을 적용한다고 가정합니다.

```sql
CREATE TABLE `demo`.`records_tbl` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT ""
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

페이지마다 100개의 행을 표시한다고 가정합니다.

- 1페이지 조회:

    ```sql
    select * from records_tbl order by user_id, name limit 100;
    ```

- 2페이지 조회:

    ```sql
    select * from records_tbl order by user_id, name limit 100 offset 100;
    ```

#### 자동 증가 열을 활용한 페이지네이션(효율적) {#auto-increment-column-pagination-efficient}

테이블에 자동 증가 열을 추가하여 각 행에 고유 식별자를 부여합니다.

```sql
CREATE TABLE `demo`.`records_tbl2` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT "",
    `unique_value` BIGINT NOT NULL AUTO_INCREMENT
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

페이지마다 100개의 행을 표시합니다.

- **1페이지 쿼리**:

    ```sql
    select * from records_tbl2 order by unique_value limit 100;
    ```

- **2페이지 쿼리**: 프로그램에서 이전 쿼리가 반환한 `unique_value`의 최댓값을 기록한 다음(99라고 가정), 다음 쿼리를 실행합니다.

    ```sql
    select * from records_tbl2 where unique_value > 99 order by unique_value limit 100;
    ```

- **뒤쪽 페이지로 바로 이동**: 뒤쪽 페이지를 바로 쿼리하려는 경우에는 이전 페이지의 `unique_value` 최댓값을 얻기가 어렵습니다. 예를 들어 101페이지를 바로 조회하려면 다음 쿼리를 실행합니다.

    ```sql
    select user_id, name, address, city, nation, region, phone, mktsegment
    from records_tbl2, (select unique_value as max_value from records_tbl2 order by unique_value limit 1 offset 9999) as previous_data
    where records_tbl2.unique_value > previous_data.max_value
    order by unique_value limit 100;
    ```
