---
{
    "title": "CREATE TABLE",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "현재 또는 지정된 데이터베이스에 새 테이블을 생성합니다. 테이블에는 여러 컬럼이 있을 수 있으며, 각 컬럼 정의에는 이름과 데이터 타입이 포함됩니다."
}
---

## 설명 {#description}

현재 또는 지정된 데이터베이스에 새 테이블을 생성합니다. 테이블에는 여러 컬럼이 있을 수 있으며, 각 컬럼 정의에는 이름, 데이터 타입과 선택적으로 다음 속성이 포함됩니다.

- 키 여부
- 집계 의미 적용 여부
- 생성 컬럼 여부
- 값이 필수인지 여부(NOT NULL)
- 자동 증가 컬럼 여부
- 삽입 시 기본값 존재 여부
- 업데이트 시 기본값 존재 여부

또한 이 명령은 다음과 같은 변형도 지원합니다.

- CREATE TABLE … AS SELECT(데이터가 채워진 테이블 생성, CTAS라고도 함)
- CREATE TABLE … LIKE(기존 테이블의 빈 복사본 생성)

## 구문 {#syntax}

```sql
CREATE [ TEMPORARY | EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ ORDER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitions_definition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <roll_up_definition> ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
```

> 참고: `ORDER BY`는 4.1.0부터 지원됩니다.

각 정의는 다음과 같습니다.

```sql
columns_definition
  : -- Column definition
    <col_name> <col_type>
      [ KEY ]
      [ <col_aggregate_type> ]
      [ [ GENERATED ALWAYS ] AS (<col_generate_expression>) ]
      [ [NOT] NULL ]
      [ AUTO_INCREMENT(<col_auto_increment_start_value>) ]
      [ DEFAULT <col_default_value> ]
      [ ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>) ]
      [ COMMENT '<col_comment>' ]
    -- Additional column definitions
    [ , <col_name> <col_type> [ ... ] ]
```

```sql
indexes_definition
  : -- Index definition
    INDEX [ IF NOT EXISTS ]
      <index_name> (<index_cols>)
      [ USING <index_type> ]
      [ PROPERTIES (
            -- Table property
            <index_property>
            -- Additional table properties
            [ , ... ]) 
      ]
      [ COMMENT '<index_comment>' ]
    -- Additional index definitions
    [ , <index_name> (<index_cols>) [ ... ] ]
```

```sql
partitions_definition
  : AUTO PARTITION BY RANGE(<auto_partition_function>(<auto_partition_arguments>))
    <origin_partitions_definition>
  | AUTO PARTITION BY LIST(<partition_cols>)
    <origin_partitions_definition>
  | PARTITION BY <partition_type> (<partition_cols>)
    <origin_partitions_definition>
```

- 각 정의는 다음과 같습니다.

    ```sql
    <origin_partitions_definition>
    : (
        -- Partition definition
        <one_partition_definition>
        -- Additional partition definition
        [ , ... ]
      )

    <one_partition_definition>
    : PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES LESS THAN <partition_value_list>
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES [ <partition_lower_bound>, <partition_upper_bound>)
    | FROM <partition_lower_bound> TO <partition_upper_bound>
        INTERVAL <n> [ <datetime_unit> ]
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES IN {
            (<partition_value> [, <partition_value> [ ... ] ])
            | <partition_value>
        }
    ```

```sql
roll_up_definition
  : ROLLUP (
        -- Rollup definition
        <rollup_name> (<rollup_cols>)
        [ DUPLICATE KEY (<duplicate_cols>) ]
        -- Additional rollup definition
        [ , <rollup_name> (<rollup_cols>) [ ... ] ]
    )
```

## 변형 구문 {#varaint-syntax}

### CREATE TABLE ... AS SELECT(CTAS라고도 함) {#create-table--as-select-also-referred-to-as-ctas}

테이블을 생성하고 `query`가 반환한 데이터로 채웁니다.

```sql
CREATE
    [ EXTERNAL ]
    TABLE [ IF NOT EXISTS ] <table_name>
    [ ( <column_definitions> ) ]
    [ <index_definitions> ]
    [ ENGINE = <storage_engine_type> ]
    [ <partitioning_key_type> KEY ( <key_columns> )
        [ ORDER BY ( <clustering_columns> ) ]
    ]
    [ COMMENT '<table_description>' ]
    [ <partition_definitions> ]
    [ DISTRIBUTED BY { HASH ( <distribution_columns> ) | RANDOM }
        [ BUCKETS { <number_of_buckets> | AUTO } ]
    ]
    [ <rollup_definitions> ]
    [ PROPERTIES (
          "<table_properties>"
          [ , ... ] 
    ) ]
[ AS ] <query>;
```

> 참고: `ORDER BY`는 4.1.0부터 지원됩니다.

### CREATE TABLE ... LIKE {#create-table--like}

기존 테이블과 동일한 컬럼 정의를 가진 새 테이블을 생성하며, 기존 테이블의 데이터는 복사하지 않습니다. 컬럼의 모든 속성이 새 테이블에 복제됩니다. `rollup` 이름 목록을 지정하면 원본 테이블의 해당 `rollup`도 복제됩니다.

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## 필수 매개변수 {#required-parameters}

**<name>**

> 테이블의 식별자(즉, 이름)를 지정합니다. 테이블을 생성하는 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 문자(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자)로 시작해야 하며, 전체 식별자 문자열을 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: ``My Object``).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 [식별자 요구 사항](../../../basic-element/object-identifiers.md)과 [예약 키워드](../../../basic-element/reserved-keywords.md)를 참조하세요.

**<col_name>**

> 컬럼의 식별자(즉, 이름)를 지정합니다. 생성되는 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자), 숫자 또는 기호 `@`로 시작해야 하며, 전체 식별자 문자열을 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: ``My Object``).
>
> 자세한 내용은 [식별자 요구 사항](../../../basic-element/object-identifiers.md)과 [예약 키워드](../../../basic-element/reserved-keywords.md)를 참조하세요.

**<col_type>**

> 컬럼의 데이터 타입을 지정합니다.
>
> 테이블 컬럼에 지정할 수 있는 데이터 타입에 대한 자세한 내용은 [데이터 타입](../../../basic-element/sql-data-types/data-type-overview.md) 섹션을 참조하세요.

**<query>**

> CTAS의 필수 매개변수입니다. 데이터를 채우는 SELECT 문을 지정합니다.

**<source_table>**

> CREATE TABLE ... LIKE의 필수 매개변수입니다. 복사할 원본 테이블을 지정합니다.

## 선택적 매개변수 {#optional-parameters}

### 데이터 모델 관련 매개변수 {#data-model-related-parameters}

**<key_type>**

> 테이블의 데이터 모델입니다. 사용 가능한 값은 DUPLICATE(상세 모델), UNIQUE(기본 키 모델), AGGREGATE(집계 모델)입니다. 데이터 모델에 대한 자세한 내용은 [데이터 모델](../../../../table-design/data-model/intro.mdx) 섹션을 참조하세요.

**<key_cols>**

> 테이블의 Key 컬럼입니다. Doris에서 Key 컬럼은 테이블의 처음 K개 컬럼이어야 합니다. 단일 tablet 내의 데이터는 이 컬럼을 기준으로 정렬된 상태로 유지됩니다. Key의 제약 사항과 Key 컬럼 선택 방법은 [데이터 모델](../../../../table-design/data-model/intro.mdx) 섹션의 각 하위 섹션을 참조하세요.

**<cluster_cols>**

> 데이터의 로컬 정렬 컬럼으로, 데이터 모델이 UNIQUE(기본 키 모델)일 때만 사용할 수 있습니다. `<cluster_cols>`를 지정하면 데이터는 `<cluster_cols>`를 기준으로 정렬되며, `<key_cols>`는 정렬에 사용되지 않습니다.

**<col_aggregate_type>**

> 컬럼의 집계 방식입니다. 테이블이 집계 모델일 때만 사용할 수 있습니다. 집계 방식에 대한 자세한 내용은 [집계 모델](../../../../table-design/data-model/aggregate.md) 섹션을 참조하세요.

### 버킷팅 관련 매개변수 {#bucketing-related-parameters}

**<distribute_cols> 및 <bucket_count>**

> 버킷팅 컬럼과 버킷 수입니다. 상세 모델에서는 어떤 컬럼이든 버킷 컬럼으로 사용할 수 있지만, 집계 모델과 기본 키 모델의 버킷 컬럼은 키 컬럼과 일치해야 합니다. 버킷 수는 임의의 양의 정수입니다. 버킷팅에 대한 자세한 내용은 [수동 버킷팅](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets)과 [자동 버킷팅](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets) 섹션을 참조하세요.

### 컬럼 기본값 관련 매개변수 {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 생성 컬럼입니다. 현재 컬럼보다 앞에 있는 컬럼을 사용하여 표현식 `<col_generate_expression>`을 통해 현재 컬럼의 데이터를 생성합니다. 생성 컬럼은 사용자가 직접 값을 삽입하거나 업데이트하는 대신 다른 컬럼의 값으로부터 값을 계산하는 특수한 데이터베이스 테이블 컬럼입니다. 이 기능은 표현식의 결과를 미리 계산하여 데이터베이스에 저장할 수 있으므로, 빈번한 쿼리나 복잡한 계산이 필요한 시나리오에 적합합니다.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> 데이터를 적재할 때 자동 증가 컬럼의 값이 지정되지 않은 데이터 행에는 Doris가 테이블 내에서 고유한 값을 할당합니다. `<col_auto_increment_start_value>`는 자동 증가 컬럼의 시작 값을 지정합니다. 자동 증가 컬럼에 대한 자세한 내용은 [자동 증가 컬럼](../../../../table-design/auto-increment.md) 섹션을 참조하세요.

**DEFAULT <col_default_value>**

> 컬럼의 기본값입니다. 이 컬럼을 포함하지 않고 데이터를 쓰면 이 기본값이 사용됩니다. 기본값을 명시적으로 설정하지 않으면 NULL이 사용됩니다. 사용 가능한 기본값은 다음과 같습니다.
>
> - NULL: 모든 타입에서 사용할 수 있으며, NULL을 기본값으로 사용합니다.
> - 숫자 리터럴: 숫자 타입에서만 사용할 수 있습니다.
> - 문자열 리터럴: 문자열 타입에서만 사용할 수 있습니다.
> - CURRENT_DATE: 날짜 타입에서만 사용할 수 있습니다. 현재 날짜를 기본값으로 사용합니다.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: 날짜 및 시간 타입에서만 사용할 수 있습니다. 현재 타임스탬프를 기본값으로 사용합니다. `<defaultValuePrecision>`으로 시간 정밀도를 지정할 수 있습니다.
> - PI: double 타입에서만 사용할 수 있습니다. 원주율을 기본값으로 사용합니다.
> - E: double 타입에서만 사용할 수 있습니다. 수학 상수 e를 기본값으로 사용합니다.
> - BITMAP_EMPTY: 컬럼이 bitmap 타입일 때만 사용할 수 있습니다. 빈 bitmap을 채웁니다.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> 데이터를 업데이트할 때 이 컬럼의 값을 지정하지 않으면 현재 타임스탬프로 이 컬럼의 데이터를 업데이트합니다. UNIQUE(기본 키 모델) 테이블에서만 사용할 수 있습니다.

### 인덱스 관련 매개변수 {#index-related-parameters}

**<index_name>**

> 인덱스의 식별자(즉, 이름)를 지정합니다. 생성되는 테이블 내에서 고유해야 합니다. 식별자에 대한 자세한 내용은 [식별자 요구 사항](../../../basic-element/object-identifiers.md)과 [예약 키워드](../../../basic-element/reserved-keywords.md)를 참조하세요.

**<index_cols>**

> 인덱스를 추가할 컬럼 목록입니다. 테이블에 이미 존재하는 컬럼이어야 합니다.

**<index_type>**

> 인덱스의 타입입니다. 현재는 INVERTED만 지원합니다.

**<index_property>**

> 인덱스의 속성입니다. 자세한 설명은 [역색인](../../../../table-design/index/inverted-index/overview.md) 섹션을 참조하세요.

### 자동 파티셔닝 관련 매개변수 {#auto-partition-related-parameters}

파티셔닝에 대한 자세한 소개는 [자동 파티셔닝](../../../../table-design/data-partitioning/auto-partitioning.md) 섹션을 참조하세요.

### 수동 파티셔닝 관련 매개변수 {#manual-partitioning-related-parameters}

파티셔닝에 대한 자세한 소개는 "수동 파티셔닝" 섹션을 참조하세요.

**<partition_type>**

> Doris는 RANGE 파티셔닝과 LIST 파티셔닝을 지원합니다. 자세한 내용은 [수동 파티셔닝](../../../../table-design/data-partitioning/manual-partitioning.md) 섹션을 참조하세요.

**<partition_name>**

> 파티션의 식별자(즉, 이름)입니다. 생성되는 테이블 내에서 고유해야 합니다. 식별자에 대한 자세한 내용은 [식별자 요구 사항](../../../basic-element/object-identifiers.md)과 [예약 키워드](../../../basic-element/reserved-keywords.md)를 참조하세요.

**VALUES LESS THAN <partition_value_list>**

> RANGE 파티셔닝입니다. 파티션의 데이터 범위는 하한부터 `<partition_value_list>`까지입니다.
>
> 상한을 나타내는 경우 `<partition_value_list>`를 `MAX_VALUE`로 간소화할 수 있습니다.
>
> `<partition_value_list>`의 형식은 다음과 같습니다. `((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE 파티셔닝입니다. 파티션의 데이터 범위는 `<partition_lower_bound>`부터 `<partition_upper_bound>`까지입니다. 파티션은 하나만 생성됩니다.
>
> `<partition_lower_bound>`와 `<partition_upper_bound>`의 형식은 다음과 같습니다. `(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGE 파티셔닝입니다. 파티션의 데이터 범위는 `<partition_lower_bound>`부터 `<partition_value_list>`까지입니다. `<n>`마다 파티션이 생성됩니다.
>
> `<partition_lower_bound>`와 `<partition_upper_bound>`의 형식은 다음과 같습니다. `(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LIST 파티셔닝입니다. 파티션 컬럼의 값이 `<partition_value>`와 같은 행은 이 파티션에 속합니다.
>
> `<partition_value>`의 형식은 다음과 같습니다. `(col_1_value, ...)`


### 동기식 구체화된 뷰 관련 사항 {#synchronized-materialized-view-related}

:::caution 참고
rollup으로 동기식 구체화된 뷰를 생성하는 기능은 제한적이며 더 이상 권장되지 않습니다. 별도의 문을 사용하여 동기식 구체화된 뷰를 생성하는 것이 좋습니다. 자세한 내용은 [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 문과 [동기식 구체화된 뷰](../../../../query-acceleration/materialized-view/sync-materialized-view.md) 섹션을 참조하세요.
:::

**<rollup_name>**

> 동기식 구체화된 뷰의 식별자(즉, 이름)입니다. 생성되는 테이블 내에서 고유해야 합니다. 식별자에 대한 자세한 내용은 [식별자 요구 사항](../../../basic-element/object-identifiers.md)과 [예약 키워드](../../../basic-element/reserved-keywords.md)를 참조하세요.

**<rollup_cols>**

> 동기식 구체화된 뷰에 포함되는 컬럼입니다.

### 테이블 속성 관련 매개변수 {#table-property-related-parameters}

**<table_property>**

| 속성 이름 | 기능 |
| :------------ | :-------- |
| replication_num | 복제본 수입니다. 기본 복제본 수는 3입니다. BE 노드 수가 3보다 적으면 BE 노드 수 이하의 복제본 수를 지정해야 합니다. 버전 0.15 이후에는 이 속성이 자동으로 `replication_allocation` 속성으로 변환됩니다. 예를 들어 `"replication_num" = "3"`은 자동으로 `"replication_allocation" = "tag.location.default:3"`으로 변환됩니다. |
| replication_allocation | Tag를 기준으로 복제본 분포를 설정합니다. 이 속성은 `replication_num` 속성의 기능을 완전히 대체할 수 있습니다. |
| min_load_replica_num | 데이터 적재가 성공하는 데 필요한 최소 복제본 수를 설정하며, 기본값은 -1입니다. 이 속성이 0 이하이면 데이터 적재 시 여전히 과반수의 복제본에서 성공해야 함을 의미합니다. |
| storage_medium | 테이블 데이터의 초기 스토리지 매체를 선언합니다. |
| storage_cooldown_time | 테이블 데이터의 초기 스토리지 매체에 대한 만료 시간을 설정합니다. 이 시간이 지나면 첫 번째 계층의 스토리지 매체로 자동 강등됩니다. |
| colocate_with | Colocation Join 기능이 필요할 때 이 매개변수로 Colocation Group을 설정합니다. |
| bloom_filter_columns | 사용자가 지정한, Bloom Filter 인덱스를 추가해야 하는 컬럼 이름 목록입니다. 각 컬럼의 Bloom Filter 인덱스는 독립적이며 복합 인덱스가 아닙니다. 예: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | 버전 4.0.3부터 Doris 테이블의 기본 압축 방식은 ZSTD입니다. 버전 4.0.3 이전의 기본 압축 방식은 LZ4F였습니다. |
| function_column.sequence_col | Unique Key 모델을 사용할 때 Sequence 컬럼을 지정할 수 있습니다. Key 컬럼이 같으면 Sequence 컬럼에 따라 REPLACE가 수행됩니다(큰 값이 작은 값을 대체하며, 그렇지 않으면 대체할 수 없습니다). `function_column.sequence_col`은 sequence 컬럼을 테이블의 특정 컬럼에 매핑하는 데 사용되며, 해당 컬럼은 정수 또는 날짜/시간 타입(DATE, DATETIME)일 수 있습니다. 이 컬럼의 타입은 생성 후 변경할 수 없습니다. `function_column.sequence_col`이 설정되면 `function_column.sequence_type`은 무시됩니다. |
| function_column.sequence_type | Unique Key 모델을 사용할 때 Sequence 컬럼을 지정할 수 있습니다. Key 컬럼이 같으면 Sequence 컬럼에 따라 REPLACE가 수행됩니다(큰 값이 작은 값을 대체하며, 그렇지 않으면 대체할 수 없습니다). 여기서는 sequence 컬럼의 타입만 지정하면 되며, 날짜/시간 타입 또는 정수를 지원합니다. Doris는 숨겨진 sequence 컬럼을 생성합니다. |
| enable_unique_key_merge_on_write | Unique 테이블이 Merge-on-Write 구현을 사용할지 여부입니다. 이 속성은 버전 2.1 이전에는 기본적으로 비활성화되어 있었으며, 버전 2.1부터 기본적으로 활성화됩니다. |
| light_schema_change | Light Schema Change 최적화를 사용할지 여부입니다. `true`로 설정하면 value 컬럼의 추가 및 삭제 작업을 더 빠르게 동기적으로 완료할 수 있습니다. 이 기능은 버전 2.0.0 이상에서 기본적으로 활성화됩니다. |
| disable_auto_compaction | 이 테이블의 자동 compaction을 비활성화할지 여부입니다. 이 속성을 `true`로 설정하면 백그라운드 자동 compaction 프로세스가 이 테이블의 모든 tablet을 건너뜁니다. |
| enable_duplicate_without_keys_by_default | `true`로 설정하면 테이블 생성 시 Unique, Aggregate 또는 Duplicate를 지정하지 않은 경우 정렬 컬럼과 접두사 인덱스가 없는 Duplicate 모델 테이블이 기본적으로 생성됩니다. |
| skip_write_index_on_load | 이 테이블의 데이터 적재 중 인덱스를 쓰지 않는 기능을 활성화할지 여부입니다. 이 속성을 `true`로 설정하면 데이터 적재 중 인덱스를 쓰지 않고(현재는 역색인에만 적용됨) compaction 시점까지 지연합니다. 이를 통해 최초 쓰기와 compaction 중 인덱스를 반복해서 쓰는 데 드는 CPU 및 IO 리소스 소모를 방지하여 처리량이 높은 데이터 적재의 성능을 향상할 수 있습니다. |
| compaction_policy | 이 테이블의 compaction 병합 정책을 설정하며, time_series 또는 size_basedtime_series만 지원합니다. rowset의 디스크 사용량이 일정 크기에 도달하면 버전 병합을 수행합니다. 병합된 rowset은 바로 base compaction 단계로 승격됩니다. 이를 통해 지속적인 데이터 적재가 이루어지는 시나리오에서 compaction의 쓰기 증폭을 효과적으로 줄일 수 있습니다. 이 정책은 time_series_compaction 접두사가 붙은 매개변수를 사용하여 compaction 실행을 조정합니다. |
| time_series_compaction_goal_size_mbytes | compaction 병합 정책이 time_series일 때 이 매개변수로 각 compaction의 입력 파일 크기를 조정하며, 출력 파일 크기는 입력 파일 크기와 비슷합니다. |
| time_series_compaction_file_count_threshold | compaction 병합 정책이 time_series일 때 이 매개변수로 각 compaction의 최소 입력 파일 수를 조정합니다. tablet의 파일 수가 이 설정을 초과하면 compaction이 트리거됩니다. |
| time_series_compaction_time_threshold_seconds | compaction 병합 정책이 time_series일 때 이 매개변수로 compaction 사이의 최대 간격을 초 단위로 조정합니다. 즉, 오랫동안 compaction이 실행되지 않으면 compaction이 트리거됩니다. |
| time_series_compaction_level_threshold | compaction 병합 정책이 time_series일 때 이 매개변수의 기본값은 1입니다. 2로 설정하면 한 번 병합된 segment를 다시 병합하여 segment 크기가 time_series_compaction_goal_size_mbytes에 도달하도록 제어하므로 segment 수를 줄이는 효과를 얻을 수 있습니다. |
| group_commit_interval_ms | 이 테이블의 Group Commit 배치 간격을 설정합니다. 단위는 ms이며 기본값은 10000ms, 즉 10s입니다. Group Commit 시점은 `group_commit_interval_ms`와 `group_commit_data_bytes` 중 어느 것이 설정값에 먼저 도달하는지에 따라 결정됩니다. |
| group_commit_data_bytes | 이 테이블의 Group Commit 배치 데이터 크기를 설정합니다. 단위는 바이트이며 기본값은 134217728, 즉 128MB입니다. Group Commit 시점은 `group_commit_interval_ms`와 `group_commit_data_bytes` 중 어느 것이 설정값에 먼저 도달하는지에 따라 결정됩니다. |
| enable_mow_light_delete | Mow를 사용하는 Unique 테이블에서 Delete 문으로 Delete predicate를 쓰는 기능을 활성화할지 여부입니다. 활성화하면 Delete 문의 성능이 향상되지만, Delete 이후 부분 컬럼 업데이트를 수행하면 일부 데이터 오류가 발생할 수 있습니다. 비활성화하면 정확성을 보장하기 위해 Delete 문의 성능이 저하됩니다. 이 속성의 기본값은 `false`입니다. 이 속성은 Unique Merge-on-Write 테이블에서만 활성화할 수 있습니다. |
| 동적 파티셔닝 관련 속성 | 동적 파티셔닝에 대해서는 [데이터 파티셔닝 - 동적 파티셔닝](../../../../table-design/data-partitioning/dynamic-partitioning)을 참조하세요. |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Write 테이블에서 [유연한 컬럼 업데이트 기능](../../../../data-operate/update/partial-column-update.md#flexible-column-update)을 활성화할지 여부입니다. 이 속성은 Unique Merge-on-Write 테이블에서만 활성화할 수 있습니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 [사용자](../../../../admin-manual/auth/authentication-and-authorization.md)는 최소한 다음 [권한](../../../../admin-manual/auth/authentication-and-authorization.md)이 있어야 합니다.

| 권한 | 객체 | 설명 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | 데이터베이스 | |
| SELECT_PRIV | 테이블, 뷰 | CTAS를 실행할 때 쿼리 대상 테이블, 뷰 또는 구체화된 뷰에 대한 SELECT_PRIV가 필요합니다. |

## 사용 시 참고 사항 {#usage-notes}

- 데이터베이스(Database)에는 같은 이름의 테이블(Table)이나 뷰(View)가 없어야 합니다.
- 테이블 이름, 컬럼 이름, rollup 이름에는 [예약 키워드](../../../basic-element/reserved-keywords.md)를 사용할 수 없습니다.
- CREATE TABLE ... LIKE:
  - 이 명령은 Doris 내부 테이블에만 사용할 수 있습니다.
  - 명시적으로 지정한 rollup만 복사됩니다.
  - 모든 동기식 구체화된 뷰를 복제하지는 않습니다.
- CREATE TABLE ... AS SELECT(CTAS):
  - SELECT 목록에 있는 컬럼 이름의 별칭이 유효한 컬럼이면 CTAS 문에 컬럼 정의가 필요하지 않습니다. 생략하면 기본 쿼리에서 컬럼 이름과 데이터 타입을 추론합니다.
      
    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - 또는 다음 구문을 사용하여 이름을 명시적으로 지정할 수 있습니다.
    
    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- 파티셔닝과 버킷팅
  - 테이블에는 버킷팅 컬럼을 지정해야 하지만 파티션은 지정하지 않아도 됩니다. 파티셔닝과 버킷팅에 대한 자세한 내용은 [데이터 파티셔닝](../../../../table-design/data-partitioning/data-bucketing.md) 문서를 참조하세요.
  - Doris의 테이블은 파티션 테이블이거나 비파티션 테이블일 수 있습니다. 이 속성은 테이블 생성 시 결정되며 이후에는 변경할 수 없습니다. 즉, 파티션 테이블은 이후 사용 중에 파티션을 추가하거나 제거할 수 있지만, 비파티션 테이블에는 나중에 파티션을 추가할 수 없습니다.
  - 테이블 생성 후에는 파티션 컬럼과 버킷 컬럼을 변경할 수 없습니다. 파티션 컬럼과 버킷 컬럼의 타입을 변경할 수 없으며, 이 컬럼을 추가하거나 제거할 수도 없습니다.
- 동적 파티셔닝
  - 동적 파티셔닝 기능은 주로 사용자가 파티션을 자동으로 관리할 수 있도록 돕는 데 사용됩니다. 특정 규칙을 설정하면 Doris 시스템이 주기적으로 새 파티션을 추가하거나 오래된 파티션을 제거합니다. 자세한 내용은 [동적 파티셔닝](../../../../table-design/data-partitioning/dynamic-partitioning.md) 문서를 참조하세요.
- 자동 파티셔닝
  - 자동 파티셔닝에 대한 문서는 [자동 파티셔닝](../../../../table-design/data-partitioning/auto-partitioning.md)에서 확인할 수 있습니다.
- 동기식 구체화된 뷰
  - 테이블을 생성할 때 여러 동기식 구체화된 뷰(ROLLUP)를 생성할 수 있습니다. 테이블을 생성한 후에도 동기식 구체화된 뷰를 추가할 수 있습니다. 테이블 생성 문에 포함하면 모든 동기식 구체화된 뷰를 한 번에 생성할 수 있습니다.
  - 테이블 생성 시 동기식 구체화된 뷰를 생성하면 이후의 모든 데이터 적재 작업에서 구체화된 뷰의 데이터를 동기적으로 생성합니다. 구체화된 뷰의 수는 데이터 적재 효율에 영향을 줄 수 있습니다.
  - 구체화된 뷰에 대한 소개는 [동기식 구체화된 뷰](../../../../query-acceleration/materialized-view/sync-materialized-view.md) 문서를 참조하세요.
- 인덱스
  - 테이블을 생성할 때 여러 컬럼 인덱스를 생성할 수 있습니다. 테이블을 생성한 후에도 인덱스를 추가할 수 있습니다.
  - 이후 사용 중에 인덱스를 추가하고 테이블에 기존 데이터가 있으면 모든 데이터를 다시 써야 합니다. 따라서 인덱스 생성에 걸리는 시간은 현재 데이터 양에 따라 달라집니다.


## 예제 {#examples}

### 기본 예제 {#basic-examples}

**상세 모델**

```sql
CREATE TABLE t1
(
  c1 INT,
  c2 STRING
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**집계 모델**

```sql
CREATE TABLE t2
(
  c1 INT,
  c2 INT MAX
)
AGGREGATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**기본 키 모델**

```sql
CREATE TABLE t3
(
  c1 INT,
  c2 INT
)
UNIQUE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**생성 컬럼 사용**

```sql
CREATE TABLE t4
(
  c1 INT,
  c2 INT GENERATED ALWAYS AS (c1 + 1)
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**컬럼 기본값 지정**

```sql
CREATE TABLE t5
(
  c1 INT,
  c2 INT DEFAULT 10
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**버킷팅 방식**

```sql
CREATE TABLE t6
(
  c1 INT,
  c2 INT
)
DUPLICATE KEY(c1)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**자동 파티셔닝**

```sql
CREATE TABLE t7
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
AUTO PARTITION BY RANGE(date_trunc(c2, 'day')) ()
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**범위 파티셔닝**

```sql
CREATE TABLE t8
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY RANGE(c2) (
  FROM ('2020-01-01') TO ('2020-01-10') INTERVAL 1 DAY
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**목록 파티셔닝**

```sql
CREATE TABLE t9
(
  c1 INT,
  c2 DATE NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY LIST(c2) (
  PARTITION p1 VALUES IN (('2020-01-01'),('2020-01-02'))
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**스토리지 매체와 냉각 시간**

```sql
CREATE TABLE example_db.table_hash
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048),
    v2 SMALLINT DEFAULT "10"
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH (k1, k2) BUCKETS 32
PROPERTIES(
    "storage_medium" = "SSD",
    "storage_cooldown_time" = "2015-06-04 00:00:00"
);
```

**`storage_policy` 속성으로 테이블의 콜드/핫 계층 간 데이터 마이그레이션 전략 설정**

1. 테이블에 마이그레이션 전략을 연결하려면 먼저 s3 리소스와 스토리지 정책을 생성해야 합니다.

    ```sql
    -- Non-partitioned table
    CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
    (
        k1 BIGINT,
        k2 LARGEINT,
        v1 VARCHAR(2048)
    )
    UNIQUE KEY(k1)
    DISTRIBUTED BY HASH (k1) BUCKETS 3
    PROPERTIES(
        "storage_policy" = "test_create_table_use_policy",
        "replication_num" = "1"
    );

    -- Partitioned table
    CREATE TABLE create_table_partion_use_created_policy
    (
        k1 DATE,
        k2 INT,
        V1 VARCHAR(2048) REPLACE
    ) PARTITION BY RANGE (k1) (
        PARTITION p1 VALUES LESS THAN ("2022-01-01") ("storage_policy" = "test_create_table_partition_use_policy_1" ,"replication_num"="1"),
        PARTITION p2 VALUES LESS THAN ("2022-02-01") ("storage_policy" = "test_create_table_partition_use_policy_2" ,"replication_num"="1")
    ) DISTRIBUTED BY HASH(k2) BUCKETS 1;
    ```

**Colocation Group**

```sql
CREATE TABLE t1 (
    id int(11) COMMENT "",
    value varchar(8) COMMENT ""
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);

CREATE TABLE t2 (
    id int(11) COMMENT "",
    value1 varchar(8) COMMENT "",
    value2 varchar(8) COMMENT ""
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);
```

**인덱스**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5",
    v1 CHAR(10) REPLACE,
    v2 INT SUM,
    INDEX k1_idx (k1) USING INVERTED COMMENT 'my first index'
)
AGGREGATE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "bloom_filter_columns" = "k2"
);
```

**테이블의 복제 속성 설정**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5"
)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
);
```

**동적 파티셔닝**

이 테이블은 3일 후까지의 파티션을 미리 생성하고 3일 전의 파티션을 삭제합니다. 예를 들어 오늘이 `2020-01-08`이면 이름이 `p20200108`, `p20200109`, `p20200110`, `p20200111`인 파티션을 생성합니다. 파티션 범위는 다음과 같습니다.

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
```

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
DUPLICATE KEY(k1, k2, k3)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32" 
);
```

**동적 파티션의 복제 속성 설정**

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_allocation" = "tag.location.group_a:3"
 );
```

### CTAS 예제 {#ctas-example}

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1;
```

### CREATE TABLE ... LIKE 예제 {#create-table--like-example}

```sql
CREATE TABLE t11 LIKE t10;
```
