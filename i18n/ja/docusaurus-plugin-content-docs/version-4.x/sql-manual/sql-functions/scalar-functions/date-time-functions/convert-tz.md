---
{
    "title": "CONVERT_TZ",
    "language": "ja",
    "description": "日時値を指定したタイムゾーン fromtz から totz に変換して返します。タイムゾーンの設定については、"
}
---

## 説明

日時値を指定したタイムゾーン from_tz から to_tz に変換し、結果を返します。タイムゾーンの設定については、[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。

この関数の動作は、MySQL の [convert_tz 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz)と同じです。

## 構文

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- | 
| `<dt>` | 変換する値。DATETIME 型または DATE 型です。使用できる日時および日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<from_tz>` | dt の元のタイムゾーン。`varchar` 型です。 |
| `<to_tz>` | 変換先のタイムゾーン。`varchar` 型です。 |

## 戻り値

- 変換後の値を DATETIME 型で返します。
- 戻り値の小数秒の桁数は入力と同じです。
  - 小数秒を含まない DATETIME 値を入力した場合、戻り値にも小数秒はありません。
  - 小数秒を含む値を入力した場合、戻り値の小数秒の桁数は入力と同じです。

特殊なケース:
- いずれかのパラメータが NULL の場合は、NULL を返します。
- 指定したタイムゾーンが無効な場合は、エラーを返します。タイムゾーンの設定については、[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。
- DATE 型の値を入力した場合、時刻部分は自動的に 00:00:00 に変換されます。

## 使用例


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
