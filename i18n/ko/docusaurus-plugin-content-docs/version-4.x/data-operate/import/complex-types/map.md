---
{
    "title": "MAP | 복합 타입",
    "language": "ko",
    "description": "Apache Doris의 MAP 타입 열에 데이터를 적재하는 방법을 알아봅니다. CSV와 JSON 형식 모두에 대해 테이블 생성, Stream Load 명령, 결과 확인 방법을 다룹니다.",
    "keywords": [
        "Doris MAP 데이터 적재",
        "MAP 데이터 타입",
        "복합 타입 데이터 적재",
        "Stream Load MAP",
        "CSV 데이터 적재 MAP",
        "JSON 데이터 적재 MAP",
        "반정형 데이터"
    ],
    "sidebar_label": "MAP"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Complex type data load / Stream Load practice -->

`MAP<K, V>`는 `MAP`을 나타내며, 각 요소의 타입은 `K, V`입니다. 주로 반정형 키-값 쌍 데이터를 저장하는 데 사용됩니다. 자세한 내용은 [MAP 데이터 타입](../../../sql-manual/basic-element/sql-data-types/semi-structured/MAP.md)을 참고하세요.

이 문서는 **MAP 타입 열에 데이터를 쓰는 방법**을 중심으로, 자주 사용하는 두 가지 데이터 소스에 대한 전체 과정의 예제를 제공합니다.

- [CSV 형식 데이터 적재](#csv-format-load): 원본 데이터가 구분자로 나뉜 텍스트일 때 적합합니다. 열 구분자와 MAP 내부의 쉼표가 충돌하지 않도록 주의하세요.
- [JSON 형식 데이터 적재](#json-format-load): 원본 데이터가 JSON 배열 또는 JSON Lines일 때 적합합니다.

두 데이터 적재 방식 모두 [Stream Load](../import-way/stream-load-manual.md) 인터페이스를 사용합니다. 기본 절차는 다음과 같습니다.

1. 데이터 파일을 준비합니다.
2. 데이터베이스에 테이블을 생성합니다.
3. `curl`로 Stream Load를 호출하여 데이터를 적재합니다.
4. 쿼리로 결과를 확인합니다.

## CSV 형식 데이터 적재 {#csv-format-load}

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

다음 내용으로 CSV 파일 `test_map.csv`를 생성합니다. MAP 내부의 쉼표와 충돌하지 않도록 열 구분자로 쉼표 대신 `|`를 사용합니다.

```text
1|{"Emily":101,"age":25}
2|{"Benjamin":102}
3|{}
4|null
```

파일의 각 행은 다음을 의미합니다.

| 행 | 의미 |
| --- | --- |
| `1\|{"Emily":101,"age":25}` | 키-값 쌍 두 개를 포함하는 MAP |
| `2\|{"Benjamin":102}` | 키-값 쌍 한 개를 포함하는 MAP |
| `3\|{}` | 빈 MAP |
| `4\|null` | NULL 값 |

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database}

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-load-the-data}

Stream Load를 사용해 CSV 파일의 데이터를 적재합니다. 주요 헤더의 의미는 아래 표와 같습니다.

```bash
curl --location-trusted \
        -u "root":"" \
        -H "column_separator:|" \
        -H "columns: id, c_map" \
        -T "test_map.csv" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| 헤더 | 용도 |
| --- | --- |
| `column_separator:|` | 열 구분자를 `|`로 설정하여 MAP 내부의 쉼표와 충돌하지 않도록 함 |
| `columns: id, c_map` | 파일 열과 테이블 열 간의 매핑을 선언함 |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-loaded-data}

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## JSON 형식 데이터 적재 {#json-format-load}

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

다음 내용으로 JSON 파일 `test_map.json`을 생성합니다. 파일 전체가 하나의 JSON 배열이며, 각 요소는 데이터 한 행에 해당합니다.

```json
[
    {"id":1, "c_map":{"Emily":101, "age":25}},
    {"id":2, "c_map":{"Benjamin":102}},
    {"id":3, "c_map":{}},
    {"id":4, "c_map":null}
]
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database-1}

```sql
CREATE TABLE map_test (
    id       INT                 NOT NULL,
    c_map    MAP<STRING, INT>    NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 3단계: 데이터 적재 {#step-3-load-the-data-1}

Stream Load를 사용해 JSON 파일의 데이터를 적재합니다. 주요 헤더의 의미는 아래 표와 같습니다.

```bash
curl --location-trusted \
        -u "root":"" \
        -H "format:json" \
        -H "columns: id, c_map" \
        -H "strip_outer_array:true" \
        -T "test_map.json" \
        http://localhost:8040/api/testdb/map_test/_stream_load
```

| 헤더 | 용도 |
| --- | --- |
| `format:json` | 데이터 형식을 JSON으로 선언함 |
| `strip_outer_array:true` | 입력이 JSON 배열이면 각 배열 요소를 한 행으로 파싱함 |
| `columns: id, c_map` | JSON 필드와 테이블 열 간의 매핑을 선언함 |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-loaded-data-1}

```sql
mysql> SELECT * FROM map_test;
+------+-------------------------+
| id   | c_map                   |
+------+-------------------------+
|    1 | {"Emily":101, "age":25} |
|    2 | {"Benjamin":102}        |
|    3 | {}                      |
|    4 | NULL                    |
+------+-------------------------+
4 rows in set (0.01 sec)
```

## 자주 묻는 질문 {#faq}

**Q1: CSV에서 열 구분자로 쉼표를 사용하지 않는 이유는 무엇인가요?**

MAP 리터럴 자체에서 여러 키-값 쌍을 구분하는 데 쉼표를 사용합니다. 예를 들어 `{"Emily":101,"age":25}`와 같습니다. 열 구분자로도 쉼표를 사용하면 파싱이 모호해집니다. `|` 또는 `\t`처럼 MAP 내용에 나타나지 않는 문자를 사용하는 것이 좋습니다.

**Q2: JSON 배열을 적재할 때 `strip_outer_array:true`가 필요한 이유는 무엇인가요?**

JSON 파일의 최상위 구조가 이 문서의 예제처럼 배열이면, `strip_outer_array:true`를 설정해야 Doris가 배열의 각 요소를 데이터 한 행으로 처리합니다. 파일이 이미 JSON Lines 형식(행마다 객체 하나)이라면 이 매개변수는 필요하지 않습니다.

**Q3: 빈 MAP과 NULL은 각각 어떻게 표현하나요?**

- 빈 MAP: CSV에서는 `{}`로, JSON에서도 `{}`로 작성합니다.
- NULL 값: CSV에서는 `null`로, JSON에서도 `null`로 작성합니다. 대상 열은 `NULL`을 허용해야 합니다.
