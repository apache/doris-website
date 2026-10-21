---
{
    "title": "CONVERT_TZ",
    "language": "ko",
    "description": "datetime 값을 지정된 시간대 fromtz에서 지정된 시간대 totz로 변환하여 결과를 반환합니다. 시간대 설정에 대해서는 다음을 참조하세요."
}
---

## 설명 {#description}

 datetime 값을 지정된 시간대 from_tz에서 지정된 시간대 to_tz로 변환하여 결과를 반환합니다. 시간대 설정에 대해서는 [시간대 관리](../../../../admin-manual/cluster-management/time-zone) 문서를 참조하세요.

이 함수는 MySQL의 [convert_tz 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- | 
| `<dt>` | 변환할 값입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`를 지원합니다. |
| `<from_tz>` | dt의 원래 시간대입니다. 이 매개변수는 `varchar` 타입입니다. |
| `<to_tz>` | 변환할 대상 시간대입니다. 이 매개변수는 `varchar` 타입입니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 입력은 초 소수부 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과는 반환 타입의 범위를 기준으로 검증됩니다. `TIMESTAMP_NS`의 범위는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`입니다.

- 변환된 datetime 타입의 값
- 반환 값의 소수 자릿수는 입력 값과 동일합니다
  - 소수 자릿수가 없는 datetime 입력의 경우 반환 결과에도 소수 자릿수가 없습니다
  - 소수 자릿수가 있는 입력의 경우 반환 결과의 소수 자릿수는 입력과 동일합니다

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 입력한 시간대가 유효하지 않으면 오류를 반환합니다. 시간대 설정에 대해서는 [시간대 관리](../../../../admin-manual/cluster-management/time-zone)를 참조하세요.
- date 타입 입력의 경우 시간 부분이 자동으로 00:00:00으로 변환됩니다

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
