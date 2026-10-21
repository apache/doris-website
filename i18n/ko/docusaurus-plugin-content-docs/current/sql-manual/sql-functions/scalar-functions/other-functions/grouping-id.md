---
{
    "title": "GROUPING_ID",
    "language": "ko",
    "description": "GROUP BY 쿼리에서 행의 그룹화 수준을 계산합니다."
}
---

## 설명 {#description}

GROUP BY 쿼리에서 행의 그룹화 수준을 계산합니다. GROUPING_ID 함수는 주어진 출력 행에서 GROUP BY 목록의 어떤 컬럼이 집계되지 않았는지를 나타내는 정수 비트맵을 반환합니다. GROUP BY가 지정된 경우 SELECT 목록, HAVING 절 또는 ORDER BY 절에서 사용할 수 있습니다.

## 구문 {#syntax}

```sql
GROUPING_ID(<column_expression> [, ...])
```

## 매개변수 {#parameters}

| 매개변수                 | 설명                                              |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | GROUP BY 절의 컬럼 표현식입니다.                    |

## 반환 값 {#return-value}

주어진 컬럼의 그룹화 비트맵을 나타내는 BIGINT 값을 반환합니다.

## 예제 {#examples}

### 예제 A: 그룹화 수준 식별 {#example-a-identify-grouping-levels}

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

*예상 출력:*

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

### 예제 B: GROUPING_ID를 사용하여 결과 집합 필터링 {#example-b-filter-result-set-using-grouping_id}

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

*예상 출력:*

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
