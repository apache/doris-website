---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "ja",
    "description": "DATETIME または TIMESTAMP_NS 値をマイクロ秒単位の Unix タイムスタンプに変換し、マイクロ秒未満の桁を切り捨てます。"
}
---

## 説明

MICROSECOND_TIMESTAMP 関数は、`DATETIME` または `TIMESTAMP_NS` 値をマイクロ秒単位の Unix タイムスタンプに変換します。`TIMESTAMP_NS` の場合、ナノ秒の末尾三桁は切り捨てられます。

## 構文

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## パラメータ

| パラメータ | 説明 |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 変換する `DATETIME` または `TIMESTAMP_NS` 値。 |

## 戻り値

入力日時に対応するマイクロ秒単位の Unix タイムスタンプ（現在のタイムゾーンに換算した総マイクロ秒数）を `BIGINT` 整数で返します。

- 入力が `NULL` の場合、`NULL` を返します。
- 入力日時が 1970-01-01 00:00:00.000 UTC より前の場合、結果は負の値になります。

## 例

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
| MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC')  |
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
