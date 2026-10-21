---
{
    "title": "VARIANT_TYPE",
    "language": "ko",
    "description": "VARIANT_TYPE은 VARIANT 값의 타입 이름(예: object, array, string, bigint, double)을 반환하여 VARIANT 데이터의 디버깅과 분석을 돕습니다."
}
---

## 기능 {#function}

`VARIANT_TYPE` 함수는 `VARIANT` 값의 타입 이름을 반환합니다.
주로 `VARIANT` 데이터의 구조를 디버깅하거나 분석할 때 사용하며, 타입 확인과 데이터 처리를 돕습니다. 이 페이지에서는 Doris 5.0.0 이상 버전에서의 동작을 설명합니다.

## 구문 {#syntax}

```sql
VARIANT_TYPE(variant_value)
```

## 매개변수 {#parameters}

- `variant_value`: `VARIANT` 타입의 값입니다. 중첩된 값의 타입을 확인하려면 경로를 전달하세요. 예: `VARIANT_TYPE(v['a'])`.

## 반환 값 {#return-value}

값 자체의 타입 이름을 `STRING`으로 반환합니다. 객체나 배열인 경우 `object` 또는 `array`를 반환하며, 내부 요소의 타입을 나열하지는 않습니다.

| 결과 | 값 |
| --- | --- |
| `object`, `array` | JSON 객체 또는 배열 |
| `string` | 문자열 |
| `bool` | `true` 또는 `false` |
| `tinyint`, `smallint`, `int`, `bigint` | 정수. 해당 값을 담을 수 있는 가장 작은 타입으로 표시됨 |
| `decimal` | 십진수. `BIGINT` 범위를 넘는 정수와 최대 38자리의 `LARGEINT` 값도 포함 |
| `float`, `double` | 부동 소수점 숫자 |
| `date` | 날짜 |
| `timestamp` | 시간대가 있는 타임스탬프 |
| `timestamp_ntz` | 시간대가 없는 타임스탬프. 예: `DATETIME` 또는 `TIMESTAMP_NS` 값 |
| `null` | VARIANT `null` (JSON `null`) |
| `binary`, `time`, `uuid` | Doris의 JSON 파싱이나 CAST로는 생성되지 않는 값. 다른 시스템에서 기록한 VARIANT 데이터(예: Parquet 파일)에서 가져올 수 있음 |

SQL `NULL`을 입력하면 SQL `NULL`을 반환합니다.

## 참고 사항 {#notes}

1. `VARIANT` 열에 있는 값의 실제 타입을 확인할 때 사용합니다. 테이블에서 읽은 값의 경우 결과는 저장된 값을 반영합니다. 예를 들어 루트 값의 `DATE`는 문자열로 저장됩니다. [저장 시 유지되는 정보](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)를 참조하세요.
2. 결과는 경로의 저장 타입이 아니라 값의 타입입니다. 예를 들어 `BIGINT` 경로에서 읽은 정수의 타입이 `tinyint`일 수 있습니다. 테이블의 각 하위 열의 저장 타입을 확인하려면 `SET describe_extend_variant_column = true;`와 `DESC`를 사용하세요.
3. 이 함수는 모든 행을 읽으므로 실제 사용 시 `LIMIT`으로 행 수를 제한하세요.

## 예제 {#example}

```SQL
CREATE TABLE variant_table(
    k INT,
    v VARIANT NULL
)
DUPLICATE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO variant_table VALUES
    (1, PARSE_TO_VARIANT('{"a": 10, "b": 1.2, "c": "ddddd"}')),
    (2, PARSE_TO_VARIANT('[1, 2]')),
    (3, NULL);

SELECT k,
       VARIANT_TYPE(v)      AS root_type,
       VARIANT_TYPE(v['a']) AS a_type,
       VARIANT_TYPE(v['b']) AS b_type,
       VARIANT_TYPE(v['c']) AS c_type
FROM variant_table
ORDER BY k;
```

```text
+------+-----------+---------+--------+--------+
| k    | root_type | a_type  | b_type | c_type |
+------+-----------+---------+--------+--------+
|    1 | object    | tinyint | double | string |
|    2 | array     | NULL    | NULL   | NULL   |
|    3 | NULL      | NULL    | NULL   | NULL   |
+------+-----------+---------+--------+--------+
```
