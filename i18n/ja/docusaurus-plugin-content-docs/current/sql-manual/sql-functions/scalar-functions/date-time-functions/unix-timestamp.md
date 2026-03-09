---
{
  "title": "UNIX_TIMESTAMP",
  "language": "ja",
  "description": "DateまたはDatetime型をunixタイムスタンプに変換します。"
}
---
## 説明

DateまたはDatetime型をunixタイムスタンプに変換します。

パラメータが指定されない場合、現在時刻がタイムスタンプに変換されます。

パラメータはDateまたはDatetime型である必要があります。

フォーマットの仕様については、date_format関数のフォーマット説明を参照してください。

この関数はタイムゾーンの影響を受けます。タイムゾーンの詳細については[Time Zone Management](../../../../admin-manual/cluster-management/time-zone)を参照してください。

この関数はMySQLの[unix_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp)と一致しています。

## 構文

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_date_expr>` | 入力datetime値、date/datetimeタイプをサポートします。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<fmt>` | dateパラメータは、timestampに変換される特定の部分を指定します。タイプはstringです。このパラメータが提供される場合、フォーマットにマッチする部分のみがtimestampに変換されます。 |

## 戻り値
入力に基づいて2つのタイプを返します：

1. 入力date_or_date_exprがゼロ以外のscaleを持つdatetimeタイプであるか、formatパラメータがある場合：
   最大6桁の小数点精度を持つDecimalタイプのtimestampを返します

2. 入力date_or_date_exprがscale 0を持ち、formatパラメータがない場合：
   INTタイプのtimestampを返します

入力時刻を対応するtimestampに変換します。エポック時刻は1970-01-01 00:00:00です。

- いずれかのパラメータがnullの場合はnullを返します。
- formatが無効な場合はエラーを返します

## 例

```sql
-- Input datetime is the begin datetime
mysql> select unix_timestamp('1970-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1970-01-01 00:00:00') |
+---------------------------------------+
|                            0 |
+------------------------------+

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
