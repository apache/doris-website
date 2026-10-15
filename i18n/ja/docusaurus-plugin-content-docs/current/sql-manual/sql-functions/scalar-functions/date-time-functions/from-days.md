---
{
    "title": "FROM_DAYS",
    "language": "ja",
    "description": "FROMDAYS 関数は、整数で表した日数を対応する日付（DATE 型）に変換します。この関数は「1 月の初日、"
}
---

## 説明

FROM_DAYS 関数は、整数で表した日数を対応する日付（DATE 型）に変換します。この関数は「1 年の 1 月初日」を基準とし（つまり、0 日目は 0000-01-01 に対応します）、基準日から指定した日数が経過した後の日付を計算します。

注: MySQL との動作の一貫性を保つため、FROM_DAYS 関数は「1 年の二月 29 日」（0000-02-29）をサポートしません。理論上、この年はうるう年の規則に従いますが、この日付は自動的にスキップされます。
歴史上の日付に関する制限: この関数は拡張グレゴリオ暦に基づいて計算するため、グレゴリオ暦が導入された 1582 年より前の日付（実際にはユリウス暦が使用されていた時代）には適しません。そのため、計算結果が実際の歴史上の日付と異なる場合があります。

この関数の動作は、MySQL の [from_days 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-days) と一致します。

## 構文

```sql
FROM_DAYS(<days>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<days>` | 入力する日数。型は `INT` です。 |

## 戻り値

基準日（0000-01-01）から指定した日数が経過した後の日付を、YYYY-MM-DD 形式の DATE 型の値として返します。
days が負の場合は NULL を返します。
days が有効な日付範囲（通常は 1～3652424 で、およそ 10000 年に相当）を超える場合は、エラーを返します。

## 例

```sql
-- Calculate days from the reference date
select from_days(730669),from_days(5),from_days(59), from_days(60);

+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+

-- If the input parameter is negative, an error is returned
select from_days(-60);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of -60 out of range

-- If the input is NULL, returns NULL
select from_days(NULL);
+-----------------+
| from_days(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- If days exceeds the valid date range (typically 1 to 3652424, corresponding to approximately year 10000), an error is returned
select from_days(99999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of 99999999 out of range
```
