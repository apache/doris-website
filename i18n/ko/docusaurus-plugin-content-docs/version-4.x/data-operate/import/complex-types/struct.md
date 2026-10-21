---
{
    "title": "STRUCT 타입 데이터 적재",
    "language": "ko",
    "description": "CSV, JSON 및 INSERT INTO를 사용하여 Apache Doris에 STRUCT 타입 데이터를 적재하는 방법을 소개합니다. 테이블 생성, Stream Load, 결과 검증 예제를 포함합니다.",
    "keywords": [
        "STRUCT 데이터 적재",
        "복합 타입 데이터 적재",
        "Doris STRUCT",
        "Stream Load STRUCT",
        "named_struct",
        "CSV STRUCT 데이터 적재",
        "JSON STRUCT 데이터 적재"
    ],
    "sidebar_label": "STRUCT"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Complex type data import -->

`STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`는 여러 필드로 구성된 구조를 나타내며, 여러 컬럼의 모음으로도 볼 수 있습니다. 타입에 대한 자세한 내용은 [STRUCT 데이터 타입](../../../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md)을 참조하세요.

이 문서는 일반적인 사용 사례를 바탕으로 Apache Doris에 STRUCT 데이터를 적재하는 방법을 소개하며, 다음 두 가지 데이터 형식을 다룹니다.

- **CSV 형식 데이터 적재**: 텍스트 파일, ETL 작업 출력 등의 데이터를 적재하는 데 적합합니다.
- **JSON 형식 데이터 적재**: API, 로그 또는 반정형 데이터 소스의 데이터를 적재하는 데 적합합니다.

두 방식 모두 [Stream Load](../import-way/stream-load-manual.md)를 사용하며, `INSERT INTO VALUES` 문을 사용한 직접 쓰기도 지원합니다.

## 데이터 적재 과정 개요 {#import-process-overview}

사용하는 데이터 형식에 관계없이 STRUCT 타입 데이터 적재는 다음 4단계로 진행됩니다.

| 단계 | 작업 | 설명 |
|------|------|------|
| 1 | 데이터 준비 | 대상 형식(CSV / JSON)에 맞는 테스트 데이터 파일 생성 |
| 2 | 데이터베이스에 테이블 생성 | `STRUCT` 필드가 포함된 테이블 스키마 생성 |
| 3 | 데이터 적재 | Stream Load 또는 `INSERT INTO`를 사용하여 데이터 쓰기 |
| 4 | 적재된 데이터 검증 | `SELECT`로 결과 검증 |

## CSV 형식 데이터 적재 {#csv-format-import}

### 1단계: 데이터 준비 {#step-1-prepare-data}

다음 내용으로 CSV 파일 `test_struct.csv`를 생성합니다. STRUCT 내부의 쉼표와 구별할 수 있도록 구분자로 쉼표 대신 `|`를 사용합니다.

```text
1|{10, 3.14, "Emily"}
2|{4, 1.5, null}
3|{7, null, "Benjamin"}
4|{}
5|null
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database}

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-import-data}

Stream Load를 사용하여 CSV 파일을 적재합니다.

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_struct" \
    -T "test_struct.csv" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

`INSERT INTO VALUES` 문을 사용하여 데이터를 적재할 수도 있습니다.

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 4단계: 적재된 데이터 검증 {#step-4-verify-imported-data}

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.01 sec)
```

## JSON 형식 데이터 적재 {#json-format-import}

### 1단계: 데이터 준비 {#step-1-prepare-data-1}

다음 내용으로 JSON 파일 `test_struct.json`을 생성합니다.

```json
[
    {"id":1, "c_struct":{"f1":10, "f2":3.14, "f3":"Emily"}},
    {"id":2, "c_struct":{"f1":4, "f2":1.5, "f3":null}},
    {"id":3, "c_struct":{"f1":7, "f2":null, "f3":"Benjamin"}},
    {"id":4, "c_struct":{}},
    {"id":5, "c_struct":null}
]
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database-1}

```sql
CREATE TABLE struct_test (
    id          INT                                  NOT NULL,
    c_struct    STRUCT<f1:INT,f2:FLOAT,f3:STRING>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-import-data-1}

Stream Load를 사용하여 JSON 파일을 적재합니다. `format:json`으로 형식을 지정하고, `strip_outer_array:true`를 사용하여 가장 바깥쪽 JSON 배열을 파싱합니다.

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_struct" \
    -H "strip_outer_array:true" \
    -T "test_struct.json" \
    http://localhost:8040/api/testdb/struct_test/_stream_load
```

### 4단계: 적재된 데이터 검증 {#step-4-verify-imported-data-1}

```sql
mysql> SELECT * FROM struct_test;
+------+--------------------------------------+
| id   | c_struct                             |
+------+--------------------------------------+
|    1 | {"f1":10, "f2":3.14, "f3":"Emily"}   |
|    2 | {"f1":4, "f2":1.5, "f3":null}        |
|    3 | {"f1":7, "f2":null, "f3":"Benjamin"} |
|    4 | {"f1":null, "f2":null, "f3":null}    |
|    5 | NULL                                 |
+------+--------------------------------------+
5 rows in set (0.00 sec)
```

## 주요 매개변수 {#key-parameters}

<!-- Knowledge type: Configuration parameters -->

다음 표는 STRUCT 데이터 적재 시 자주 사용하는 Stream Load 헤더 매개변수를 정리한 것입니다.

| 매개변수 | 적용 형식 | 설명 |
|------|----------|------|
| `column_separator` | CSV | 컬럼 구분자입니다. STRUCT 내부에서는 `,`를 사용하므로, 혼동을 피하려면 외부 구분자로 `|`와 같은 다른 문자를 사용하는 것이 좋습니다 |
| `columns` | CSV / JSON | 컬럼과 테이블 필드 간의 매핑을 지정합니다 |
| `format` | JSON | 적재할 파일의 형식이 `json`임을 지정합니다 |
| `strip_outer_array` | JSON | JSON 파일의 가장 바깥쪽이 배열이면 `true`로 설정하여 행별로 파싱하도록 합니다 |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

### 1. CSV 파일에서 `|`를 `,` 대신 구분자로 사용해야 하는 이유는 무엇인가요? {#1-why-does-the-csv-file-need-to-use--instead-of--as-the-delimiter}

STRUCT 필드의 리터럴은 내부적으로 `,`를 사용하여 필드를 구분합니다(예: `{10, 3.14, "Emily"}`). 외부 컬럼 구분자로도 `,`를 사용하면 STRUCT 내부 구분자와 충돌하여 파싱 오류가 발생합니다. STRUCT 내부에 나타나지 않는 `|` 또는 `\t`와 같은 문자를 사용하는 것이 좋습니다.

### 2. SQL에서 STRUCT 값을 직접 삽입하려면 어떻게 해야 하나요? {#2-how-to-insert-struct-values-directly-in-sql}

`named_struct` 함수를 사용하여 각 필드의 이름과 값을 명시적으로 지정합니다. 예를 들면 다음과 같습니다.

```sql
INSERT INTO struct_test VALUES(1, named_struct('f1', '1', 'f2', '2.0', 'f3', 'abc'));
```

### 3. STRUCT 필드에는 어떤 형태의 NULL을 사용할 수 있나요? {#3-what-forms-of-null-are-allowed-for-struct-fields}

| 데이터 형태 | 의미 |
|----------|------|
| `null` | STRUCT 컬럼 전체가 NULL입니다 |
| `{}` | STRUCT는 존재하지만 모든 필드가 NULL입니다 |
| `{10, null, "Emily"}` | 일부 필드는 NULL이고 나머지 필드에는 값이 정상적으로 할당되어 있습니다 |

### 4. JSON 데이터 적재 시 `strip_outer_array:true`를 설정해야 하는 이유는 무엇인가요? {#4-why-does-json-import-need-to-set-strip_outer_arraytrue}

JSON 파일이 여러 레코드를 배열(예: `[ {...}, {...} ]`)로 묶고 있다면, `strip_outer_array:true`를 설정해야 Doris가 가장 바깥쪽 배열을 제거하고 행별로 파싱할 수 있습니다. 그렇지 않으면 데이터 적재 시 배열 전체를 하나의 레코드로 처리합니다.
