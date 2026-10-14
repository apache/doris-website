---
{
    "title": "MILLISECONDS_ADD",
    "language": "ja",
    "description": "DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ の値に、指定したミリ秒数を加算します。"
}
---

## 説明

`MILLISECONDS_ADD` 関数は、`DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` の値に指定したミリ秒数を加算し、入力と同じ型の結果を返します。

## 構文

```sql
MILLISECONDS_ADD(`<datetime>`, `<delta>`)
```

## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<datetime>` | 入力する日時値。`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` に対応します。具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[TIMESTAMP_NS の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照してください。 |
| `<delta>` | 加算するミリ秒数。型は `BIGINT` です。1 秒 = 1,000 ミリ秒 = 1,000,000 マイクロ秒です。 |

## 戻り値

入力が `TIMESTAMP_NS` の場合は、小数秒が固定の九桁精度である `TIMESTAMP_NS` を返します。結果が戻り値の型の有効範囲内にあるか検証されます。`TIMESTAMP_NS` の有効範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

基準時刻に指定したミリ秒数を加算した結果を、入力と同じ日時型で返します。

- `<delta>` が負の場合は、基準時刻から対応するミリ秒数を減算した場合と同じ動作になります（つまり、`MILLISECONDS_ADD(basetime, -n)` は `MILLISECONDS_SUB(basetime, n)` と同じです）。
- 入力が `DATE` 型（年、月、日のみを含む）の場合、時刻部分の初期値は `00:00:00.000` になります。
- 計算結果が `DATETIME` 型の有効範囲（`0000-01-01 00:00:00` から `9999-12-31 23:59:59.999999`）を超える場合は、例外が発生します。
- いずれかのパラメータが `NULL` の場合、`NULL` を返します。

## 例

```sql
-- Add one millisecond
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1);

+---------------------------------------------------+
| MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.436123                        |
+---------------------------------------------------+

-- Negative milliseconds, subtracts the corresponding milliseconds from the datetime
SELECT MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300);
+---------------------------------------------------+
| MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_ADD('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_ADD('2023-01-01', 1500) |
+--------------------------------------+
| 2023-01-01 00:00:01.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_ADD('9999-12-31 23:59:59.999', 2000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation milliseconds_add of 9999-12-31 23:59:59.999000, 2000 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_ADD('2023-10-01 12:00:00.500', NULL) AS after_add;
+-----------+
| after_add |
+-----------+
| NULL      |
+-----------+

```
