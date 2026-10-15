---
{
    "title": "MILLISECONDS_ADD",
    "language": "ja",
    "description": "MILLISECONDS_ADD 関数は、入力された日時値に指定されたミリ秒数を加算し、その結果の新しい日時値を返します。"
}
---

## 説明

`MILLISECONDS_ADD` 関数は、入力された日時値に指定されたミリ秒数を加算し、その結果の新しい日時値を返します。この関数は、ミリ秒精度の `DATETIME` 型を処理できます。

## 構文

```sql
MILLISECONDS_ADD(`<datetime>`, `<delta>`)
```

## 引数

| 引数         | 説明                                                                                          |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 入力する日時値。`DATETIME` 型に対応します。日時の具体的な形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |
| `<delta>`    | 加算するミリ秒数。型は `BIGINT` です。1 秒 = 1,000 ミリ秒 = 1,000,000 マイクロ秒です。 |

## 戻り値

基準時刻に指定されたミリ秒数を加算した結果を表す、`DATETIME` 型の値を返します。

- `<delta>` が負の場合、対応するミリ秒数を基準時刻から減算するのと同じ動作になります（つまり、`MILLISECONDS_ADD(basetime, -n)` は `MILLISECONDS_SUB(basetime, n)` と同等です）。
- 入力が `DATE` 型（年、月、日のみを含む）の場合、時刻部分はデフォルトで `00:00:00.000` に設定されます。
- 計算結果が `DATETIME` 型の有効範囲（`0000-01-01 00:00:00` から `9999-12-31 23:59:59.999999` まで）を超える場合、例外が発生します。
- いずれかの引数が `NULL` の場合、関数は `NULL` を返します。

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

-- delta supports the full BIGINT range; values beyond INT max (2^31 - 1) still compute correctly
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435', 2147483648) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-03 12:33:32.083000 |
+----------------------------+

```
