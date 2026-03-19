---
{
  "title": "MICROSECOND_TIMESTAMP",
  "description": "MICROSECONDTIMESTAMP関数は、入力されたdatetime値を1970-01-01 00:00:00から計算されたUnixタイムスタンプに変換するために使用されます（",
  "language": "ja"
}
---
## 説明

MICROSECOND_TIMESTAMP関数は、入力された日時の値を、1970-01-01 00:00:00（ローカルタイムゾーンオフセットで調整済み）から計算されたUnixタイムスタンプに変換するために使用されます。単位はマイクロ秒です（1秒 = 1,000,000マイクロ秒）。この関数は、マイクロ秒精度のDATETIME型の処理をサポートし、変換時にタイムゾーンの差異を自動的に無視します（デフォルトの基準としてUTC時刻を使用）。

## 構文

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```
## パラメータ

| Parameter       | デスクリプション                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>`     | Unix タイムスタンプに変換される datetime を表します。`DATETIME` 型をサポートします。特定の datetime 形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) を参照してください |

## Return Value

入力された datetime に対応する Unix タイムスタンプをマイクロ秒で表す `BIGINT` 整数を返します（現在のタイムゾーンに変換された総マイクロ秒）。

- 入力が `NULL` の場合、関数は `NULL` を返します。
- 入力 datetime が 1970-01-01 00:00:00.000 UTC より前の場合、結果は負の値になります。

## Examples

```sql
-- Convert a DATETIME with microsecond precision, executed in a machine with the East 8 time zone
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456');
+-----------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456') |
+-----------------------------------------------------+
|                                    1737606896123456 |
+-----------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC');
+---------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC') |
+---------------------------------------------------------+
|                                        1737635696123456 |
+---------------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MICROSECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                        -28800000000 |
+-------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC') |
+---------------------------------------------------+
|                                  -315619200000000 |
+---------------------------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND_TIMESTAMP(NULL);
+-----------------------------+
| MICROSECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL  |
+-----------------------------+
```
