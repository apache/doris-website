---
{
  "title": "FROM_DAYS",
  "description": "FROMDAYS関数は、整数の日数を対応する日付（DATE型）に変換するために使用されます。この関数は「1月1日、",
  "language": "ja"
}
---
## 説明

FROM_DAYS関数は、整数の日数を対応する日付（DATE型）に変換するために使用されます。この関数は「1年1月1日」を基準点として使用し（つまり、0日目は0000-01-01に対応）、基準日から指定された日数後の日付を計算します。

注意：MySQLとの動作一貫性を保つため、FROM_DAYS関数は「1年2月29日」（0000-02-29）をサポートしていません。理論的にはこの年はうるう年の規則に適合しますが、この日付は自動的にスキップされます。
歴史的日付制限：この関数は拡張グレゴリオ暦に基づいて計算されており、1582年にグレゴリオ暦が導入される前の日付（実際にはユリウス暦が使用されていた時期）には適していません。これにより、結果と実際の歴史的日付との間に相違が生じる可能性があります。

この関数は、MySQLの[from_days function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-days)と一貫した動作をします

## 構文

```sql
FROM_DAYS(<days>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<days>` | 日数を入力します。型は`INT`です |

## Return Value

参照日（0000-01-01）から指定した日数後の日付を表す、YYYY-MM-DD形式のDATE型の値を返します。
daysが負の値の場合、NULLを返します。
daysが有効な日付範囲（通常1から3652424、およそ10000年に相当）を超える場合、エラーを返します。

## Examples

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
