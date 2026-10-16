---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "ja",
    "description": "入力した日時を、ローカルタイムゾーンのオフセットを考慮して、1970-01-01 00:00:00 を起点とするマイクロ秒単位の Unix タイムスタンプに変換します。"
}
---

## 説明

MICROSECOND_TIMESTAMP 関数は、入力した日時を、1970-01-01 00:00:00 を起点とするマイクロ秒単位（1 秒 = 1,000,000 マイクロ秒）の Unix タイムスタンプに変換します。計算にはローカルタイムゾーンのオフセットが反映されます。この関数はマイクロ秒精度の DATETIME 型を処理でき、変換時にはタイムゾーンの差異を自動的に無視します（デフォルトでは UTC を基準に使用します）。

## 構文

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<datetime>` | Unix タイムスタンプに変換する日時。`DATETIME` 型をサポートします。日時の書式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |

## 戻り値

入力した日時に対応するマイクロ秒単位の Unix タイムスタンプ（現在のタイムゾーンを考慮して変換したマイクロ秒の総数）を `BIGINT` 型の整数で返します。

- 入力が `NULL` の場合、`NULL` を返します。
- 入力日時が 1970-01-01 00:00:00.000 UTC より前の場合、負の値を返します。

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
