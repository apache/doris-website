---
{
  "title": "GROUPING_ID",
  "description": "GROUP BY クエリにおける行のグループ化レベルを計算します。",
  "language": "ja"
}
---
## 説明

GROUP BY クエリにおける行のグループ化レベルを計算します。GROUPING_ID 関数は、指定された出力行に対して GROUP BY リスト内のどの列が集約されていないかを示す整数ビットマップを返します。この関数は、GROUP BY が指定されている場合に SELECT リスト、HAVING、または ORDER BY 句で使用できます。

## 構文

```sql
GROUPING_ID(<column_expression> [, ...])
```
## パラメータ

| パラメータ               | デスクリプション                                       |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | GROUP BY句のカラム式。     |

## Return Value

指定されたカラムのグルーピングビットマップを表すBIGINT値を返します。

## Examples

### Example A: グルーピングレベルの識別

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
ORDER BY department desc;
```
*期待される出力:*

```text
+--------------------+---------------------------+----------------+
| department         | Job Title                 | Employee Count |
+--------------------+---------------------------+----------------+
| Technology         | Senior                    |              3 |
| Technology         | Total: Technology         |              3 |
| Sales              | Assistant                 |              2 |
| Sales              | Total: Sales              |              4 |
| Sales              | Trainee                   |              1 |
| Sales              | Senior                    |              1 |
| Marketing          | Senior                    |              1 |
| Marketing          | Assistant                 |              1 |
| Marketing          | Total: Marketing          |              4 |
| Marketing          | Trainee                   |              2 |
| Board of Directors | Senior                    |              2 |
| Board of Directors | Total: Board of Directors |              2 |
| NULL               | Total: Company            |             13 |
+--------------------+---------------------------+----------------+
```
### Example B: GROUPING_ID を使用して結果セットをフィルタリングする

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
**期待される出力:**

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
