---
{
  "title": "GROUPING_ID",
  "language": "ja",
  "description": "GROUP BY クエリにおける行のグループ化レベルを計算します。"
}
---
## 説明

GROUP BY クエリにおける行のグルーピングレベルを計算します。GROUPING_ID 関数は、特定の出力行に対して GROUP BY リスト内のどの列が集約されていないかを示す整数ビットマップを返します。GROUP BY が指定されている場合、SELECT リスト、HAVING 句、または ORDER BY 句で使用できます。

## 構文

```sql
GROUPING_ID(<column_expression> [, ...])
```
## パラメータ

| パラメータ               | 説明                                       |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | GROUP BY句からの列式。     |

## 戻り値

指定された列のグループ化ビットマップを表すBIGINT値を返します。

## 例

### 例A: グループ化レベルの識別

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS `Job Title`,
  COUNT(uid) AS `Employee Count`
FROM employee 
GROUP BY ROLLUP(department, level)
ORDER BY GROUPING_ID(department, level) ASC;
```
*期待される出力:*

```text
+--------------------+---------------------------+----------------+
| department         | Job Title                 | Employee Count |
+--------------------+---------------------------+----------------+
| Board of Directors | Senior                    |              2 |
| Technology         | Senior                    |              3 |
| Sales              | Senior                    |              1 |
| Sales              | Assistant                 |              2 |
| Sales              | Trainee                   |              1 |
| Marketing          | Senior                    |              1 |
| Marketing          | Trainee                   |              2 |
| Marketing          | Assistant                 |              1 |
| Board of Directors | Total: Board of Directors |              2 |
| Technology         | Total: Technology         |              3 |
| Sales              | Total: Sales              |              4 |
| Marketing          | Total: Marketing          |              4 |
| NULL               | Total: Company            |             13 |
+--------------------+---------------------------+----------------+
```
### 例 B: GROUPING_ID を使用して結果セットをフィルタリング

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS `Job Title`,
  COUNT(uid) AS `Count`
FROM employee 
GROUP BY ROLLUP(department, level)
HAVING `Job Title` = 'Senior';
```
*期待される出力:*

```text
+--------------------+-----------+-------+
| department         | Job Title | Count |
+--------------------+-----------+-------+
| Board of Directors | Senior    |     2 |
| Technology         | Senior    |     3 |
| Sales              | Senior    |     1 |
| Marketing          | Senior    |     1 |
+--------------------+-----------+-------+
```
