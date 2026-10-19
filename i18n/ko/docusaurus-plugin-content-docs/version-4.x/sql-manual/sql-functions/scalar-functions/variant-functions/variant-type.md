---
{
    "title": "VARIANT_TYPE",
    "language": "ko",
    "description": "VARIANTTYPE 함수는 VARIANT 값의 실제 타입을 반환합니다."
}
---

## 기능 {#function}

`VARIANT_TYPE` 함수는 `VARIANT` 값의 실제 타입을 반환합니다.  
이 함수는 주로 `VARIANT` 데이터의 구조를 디버깅하거나 분석하는 데 사용되며, 타입 판별과 데이터 처리를 돕습니다.

## 구문 {#syntax}

```sql
VARIANT_TYPE(variant_value)
```

## 매개변수 {#parameters}

- `variant_value`: `VARIANT` 타입의 값입니다.

## 반환 값 {#return-value}

- `VARIANT` 값의 실제 타입을 나타내는 문자열을 반환합니다.
    - 문자열은 `{"key":"value"}` 구조를 따릅니다.
    - 키는 하위 필드 경로를 나타내고, 값은 타입을 나타냅니다.

## 참고 사항 {#notes}

1. `VARIANT` 열에 저장된 실제 타입을 확인하는 데 사용합니다.  
2. 테이블의 각 행에서 하위 필드를 읽어 타입을 확인합니다. 실제 사용 시에는 `LIMIT`로 행 수를 제한하여 실행이 느려지는 것을 방지하세요.

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

INSERT INTO variant_table VALUES(1, '{"a": 10, "b": 1.2, "c" : "ddddd"}'), (2, NULL);

SELECT VARIANT_TYPE(v) FROM variant_table;
+-------------------------------------------+
| VARIANT_TYPE(v)                           |
+-------------------------------------------+
| {"a":"tinyint","b":"double","c":"string"} |
| NULL                                      |
+-------------------------------------------+
```
