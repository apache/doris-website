---
{
    "title": "RANK",
    "language": "ru",
    "description": "Оконная функция RANK() возвращает ранг значений в упорядоченном наборе данных. Ранги начинаются с 1 и последовательно увеличиваются."
}
---

## Описание {#description}

Оконная функция RANK() возвращает ранг значений в упорядоченном наборе данных. Ранги начинаются с 1 и последовательно увеличиваются. Одинаковые значения получают одинаковый ранг, но при этом в последовательности рангов появляются пропуски. Например, если первые две строки имеют ранг 1, следующее отличающееся значение получит ранг 3 (а не 2).

## Синтаксис {#syntax}

```sql
RANK()
```

## Возвращаемое значение {#return-value}

Возвращает значение ранга типа BIGINT. Для одинаковых значений возвращается одинаковый ранг, но в последовательности появляются пропуски.

## Примеры {#examples}

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

В этом примере данные разбиваются на разделы по отделам, а внутри каждого отдела ранжируются по зарплате. Сотрудники с одинаковыми зарплатами (например, Alice и Bob, Eve и Frank) получают одинаковый ранг, но это приводит к пропускам в последующих рангах.
