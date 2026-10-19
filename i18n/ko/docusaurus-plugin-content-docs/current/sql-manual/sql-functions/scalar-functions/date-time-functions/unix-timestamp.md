---
{
    "title": "UNIX_TIMESTAMP",
    "language": "ko",
    "description": "DATE, DATETIME 또는 TIMESTAMP_NS 값을 Unix 타임스탬프로 변환하며, TIMESTAMP_NS 입력의 경우 소수점 이하 아홉 자리를 유지합니다."
}
---

## 설명 {#description}

`DATE`, `DATETIME` 또는 `TIMESTAMP_NS` 값을 Unix 타임스탬프로 변환합니다.

매개변수를 지정하지 않으면 현재 시간을 타임스탬프로 변환합니다.

날짜와 시간 인수를 지정하는 경우, 해당 인수는 `DATE`, `DATETIME` 또는 `TIMESTAMP_NS`여야 합니다.

형식 지정에 대해서는 date_format 함수의 형식 설명을 참조하세요.

이 함수는 시간대의 영향을 받습니다. 시간대에 대한 자세한 내용은 [시간대 관리](../../../../admin-manual/cluster-management/time-zone)를 참조하세요.

이 함수는 MySQL의 [unix_timestamp 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_date_expr>` | 입력 날짜 및 시간 값입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`를 지원합니다. |
| `<fmt>` | 날짜 매개변수에서 타임스탬프로 변환할 부분을 지정하며, 타입은 문자열입니다. 이 매개변수를 지정하면 형식과 일치하는 부분만 타임스탬프로 변환됩니다. |

## 반환 값 {#return-value}
반환 타입은 입력에 따라 달라집니다.

1. `TIMESTAMP_NS` 입력은 소수점 이하 아홉 자리의 `DECIMAL` 타임스탬프를 반환합니다.
2. `DATETIME` 입력의 스케일이 영이 아니거나 `<fmt>`를 사용하여 호출하면 소수점 이하 최대 여섯 자리의 `DECIMAL` 타임스탬프를 반환합니다.
3. `DATE` 입력이나 스케일이 0인 `DATETIME` 입력에 `<fmt>`가 없으면 `INT` 타임스탬프를 반환합니다.

입력 시간을 해당 타임스탬프로 변환하며, 기준 시각은 1970-01-01 00:00:00입니다.

- 매개변수 중 하나라도 null이면 null을 반환합니다.
- 형식이 올바르지 않으면 오류를 반환합니다.

## 예제 {#examples}

```sql
-- Input datetime is the begin datetime
mysql> select unix_timestamp('1970-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1970-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Display timestamp of current time
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1753933330 |
+------------------+

-- Input a datetime to display its timestamp
mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+


-- Match format to display timestamp for given datetime
mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------------------------------------------------+
|                                          1196389819.000000 |
+------------------------------------------------------------+

-- Input with non-zero scale
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+

-- For datetime before 1970-01-01, returns 0
select unix_timestamp('1007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('1007-11-30 10:30:19') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Returns NULL if any parameter is null
mysql> select unix_timestamp(NULL);
+----------------------+
| unix_timestamp(NULL) |
+----------------------+
|                 NULL |
+----------------------+

-- Returns an error if format is invalid
mysql> select unix_timestamp('2007-11-30 10:30-19', 's');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation unix_timestamp of 2007-11-30 10:30-19, s is invalid
```
