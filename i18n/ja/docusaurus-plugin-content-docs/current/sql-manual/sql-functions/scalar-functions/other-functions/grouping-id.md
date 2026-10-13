---
{
    "title": "GROUPING_ID",
    "language": "ja",
    "description": "GROUP BY クエリの各行のグループ化レベルを計算します。"
}
---

## 説明

GROUP BY クエリの各行のグループ化レベルを計算します。GROUPING_ID 関数は、出力行について GROUP BY リスト内のどの列が集約されていないかを示す整数のビットマップを返します。GROUP BY を指定した場合、SELECT リスト、HAVING 句、ORDER BY 句で使用できます。

## 構文

```sql
GROUPING_ID(<column_expression> [, ...])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<column_expression>` | GROUP BY 句に含まれる列式。 |

## 戻り値

指定した列のグループ化ビットマップを表す BIGINT 値を返します。

## 例

### 例 A: グループ化レベルの判定

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

*想定される出力:*

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

### 例 B: GROUPING_ID を使用した結果の絞り込み

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

*想定される出力:*

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