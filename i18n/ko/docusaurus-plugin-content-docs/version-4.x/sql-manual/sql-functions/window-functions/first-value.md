---
{
    "title": "FIRST_VALUE",
    "language": "ko",
    "description": "FIRSTVALUE()는 윈도우 파티션 내에서 정렬된 값 집합의 첫 번째 값을 반환하는 윈도우 함수입니다."
}
---

## 설명 {#description}

FIRST_VALUE()는 윈도우 파티션 내에서 정렬된 값 집합의 첫 번째 값을 반환하는 윈도우 함수입니다. NULL 값 처리 방식은 IGNORE NULL 옵션으로 제어할 수 있습니다.

## 구문 {#syntax}

```sql
FIRST_VALUE(expr[, ignore_null])
```

## 매개변수 {#parameters}
| 매개변수            | 설명                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | 첫 번째 값을 가져올 표현식입니다. 지원되는 타입: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                                    |
| ignore_null         | 선택 사항인 boolean 타입입니다. 설정하면 NULL 값을 무시하고 첫 번째 NULL이 아닌 값을 반환합니다.                                     |

## 반환값 {#return-value}

입력 표현식과 동일한 데이터 타입을 반환합니다.

## 예제 {#examples}

```sql
WITH example_data AS (
    SELECT 1 as column1, NULL as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, NULL, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, NULL, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS first_value_default,
    FIRST_VALUE(column2, true) OVER (
        PARTITION BY column1 
        ORDER BY column2
    ) AS first_value_ignore_null
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+---------------------+-------------------------+
| group_name | column1 | column2 | first_value_default | first_value_ignore_null |
+------------+---------+---------+---------------------+-------------------------+
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |      10 |                  10 |                      10 |
| A          |       1 |      20 |                  10 |                      10 |
| B          |       2 |    NULL |                  30 |                    NULL |
| B          |       2 |      30 |                  30 |                      30 |
| B          |       2 |      40 |                  30 |                      30 |
+------------+---------+---------+---------------------+-------------------------+
```
