---
{
  "title": "MONTHS_BETWEEN",
  "description": "MONTHSDIFF関数とは異なり、MONTHSBETWEEN関数は日の要素を無視せず、浮動小数点数を返します。この数値は",
  "language": "ja"
}
---
## 説明

[MONTHS_DIFF function](./months-diff)とは異なり、MONTHS_BETWEEN関数は日付の日の部分を無視せず、日付に表示される月単位の単純な差分ではなく、実際の月の差分を表す浮動小数点数を返します。

MONTHS_BETWEEN関数は、2つのdatetime値間の月の差分を計算するために使用され、浮動小数点の結果を返します。この関数はDATEおよびDATETIME型の処理をサポートし、オプションのパラメータを通じて結果を四捨五入するかどうかを制御できます。

この関数はOracleの[MONTHS_BETWEEN function](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434)と一貫した動作をします。

## 構文

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了日。date/datetimeタイプをサポートします。具体的なdatetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。date/datetimeタイプとdatetimeフォーマットに準拠した文字列をサポートします。 |
| `<round_type>` | 結果を小数点以下8桁に丸めるかどうか。`true`または`false`をサポートします。デフォルトは`true`です。 |

## Return Value

`<date_or_time_expr1>`から`<date_or_time_expr2>`を引いて得られる月数を返します。戻り値の型はDOUBLEです。

Result = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- `<date_or_time_expr1>`または`<date_or_time_expr2>`がNULL、もしくは両方がNULLの場合、NULLを返します
- `<round_type>`がtrueの場合、結果は小数点以下8桁に丸められます。そうでなければ、DOUBLE精度（小数点以下15桁）を維持します
- `<date_or_time_expr1>`が`<date_or_time_expr2>`より前の日付の場合、負の値を返します
- 時間コンポーネント（時、分、秒）は計算に影響しません。日付コンポーネント（年、月、日）のみが使用されます

`<date_or_time_expr1>`と`<date_or_time_expr2>`が以下の条件を満たす場合、関数は整数の月差を返します（日の違いによる小数部分は無視されます）：

- 両方の日付がそれぞれの月の最終日である場合（例：2024-01-31と2024-02-29）
- 両方の日付が同じ日コンポーネントを持つ場合（例：2024-01-15と2024-03-15）

## Examples

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
