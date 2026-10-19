---
{
    "title": "JSON | 파일 형식",
    "language": "ko",
    "description": "Doris에 JSON 파일을 적재하는 방법을 안내합니다. 세 가지 JSON 형식, jsonpaths와 json_root 등의 매개변수 설정, Stream Load, Broker Load, Routine Load, TVF 사용 예제를 다룹니다.",
    "keywords": [
        "Doris JSON 데이터 적재",
        "jsonpaths",
        "json_root",
        "strip_outer_array",
        "read_json_by_line",
        "Stream Load JSON",
        "Routine Load JSON",
        "중첩 JSON 데이터 적재"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: JSON data import / Field extraction / Nested structure handling -->

이 문서에서는 JSON 형식의 데이터 파일을 Doris에 적재하는 방법을 설명합니다. Doris는 표준 JSON 형식의 데이터 적재를 지원합니다. 매개변수를 설정하면 다양한 JSON 데이터 구조를 유연하게 처리하고, JSON 데이터에서 필드를 추출하고, 중첩 구조를 파싱할 수 있습니다.

## 데이터 적재 방법 {#import-methods}

다음 데이터 적재 방법은 JSON 형식의 데이터를 지원합니다.

| 데이터 적재 방법 | 적용 시나리오 | 매개변수 전달 방식 |
|---|---|---|
| [Stream Load](../import-way/stream-load-manual) | 로컬 또는 클라이언트에서 푸시하는 소규모 배치 데이터를 준실시간으로 적재 | HTTP Header, 예: `-H "jsonpaths: $.data"` |
| [Broker Load](../import-way/broker-load-manual) | 객체 스토리지, HDFS 등의 소스에서 대용량 파일을 일괄 적재 | `PROPERTIES`, 예: `PROPERTIES("jsonpaths"="$.data")` |
| [Routine Load](../import-way/routine-load-manual) | Kafka 등의 메시지 큐에서 JSON을 지속적으로 소비 | `PROPERTIES`, 예: `PROPERTIES("jsonpaths"="$.data")` |
| [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) | SQL로 S3의 JSON 파일을 직접 읽기 | TVF 매개변수, 예: `S3("jsonpaths"="$.data")` |
| [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) | SQL로 HDFS의 JSON 파일을 직접 읽기 | TVF 매개변수 |

## 지원되는 JSON 형식 {#supported-json-formats}

Doris는 다음 세 가지 JSON 파일 구성 형식을 지원하며, 각 형식은 서로 다른 비즈니스 시나리오에 적합합니다.

### 형식 1: 여러 행을 Array로 표현 {#format-1-multiple-rows-represented-as-an-array}

여러 행을 한 번에 일괄 적재할 때 적합합니다.

요구 사항:

- 루트 노드는 배열이어야 합니다.
- 배열의 각 요소는 데이터 한 행을 나타내는 객체여야 합니다.
- `strip_outer_array=true`를 설정해야 합니다.

예제 데이터:

```json
[
    {"id": 123, "city": "beijing"},
    {"id": 456, "city": "shanghai"}
]

// Nested structures are supported
[
    {"id": 123, "city": {"name": "beijing", "region": "haidian"}},
    {"id": 456, "city": {"name": "beijing", "region": "chaoyang"}}
]
```

### 형식 2: 단일 행을 Object로 표현 {#format-2-a-single-row-represented-as-an-object}

데이터 한 행을 적재할 때 적합합니다.

요구 사항:

- 루트 노드는 객체여야 합니다.
- 전체 객체가 데이터 한 행을 나타냅니다.
- 파일의 각 줄에는 JSON 레코드가 하나만 있어야 합니다.

예제 데이터:

```json
{"id": 123, "city": "beijing"}

// Nested structures are supported
{"id": 123, "city": {"name": "beijing", "region": "haidian"}}
```

:::tip 참고
이 형식은 일반적으로 Kafka의 단일 메시지처럼 Routine Load에서 사용됩니다.
:::

### 형식 3: 고정 구분자로 구분된 여러 행의 Object 데이터 {#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter}

각 행이 독립적인 JSON 객체인 데이터를 여러 행 일괄 적재할 때 적합합니다(NDJSON과 유사).

요구 사항:

- 각 줄은 완전한 JSON 객체여야 합니다.
- `read_json_by_line=true`는 기본적으로 활성화되어 있으므로 명시적으로 설정할 필요가 없습니다.
- 줄 구분자는 `line_delimiter` 매개변수로 지정할 수 있으며, 기본값은 `\n`입니다.

예제 데이터:

```json
{"id": 123, "city": "beijing"}
{"id": 456, "city": "shanghai"}
```

## 매개변수 설정 {#parameter-configuration}

### 데이터 적재 방법별 매개변수 지원 현황 {#parameter-support-matrix-for-each-import-method}

다음 표는 각 데이터 적재 방법에서 JSON 관련 매개변수를 지원하는지 보여 줍니다.

| 매개변수 | 기본값 | Stream Load | Broker Load | Routine Load | TVF |
|---|---|---|---|---|---|
| `jsonpaths` | 없음 | 지원 | 지원 | 지원 | 지원 |
| `json_root` | 없음 | 지원 | 지원 | 지원 | 지원 |
| `strip_outer_array` | false | 지원 | 지원 | 지원 | 지원 |
| `read_json_by_line` | true | 지원 | 설정 불가 | 설정 불가 | 지원 |
| `fuzzy_parse` | false | 지원 | 지원 | 미지원 | 지원 |
| `num_as_string` | false | 지원 | 지원 | 지원 | 지원 |
| 압축 형식 | plain | 지원 | 지원 | 미지원 | 지원 |

:::tip 매개변수 전달 방식과 기본 동작

1. Stream Load: HTTP Header를 통해 매개변수를 직접 전달합니다. 예: `-H "jsonpaths: $.data"`.
2. Broker Load: `PROPERTIES`를 통해 매개변수를 전달합니다. 예: `PROPERTIES("jsonpaths"="$.data")`.
3. Routine Load: `PROPERTIES`를 통해 매개변수를 전달합니다. 예: `PROPERTIES("jsonpaths"="$.data")`.
4. TVF: TVF 문을 통해 매개변수를 전달합니다. 예: `S3("jsonpaths"="$.data")`.
5. JSON 파일의 루트 노드에 있는 JSON 객체를 직접 적재하려면 `jsonpaths`를 `$.`로 설정합니다. 예: `PROPERTIES("jsonpaths"="$.")`.
6. `read_json_by_line`의 기본값은 true입니다. 즉, 데이터 적재 시 `strip_outer_array`와 `read_json_by_line`을 모두 지정하지 않으면 `read_json_by_line`은 true입니다.
7. Broker Load와 Routine Load에서는 `read_json_by_line`을 설정할 수 없습니다. 스트리밍 읽기를 활성화하고 BE의 메모리 부담을 줄이기 위해 항상 true로 설정됩니다.

:::

### 매개변수 상세 설명 {#detailed-parameter-description}

#### jsonpaths {#jsonpaths}

- **용도**: JSON 데이터에서 필드를 추출하는 방법을 지정합니다.
- **유형**: 문자열 배열.
- **기본값**: 없음. 기본적으로 열 이름을 기준으로 매칭합니다.
- **예제**:

    ```json
    -- Basic usage
    ["$.id", "$.city"]

    -- Nested structure
    ["$.id", "$.info.city", "$.data[0].name"]
    ```

#### json_root {#json_root}

- **용도**: JSON 데이터의 파싱 시작점을 지정합니다.
- **유형**: 문자열.
- **기본값**: 없음. 기본적으로 루트 노드에서 파싱을 시작합니다.
- **예제**:

    ```json
    -- Original data
    {
      "data": {
        "id": 123,
        "city": "beijing"
      }
    }

    -- Set json_root
    json_root = $.data
    ```

#### strip_outer_array {#strip_outer_array}

- **용도**: 가장 바깥쪽 배열 구조를 제거할지 지정합니다.
- **유형**: Boolean.
- **기본값**: false.
- **예제**:

    ```json
    -- Original data
    [
      {"id": 1, "city": "beijing"},
      {"id": 2, "city": "shanghai"}
    ]

    -- Set strip_outer_array=true
    ```

#### read_json_by_line {#read_json_by_line}

- **용도**: JSON 데이터를 줄 단위로 읽을지 지정합니다.
- **유형**: Boolean.
- **기본값**: `strip_outer_array`를 설정하지 않으면 true이며, `strip_outer_array=true`를 지정하면 기본값이 false가 됩니다. (Broker Load와 Routine Load에서는 항상 `read_json_by_line=true`가 적용됩니다.)
- **예제**:

    ```json
    -- Original data (one complete JSON object per line)
    {"id": 1, "city": "beijing"}
    {"id": 2, "city": "shanghai"}

    -- Set read_json_by_line=true
    ```

#### fuzzy_parse {#fuzzy_parse}

- **용도**: JSON 데이터 적재 속도를 높입니다.
- **유형**: Boolean.
- **기본값**: false.
- **제한 사항**:
    - 배열의 모든 행에서 필드 순서가 정확히 같아야 합니다.
    - 일반적으로 `strip_outer_array`와 함께 사용합니다.
- **성능**: 데이터 적재 효율을 3~5배 높입니다.

#### num_as_string {#num_as_string}

- **용도**: JSON의 숫자 값을 문자열로 파싱할지 지정합니다.
- **유형**: Boolean.
- **기본값**: false.
- **사용 사례**:
    - 지원되는 숫자 범위를 초과하는 숫자 처리.
    - 숫자 정밀도 손실 방지.
- **예제**:

    ```json
    -- Original data
    {
      "id": "12345678901234567890",
      "price": "99999999.999999"
    }
    -- With num_as_string=true, the price field is parsed as a string
    ```

### JSON Path와 Columns의 관계 {#relationship-between-json-path-and-columns}

데이터 적재 시 `jsonpaths`와 `columns`는 서로 다른 역할을 담당합니다.

| 매개변수 | 역할 | 결과 |
|---|---|---|
| `jsonpaths` | 데이터 추출 규칙 정의 | 지정된 경로를 따라 JSON 데이터에서 필드를 추출하고, `jsonpaths`에 정의된 순서대로 재정렬 |
| `columns` | 데이터 매핑 규칙 정의 | 추출한 필드를 대상 테이블의 열에 매핑하며, 필요에 따라 열 순서 변경 및 변환 수행 |

두 매개변수는 순차적으로 처리됩니다.

1. 먼저 `jsonpaths`가 원본 데이터에서 필드를 추출하여 순서가 있는 데이터셋을 구성합니다.
2. 그런 다음 `columns`가 이 데이터 항목을 테이블의 열에 매핑합니다.

`columns`를 지정하지 않으면 추출한 필드가 테이블의 열 순서대로 직접 매핑됩니다.

#### 예제 1: JSON Path만 사용 {#example-1-using-json-path-only}

테이블 스키마 및 데이터:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int
);

-- JSON data
{"k1": 1, "k2": 2}
```

데이터 적재 명령:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

데이터 적재 결과:

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

#### 예제 2: JSON Path와 Columns를 함께 사용 {#example-2-using-json-path-together-with-columns}

위와 동일한 테이블 스키마 및 데이터를 사용하고, `columns` 매개변수를 추가합니다.

데이터 적재 명령:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\"]" \
    -H "columns: k2, k1" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

데이터 적재 결과:

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

#### 예제 3: 필드 재사용 {#example-3-reusing-a-field}

테이블 스키마 및 데이터:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_copy int
);

-- JSON data
{"k1": 1, "k2": 2}
```

데이터 적재 명령:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" \
    -H "columns: k2, k1, k1_copy" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

데이터 적재 결과:

```text
+------+------+---------+
| k2   | k1   | k1_copy |
+------+------+---------+
|    2 |    1 |       1 |
+------+------+---------+
```

#### 예제 4: 중첩 필드 매핑 {#example-4-mapping-nested-fields}

테이블 스키마 및 데이터:

```sql
-- Table schema
CREATE TABLE example_table (
    k2 int,
    k1 int,
    k1_nested1 int,
    k1_nested2 int
);

-- JSON data
{
    "k1": 1,
    "k2": 2,
    "k3": {
        "k1": 31,
        "k1_nested": {
            "k1": 32
        }
    }
}
```

데이터 적재 명령:

```shell
curl -v ... -H "format: json" \
    -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k3.k1\", \"$.k3.k1_nested.k1\"]" \
    -H "columns: k2, k1, k1_nested1, k1_nested2" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/db_name/table_name/_stream_load
```

데이터 적재 결과:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

## 사용 예제 {#usage-examples}

이 절에서는 각 데이터 적재 방법에서 JSON 형식을 사용하는 방법을 보여 줍니다. 코드 예제를 그대로 복사한 후 필요에 맞게 수정하여 사용할 수 있습니다.

### Stream Load {#stream-load}

```bash
# Use JSON Path
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "jsonpaths: [\"$.id\", \"$.city\"]" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Specify JSON root
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "json_root: $.events" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load

# Read JSON line by line
curl --location-trusted -u <user>:<passwd> \
    -H "format: json" \
    -H "read_json_by_line: true" \
    -T example.json \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load {#broker-load}

```sql
-- Use JSON Path
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "jsonpaths" = "[\"$.id\", \"$.city\"]"
    )
)
WITH S3
(
    ...
);

-- Specify JSON root
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/path/example.json")
    INTO TABLE example_table
    FORMAT AS "json"
    PROPERTIES
    (
        "json_root" = "$.events"
    )
)
WITH S3
(
    ...
);
```

### Routine Load {#routine-load}

```sql
-- Use JSON Path
CREATE ROUTINE LOAD example_db.example_job ON example_table
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]"
)
FROM KAFKA
(
    ...
);
```

### TVF {#tvf}

```sql
-- Use JSON Path
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "jsonpaths" = "[\"$.id\", \"$.city\"]",
    ...
);

-- Specify JSON root
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.json",
    "format" = "json",
    "json_root" = "$.events",
    ...
);
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: 배열 형태의 JSON 파일을 적재할 때 모든 데이터가 단일 행으로 처리되는 이유는 무엇인가요? {#q1-when-importing-a-json-file-in-array-form-all-data-is-treated-as-a-single-row-why}

`strip_outer_array=true`를 명시적으로 설정해야 합니다. 그렇지 않으면 Doris는 가장 바깥쪽 배열 전체를 단일 JSON 객체로 파싱하므로 데이터를 행 단위로 쓸 수 없습니다.

### Q2: 각 줄에 JSON 객체가 하나씩 있는 파일(NDJSON)은 어떻게 적재하나요? {#q2-how-should-i-import-a-file-with-one-json-object-per-line-ndjson}

[형식 3](#format-3-multiple-rows-of-object-data-separated-by-a-fixed-delimiter)을 사용하여 바로 적재하면 됩니다. `read_json_by_line`이 기본적으로 활성화되어 있으므로 추가 설정은 필요하지 않습니다. 줄 구분자가 `\n`이 아닌 경우 `line_delimiter`로 지정하세요.

### Q3: JSON 파일의 루트 노드에 있는 JSON 객체를 직접 적재하려면 어떻게 하나요? {#q3-how-do-i-import-the-json-object-at-the-root-node-of-a-json-file-directly}

`jsonpaths`를 `$.`로 설정하세요. 예: `PROPERTIES("jsonpaths"="$.")`.

### Q4: 매우 큰 숫자나 고정밀 소수의 정밀도 손실을 방지하려면 어떻게 하나요? {#q4-how-do-i-avoid-precision-loss-for-very-large-numbers-or-high-precision-decimals}

`num_as_string=true`를 설정하세요. JSON의 숫자 값을 문자열로 파싱한 다음 해당 열 유형에 맞게 기록하여 숫자 오버플로와 정밀도 손실을 방지합니다.

### Q5: Broker Load / Routine Load에서 `read_json_by_line`을 설정할 수 없는 이유는 무엇인가요? {#q5-why-does-broker-load--routine-load-not-allow-read_json_by_line-to-be-configured}

BE의 메모리 부담을 줄이기 위해 Broker Load와 Routine Load는 항상 스트리밍 모드로 줄 단위 읽기를 수행합니다. 따라서 `read_json_by_line`을 명시적으로 설정할 수 없습니다.

### Q6: 구조가 동일한 JSON 배열을 대량으로 적재할 때 속도를 높이려면 어떻게 하나요? {#q6-how-do-i-speed-up-the-import-of-large-numbers-of-json-arrays-with-the-same-structure}

`fuzzy_parse=true`와 `strip_outer_array=true`를 함께 활성화하면 데이터 적재 성능을 3~5배 높일 수 있습니다. 배열의 모든 행에서 필드 순서가 정확히 같아야 합니다.

### Q7: `jsonpaths`와 `columns`는 어떤 관계이며, 어느 것이 먼저 적용되나요? {#q7-what-is-the-relationship-between-jsonpaths-and-columns-and-which-takes-effect-first}

먼저 `jsonpaths`가 JSON에서 필드를 추출하여 지정된 순서대로 정렬하고, 그런 다음 `columns`가 이 필드를 대상 테이블의 열에 매핑합니다. 자세한 내용은 [JSON Path와 Columns의 관계](#relationship-between-json-path-and-columns)를 참조하세요.
