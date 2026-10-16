---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "ja",
    "description": "MILLISECOND_TIMESTAMP 関数は、入力された日時値を、1970-01-01 00:00:00 を基準とするミリ秒単位の Unix タイムスタンプに変換します。"
}
---

## 説明

`MILLISECOND_TIMESTAMP` 関数は、入力された日時値を、`1970-01-01 00:00:00` を起点として計算した Unix タイムスタンプに変換します。起点にはローカルタイムゾーンのオフセットが適用され、単位はミリ秒です（1 秒 = 1,000 ミリ秒）。この関数はミリ秒精度の `DATETIME` 型を処理でき、変換時にはタイムゾーンの差異を自動的に無視します（デフォルトでは UTC 時刻を基準にします）。

## 構文

```sql
MILLISECOND_TIMESTAMP(`<datetime>`)
```

## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<datetime>` | Unix タイムスタンプに変換する日時。`DATETIME` 型に対応します。日時の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |

## 戻り値

入力された日時に対応するミリ秒単位の Unix タイムスタンプを `BIGINT` 整数で返します（現在のタイムゾーンに換算した合計ミリ秒数）。タイムゾーンの設定については、[タイムゾーンの管理](../../../../admin-manual/cluster-management/time-zone)を参照してください。

- 入力が `NULL` の場合は、`NULL` を返します。
- マイクロ秒を含む日時値も変換できます（ミリ秒未満の部分は自動的に切り捨てられます）。
- 入力日時が `1970-01-01 00:00:00.000 UTC` より前の場合は、負の値を返します。

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
