---
{
    "title": "TIMESTAMP | 日時関数",
    "language": "ja",
    "description": "日時文字列を DATETIME に変換します。TIMESTAMP_NS を入力した場合は、ナノ秒精度を保持して返します。",
    "sidebar_label": "TIMESTAMP"
}
---

# TIMESTAMP

## 説明

TIMESTAMP 関数は、日時文字列を `DATETIME` に変換します。`TIMESTAMP_NS` を入力した場合は、ナノ秒精度を保持した `TIMESTAMP_NS` を返します。二つ目の時刻パラメータを指定した場合は、その時刻の値を最初のパラメータに加算し、最初のパラメータに対応する日時型を保持します。

日時の形式については、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。

この関数は、MySQL の [timestamp 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)と同じように動作します。

## 構文

```sql
TIMESTAMP(<date_or_datetime_string>[, <time_string>])
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `date_or_datetime_string` | 日付または日時の文字列、あるいは `DATETIME` または `TIMESTAMP_NS` の式。 |
| `time_string` | 時刻を表す文字列型の値。省略可能。 |

## 戻り値

`TIMESTAMP_NS` を入力した場合は、小数秒部分を常に九桁で表した `TIMESTAMP_NS` を返します。結果は戻り値の型の有効範囲に照らして検証されます。`TIMESTAMP_NS` の有効範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

日付、日時、文字列を入力した場合は `DATETIME` を返し、`TIMESTAMP_NS` を入力した場合は `TIMESTAMP_NS` を返します。

パラメータを一つ指定した場合は、最初のパラメータを対応する日時型で返します。
パラメータを二つ指定した場合は、両パラメータの和を返します。

- 最初のパラメータが日付文字列の場合、時刻は 00:00:00 に設定されます。
- いずれかのパラメータが NULL の場合、またはパラメータの型が一致しない場合は、NULL を返します。

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
