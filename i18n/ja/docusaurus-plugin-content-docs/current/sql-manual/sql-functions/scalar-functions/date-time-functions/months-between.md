---
{
    "title": "MONTHS_BETWEEN",
    "language": "ja",
    "description": "MONTHSDIFF 関数とは異なり、MONTHSBETWEEN 関数は日の部分を無視せず、月数の差を表す浮動小数点数を返します。"
}
---

## 説明

[MONTHS_DIFF 関数](./months-diff)とは異なり、MONTHS_BETWEEN 関数は日の部分を無視せず、日付に表れる月単位の単純な差ではなく、実際の月数の差を浮動小数点数で返します。

MONTHS_BETWEEN 関数は、二つの日時値の月数の差を計算し、浮動小数点数で返します。DATE、DATETIME、TIMESTAMP_NS 型に対応し、省略可能なパラメータで結果を丸めるかどうかを指定できます。

この関数の動作は、Oracle の [MONTHS_BETWEEN 関数](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434) と同じです。

## 構文

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了日。DATE、DATETIME、TIMESTAMP_NS 型に対応します。日時と日付の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。DATE、DATETIME、TIMESTAMP_NS 型、および日時形式に適合する文字列に対応します。 |
| `<round_type>` | 省略可能。結果を小数点以下8桁に丸めるかどうかを指定します。`true` または `false` を指定できます。デフォルトは `true` です。 |

## 戻り値

`<date_or_time_expr2>` を `<date_or_time_expr1>` から引いた月数を DOUBLE 型で返します。

結果 = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- `<date_or_time_expr1>` または `<date_or_time_expr2>` が NULL の場合、両方が NULL の場合も含めて NULL を返します。
- `<round_type>` が true の場合、結果を小数点以下8桁に丸めます。それ以外の場合は DOUBLE 型の精度（小数点以下15桁）を維持します。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合、負の値を返します。
- 時刻部分（時、分、秒）は計算に影響しません。日付部分（年、月、日）のみを使用します。

`<date_or_time_expr1>` と `<date_or_time_expr2>` が次のいずれかの条件を満たす場合、日の差による小数部分を無視し、整数の月数の差を返します。

- どちらもそれぞれの月の末日である場合（例：2024-01-31 と 2024-02-29）
- どちらも日が同じである場合（例：2024-01-15 と 2024-03-15）

## 例

```sql
--- Month difference between two dates
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Including time components (does not affect result)
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Disable rounding (preserve original precision)
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- Both are month-end dates (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Same day component (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Different day components and not month-end
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- Input is NULL (returns NULL)
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
