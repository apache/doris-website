---
{
  "title": "MILLISECONDS_SUB",
  "description": "MILLISECONDSSUB関数は、入力されたdatetime値から指定されたミリ秒数を減算し、結果として得られる新しいdatetime値を返します。",
  "language": "ja"
}
---
## 説明

`MILLISECONDS_SUB`関数は、入力された日時値から指定されたミリ秒数を減算し、結果として得られる新しい日時値を返します。この関数は`DATETIME`型の処理をサポートしています。

## 構文

```sql
MILLISECONDS_SUB(`<datetime>`, `<delta>`)
```
## パラメータ

| Parameter    | デスクリプション                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 入力する日時値で、`DATETIME`型です。具体的な日時フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |
| `<delta>`    | 減算するミリ秒数で、`BIGINT`型です。1秒 = 1,000ミリ秒 = 1,000,000マイクロ秒です。 |

## Return Value

`DATETIME`型の値を返し、基準時刻から指定されたミリ秒を減算した結果を表します。

- `<delta>`が負の値の場合、この関数は基準時刻に対応するミリ秒を加算するのと同じ動作をします。
- 入力が`DATE`型（年、月、日のみを含む）の場合、デフォルトの時刻部分は`00:00:00.000`に設定されます。
- 計算結果が`DATETIME`型の有効範囲（`0000-01-01 00:00:00`から`9999-12-31 23:59:59.999999`）を超えた場合、例外がスローされます。
- いずれかのパラメータが`NULL`の場合、この関数は`NULL`を返します。

## Examples

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
