---
{
    "title": "JSON | 복합 타입",
    "language": "ko",
    "description": "이 문서에서는 Apache Doris JSON 타입의 기능과 용량 제한을 설명하고, CSV 및 JSON 형식의 Stream Load 적재 방법과 예제를 소개합니다.",
    "keywords": [
        "Doris JSON",
        "JSON 데이터 타입",
        "JSONB",
        "JSON 적재",
        "Stream Load JSON",
        "json_extract",
        "복합 타입 적재",
        "반정형 데이터"
    ],
    "sidebar_label": "JSON"
}
---

<!-- Knowledge type: Data type description + Operation steps -->
<!-- Use case: Semi-structured data modeling / JSON data import -->

## 개요 {#overview}

`JSON`은 Apache Doris가 제공하는 복합 데이터 타입입니다. JSON 데이터를 바이너리 형식으로 효율적으로 저장하며, 내부 필드에 접근할 수 있는 JSON 함수를 제공합니다. 이벤트 추적 로그, 사용자 속성, 설정 항목과 같은 반정형 데이터를 저장하고 내부 필드에 빠르게 접근해야 하는 경우에 이 타입을 사용하세요.

JSON 문자열을 `String` 타입으로 저장하는 것과 비교하면, `JSON` 타입은 다음과 같은 장점이 있습니다.

1. **데이터 검증**: Doris가 쓰기 시 JSON 형식을 자동으로 검증하여 잘못된 데이터가 저장되는 것을 방지합니다.
2. **효율적인 접근**: 바이너리 저장 형식은 더 적은 공간을 차지하며, `json_extract`와 같은 함수로 JSON 필드에 접근하면 `get_json_xx` 함수를 사용할 때보다 몇 배 더 빠릅니다.

### 용량 제한 {#capacity-limits}

| 항목 | 기본값 | 최댓값 | 조정 방법 |
| --- | --- | --- | --- |
| 단일 JSON 필드 크기 | 1 MB (1048576 바이트) | 2 GB (2147483643 바이트) | BE 설정 `string_type_length_soft_limit_bytes` 조정 |

:::caution[버전 호환성]
버전 1.2.x에서는 JSON 타입의 이름이 `JSONB`였습니다. MySQL과의 호환성을 위해 버전 2.0.0부터 `JSON`으로 이름이 변경되었습니다. `JSONB`로 생성한 기존 테이블은 계속 정상적으로 동작합니다.
:::

## 적재 방식 선택 {#choose-an-import-method}

원본 데이터 파일의 형식에 따라 적재 방식을 선택하세요.

| 원본 파일 형식 | 사용 사례 | 주요 매개변수 |
| --- | --- | --- |
| CSV | 각 줄에 레코드 하나가 있는 구분자 기반 파일의 데이터 | `column_separator` (쉼표 이외의 구분자, 예를 들어 `|` 사용 권장) |
| JSON | 데이터가 이미 JSON 배열 또는 JSON Lines 형식인 경우 | `format:json`, `strip_outer_array:true` |

다음 절에서는 Stream Load를 예로 들어 두 방식의 전체 적재 과정을 설명합니다.

## CSV 형식으로 적재 {#import-via-csv-format}

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

CSV 파일 `test_json.csv`를 생성합니다. JSON은 내부적으로 쉼표를 사용하여 필드를 구분하므로, 충돌을 방지하려면 열 구분자로 `|`를 사용하세요.

```text
1|{"name": "tom", "age": 35}
2|{"name": null, "age": 28}
3|{"name": "micheal", "age": null}
4|{"name": null, "age": null}
5|null
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database}

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-import-the-data}

Stream Load 작업을 제출합니다. 열 구분자를 `|`로 지정하도록 `column_separator`를 설정합니다.

```bash
curl --location-trusted \
    -u "root":"" \
    -H "column_separator:|" \
    -H "columns: id, c_json" \
    -T "test_json.csv" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data}

```sql
SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | null                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## JSON 형식으로 적재 {#import-via-json-format}

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

JSON 파일 `test_json.json`을 생성합니다. 파일 내용은 JSON 배열이며, 각 요소는 레코드 한 행에 해당합니다.

```json
[
    {"id": 1, "c_json": {"name": "tom", "age": 35}},
    {"id": 2, "c_json": {"name": null, "age": 28}},
    {"id": 3, "c_json": {"name": "micheal", "age": null}},
    {"id": 4, "c_json": {"name": null, "age": null}},
    {"id": 5, "c_json": null}
]
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database-1}

```sql
CREATE TABLE json_test (
    id          INT     NOT NULL,
    c_json      JSON    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-import-the-data-1}

Stream Load 작업을 제출합니다. `format:json`을 설정하고, `strip_outer_array:true`를 사용하여 바깥쪽 배열을 해제합니다.

```bash
curl --location-trusted \
    -u "root":"" \
    -H "format:json" \
    -H "columns: id, c_json" \
    -H "strip_outer_array:true" \
    -T "test_json.json" \
    http://localhost:8040/api/testdb/json_test/_stream_load
```

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data-1}

```sql
mysql> SELECT * FROM json_test;
+------+-------------------------------+
| id   | c_json                        |
+------+-------------------------------+
|    1 | {"name":"tom","age":35}       |
|    2 | {"name":null,"age":28}        |
|    3 | {"name":"micheal","age":null} |
|    4 | {"name":null,"age":null}      |
|    5 | NULL                          |
+------+-------------------------------+
5 rows in set (0.01 sec)
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**질문 1: JSON 필드의 최대 크기는 얼마인가요?**

기본 제한은 1 MB (1048576 바이트)입니다. BE 설정 `string_type_length_soft_limit_bytes`를 조정하면 최대 2 GB (2147483643 바이트)까지 늘릴 수 있습니다.

**질문 2: `JSONB` 필드를 버전 1.2.x에서 생성했다면 업그레이드 후 수정해야 하나요?**

수정할 필요가 없습니다. 버전 2.0.0부터 타입 이름이 `JSON`으로 변경되었지만, `JSONB`로 생성한 기존 테이블은 계속 정상적으로 읽기와 쓰기를 지원합니다.

**질문 3: JSON 저장에 `JSON` 타입을 `String`보다 권장하는 이유는 무엇인가요?**

`JSON` 타입은 쓰기 시 형식을 검증하여 잘못된 데이터가 저장되는 것을 방지합니다. 바이너리 저장 방식으로 더 적은 공간을 차지하며, `json_extract`와 같은 함수로 필드에 접근하면 `get_json_xx` 함수를 사용할 때보다 몇 배 더 빠릅니다.

**질문 4: CSV 적재 시 `|` 구분자를 사용하는 이유는 무엇인가요?**

JSON 자체에 쉼표가 포함되어 있으므로, 쉼표를 열 구분자로 사용하면 파싱 오류가 발생합니다. JSON 문자열에 나타나지 않는 문자(예: `|`)를 열 구분자로 선택하세요.

**질문 5: JSON 배열을 적재할 때 `strip_outer_array:true`가 필요한 이유는 무엇인가요?**

이 매개변수는 Stream Load가 바깥쪽 JSON 배열을 해제하고 배열의 각 요소를 독립적인 행으로 적재하도록 지정합니다. 이 매개변수가 없으면 배열 전체가 하나의 레코드로 처리됩니다.
