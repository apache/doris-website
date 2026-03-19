---
{
  "title": "CONVERT_TZ",
  "language": "ja",
  "description": "指定されたタイムゾーンfromtzから指定されたタイムゾーンtotzへdatetime値を変換し、結果を返します。タイムゾーン設定については、"
}
---
## 説明

指定されたタイムゾーンfrom_tzから指定されたタイムゾーンto_tzにdatetime値を変換し、結果を返します。タイムゾーンの設定については、[Time Zone Management](../../../../admin-manual/cluster-management/time-zone)ドキュメントを参照してください。

この関数はMySQLの[convert_tz function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz)と一貫性があります。

## 構文

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- | 
| `<dt>` | 変換対象の値で、datetime型またはdate型です。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<from_tz>` | dtの元のタイムゾーン、このパラメータは`varchar`型です |
| `<to_tz>` | 変換先のタイムゾーン、このパラメータは`varchar`型です |

## 戻り値

- 変換されたdatetime型の値
- 返されるスケールは入力のスケールと同じです
  - スケールなしのdatetime入力の場合、返される結果もスケールなし
  - スケールありの入力の場合、返される結果は同じスケール

特殊ケース:
- いずれかのパラメータがNULLの場合、NULLを返します。
- 入力タイムゾーンが無効な場合、エラーを返します。タイムゾーン設定については、[Time Zone Management](../../../../admin-manual/cluster-management/time-zone)を参照してください。
- date型の入力の場合、時間部分は自動的に00:00:00に変換されます

## 例

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
| CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATEV2), 'Asia/Shanghai', 'America/Los_Angeles') |
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
