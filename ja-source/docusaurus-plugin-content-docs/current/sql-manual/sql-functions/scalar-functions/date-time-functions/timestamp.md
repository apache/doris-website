---
{
  "title": "TIMESTAMP | 日付時刻関数",
  "language": "ja",
  "description": "TIMESTAMP関数は、datetime形式の文字列をDATETIME型に変換します。",
  "sidebar_label": "TIMESTAMP"
}
---
# TIMESTAMP

## 説明

TIMESTAMP関数は、datetime形式の文字列をDATETIME型に変換します。
2番目の時間パラメータが存在する場合、2つのパラメータの合計を計算し、結果をDATETIME形式で返します。

特定のdatetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。

この関数は、MySQLの[timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)と同じように動作します。

## 構文

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```
## パラメータ

| パラメータ | 説明                                           |
|-----------|-------------------------------------------------------|
| `date_or_datetime_string` | 日付または日時文字列型 |
| `time_string` | 時刻文字列型 |

## 戻り値

DATETIME型の値を返します。

パラメータが1つ提供された場合、最初のパラメータをDATETIME型に変換した結果を返します。
パラメータが2つ提供された場合、2つのパラメータの合計を返します。

- 最初のパラメータが日付文字列の場合、時刻は00:00:00に設定されます
- いずれかのパラメータがNULLまたはパラメータ型が一致しない場合、NULLを返します

## 例

```sql
-- Convert a string to DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');

+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+

-- Input date string
SELECT TIMESTAMP('2019-01-01');
+-------------------------+
| TIMESTAMP('2019-01-01') |
+-------------------------+
| 2019-01-01 00:00:00     |
+-------------------------+

-- Input NULL, returns NULL
SELECT TIMESTAMP(NULL);
+-----------------+
| TIMESTAMP(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- Two parameters, returns the sum of the two parameters (Date/DateTime + Time)
SELECT TIMESTAMP('2025-11-30 23:45:12', '12:34:56');
+----------------------------------------------+
| TIMESTAMP('2025-11-30 23:45:12', '12:34:56') |
+----------------------------------------------+
| 2025-12-01 12:20:08                          |
+----------------------------------------------+

-- The first parameter only accepts Date/Datetime type, the second parameter only accepts Time type
SELECT TIMESTAMP('12:34:56', '12:34:56');
+-----------------------------------+
| TIMESTAMP('12:34:56', '12:34:56') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- If any parameter is NULL, returns NULL
SELECT TIMESTAMP('2025-12-01', NULL);
+-------------------------------+
| TIMESTAMP('2025-12-01', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```
