---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "ja",
    "description": "DATETIME または TIMESTAMP_NS の値をミリ秒単位の Unix タイムスタンプに変換し、ミリ秒未満の桁を切り捨てます。"
}
---

## 説明

`MILLISECOND_TIMESTAMP` 関数は、`DATETIME` または `TIMESTAMP_NS` の値をミリ秒単位の Unix タイムスタンプに変換します。ミリ秒より細かい部分は切り捨てます。

## 構文

```sql
MILLISECOND_TIMESTAMP(`<datetime>`)
```

## パラメータ

| パラメータ | 説明 |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 変換する `DATETIME` または `TIMESTAMP_NS` の値。 |

## 戻り値

入力日時に対応する Unix タイムスタンプをミリ秒単位で表す `BIGINT` 整数を返します（現在のタイムゾーンに換算した総ミリ秒数）。タイムゾーンの設定については、[タイムゾーン管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。

- 入力が `NULL` の場合、`NULL` を返します。
- マイクロ秒を含む日時値は、ミリ秒単位に切り捨てて変換します。
- 入力日時が `1970-01-01 00:00:00.000 UTC` より前の場合、結果は負の値になります。

## 例

```sql
-- Convert a DATETIME with millisecond precision, executed in a machine with the East 8 time zone
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123');
+--------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123') |
+--------------------------------------------------+
|                                    1737606896123 |
+--------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC');
+------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC') |
+------------------------------------------------------+
|                                        1737635696123 |
+------------------------------------------------------+

-- Convert datetime values with microseconds (automatically truncated to milliseconds)
SELECT MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456');
+-----------------------------------------------------+
| MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456') |
+-----------------------------------------------------+
|                                       1704038400123 |
+-----------------------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC') |
+---------------------------------------------------+
|                                     -315619200000 |
+---------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000 (results are negative in East 8 time zone)
SELECT MILLISECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MILLISECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                           -28800000 |
+-------------------------------------+

-- Input is NULL, returns NULL
SELECT MILLISECOND_TIMESTAMP(NULL);
+-----------------------------+
| MILLISECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```
