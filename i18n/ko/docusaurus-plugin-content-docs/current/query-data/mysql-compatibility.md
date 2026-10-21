---
{
    "title": "MySQL 호환성 참고 사항",
    "language": "ko",
    "description": "Doris와 MySQL의 호환성 차이를 빠르게 확인할 수 있는 참고 자료로, 데이터 타입, DDL/DML 구문, SQL 함수, SQL Mode를 다룹니다.",
    "keywords": [
        "Doris MySQL 호환성",
        "Doris와 MySQL 비교",
        "Doris 데이터 타입",
        "Doris DDL 구문",
        "Doris DML 구문",
        "Doris SQL Mode",
        "MySQL 프로토콜",
        "표준 SQL"
    ]
}
---

<!-- Knowledge type: Compatibility comparison / Syntax reference -->
<!-- Applicable scenario: Migrating from MySQL to Doris / SQL syntax selection and troubleshooting -->

Doris는 MySQL 프로토콜 및 표준 SQL 구문과 높은 호환성을 제공합니다. 업무 시스템, BI 도구, 운영 스크립트는 대체로 큰 변경 없이 연결할 수 있습니다. 다만 Doris는 분석 지향 MPP 데이터베이스이므로 데이터 타입, 테이블 생성 구문, 데이터 모델, DML 동작 등의 영역에서 MySQL과 차이가 있습니다.

이 문서는 마이그레이션과 일상적인 사용이라는 두 가지 관점에서 Doris와 MySQL의 주요 차이를 정리하여, 구문이나 동작의 비호환성을 빠르게 파악할 수 있도록 돕습니다.

## 대상 독자 및 사용 시나리오 {#intended-readers-and-scenarios}

- MySQL 애플리케이션이나 데이터 웨어하우스를 Doris로 마이그레이션할 계획이며, SQL 호환성을 빠르게 평가해야 하는 경우
- MySQL 사용 습관에 따라 Doris에서 SQL을 작성하다가 구문이나 동작의 차이를 발견한 경우
- 특정 데이터 타입이나 DDL/DML 문을 Doris에서 지원하는지 확인해야 하는 경우

## 데이터 타입 차이 {#data-type-differences}

MySQL과의 차이를 숫자, 날짜, 문자열, JSON, Doris 전용 타입으로 나누어 아래에 정리했습니다.

### 숫자 타입 {#numeric-types}

| 타입 | MySQL | Doris |
| --- | --- | --- |
| Boolean | - 지원<br />- 범위: 0은 false, 1은 true를 나타냄 | - 지원<br />- 키워드: Boolean<br />- 범위: 0은 false, 1은 true를 나타냄 |
| Bit | - 지원<br />- 범위: 1~64 | 지원하지 않음 |
| Tinyint | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원<br />- 범위: 부호 있는 타입은 -128~127, 부호 없는 타입은 0~255 | - 지원<br />- 부호 있는 타입만 지원<br />- 범위: -128~127 |
| Smallint | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원<br />- 범위: 부호 있는 타입은 -2^15~2^15-1, 부호 없는 타입은 0~2^16-1 | - 지원<br />- 부호 있는 타입만 지원<br />- 범위: -32768~32767 |
| Mediumint | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원<br />- 범위: 부호 있는 타입은 -2^23~2^23-1, 부호 없는 타입은 0~2^24-1 | 지원하지 않음 |
| Int | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원<br />- 범위: 부호 있는 타입은 -2^31~2^31-1, 부호 없는 타입은 0~2^32-1 | - 지원<br />- 부호 있는 타입만 지원<br />- 범위: -2147483648~2147483647 |
| Bigint | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원<br />- 범위: 부호 있는 타입은 -2^63~2^63-1, 부호 없는 타입은 0~2^64-1 | - 지원<br />- 부호 있는 타입만 지원<br />- 범위: -2^63~2^63-1 |
| Largeint | 지원하지 않음 | - 지원<br />- 부호 있는 타입만 지원<br />- 범위: -2^127~2^127-1 |
| Decimal | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원(8.0.17 이전 버전에서 지원되며, 이후 버전에서는 사용 중단 예정으로 표시됨)<br />- 기본값: Decimal(10, 0) | - 지원<br />- 부호 있는 타입만 지원<br />- 기본값: Decimal(9, 0) |
| Float/Double | - 지원<br />- 부호 있는 타입과 부호 없는 타입 지원(8.0.17 이전 버전에서 지원되며, 이후 버전에서는 사용 중단 예정으로 표시됨) | - 지원<br />- 부호 있는 타입만 지원 |

### 날짜 타입 {#date-types}

| 타입 | MySQL | Doris |
| --- | --- | --- |
| Date | - 지원<br />- 범위: ['1000-01-01', '9999-12-31']<br />- 형식: YYYY-MM-DD | - 지원<br />- 범위: ['0000-01-01', '9999-12-31']<br />- 형식: YYYY-MM-DD |
| DateTime | - 지원<br />- DATETIME([P]), 선택적 매개변수 P는 정밀도를 나타냄<br />- 범위: '1000-01-01 00:00:00.000000'~'9999-12-31 23:59:59.999999'<br />- 형식: YYYY-MM-DD hh:mm:ss[.fraction] | - 지원<br />- DATETIME([P]), 선택적 매개변수 P는 정밀도를 나타냄<br />- 범위: ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']<br />- 형식: YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | - 지원<br />- Timestamp[(p)], 선택적 매개변수 P는 정밀도를 나타냄<br />- 범위: ['1970-01-01 00:00:01.000000' UTC, '2038-01-19 03:14:07.999999' UTC]<br />- 형식: YYYY-MM-DD hh:mm:ss[.fraction] | - 지원<br />- TIMESTAMPTZ([P]), 선택적 매개변수 P는 정밀도를 나타냄<br />- 범위: ['0000-01-01 00:00:00[.000000]' UTC, '9999-12-31 23:59:59[.999999]' UTC]<br />- 형식: YYYY-MM-DD hh:mm:ss[.fraction]+XX.XX |
| Time | - 지원<br />- Time[(p)]<br />- 범위: ['-838:59:59.000000', '838:59:59.000000']<br />- 형식: hh:mm:ss[.fraction] | - 연산에 사용할 수 있으나 OLAP 테이블의 컬럼으로는 저장할 수 없음<br />- Time[(p)]<br />- 범위: ['-838:59:59.999999', '838:59:59.999999']<br />- 형식: hh:mm:ss[.fraction] |
| Year | - 지원<br />- 범위: 1901~2155 또는 0000<br />- 형식: yyyy | 지원하지 않음 |

`TIMESTAMP_NS`는 MySQL의 `TIMESTAMP`에 대응하는 타입이 아니라 Doris 확장 타입입니다. 시간대 정보를 포함하지 않으며, 나노초 단위의 고정 정밀도를 갖고, `1677-09-21 00:12:43.145224192`부터 `2262-04-11 23:47:16.854775807`까지의 범위를 지원합니다.

### 문자열 타입 {#string-types}

| 타입 | MySQL | Doris |
| --- | --- | --- |
| Char | - 지원<br />- CHAR(M), M은 문자 수이며 기본값은 1<br />- 고정 길이<br />- 범위: [0, 255], 바이트 단위 | - 지원<br />- CHAR(M), M은 바이트 길이<br />- 가변 길이<br />- 범위: [1, 255] |
| Varchar | - 지원<br />- VARCHAR(M), M은 문자 수<br />- 범위: [0, 65535], 바이트 단위 | - 지원<br />- VARCHAR(M), M은 바이트 길이<br />- 범위: [1, 65533] |
| String | 지원하지 않음 | - 지원<br />- 1048576바이트(1 MB), 최대 2147483643바이트(2 GB)까지 늘릴 수 있음 |
| Binary | - 지원<br />- Char와 유사 | 지원하지 않음 |
| Varbinary | - 지원<br />- Varchar와 유사 | 지원하지 않음 |
| Blob | - 지원<br />- TinyBlob, Blob, MediumBlob, LongBlob | 지원하지 않음 |
| Text | - 지원<br />- TinyText, Text, MediumText, LongText | 지원하지 않음 |
| Enum | - 지원<br />- 최대 65535개 요소 | 지원하지 않음 |
| Set | - 지원<br />- 최대 64개 요소 | 지원하지 않음 |

### JSON 데이터 타입 {#json-data-type}

| 타입 | MySQL | Doris |
| --- | --- | --- |
| JSON | 지원 | 지원 |

### Doris 전용 데이터 타입 {#doris-specific-data-types}

다음은 Doris가 MySQL에 없는 기능을 제공하기 위해 확장한 분석 지향 데이터 타입입니다. 주로 고유값 수 계산, 분위수 계산, 반정형 데이터 처리에 사용됩니다.

- **HyperLogLog**

    HLL 타입은 Key 컬럼으로 사용할 수 없습니다. Aggregate 모델 테이블에서 사용할 때는 테이블 생성 시 대응하는 집계 타입으로 HLL_UNION을 지정합니다. 길이나 기본값을 지정할 필요는 없으며, 길이는 데이터의 집계 수준에 따라 시스템 내부에서 제어합니다. HLL 컬럼은 대응하는 HLL_UNION_AGG, HLL_RAW_AGG, HLL_CARDINALITY, HLL_HASH 함수를 통해서만 쿼리하거나 사용할 수 있습니다.

    HLL은 고유값 수를 근사적으로 계산하며, 대용량 데이터에서 Count Distinct보다 성능이 뛰어납니다. HLL의 오차율은 일반적으로 1% 정도이며, 경우에 따라 2%에 이를 수 있습니다.

- **BITMAP**

    BITMAP 타입은 Key 컬럼으로 사용할 수 없습니다. Aggregate 테이블에서 사용할 때는 BITMAP_UNION 집계 정의와 함께 사용해야 합니다. 길이나 기본값을 지정할 필요는 없으며, 길이는 데이터의 집계 수준에 따라 시스템 내부에서 제어합니다. BITMAP 컬럼은 대응하는 BITMAP_UNION_COUNT, BITMAP_UNION, BITMAP_HASH, BITMAP_HASH64 등의 함수를 통해서만 쿼리하거나 사용할 수 있습니다.

    오프라인 환경에서 BITMAP을 사용하면 데이터 적재 속도에 영향을 줄 수 있습니다. 대용량 데이터에서는 쿼리 속도가 HLL보다 느리지만 Count Distinct보다는 빠릅니다. 참고: 실시간 환경에서 전역 사전 없이 BITMAP을 사용하고 대신 BITMAP_HASH()를 사용하면 약 천분의 일의 오차가 발생할 수 있습니다. 이 오차를 허용할 수 없다면 BITMAP_HASH64를 사용할 수 있습니다.

- **QUANTILE_PERCENT (QUANTILE_STATE)**

    QUANTILE_STATE 타입은 Key 컬럼으로 사용할 수 없습니다. Aggregate 모델 테이블에서 사용할 때는 테이블 생성 시 대응하는 집계 타입으로 QUANTILE_UNION을 지정합니다. 길이나 기본값을 지정할 필요는 없으며, 길이는 데이터의 집계 수준에 따라 시스템 내부에서 제어합니다. QUANTILE_STATE 컬럼은 대응하는 QUANTILE_PERCENT, QUANTILE_UNION, TO_QUANTILE_STATE 등의 함수를 통해서만 쿼리하거나 사용할 수 있습니다.

    QUANTILE_STATE는 근사 분위수를 계산하는 타입입니다. 데이터 적재 시 동일한 Key에 속한 서로 다른 Values를 사전 집계합니다. Values의 개수가 2048 이하이면 모든 데이터를 상세히 기록하고, Values의 개수가 2048을 초과하면 [TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) 알고리즘으로 데이터를 집계(클러스터링)하여 각 클러스터의 중심점을 저장합니다.

- **Array\<T\>**

    Array\<T\>는 T 타입 요소로 이루어진 배열이며, Key 컬럼으로 사용할 수 없습니다.

- **MAP\<K, V\>**

    Map은 K 타입과 V 타입 요소 간의 매핑 테이블이며, Key 컬럼으로 사용할 수 없습니다.

- **STRUCT\<field_name:field_type, ...\>**

    Struct는 여러 Field로 구성된 구조체로, 여러 컬럼의 집합으로도 이해할 수 있습니다. Key로 사용할 수 없습니다.

    Struct의 Field 이름과 개수는 고정되어 있으며, 모든 Field는 Nullable입니다. Field는 일반적으로 다음 요소로 구성됩니다.

    - field_name: Field의 식별자로, 고유해야 함
    - field_type: Field의 타입

- **Agg_State**

    AGG_STATE는 Key 컬럼으로 사용할 수 없습니다. 테이블을 생성할 때 집계 함수의 시그니처도 선언해야 합니다.

    길이나 기본값을 지정할 필요는 없으며, 실제 저장 크기는 함수 구현에 따라 달라집니다.

    AGG_STATE는 [STATE](../sql-manual/sql-functions/combinators/state) / [MERGE](../sql-manual/sql-functions/combinators/merge) / [UNION](../sql-manual/sql-functions/combinators/union) 함수 조합자와 함께만 사용할 수 있습니다.

## 구문 차이 {#syntax-differences}

Doris SQL 구문은 전반적으로 MySQL과 유사하지만, 테이블 생성, 인덱스, 뷰 등의 영역에서 고유한 확장 기능이나 제약이 있습니다. 마이그레이션 시 이러한 차이에 특히 주의해야 합니다.

### DDL 차이 {#ddl-differences}

#### CREATE TABLE {#create-table}

Doris의 테이블 생성 구문은 다음과 같습니다.

```sql
CREATE TABLE [IF NOT EXISTS] [database.]table
(
    column_definition_list
    [, index_definition_list]
)
[engine_type]
[keys_type]
[table_comment]
[partition_info]
distribution_desc
[rollup_list]
[properties]
[extra_properties]
```

각 절의 MySQL과의 차이는 다음과 같습니다.

| 매개변수 | MySQL과의 차이 |
| --- | --- |
| column_definition_list | - 컬럼 목록을 정의합니다. 기본 구문은 MySQL과 유사합니다.<br />- Doris는 주로 Aggregate Key 데이터 모델에 사용되는 집계 타입 연산을 추가로 지원합니다.<br />- MySQL은 컬럼 목록 정의 뒤에 Index, Primary Key, Unique Key 등의 제약 조건을 추가할 수 있습니다. Doris는 데이터 모델을 통해 이러한 제약 조건과 연산을 지원합니다. |
| index_definition_list | - 인덱스 목록을 정의합니다. 기본 구문은 MySQL과 유사합니다.<br />- Doris는 비트맵 인덱스, 역색인, N-Gram 인덱스를 지원하며, 속성을 통해 Bloom filter 인덱스도 활성화할 수 있습니다.<br />- MySQL은 B+Tree 인덱스와 Hash 인덱스를 지원합니다. |
| engine_type | - 테이블 엔진 타입을 지정합니다. 선택 사항입니다.<br />- 현재 지원되는 테이블 엔진은 주로 OLAP 네이티브 엔진입니다.<br />- MySQL은 InnoDB, MyISAM 등의 스토리지 엔진을 지원합니다. |
| keys_type | - 데이터 모델을 지정합니다. 선택 사항입니다.<br />- 지원되는 타입은 다음과 같습니다.<br />&nbsp;&nbsp;1) DUPLICATE KEY(기본값): 뒤에 지정하는 컬럼은 정렬 컬럼입니다;<br />&nbsp;&nbsp;2) AGGREGATE KEY: 뒤에 지정하는 컬럼은 차원 컬럼입니다;<br />&nbsp;&nbsp;3) UNIQUE KEY: 뒤에 지정하는 컬럼은 기본 키 컬럼입니다.<br />- MySQL에는 데이터 모델이라는 개념이 없습니다. |
| table_comment | 테이블 주석입니다. |
| partition_info | 파티셔닝 알고리즘입니다. 선택 사항입니다.<br />Doris는 다음 파티셔닝 알고리즘을 지원합니다.<br />- LESS THAN: 파티션의 상한만 정의하며, 하한은 이전 파티션의 상한으로 결정됩니다.<br />- FIXED RANGE: 파티션을 왼쪽 경계는 포함하고 오른쪽 경계는 포함하지 않는 구간으로 정의합니다.<br />- MULTI RANGE: 시간 단위와 간격을 지정하여 왼쪽 경계는 포함하고 오른쪽 경계는 포함하지 않는 RANGE 파티션을 일괄 생성합니다. 지원되는 시간 단위는 연, 월, 일, 주, 시간입니다.<br /><br />MySQL이 지원하는 알고리즘은 Hash, Range, List Key이며, 하위 파티션도 지원합니다. 하위 파티션은 Hash와 Key를 지원합니다. |
| distribution_desc | - 버킷팅 알고리즘입니다. 필수 항목이며, 다음을 포함합니다.<br />&nbsp;&nbsp;1) Hash 버킷팅: `DISTRIBUTED BY HASH (k1[, k2 ...]) [BUCKETS num\|auto]`, 지정된 키 컬럼을 사용하여 Hash 버킷팅을 수행합니다;<br />&nbsp;&nbsp;2) Random 버킷팅: `DISTRIBUTED BY RANDOM [BUCKETS num\|auto]`, 난수를 사용하여 버킷팅을 수행합니다.<br />- MySQL에는 버킷팅 알고리즘이 없습니다. |
| rollup_list | - 테이블 생성과 동시에 여러 동기 구체화된 뷰를 생성할 수 있습니다.<br />- 구문: `rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])][PROPERTIES("key" = "value")]`.<br />- MySQL에서는 지원하지 않습니다. |
| properties | 테이블 속성입니다. 속성 자체와 속성을 정의하는 구문 모두 MySQL과 다릅니다. |

#### CREATE INDEX {#create-index}

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- Doris는 현재 비트맵 인덱스, 역색인, N-Gram 인덱스, Bloom filter 인덱스(별도 구문으로 설정)를 지원합니다.
- MySQL은 B+Tree 및 Hash 인덱스 알고리즘을 지원합니다.

#### CREATE VIEW {#create-view}

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt

CREATE MATERIALIZED VIEW [IF NOT EXISTS] mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        (KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN partitionKey = identifier RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```

- 기본 구문은 MySQL과 같습니다.
- Doris는 논리 뷰 외에도 동기 구체화된 뷰와 비동기 구체화된 뷰라는 두 가지 유형의 구체화된 뷰를 지원합니다.
- MySQL은 구체화된 뷰를 지원하지 않습니다.

#### ALTER TABLE / ALTER INDEX {#alter-table--alter-index}

Doris의 ALTER 구문은 기본적으로 MySQL과 같습니다.

#### DROP TABLE / DROP INDEX {#drop-table--drop-index}

Doris의 DROP 구문은 기본적으로 MySQL과 같습니다.

### DML 차이 {#dml-differences}

#### INSERT {#insert}

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

Doris의 INSERT 구문은 기본적으로 MySQL과 같습니다.

#### UPDATE {#update}

```sql
UPDATE target_table [table_alias]
    SET assignment_list
    WHERE condition

assignment_list:
    assignment [, assignment] ...

assignment:
    col_name = value

value:
    {expr | DEFAULT}
```

Doris의 UPDATE 구문은 기본적으로 MySQL과 같지만, **WHERE 조건이 필수**라는 점에 주의해야 합니다.

#### DELETE {#delete}

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Doris에서 위 구문은 필터 조건자만 지정할 수 있습니다.

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

Doris에서 위 구문은 Unique Key 모델 테이블에서만 사용할 수 있습니다.

Doris의 DELETE 구문은 기본적으로 MySQL과 같습니다. 다만 Doris는 분석 지향 데이터베이스이므로 삭제 작업을 지나치게 자주 수행하지 않는 것이 좋습니다.

#### SELECT {#select}

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT]
    select_expr [, select_expr ...]
    [EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position} [ASC | DESC], ...]
    [LIMIT {[offset_count,] row_count | row_count OFFSET offset_count}]
    [INTO OUTFILE 'file_name']
```

Doris의 SELECT 구문은 기본적으로 MySQL과 같습니다.

## SQL 함수 {#sql-functions}

Doris 함수는 MySQL 함수의 대다수를 지원합니다. 일반적인 문자열, 날짜, 집계, 윈도우 함수를 바로 사용할 수 있습니다.

## SQL Mode {#sql-mode}

Doris는 일부 SQL Mode 설정을 지원하여 SQL 구문 분석과 실행 동작을 제어할 수 있으므로, MySQL의 사용 방식에 쉽게 맞출 수 있습니다.

| 이름 | 설정 시 동작 | 미설정 시 동작 | 참고 |
| :-- | :-- | :-- | :-- |
| PIPES_AS_CONCAT | `\|\|` 기호를 concat 함수로 해석 | `\|\|` 기호를 논리 OR 연산자로 해석 | - |
| NO_BACKSLASH_ESCAPES | 문자열의 백슬래시를 일반 문자로 처리 | 문자열의 백슬래시를 이스케이프 시퀀스의 시작으로 처리 | - |
| ONLY_FULL_GROUP_BY | 표준 집계만 허용 | 집계 결과 출력에 집계 KEY에 포함되지 않은 스칼라 값을 허용 | 3.1.0 버전부터 지원 |
