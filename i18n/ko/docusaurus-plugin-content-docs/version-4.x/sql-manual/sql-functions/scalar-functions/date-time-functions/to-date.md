---
{
    "title": "TO_DATE",
    "language": "ko",
    "description": "이 함수는 CAST(<STRING> TO DATE)와 동일합니다."
}
---

## 설명 {#description}

이 함수는 `CAST(<STRING> TO DATE)`와 동일합니다.

TO_DATE 함수는 datetime 값을 DATE 타입(YYYY-MM-DD 형식으로 연도, 월, 일만 포함)으로 변환하는 데 사용됩니다. 이 함수는 입력값에서 시간 부분(시, 분, 초, 마이크로초)을 자동으로 무시하고 날짜 부분만 추출하여 변환합니다.

## 구문 {#syntax}
```sql
TO_DATE(`<datetime_value>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<datetime_value>` | DATETIME 타입의 datetime 값입니다. DATETIME 형식을 지원하며, datetime 형식에 대해서는 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요. |

## 반환값 {#return-value}

DATE 타입을 반환합니다.

## 예제 {#examples}

```sql
-- Extract the date part from datetime
select to_date("2020-02-02 00:00:00");

+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+

-- Input date, returns itself
select to_date("2020-02-02");
+-----------------------+
| to_date("2020-02-02") |
+-----------------------+
| 2020-02-02            |
+-----------------------+

-- Input NULL, returns NULL
SELECT TO_DATE(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
