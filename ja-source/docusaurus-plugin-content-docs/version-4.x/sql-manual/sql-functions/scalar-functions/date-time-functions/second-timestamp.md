---
{
  "title": "SECOND_TIMESTAMP",
  "description": "SECONDTIMESTAMP関数は、入力されたdatetime値をUnixタイムスタンプ（秒単位）に変換します。",
  "language": "ja"
}
---
## 説明

SECOND_TIMESTAMP関数は、入力されたdatetime値をUnixタイムスタンプ（秒単位）に変換します。これは1970-01-01 00:00:00 UTCから指定されたdatetimeまでの総秒数を表します。この関数はDATETIME値の処理をサポートしており、結果はマシンのタイムゾーンオフセットに合わせて調整されます。タイムゾーンの情報については、Timezone Managementを参照してください。

## エイリアス

- UNIX_TIMESTAMP()

## 構文

```sql
SECOND_TIMESTAMP(<datetime>)
```
## パラメータ

| Parameter    | デスクリプション                                                                                                                                                                                                                                       |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime>` | 必須。Unix タイムスタンプに変換される日時を表す入力 DATETIME 値。datetime 型の入力をサポートします。具体的な datetime フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) を参照してください。 |

## Return Value

入力された datetime に対応する現在のタイムゾーンでの Unix タイムスタンプ（秒単位）を表す BIGINT 型を返します。

特殊なケース:
- 入力が DATE 型（年、月、日のみを含む）の場合、時間部分はデフォルトで 00:00:00 になります
- 入力された datetime が 1970-01-01 00:00:00 UTC より前の場合、負のタイムスタンプを返します
- `<datetime>` が NULL の場合、NULL を返します

## Examples

```sql
--input init datetime
SELECT SECOND_TIMESTAMP('1970-01-01 00:00:00 UTC') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- DATETIME type to timestamp
SELECT SECOND_TIMESTAMP('2025-01-23 12:34:56') AS result;
+------------+
| result     |
+------------+
| 1737606896 |
+------------+

-- DATE type (default time is 00:00:00)
SELECT SECOND_TIMESTAMP('2023-01-01') AS result;
+------------+
| result     |
+------------+
| 1672502400 |
+------------+

-- Date earlier than 1970-01-01 (returns negative number)
SELECT SECOND_TIMESTAMP('1964-10-31 23:59:59') AS result;
+------------+
| result     |
+------------+
| -163065601 |
+------------+

-- DATETIME with microseconds (microseconds ignored)
SELECT SECOND_TIMESTAMP('2023-07-13 22:28:18.456789') AS result;
+------------+
| result     |
+------------+
| 1689258498 |
+------------+

-- Input is NULL (returns NULL)
SELECT SECOND_TIMESTAMP(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
