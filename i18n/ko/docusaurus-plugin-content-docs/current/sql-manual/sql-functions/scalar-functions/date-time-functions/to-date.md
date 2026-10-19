---
{
    "title": "TO_DATE",
    "language": "ko",
    "description": "이 함수는 CAST(<STRING> TO DATE)와 동일합니다."
}
---

## 설명 {#description}

이 함수는 `CAST(<STRING> TO DATE)`와 동일합니다.

TO_DATE 함수는 datetime 값을 DATE 타입(연도, 월, 일만 포함하며 YYYY-MM-DD 형식)으로 변환하는 데 사용됩니다. 이 함수는 입력값의 시간 부분(시, 분, 초, 마이크로초)을 자동으로 무시하고 날짜 부분만 추출하여 변환합니다.

## 구문 {#syntax}
```sql
TO_DATE(`<datetime_value>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<datetime_value>` | `DATETIME` 또는 `TIMESTAMP_NS` 값입니다. 시간 및 소수 초 필드는 무시됩니다. |

## 반환 값 {#return-value}

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
