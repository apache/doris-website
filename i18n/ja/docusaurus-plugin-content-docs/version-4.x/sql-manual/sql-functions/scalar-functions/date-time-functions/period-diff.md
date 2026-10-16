---
{
    "title": "PERIOD_DIFF",
    "language": "ja",
    "description": "二つの期間の差を月数で計算します。"
}
---

## 説明
二つの期間の差を月数で計算します。

`<period>` は整数で、末尾の二桁が月（01～12）を表し、それより前の桁が年を表します。
この関数は period_1 - period_2 の符号付きの結果を返します。

年の部分が 100 未満の場合は、[所定の規則](#parameters)に従って四桁の年に変換されます。

この関数は MySQL の [PERIOD_DIFF 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-diff) と同じように動作します。

## 構文

```sql
PERIOD_DIFF(`<period_1>`, `<period_2>`)
```

## パラメータ {#parameters}

| パラメータ      | 説明                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|
| `<period_1>`   | 年と月で構成される期間を表します。<ul><li>**形式**：末尾の二桁が月を表し、`[1, 12]` の範囲内である必要があります。それより前の桁が年を表します。年の桁数に上限はなく、四桁を超えることもできます。</li><li>**年の解釈**：末尾の二桁を除くすべての桁を年の値とします。年が二桁の数値（範囲：[00, 99]）の場合、70 未満なら 20YY、70 以上なら 19YY と解釈します。</li><li>**値の範囲**：`[0, 2^63-1]` の範囲内の整数パラメータを受け付けます。</li></ul> |
| `<period_2>`   | もう一方の期間を表します。形式の要件は `<period_1>` と同じです。 |

## 戻り値

`<period_1>` の総月数から `<period_2>` の総月数を引いた整数を返します。

いずれかのパラメータが NULL の場合、または値を BIGINT に変換できない場合は、NULL を返します。

パラメータが負の数の場合、または月の部分が無効な場合は、エラーが発生します。

## 例

<!-- setup-sql
CREATE TABLE test_period_diff (period_1 LARGEINT, period_2 LARGEINT) DISTRIBUTED BY HASH(period_1) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_period_diff VALUES (200802,200703),(200703,200802),(7001,6912),(NULL,2510),(2510,NULL),(9223372036854775807,101),(9223372036854775808,101);
-->

```sql
SELECT `period_1`, `period_2`, PERIOD_DIFF(`period_1`, `period_2`) AS DIFF FROM `test_period_diff`;
```
```text
+---------------------+----------+---------------------+
| period_1            | period_2 | DIFF                |
+---------------------+----------+---------------------+
| 200802              |   200703 |                  11 |
| 200703              |   200802 |                 -11 |
| 7001                |     6912 |               -1199 |
| NULL                |     2510 |                NULL |
| 2510                |     NULL |                NULL |
| 9223372036854775807 |      101 | 1106804644422549090 |
| 9223372036854775808 |      101 |                NULL |
+---------------------+----------+---------------------+
```
最後の行では、`period_1` が BIGINT の上限（2^63-1）を超えているため、結果は NULL になります。

```sql
SELECT PERIOD_DIFF(1, -1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```
