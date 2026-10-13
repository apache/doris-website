---
{
    "title": "GROUPING_ID",
    "language": "ja",
    "description": "GROUP BY クエリの行のグループ化レベルを計算します。"
}
---

## 説明

GROUP BY クエリの行のグループ化レベルを計算します。GROUPING_ID 関数は、指定された出力行について、GROUP BY リストのどの列が集約されていないかを示す整数のビットマップを返します。GROUP BY を指定した場合、SELECT リストまたは HAVING 句で使用できます。

## 構文

```sql
GROUPING_ID(<column_expression> [, ...])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<column_expression>` | GROUP BY 句に含まれる列式。 |

## 戻り値

指定した列のグループ化を表すビットマップとして、BIGINT 値を返します。

## 例

### 例 A: GROUPING_ID を使用して結果セットを絞り込む

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
