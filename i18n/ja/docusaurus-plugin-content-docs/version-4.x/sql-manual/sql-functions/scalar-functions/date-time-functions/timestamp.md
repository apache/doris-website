---
{
    "title": "TIMESTAMP | 日付・時刻関数",
    "language": "ja",
    "description": "TIMESTAMP 関数は、日時形式の文字列を DATETIME 型に変換します。",
    "sidebar_label": "TIMESTAMP"
}
---

# TIMESTAMP

## 説明

TIMESTAMP 関数は、日時形式の文字列を DATETIME 型に変換します。
二番目の時刻パラメータが指定された場合は、二つのパラメータの和を計算し、結果を DATETIME 形式で返します。

具体的な日時形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。

この関数の動作は、MySQL の [TIMESTAMP 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)と同じです。

## 構文

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `date_or_datetime_string` | 日付または日時を表す文字列型 |
| `time_string` | 省略可能。時刻を表す文字列型 |

## 戻り値

DATETIME 型の値を返します。

パラメータが一つの場合は、最初のパラメータを DATETIME 型に変換した結果を返します。
パラメータが二つの場合は、両パラメータの和を返します。

- 最初のパラメータが日付文字列の場合、時刻は 00:00:00 に設定されます。
- いずれかのパラメータが NULL の場合、またはパラメータの型が適合しない場合は、NULL を返します。

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
