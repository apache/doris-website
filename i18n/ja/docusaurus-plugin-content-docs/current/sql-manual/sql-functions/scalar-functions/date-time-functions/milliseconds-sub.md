---
{
    "title": "MILLISECONDS_SUB",
    "language": "ja",
    "description": "DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ 型の値から、指定したミリ秒数を減算します。"
}
---

## 説明

`MILLISECONDS_SUB` 関数は、`DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` 型の値から指定したミリ秒数を減算し、入力と同じ型の値を返します。

## 構文

```sql
MILLISECONDS_SUB(`<datetime>`, `<delta>`)
```

## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<datetime>` | 入力する日時値。型は `DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` です。具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[TIMESTAMP_NS の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照してください。 |
| `<delta>` | 減算するミリ秒数。型は `BIGINT` です。1 秒 = 1,000 ミリ秒 = 1,000,000 マイクロ秒です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒部分が固定の九桁精度の `TIMESTAMP_NS` 型の値を返します。結果は戻り値の型の有効範囲に照らして検証されます。`TIMESTAMP_NS` 型の有効範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

指定したミリ秒数を基準時刻から減算した結果を、入力と同じ日時型で返します。

- `<delta>` が負の場合、対応するミリ秒数を基準時刻に加算する場合と同じ動作になります。
- 入力が `DATE` 型（年、月、日のみを含む）の場合、時刻部分のデフォルト値は `00:00:00.000` に設定されます。
- 計算結果が `DATETIME` 型の有効範囲（`0000-01-01 00:00:00` から `9999-12-31 23:59:59.999999`）を超える場合、例外が発生します。
- いずれかのパラメータが `NULL` の場合、`NULL` を返します。

## 例

```sql
-- Subtract 1 millisecond
SELECT MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.434123                        |
+---------------------------------------------------+

-- Negative delta (equivalent to addition)
SELECT MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_SUB('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_SUB('2023-01-01', 1500) |
+--------------------------------------+
| 2022-12-31 23:59:58.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_SUB('0000-01-01',-1500);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation milliseconds_add of 0000-01-01 00:00:00, -1500 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_SUB(NULL, 100), MILLISECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| milliseconds_sub(NULL, 100)  | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

```
