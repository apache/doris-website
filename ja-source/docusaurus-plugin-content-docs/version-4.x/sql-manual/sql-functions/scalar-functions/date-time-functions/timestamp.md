---
{
  "title": "TIMESTAMP | 日付時刻関数",
  "sidebar_label": "TIMESTAMP",
  "description": "TIMESTAMP関数は、datetime形式の文字列をDATETIME型に変換します。",
  "language": "ja"
}
---
# TIMESTAMP

## 説明

TIMESTAMP関数は、datetime形式の文字列をDATETIME型に変換します。

特定のdatetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。

この関数は、MySQLの[timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestamp)とは異なります。Dorisは現在、datetime加算/減算用の第二時間パラメータをサポートしていません。

## 構文

```sql
TIMESTAMP(string)
```
## パラメータ

| Parameter | デスクリプション                                           |
|-----------|-------------------------------------------------------|
| `string`  | 日時文字列型                      |

## Return Value

DATETIME型の値を返します。

- 入力が日付文字列の場合、時刻は00:00:00に設定されます
- 入力がNULLの場合、NULLを返します

## Examples

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
```
