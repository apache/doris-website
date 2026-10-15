---
{
    "title": "PERIOD_ADD",
    "language": "ja",
    "description": "<period> に <month> か月を加えた結果を計算します。"
}
---

## 説明 {#description}

`<period>` に `<month>` か月を加えた結果を計算します。

`<period>` は整数で、末尾の二桁が月（01～12）、それより前の桁が年を表します。
関数は計算後の期間を、年と月を表す整数で返します。

年の部分が 100 未満の場合、[所定の規則](#parameters)に従って四桁の年に変換されます。
たとえば、PERIOD_ADD(2501, 0) は 2501 ではなく 202501 を返します。

この関数は MySQL の [PERIOD_ADD 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-add) と同じ動作をします。

## 構文 {#syntax}

```sql
PERIOD_ADD(`<period>`, `<month>`)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| ---------- | ---------- |
| `<period>` | 年と月で構成される期間を表します。<ul><li>**形式**：末尾の二桁が月を表し、`[1, 12]` の範囲である必要があります。それより前の桁が年を表します。年の桁数に制限はなく、四桁を超えることもできます。</li><li>**年の解釈**：末尾の二桁を除くすべての桁を年の値として使用します。年が二桁の数値（範囲：[00, 99]）の場合、70 未満なら 20YY、70 以上なら 19YY と解釈します。</li><li>**値の範囲**：`[0, 2^63-1]` の範囲の整数を受け付けます。</li></ul> |
| `<month>` | `<period>` に加える月数。`[-2^63, 2^63-1]` の範囲の整数を受け付けます。 |

## 戻り値 {#return-value}

計算後の期間を YYYYMM 形式の整数で返します。パラメータの説明にあるとおり、年の部分は四桁に限定されません。

いずれかのパラメータが NULL の場合、または `period` パラメータを BIGINT に変換できない場合は、NULL を返します。

`period` パラメータが負数の場合、またはその月の部分が無効な場合は、エラーが発生します。

## 例 {#examples}

<!-- setup-sql
CREATE TABLE test_period_add (period BIGINT, month BIGINT) DISTRIBUTED BY HASH(period) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_period_add VALUES (200803,2),(200809,5),(803,2),(6910,3),(7001,1),(12345611,123456),(NULL,10),(202510,NULL);
-->

```sql
SELECT `period`, `month`, PERIOD_ADD(`period`, `month`) AS ans FROM test_period_add;
```
```text
+----------+--------+----------+
| period   | month  | ans      |
+----------+--------+----------+
|   200803 |      2 |   200805 |
|   200809 |      5 |   200902 |
|      803 |      2 |   200805 |
|     6910 |      3 |   207001 |
|     7001 |      1 |   197002 |
| 12345611 | 123456 | 13374411 |
|     NULL |     10 |     NULL |
|   202510 |   NULL |     NULL |
+----------+--------+----------+
```

```sql
-- Month part exceeds the range [1, 12]
SELECT PERIOD_ADD(202513, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: 202513

-- Period exceeds BIGINT range
SELECT PERIOD_ADD(-1, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```

```sql
SELECT PERIOD_ADD(9223372036854775807, 1);
```
```text
+------------------------------------+
| PERIOD_ADD(9223372036854775807, 1) |
+------------------------------------+
|               -9223372036854775808 |
+------------------------------------+
```
説明：Doris は内部計算に int64_t を使用するため、オーバーフローが発生する場合があります。この動作は MySQL と同じです。
