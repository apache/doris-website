---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "ko",
    "description": "현재 시간을 가져와 TIME 타입으로 반환합니다."
}
---

## 설명 {#description}

현재 시간을 가져와 TIME 타입으로 반환합니다.

이 함수는 MySQL의 [curtime 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curtime)와 동일하게 동작합니다.

## 별칭 {#aliases}

- CURRENT_TIME

## 구문 {#syntax}

```sql
CURTIME([<precision>])
```

## 매개변수 {#parameters}

| 매개변수     | 설명                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 반환값에서 초의 소수 부분의 정밀도를 나타내는 선택적 매개변수입니다. 0에서 6 사이의 상수여야 합니다. 기본값은 0이며, 이 경우 초의 소수 부분을 반환하지 않습니다. |

## 반환값 {#return-value}

현재 시간을 TIME 타입으로 반환합니다.

## 예제 {#examples}

```sql
mysql> select curtime();

+----------------+
| curtime()      |
+----------------+
| 15:25:47       |
+----------------+
```

```sql
mysql> select curtime(0);
+------------+
| curtime(0) |
+------------+
| 13:15:27   |
+------------+
```

```sql
mysql> select curtime(4);
+---------------+
| curtime(4)    |
+---------------+
| 15:31:03.8958 |
+---------------+
```

```sql
mysql> select curtime(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = The precision must be between 0 and 6
```
