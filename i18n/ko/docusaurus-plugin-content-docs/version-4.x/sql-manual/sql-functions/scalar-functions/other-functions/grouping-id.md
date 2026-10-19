---
{
    "title": "GROUPING_ID",
    "language": "ko",
    "description": "GROUP BY 쿼리에서 행의 그룹화 수준을 계산합니다."
}
---

## 설명 {#description}

GROUP BY 쿼리에서 행의 그룹화 수준을 계산합니다. GROUPING_ID 함수는 주어진 출력 행에서 GROUP BY 목록의 열 중 집계되지 않은 열을 나타내는 정수 비트맵을 반환합니다. GROUP BY가 지정된 경우 SELECT 목록이나 HAVING 절에서 사용할 수 있습니다.

## 구문 {#syntax}

```sql
GROUPING_ID(<column_expression> [, ...])
```

## 매개변수 {#parameters}

| 매개변수               | 설명                                       |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | GROUP BY 절의 열 표현식입니다.     |

## 반환값 {#return-value}

지정된 열의 그룹화 비트맵을 나타내는 BIGINT 값을 반환합니다.

## 예제 {#examples}

### 예제 A: GROUPING_ID를 사용하여 결과 집합 필터링 {#example-a-filter-result-set-using-grouping_id}

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
