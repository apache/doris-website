---
{
  "title": "MILLISECONDS_ADD",
  "language": "ja",
  "description": "MILLISECONDSADD関数は、入力されたdatetime値に指定されたミリ秒数を加算し、結果として得られる新しいdatetime値を返します。"
}
---
## 説明

`MILLISECONDS_ADD`関数は、入力されたdatetime値に指定されたミリ秒数を加算し、結果として得られる新しいdatetime値を返します。この関数は、ミリ秒精度の`DATETIME`型の処理をサポートしています。

## 構文

```sql
MILLISECONDS_ADD(`<datetime>`, `<delta>`)
```
## パラメータ

| パラメータ    | 説明                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 入力datetime値。`DATETIME`型をサポートします。特定のdatetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |
| `<delta>`    | 追加するミリ秒数、`BIGINT`型。1秒 = 1,000ミリ秒 = 1,000,000マイクロ秒。 |

## 戻り値

`DATETIME`型の値を返します。これは、基準時刻に指定されたミリ秒を追加した結果を表します。

- `<delta>`が負の場合、この関数は基準時刻から対応するミリ秒を減算するのと同じ動作をします（つまり、`MILLISECONDS_ADD(basetime, -n)`は`MILLISECONDS_SUB(basetime, n)`と同等です）。
- 入力が`DATE`型（年、月、日のみを含む）の場合、デフォルトの時刻部分は`00:00:00.000`に設定されます。
- 計算結果が`DATETIME`型の有効範囲（`0000-01-01 00:00:00`から`9999-12-31 23:59:59.999999`）を超える場合、例外がスローされます。
- いずれかのパラメータが`NULL`の場合、関数は`NULL`を返します。

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
