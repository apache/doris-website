---
{
    "title": "CONVERT_TZ",
    "language": "ja",
    "description": "日時値を指定したタイムゾーン fromtz から指定したタイムゾーン totz に変換し、結果を返します。タイムゾーンの設定については、"
}
---

## 説明

日時値を指定したタイムゾーン from_tz から指定したタイムゾーン to_tz に変換し、結果を返します。タイムゾーンの設定については、[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)のドキュメントを参照してください。

この関数の動作は MySQL の [convert_tz 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz)と一致します。

## 構文

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- | 
| `<dt>` | 変換する値。`DATE`、`DATETIME`、`TIMESTAMP_NS` をサポートします。 |
| `<from_tz>` | dt の元のタイムゾーン。型は `varchar` です。 |
| `<to_tz>` | 変換先のタイムゾーン。型は `varchar` です。 |

## 戻り値

入力が `TIMESTAMP_NS` の場合、小数秒の精度が固定で九桁の `TIMESTAMP_NS` を返します。結果は戻り値の型が許容する範囲に対して検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

- 変換後の日時型の値を返します。
- 戻り値の小数秒桁数は入力と同じです。
  - 小数秒桁数が指定されていない日時入力の場合、戻り値にも小数秒桁数はありません。
  - 小数秒桁数が指定された入力の場合、戻り値も同じ桁数になります。

特殊なケース:
- いずれかのパラメータが NULL の場合は NULL を返します。
- 入力タイムゾーンが無効な場合はエラーを返します。タイムゾーンの設定については、[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。
- 日付型の入力では、時刻部分が自動的に 00:00:00 に変換されます。

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
