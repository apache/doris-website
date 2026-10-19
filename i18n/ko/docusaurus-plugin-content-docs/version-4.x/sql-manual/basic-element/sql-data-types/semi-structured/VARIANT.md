---
{
    "title": "VARIANT",
    "language": "ko",
    "description": "VARIANT 타입은 반정형 JSON 데이터를 저장합니다. 다양한 기본 타입(정수, 문자열, 불리언 등), 일차원 배열, 중첩 객체를 포함할 수 있습니다. 데이터를 쓸 때 Doris는 JSON 경로를 기반으로 하위 경로의 구조와 타입을 추론하고, 자주 사용되는 경로에 Subcolumnization을 수행하여 독립적인 컬럼형 하위 컬럼으로 노출합니다. 이를 통해 유연성과 성능을 모두 확보합니다."
}
---

## VARIANT {#variant}

## 개요 {#overview}

VARIANT 타입은 반정형 JSON 데이터를 저장합니다. 다양한 기본 타입(정수, 문자열, 불리언 등), 일차원 배열, 중첩 객체를 포함할 수 있습니다. 데이터를 쓸 때 Doris는 JSON 경로를 기반으로 하위 경로의 구조와 타입을 추론하고, 자주 사용되는 경로에 Subcolumnization을 수행하여 독립적인 컬럼형 하위 컬럼으로 노출합니다. 이를 통해 유연성과 성능을 모두 확보합니다.

:::tip VARIANT를 사용하는 이유
`VARIANT`는 시간이 지남에 따라 문서 구조가 바뀌지만 쿼리는 소수의 자주 사용되는 경로에 집중되는 경우에 적합합니다.

- 자주 사용되는 경로는 Subcolumnization 대상이 되므로 컬럼형 처리 성능, 파일 프루닝, 벡터화 실행의 이점을 얻습니다.
- 주요 경로에는 경로 수준 인덱스와 전문 검색을 사용할 수 있으며, Doris 희소 인덱스 프루닝의 이점도 얻을 수 있습니다.
- 와이드 컬럼 최적화를 통해 10k 규모의 하위 컬럼에서도 자동 Subcolumnization을 실용적으로 사용할 수 있습니다. Subcolumnization 대상 경로가 10,000개에 가까워지면 하드웨어 요구 사항이 빠르게 증가하므로, 일반적으로 DOC 모드로 시작하는 편이 더 안전합니다.

기본 동작, 희소 컬럼, DOC 모드, Schema Template 중 무엇을 선택할지 결정해야 한다면 [Variant 워크로드 가이드](./variant-workload-guide)부터 확인하세요. 이 페이지는 구문, 타입 규칙, 인덱스, 제한 사항, 설정에 대한 참조 문서입니다.
:::

## VARIANT 사용 {#using-variant}

### 테이블 생성 구문 {#create-table-syntax}

테이블을 생성할 때 VARIANT 컬럼을 선언합니다.

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

최상위 VARIANT 컬럼 이름에는 백틱으로 감싸더라도 점(`.`)을 포함할 수 없습니다. 예를 들어 `` `v.x` VARIANT ``는 유효하지 않습니다. 이 제한은 `CREATE TABLE`과 `ALTER TABLE`에 적용되며, VARIANT 값 내부의 JSON 필드 이름은 제한하지 않습니다.

`ADD COLUMN`(일괄 추가 포함), `MODIFY COLUMN`, `RENAME COLUMN`에서도 점이 없는 최상위 VARIANT 컬럼 이름을 사용해야 합니다. 예를 들어 다음 구문은 거부됩니다.

```sql
ALTER TABLE ${table_name} ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

Schema Template으로 특정 경로에 제약을 지정합니다(“확장 타입” 참조).

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT <
        'id' : INT,            -- restrict path id to INT
        'message*' : STRING,   -- restrict message* prefix to STRING
        'tags*' : ARRAY<TEXT>  -- restrict tags* prefix to ARRAY<TEXT>
    >
)
PROPERTIES("replication_num" = "1");
```

### 쿼리 구문 {#query-syntax}

```sql
-- Access nested fields (returns VARIANT; explicit or implicit CAST is required for aggregation/comparison)
SELECT v['properties']['title'] FROM ${table_name};

-- CAST to a concrete type before aggregation
SELECT CAST(v['properties']['title'] AS STRING) AS title
FROM ${table_name}
GROUP BY title;

-- Query arrays
SELECT *
FROM ${table_name}
WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
```

## 기본 타입 {#primitive-types}

VARIANT는 하위 컬럼의 타입을 자동으로 추론합니다. 지원되는 타입은 다음과 같습니다.

<table>
<tr><td>지원되는 타입<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL (JSON null과 동일)<br/></td></tr>
<tr><td>BigInt (64비트)<br/>Double<br/></td></tr>
<tr><td>String (Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant (중첩 객체)<br/></td></tr>
<tr><td>Array&lt;T&gt; (일차원만 지원)<br/></td></tr>
</table>

간단한 INSERT 예제:

```sql
INSERT INTO vartab VALUES
  (1, 'null'),
  (2, NULL),
  (3, 'true'),
  (4, '-17'),
  (5, '123.12'),
  (6, '1.912'),
  (7, '"A quote"'),
  (8, '[-1, 12, false]'),
  (9, '{ "x": "abc", "y": false, "z": 10 }'),
  (10, '"2021-01-01"');
```

팁: 날짜/시간처럼 JSON 표준에 없는 타입은 Schema Template을 지정하지 않으면 문자열로 저장됩니다. 연산 효율을 높이려면 정적 컬럼으로 추출하거나 Schema Template으로 타입을 선언하는 방법을 고려하세요.

## 확장 타입 (Schema Template) {#extended-types-schema-template}

VARIANT는 기본 타입 외에도 Schema Template을 통해 다음 확장 타입을 지원합니다.

- 숫자 (확장)
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt; (T는 위 타입 중 하나이며, 일차원만 지원)

참고: 사전 정의 스키마는 테이블 생성 시에만 지정할 수 있습니다. 현재 ALTER는 지원되지 않습니다(향후 버전에서 새로운 하위 컬럼 정의 추가를 지원할 수 있지만, 기존 하위 컬럼의 타입 변경은 지원되지 않습니다).

예제:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'tz_val': TIMESTAMPTZ,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "tz_val" : "2025-05-16 11:11:11+08:00",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string","tz_val":"timestamptz"} |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
```

`{"date": 2020-01-01}`과 `{"ip": 127.0.0.1}`은 유효하지 않은 JSON 텍스트입니다. 올바른 형식은 `{"date": "2020-01-01"}`과 `{"ip": "127.0.0.1"}`입니다.

Schema Template을 지정한 후 JSON 값이 선언된 타입과 충돌하고 변환할 수 없으면 해당 값은 NULL로 저장됩니다. 예를 들면 다음과 같습니다.

```sql
INSERT INTO test_var_schema VALUES (1, '{
  "decimal_val" : "1.11111111",
  "ip_val" : "127.xxxxxx.xxxx",
  "large_int_val" : "aaabbccc"
}');

-- Only decimal_val remains
SELECT * FROM test_var_schema;

+------+-----------------------------+
| id   | v1                          |
+------+-----------------------------+
|    1 | {"decimal_val":1.111111110} |
+------+-----------------------------+
```

스키마는 영구 저장 시의 타입만 결정합니다. 쿼리 실행 중 실제로 사용되는 타입은 런타임의 실제 데이터에 따라 달라집니다.

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

와일드카드 매칭과 순서:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- If enumString1 matches both patterns, the first matching pattern in definition order (STRING) is used
```

컬럼 이름에 `*`가 포함되어 있고 이를 접두사 와일드카드가 아닌 이름 그대로 매칭하려면 다음과 같이 사용합니다.

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

매칭된 하위 경로는 기본적으로 Subcolumnization 대상이 되어 컬럼으로 노출됩니다. 매칭되는 경로가 너무 많아 컬럼이 과도하게 생성된다면 `variant_enable_typed_paths_to_sparse`를 활성화하는 방법을 고려하세요(“설정” 참조).

## 타입 충돌 및 승격 규칙 {#type-conflicts-and-promotion-rules}

동일한 경로에 호환되지 않는 타입이 나타나면(예: 동일한 필드가 정수와 문자열로 모두 나타나는 경우), 정보 손실을 방지하기 위해 타입이 JSONB로 승격됩니다.

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

승격 규칙:

| 원본 타입    | 현재 타입  | 최종 타입   |
| -------------- | ------------- | ------------ |
| `TinyInt`      | `BigInt`      | `BigInt`     |
| `TinyInt`      | `Double`      | `Double`     |
| `TinyInt`      | `String`      | `JSONB`      |
| `TinyInt`      | `Array`       | `JSONB`      |
| `BigInt`       | `Double`      | `JSONB`      |
| `BigInt`       | `String`      | `JSONB`      |
| `BigInt`       | `Array`       | `JSONB`      |
| `Double`       | `String`      | `JSONB`      |
| `Double`       | `Array`       | `JSONB`      |
| `Array<Double>`| `Array<String>`| `Array<Jsonb>` |

안정적인 인덱싱과 저장을 위해 엄격한 타입 지정이 필요하다면 Schema Template으로 타입을 선언하세요.

## Variant 인덱스 {#variant-indexes}

### 인덱스 선택 {#choosing-indexes}

VARIANT는 하위 경로에 BloomFilter와 Inverted Index를 지원합니다.
- 카디널리티가 높은 동등/IN 필터: BloomFilter를 권장합니다(더 희소한 인덱스, 더 나은 쓰기 성능).
- 토큰화/구문/범위 검색: Inverted Index를 사용하고 적절한 `parser`/`analyzer` 속성을 설정합니다.

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

VARIANT 컬럼에 역색인을 생성하면 모든 하위 경로가 동일한 인덱스 속성(예: parser)을 상속합니다.

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### 하위 경로별 인덱스 {#index-by-subpath}

3.1.x/4.0 이상에서는 특정 VARIANT 하위 경로에 인덱스 속성을 지정할 수 있으며, 동일한 경로에 토큰화 역색인과 비토큰화 역색인을 모두 설정할 수도 있습니다. 경로별 인덱스를 사용하려면 Schema Template으로 경로의 타입을 선언해야 합니다.

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

와일드카드 경로 인덱싱:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

참고: 2.1.7+에서는 InvertedIndex V2 속성만 지원합니다(파일 수 감소, 쓰기 IOPS 감소, 스토리지와 컴퓨팅이 분리된 환경에 적합). 2.1.8+에서는 오프라인 Build Index가 제거되었습니다.

Doris 4.1.5부터 아래 인덱스 속성 또는 BE 설정으로 norms를 비활성화할 수 있습니다.

VARIANT 경로의 토큰화 인덱스는 기본적으로 BM25 norms를 기록하며, 해당 경로에 값이 없는 행을 포함하여 경로별로 행당 한 바이트를 사용합니다. 필터링에만 사용하는 경로는 `"norms" = "false"`로 norms를 비활성화하세요. `field_pattern`이 없으면 이 속성은 해당 인덱스가 포함하는 모든 하위 경로에 적용됩니다.

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms를 비활성화해도 `MATCH` 필터링에는 영향을 주지 않지만, `score()`가 norms가 없는 세그먼트를 읽으면 오류가 발생합니다. BE 설정 `inverted_index_skip_norms_for_variant`는 모든 VARIANT 경로의 norms를 비활성화합니다. 자세한 내용은 [레코드 길이와 norms 속성](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property)을 참조하세요.

### 인덱스가 작동하지 않는 경우 {#when-indexes-dont-work}

1. 타입 변경으로 인한 인덱스 손실: 하위 경로가 호환되지 않는 타입으로 변경되면(예: INT → JSONB) 인덱스가 손실됩니다. Schema Template으로 타입과 인덱스를 고정하여 해결하세요.
2. 쿼리 타입 불일치:
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. 잘못된 인덱스 설정: 인덱스는 전체 VARIANT 컬럼이 아닌 하위 경로에 적용됩니다.
   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```

## INSERT 및 데이터 적재 {#insert-and-load}

### INSERT INTO VALUES {#insert-into-values}

```sql
CREATE TABLE IF NOT EXISTS variant_tbl (
    k BIGINT,
    v VARIANT
) PROPERTIES("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, '{"a" : 123}');

select * from variant_tbl;
+------+-----------+
| k    | v         |
+------+-----------+
|    1 | {"a":123} |
+------+-----------+

-- v['a'] is a VARIANT
select v['a'] from variant_tbl;
+--------+
| v['a'] |
+--------+
| 123    |
+--------+

-- Accessing a non-existent key returns NULL
select v['a']['no_such_key'] from variant_tbl;;
+-----------------------+
| v['a']['no_such_key'] |
+-----------------------+
| NULL                  |
+-----------------------+

```

### 데이터 적재 (Stream Load) {#load-stream-load}

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

함께 참조: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

데이터 적재 후 `SELECT count(*)`로 확인하거나 `SELECT * ... LIMIT 1`로 샘플을 조회하세요. 높은 처리량의 데이터 적재에는 RANDOM 버킷팅을 사용하고 Group Commit을 활성화하는 것이 좋습니다.

## 출력 {#output}

VARIANT 컬럼을 읽을 때 반환되는 JSON 텍스트는 입력한 JSON 텍스트와 바이트 단위로 동일하지 않습니다. JSON 객체 내부의 키는 입력 JSON에 나타난 순서와 관계없이 정렬된 순서(사전식 순서)로 출력됩니다.

```sql
INSERT INTO variant_tbl VALUES
  (2, '{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }');

SELECT v FROM variant_tbl WHERE k = 2;
+-----------------------------------+
| v                                 |
+-----------------------------------+
| {"a":1,"b":2,"c":{"x":10,"y":20}} |
+-----------------------------------+
```

정렬은 모든 수준에 적용됩니다. 최상위 키는 `a`, `b`, `c` 순서가 되고, 중첩 객체의 키는 `x`, `y` 순서가 됩니다.

## 지원되는 연산 및 CAST 규칙 {#supported-operations-and-cast-rules}

- VARIANT는 다른 타입과 직접 비교하거나 연산할 수 없으며, 두 VARIANT 간 비교도 지원되지 않습니다.
- 비교, 필터링, 집계, 정렬을 수행하려면 하위 경로를 명시적 또는 암시적으로 구체적인 타입으로 CAST하세요.

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- VARIANT 자체는 ORDER BY, GROUP BY, JOIN KEY 또는 집계 함수 인수로 직접 사용할 수 없습니다. 대신 하위 경로를 CAST하세요.
- 문자열은 VARIANT로 암시적으로 변환할 수 있습니다.

| VARIANT         | 명시적 변환 가능 | 암시적 변환 가능 |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌        |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌        |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## 와이드 컬럼 {#wide-columns}

적재한 데이터에 서로 다른 JSON 키가 많으면 Subcolumnization으로 생성되는 하위 컬럼 수가 빠르게 증가할 수 있습니다. 규모가 커지면 메타데이터 비대화, 쓰기/병합 비용 증가, 쿼리 속도 저하가 발생할 수 있습니다. VARIANT는 하위 컬럼이 너무 많은 “와이드 컬럼” 문제를 해결하기 위해 **희소 컬럼**과 **DOC 인코딩**이라는 두 가지 메커니즘을 제공합니다.

워크로드에 맞는 선택 방법은 [Variant 워크로드 가이드](./variant-workload-guide)를 참조하세요. 이 섹션에서는 메커니즘과 관련 속성만 설명합니다.

참고: 이 두 메커니즘은 상호 배타적입니다. DOC 인코딩을 활성화하면 희소 컬럼이 비활성화되며, 그 반대도 마찬가지입니다.

### 희소 컬럼 {#sparse-columns}

**동작 방식**

- 시스템은 NULL이 아닌 값의 비율 / 희소성을 기준으로 경로의 순위를 매깁니다. 빈도가 높은(희소성이 낮은) 경로는 Subcolumnization을 거쳐 독립적인 하위 컬럼으로 저장되고, 나머지 빈도가 낮은(희소한) 경로는 병합되어 희소 컬럼에 저장됩니다. 추출되는 하위 컬럼의 최대 수는 `variant_max_subcolumns_count`로 제어합니다.
- Schema Template에 선언된 경로는 기본적으로 희소 컬럼으로 이동하지 않습니다. 타입이 지정된 경로도 희소 컬럼으로 이동할 수 있도록 허용하려면 `variant_enable_typed_paths_to_sparse`를 설정하세요.
- 희소 컬럼은 샤딩을 지원합니다. 희소 하위 경로를 여러 희소 컬럼에 분산하여 컬럼별 읽기 오버헤드를 줄이고 읽기 효율을 높입니다. 물리적으로 저장할 희소 컬럼 수는 `variant_sparse_hash_shard_count`로 지정합니다.

**참고 사항**

- 대부분의 키에서 NULL이 아닌 값의 비율이 비슷하면(희소성 차이가 작으면) 실제로 희소한 경로를 식별하기 어려워 희소 컬럼의 효과가 줄어듭니다.
- `variant_max_subcolumns_count`의 기본값은 `2048`이며, 대부분의 워크로드에 충분합니다. 추출되는 하위 컬럼을 더 많이 미리 할당하려는 목적으로 이 값을 크게 늘리지 마세요. 워크로드에 대규모 Subcolumnization이 꼭 필요하다면 <a href="./variant-workload-guide#doc-mode-template">DOC 모드</a>를 권장합니다. 실제 상한은 여전히 `10000` 이하로 유지하는 것이 좋습니다.
- `variant_sparse_hash_shard_count`는 대략 “희소 경로 수 / 128”로 추정할 수 있습니다. 예를 들어 전체 JSON 키가 약 10,000개이고 `variant_max_subcolumns_count = 2000`이면 희소 경로는 약 8000개이므로, `variant_sparse_hash_shard_count`는 `8000/128` 정도로 시작할 수 있습니다.

### DOC 인코딩 (DOC 모드) {#doc-encoding-doc-mode}

**동작 방식**

- 경로 기반 쿼리를 위해 경로에 Subcolumnization을 수행할 수 있으며, 전체 JSON 문서를 효율적으로 반환하기 위해 원본 JSON을 저장 필드로 추가 저장합니다.
- DOC 인코딩은 샤딩을 지원합니다. 원본 JSON을 여러 컬럼으로 나누어 저장하고, 전체 JSON을 쿼리할 때 다시 조합합니다. DOC 샤드 수는 `variant_doc_hash_shard_count`로 지정합니다.
- 소규모 배치 쓰기에서는 Subcolumnization을 건너뛰고 이후 병합 시점으로 미룰 수 있습니다. 이는 `variant_doc_materialization_min_rows`로 제어합니다. 예를 들어 `variant_doc_materialization_min_rows = 10000`이면 10,000행 미만의 쓰기에서는 원본 JSON만 저장하며, 해당 배치에 Subcolumnization을 수행하지 않습니다.
- 매우 넓은 워크로드에서는 Subcolumnization 규모가 일만 개의 하위 컬럼에 가까워질 때 DOC 모드가 더 안정적인 선택입니다. 기본적인 즉시 Subcolumnization과 비교하면 컴팩션 메모리는 약 삼분의 이만큼 줄어들 수 있고, 희소한 와이드 컬럼의 데이터 적재 처리량은 약 5-10x 향상될 수 있습니다.
- `VARIANT` 컬럼이 매우 넓고 쿼리가 전체 문서를 자주 읽는 경우, DOC 모드는 다수의 하위 컬럼에서 문서를 재구성하는 방식에 비해 `SELECT variant_col` 성능을 수십 배 이상 높일 수 있습니다.

**참고 사항**

- DOC 모드에는 `variant_enable_doc_mode = true`가 필요합니다.
- DOC 모드에서는 Schema Template으로 타입을 선언한 경로가 숫자, 문자열, 배열 타입으로 제한됩니다.
- `variant_doc_hash_shard_count`는 대략 “전체 JSON 키 수 / 128”로 추정할 수 있습니다.

전체 속성 목록은 아래 “설정” 섹션을 참조하세요.

## 제한 사항 {#limitations}

- **와이드 테이블 최적화**: `VARIANT` 타입으로 생성되는 동적 하위 컬럼이 많은 와이드 테이블(예: 컬럼 수가 2000개를 초과하는 경우)에서는 `"storage_format" = "V3"`를 테이블 `PROPERTIES`에 지정하여 **Storage Format V3**를 활성화하는 것을 적극 권장합니다. 이 형식은 컬럼 메타데이터를 Segment Footer에서 분리하여 파일 열기 속도를 높이고 메모리 오버헤드를 줄입니다.
- JSON 키 길이는 255 이하여야 합니다.
- JSON 문자열을 VARIANT로 명시적으로 변환하려면 [`PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)와 [`TRY_PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)(4.1.4부터 지원)를 사용하세요. 전자는 파싱에 실패하면 오류를 보고하고, 후자는 NULL을 반환한다는 차이가 있습니다.
- 기본 키 또는 정렬 키로 사용할 수 없습니다.
- 다른 타입 내부에 중첩할 수 없습니다(예: `Array<Variant>`, `Struct<Variant>`).
- DOC 모드가 아니면 전체 VARIANT 컬럼을 읽을 때 모든 하위 경로를 스캔합니다. 매우 넓은 컬럼에서는 DOC 모드를 활성화하지 않은 상태로 직접 `SELECT variant_col`을 사용하는 것을 일반적으로 권장하지 않습니다. 컬럼에 하위 경로가 많으면 `LIKE`와 같은 전체 객체 검색을 위해 원본 JSON 문자열을 추가 STRING/JSONB 컬럼에 저장하는 방법을 고려하세요.

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## 설정 {#configuration}

3.1+부터 VARIANT는 컬럼의 타입 수준 속성을 지원합니다.

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```

<table>
<tr><td>속성</td><td>설명</td></tr>
<tr><td>`variant_max_subcolumns_count`</td><td>Subcolumnization을 수행할 수 있는 최대 경로 수입니다. 임계값을 초과하면 새로운 경로가 공유 데이터 구조에 저장될 수 있습니다. 기본값은 2048(권장)이며, 대부분의 워크로드에 충분합니다. 너무 크게 설정하지 마세요. 워크로드에 매우 큰 규모의 하위 컬럼 추출이 꼭 필요하다면 <a href="./variant-workload-guide#doc-mode-template">DOC 모드</a>를 권장합니다. 0은 제한 없음을 의미하며, 10000을 초과하지 마세요.</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>기본적으로 타입이 지정된 경로는 항상 Subcolumnization 대상이 됩니다(또한 `variant_max_subcolumns_count`에 포함되지 않습니다). `true`로 설정하면 타입이 지정된 경로도 임계값 계산에 포함되며 공유 구조로 이동할 수 있습니다.</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>희소 컬럼의 샤드 수입니다. 희소 하위 경로를 여러 희소 컬럼에 분산하여 읽기 성능을 높입니다. 기본값은 1이며, 희소 하위 경로 수에 따라 조정하세요.</td></tr>
</table>

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

<table>
<tr><td>속성</td><td>설명</td></tr>
<tr><td>`variant_enable_doc_mode`</td><td>DOC 인코딩 모드를 활성화합니다. `true`이면 전체 JSON 문서를 빠르게 반환하기 위해 원본 JSON을 저장 필드로 저장합니다. DOC 모드와 희소 컬럼은 상호 배타적입니다. 기본값은 `false`입니다.</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>DOC 모드에서 Subcolumnization을 수행하기 위한 최소 행 수 임계값입니다. 행 수가 이 값보다 적으면 원본 JSON만 저장합니다. 컴팩션으로 파일을 병합하여 임계값에 도달하면 Subcolumnization을 수행합니다. 소규모 배치 쓰기의 오버헤드를 줄이는 데 도움이 됩니다.</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>DOC 인코딩의 샤드 수입니다. 원본 JSON을 지정된 수의 컬럼으로 나누어 저장하고, 전체 JSON을 쿼리할 때 다시 조합합니다. 기본값은 64이며, JSON 크기와 동시성에 따라 조정하세요.</td></tr>
</table>

한계에 도달했을 때의 동작과 튜닝 권장 사항:

1. 임계값을 초과하면 새로운 경로는 공유 구조에 기록됩니다. Rowset 병합 중에도 일부 경로가 공유 구조로 회수될 수 있습니다.
2. 시스템은 NULL이 아닌 값의 비율과 접근 빈도가 높은 경로를 Subcolumnization 대상으로 우선 유지합니다.
3. Subcolumnization 대상 경로가 10,000개에 가까워지면 강력한 하드웨어가 필요합니다(노드당 ≥128G RAM, ≥32C 권장). 워크로드가 이미 이 범위에 가깝다면 DOC 모드를 먼저 평가하는 것이 좋습니다.
4. 데이터 적재 튜닝: 클라이언트의 `batch_size`를 적절히 늘리거나 Group Commit을 사용하세요(필요에 따라 `group_commit_interval_ms`/`group_commit_data_bytes`를 늘리세요).
5. 파티션 프루닝이 필요하지 않으면 RANDOM 버킷팅과 단일 tablet 데이터 적재 활성화를 고려하여 컴팩션 쓰기 증폭을 줄이세요.
6. BE 튜닝 설정: `max_cumu_compaction_threads`(≥8), `vertical_compaction_num_columns_per_group=500`(수직 컴팩션 성능을 높이지만 메모리 사용량 증가), `segment_cache_memory_percentage=20`(메타데이터 캐시 효율 향상).
7. Compaction Score를 관찰하세요. 계속 상승하면 컴팩션이 뒤처지고 있다는 뜻이므로 데이터 적재 부하를 줄이세요.
8. VARIANT에서 대규모 `SELECT *`를 피하고 `SELECT v['path']`와 같이 필요한 항목만 조회하세요.

참고: Stream Load 오류 `[DATA_QUALITY_ERROR]Reached max column size limit 2048`이 발생하면(2.1.x 및 3.0.x에서만 발생), 병합된 tablet 스키마가 컬럼 수 한도에 도달했다는 의미입니다. `variant_max_merged_tablet_schema_size`를 늘릴 수 있습니다(4096 초과는 권장하지 않으며, 강력한 하드웨어가 필요합니다).

## 컬럼 수 및 타입 확인 {#inspect-number-of-columns-and-types}

방법 1: `variant_type`으로 행별 스키마를 확인합니다(더 정확하지만 비용이 높음).

```sql
SELECT variant_type(v) FROM variant_tbl;
```

방법 2: 확장된 `DESC`로 Subcolumnization을 통해 추출된 하위 경로를 표시합니다.

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

두 방법을 함께 사용하세요. 방법 1은 정확하고, 방법 2는 효율적입니다.

## JSON 타입과 비교 {#compared-with-json-type}

- 저장: JSON은 JSONB(행 지향)로 저장됩니다. VARIANT는 쓰기 시 Subcolumnization을 수행합니다(더 높은 압축률, 더 작은 크기).
- 쿼리: JSON은 파싱이 필요합니다. VARIANT는 컬럼을 직접 스캔하므로 일반적으로 훨씬 빠릅니다.

ClickBench(쿼리 43개):
- 저장: VARIANT는 JSON 대비 공간을 ~65% 절약합니다.
- 쿼리: VARIANT는 JSON보다 8x+ 빠르며, 사전 정의된 정적 컬럼에 가까운 성능을 보입니다.

**저장 공간**

| 타입                | 크기       |
| ------------------- | ---------- |
| 사전 정의된 컬럼  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**~65% 공간 절약**

| 실행             | 사전 정의된 컬럼 | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| 첫 번째 (콜드)    | 233.79s    | 248.66s | 대부분 시간 초과  |
| 두 번째 (핫)    | 86.02s     | 94.82s  | 789.24s         |
| 세 번째 (핫)     | 83.03s     | 92.29s  | 743.69s         |

## FAQ {#faq}

1. VARIANT의 `null`과 SQL의 `NULL`은 다른가요?
   - 아니요. 둘은 동일합니다.
2. 쿼리/인덱스가 작동하지 않는 이유는 무엇인가요?
   - 경로를 올바른 타입으로 CAST했는지, 타입 충돌로 인해 JSONB로 승격되었는지, 하위 경로가 아닌 전체 VARIANT에 인덱스가 적용될 것으로 잘못 예상하고 있는지 확인하세요.
3. VARIANT 컬럼에 쓸 때 DECIMAL의 정밀도가 손실되는 이유는 무엇인가요?
   - VARIANT 컬럼에 쓸 때 하위 컬럼의 타입은 DECIMAL로 추론되지 않습니다. 숫자 값은 DOUBLE로 저장되므로 소수점 이하 뒷자리가 손실될 수 있습니다. Schema Template으로 하위 경로를 DECIMAL로 선언하더라도(예: `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`) 정밀도가 완전히 보장되지는 않습니다. 쓰기 경로에서 값을 먼저 DOUBLE로 파싱한 후 DECIMAL로 변환하기 때문입니다. JSON 값을 문자열로 작성하고(예: `'{"num": "12.345"}'`) 이에 맞는 Schema Template DECIMAL 선언(예: `DECIMAL(9, 3)`)을 함께 지정하면, 쓰기 시 문자열을 DECIMAL로 직접 파싱하므로 정밀도가 유지됩니다.
