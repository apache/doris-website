---
{
    "title": "CONVERT_TZ",
    "language": "ko",
    "description": "datetime 값을 지정된 시간대 fromtz에서 지정된 시간대 totz로 변환하고 결과를 반환합니다. 시간대 설정의 경우,"
}
---

## 설명 {#description}

 datetime 값을 지정된 시간대 from_tz에서 지정된 시간대 to_tz로 변환하고 결과를 반환합니다. 시간대 설정은 [시간대 관리](../../../../admin-manual/cluster-management/time-zone) 문서를 참조하세요.

이 함수는 MySQL의 [convert_tz 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- | 
| `<dt>` | 변환할 값으로, datetime 또는 date 타입입니다. datetime 및 date 형식에 대한 자세한 내용은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<from_tz>` | dt의 원래 시간대입니다. 이 매개변수는 `varchar` 타입입니다. |
| `<to_tz>` | 변환할 대상 시간대입니다. 이 매개변수는 `varchar` 타입입니다. |

## 반환 값 {#return-value}

- 변환된 datetime 타입의 값
- 반환값의 scale은 입력값의 scale과 같습니다.
  - scale이 없는 datetime을 입력하면 반환 결과에도 scale이 없습니다.
  - scale이 있는 값을 입력하면 반환 결과의 scale도 같습니다.

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 입력한 시간대가 유효하지 않으면 오류를 반환합니다. 시간대 설정은 [시간대 관리](../../../../admin-manual/cluster-management/time-zone)를 참조하세요.
- date 타입을 입력하면 시간 부분은 자동으로 00:00:00으로 변환됩니다.

## 예제 {#examples}


```sql
-- Convert time from Shanghai, China to Los Angeles, USA
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), 'Asia/Shanghai', 'America/Los_Angeles');
+---------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles') |
+---------------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                       |
+---------------------------------------------------------------------------+

-- Convert the time '2019-08-01 13:21:03' in UTC+8 (+08:00) to Los Angeles, USA
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Angeles');

+--------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles') |
+--------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                |
+--------------------------------------------------------------------+

-- For date type input,return datetime type value, the time part is automatically converted to 00:00:00
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATE), 'Asia/Shanghai', 'America/Los_Angeles');
+-------------------------------------------------------------------------------------------+
| CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATE), 'Asia/Shanghai', 'America/Los_Angeles')   |
+-------------------------------------------------------------------------------------------+
| 2019-07-31 09:00:00                                                                       |
+-------------------------------------------------------------------------------------------+

-- When conversion time is NULL, output NULL
mysql> select CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York');
+-------------------------------------------------------+
| CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York') |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

-- When any time zone is NULL, return NULL
mysql> select CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles');
+----------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles') |
+----------------------------------------------------------------+
| NULL                                                           |
+----------------------------------------------------------------+

mysql> select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL);
+---------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL) |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+

-- Time with scale
mysql> select CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles');
+------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles') |
+------------------------------------------------------------------------+
| 2019-07-31 22:21:03.636                                                |
+------------------------------------------------------------------------+

-- When the input time zone is invalid, an error is returned.
select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Anges');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT][E33] Operation convert_tz invalid timezone: America/Los_Anges
```
