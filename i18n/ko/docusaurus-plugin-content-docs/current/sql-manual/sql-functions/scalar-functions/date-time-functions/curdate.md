---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "ko",
    "description": "현재 날짜를 가져와 DATE 타입으로 반환합니다."
}
---

## 설명 {#description}

현재 날짜를 가져와 DATE 타입으로 반환합니다.

이 함수는 MySQL의 [curdate 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate)와 동일하게 동작합니다.

## 별칭 {#aliases}

- current_date

## 구문 {#syntax}

```sql
CURDATE()
```

## 반환 값 {#return-value}

현재 날짜를 date 타입으로 반환합니다.

## 예제 {#examples}

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
