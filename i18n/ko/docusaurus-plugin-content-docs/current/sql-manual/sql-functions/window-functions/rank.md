---
{
    "title": "RANK",
    "language": "ko",
    "description": "RANK()는 정렬된 데이터 집합에서 값의 순위를 반환하는 윈도우 함수입니다. 순위는 1부터 시작하여 순차적으로 증가합니다."
}
---

## 설명 {#description}

RANK()는 정렬된 데이터 집합에서 값의 순위를 반환하는 윈도우 함수입니다. 순위는 1부터 시작하여 순차적으로 증가합니다. 동일한 값에는 같은 순위가 부여되지만, 이로 인해 이후 순위에서는 번호를 건너뜁니다. 예를 들어 처음 두 행이 공동 1위인 경우, 그다음에 나오는 다른 값은 3위가 됩니다(2위가 아님).

## 구문 {#syntax}

```sql
RANK()
```

## 반환 값 {#return-value}

BIGINT 형식의 순위 값을 반환합니다. 동일한 값에는 같은 순위를 반환하지만, 이후 순위에서는 번호를 건너뜁니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE employees (department VARCHAR(20), employee_name VARCHAR(20), salary INT) DISTRIBUTED BY HASH(employee_name) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO employees VALUES ('Sales','Alice',10000),('Sales','Bob',10000),('Sales','Charlie',8000),('IT','David',12000),('IT','Eve',11000),('IT','Frank',11000),('IT','Grace',9000);
-->

```sql
SELECT 
    department,
    employee_name,
    salary,
    RANK() OVER (
        PARTITION BY department 
        ORDER BY salary DESC
    ) as salary_rank
FROM employees;
```

```text
+------------+---------------+--------+-------------+
| department | employee_name | salary | salary_rank |
+------------+---------------+--------+-------------+
| Sales      | Alice        | 10000  | 1           |
| Sales      | Bob          | 10000  | 1           |
| Sales      | Charlie      | 8000   | 3           |  -- Note this is 3, not 2
| IT         | David        | 12000  | 1           |
| IT         | Eve          | 11000  | 2           |
| IT         | Frank        | 11000  | 2           |
| IT         | Grace        | 9000   | 4           |  -- Note this is 4, not 3
+------------+---------------+--------+-------------+
```

이 예제에서는 데이터를 부서별로 나누고 각 부서 내에서 급여에 따라 순위를 매깁니다. Alice와 Bob, Eve와 Frank처럼 급여가 같으면 동일한 순위를 부여하지만, 이후 순위에서는 번호를 건너뜁니다.
