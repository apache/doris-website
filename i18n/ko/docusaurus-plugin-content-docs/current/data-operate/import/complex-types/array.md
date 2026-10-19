---
{
    "title": "ARRAY | 복합 타입",
    "language": "ko",
    "description": "테이블 생성, 구분자, 매개변수 예제와 함께 CSV 및 JSON 형식의 ARRAY 타입 데이터를 Stream Load로 Apache Doris에 적재하는 방법을 설명합니다.",
    "sidebar_label": "ARRAY",
    "keywords": [
        "ARRAY 데이터 적재",
        "배열 타입",
        "복합 타입 데이터 적재",
        "CSV 배열 데이터 적재",
        "JSON 배열 데이터 적재",
        "Stream Load",
        "ARRAY<T>",
        "Apache Doris 배열",
        "column_separator",
        "strip_outer_array"
    ]
}
---

<!-- Knowledge type: Procedure / Data import example -->
<!-- Applicable scenario: Importing data files containing array fields into Doris -->

`ARRAY<T>`는 T 타입의 요소로 구성된 배열을 나타내며, 태그, ID 목록, 여러 값을 갖는 속성 등을 저장하는 데 주로 사용됩니다. 이 타입의 구문, 제한 사항, 지원 함수는 [ARRAY 데이터 타입](../../../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md)을 참조하세요.

이 문서는 **ARRAY 필드가 포함된 데이터를 Doris에 적재하는 방법**을 다룹니다. 원본 데이터 형식에 따라 CSV와 JSON이라는 두 가지 일반적인 시나리오에 대해 전체 과정의 예제를 제공합니다.

## 적용 시나리오 {#applicable-scenarios}

| 데이터 소스 | 권장 방법 | 주요 매개변수 |
| --- | --- | --- |
| `|`, `\t` 또는 유사한 문자로 구분된 텍스트 파일 | CSV 형식의 Stream Load | `column_separator` |
| 중첩 구조의 JSON 배열 | JSON 형식의 Stream Load | `format=json`, `strip_outer_array` |

전체 절차는 다음과 같습니다:

1. 적절한 형식의 원본 데이터 파일을 준비합니다
2. Doris에 `ARRAY<T>` 열이 포함된 대상 테이블을 생성합니다
3. Stream Load로 파일을 적재합니다
4. 쿼리로 데이터가 올바르게 파싱되었는지 확인합니다

## CSV 형식 데이터 적재 {#csv-format-import}

### 단계 1: 데이터 준비 {#step-1-prepare-the-data}

CSV 파일 `test_array.csv`를 생성합니다. 배열 요소 자체가 쉼표로 구분되므로, 여기서는 배열 요소 구분자와 열 구분자가 충돌하지 않도록 `|`를 열 구분자로 사용합니다:

```text
1|[1,2,3,4,5]
2|[6,7,8]
3|[]
4|null
```

### 단계 2: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database}

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 단계 3: 데이터 적재 {#step-3-import-the-data}

Stream Load로 데이터를 적재하며, `column_separator`를 사용하여 `|`를 열 구분자로 지정합니다:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_array" \
        -T "test_array.csv" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 단계 4: 적재한 데이터 확인 {#step-4-check-the-imported-data}

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## JSON 형식 데이터 적재 {#json-format-import}

### 단계 1: 데이터 준비 {#step-1-prepare-the-data-1}

JSON 파일 `test_array.json`을 생성합니다. 최상위 구조는 객체로 이루어진 배열입니다:

```json
[
    {"id":1, "c_array":[1,2,3,4,5]},
    {"id":2, "c_array":[6,7,8]},
    {"id":3, "c_array":[]},
    {"id":4, "c_array":null}
]
```

### 단계 2: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database-1}

```sql
CREATE TABLE `array_test` (
    `id`         INT           NOT NULL,
    `c_array`    ARRAY<INT>    NULL
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 단계 3: 데이터 적재 {#step-3-import-the-data-1}

Stream Load로 데이터를 적재합니다. `format`을 `json`으로 설정하고 `strip_outer_array:true`를 사용하여 최상위 배열을 여러 행으로 나눕니다:

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_array" \
        -H "strip_outer_array:true" \
        -T "test_array.json" \
        http://localhost:8040/api/testdb/array_test/_stream_load
```

### 단계 4: 적재한 데이터 확인 {#step-4-check-the-imported-data-1}

```sql
mysql> SELECT * FROM array_test;
+------+-----------------+
| id   | c_array         |
+------+-----------------+
|    1 | [1, 2, 3, 4, 5] |
|    2 | [6, 7, 8]       |
|    3 | []              |
|    4 | NULL            |
+------+-----------------+
4 rows in set (0.01 sec)
```

## 주요 매개변수 설명 {#key-parameter-description}

| 매개변수 | 적용 형식 | 설명 |
| --- | --- | --- |
| `column_separator` | CSV | 열 구분자입니다. 배열에 쉼표가 포함된 경우 배열 요소 구분자와 충돌하지 않도록 `|` or `\t` 같은 문자를 사용하는 것이 좋습니다 |
| `columns` | CSV / JSON | 데이터 열과 테이블 열 간의 매핑 순서를 지정합니다 |
| `format` | JSON | 입력을 JSON 형식으로 파싱하려면 `json`으로 설정합니다 |
| `strip_outer_array` | JSON | `true`로 설정하면 최상위 `[]`를 제거하고 내부의 각 객체를 하나의 행으로 적재합니다 |

## 자주 묻는 질문 {#faq}

### 배열에 쉼표가 포함되어 있으면 CSV 열 구분자로 쉼표를 사용할 수 없는 이유는 무엇인가요? {#when-the-array-contains-commas-why-cannot-the-csv-column-separator-be-a-comma}

CSV 파일에서 `ARRAY`는 `[1,2,3]` 형태로 표현되며, 요소는 쉼표로 구분됩니다. 열 구분자도 쉼표이면 파서가 배열 내부 구분자와 열 구분자를 구별할 수 없어 파싱 오류가 발생합니다. 배열 내용에 나타나지 않는 `|` 또는 `\t` 등의 문자를 사용하세요.

### NULL 배열과 빈 배열은 어떻게 표현하나요? {#how-to-represent-null-arrays-and-empty-arrays}

- **NULL 배열**: `null`을 직접 작성하거나(CSV), JSON 리터럴 `null`을 사용합니다. 적재 후 값은 `NULL`입니다
- **빈 배열**: `[]`로 작성합니다. 적재 후 값은 `[]`입니다. 두 배열은 의미가 다릅니다

### JSON 파일의 최상위 구조가 배열이 아니면 어떻게 하나요? {#what-if-the-outermost-layer-of-the-json-file-is-not-an-array}

파일의 각 줄이 독립적인 JSON 객체(JSON Lines)라면 `strip_outer_array`를 설정할 필요가 없습니다. 최상위 구조가 `[ {...}, {...} ]` 형태일 때만 `strip_outer_array`를 `true`로 설정해야 합니다.
