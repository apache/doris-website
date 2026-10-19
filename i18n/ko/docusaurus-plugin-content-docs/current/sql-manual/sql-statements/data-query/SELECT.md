---
{
    "title": "SELECT",
    "language": "ko",
    "description": "Select 구문의 사용법을 주로 소개합니다"
}
---

## 설명 {#description}

Select 구문의 사용법을 주로 소개합니다

구문:

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT | DISTINCTROW | ALL EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    select_expr [, select_expr ...]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position}
      [ASC | DESC], ...]
    [LIMIT {[offset,] row_count | row_count OFFSET offset}]
    [INTO OUTFILE 'file_name']
```

1. **구문 설명:**

   1. select_expr, ... 조회하여 결과에 표시할 열입니다. 별칭을 사용할 때 as는 생략할 수 있습니다.

   2. select_expr, ... 조회할 대상 테이블입니다. 하나 이상의 테이블을 지정하며, 서브쿼리에서 생성한 임시 테이블도 포함됩니다.

   3. where_definition은 조회 조건(표현식)입니다. WHERE 절이 있으면 이 조건으로 행 데이터를 필터링합니다. where_condition은 선택할 각 행에 대해 true로 평가되는 표현식입니다. WHERE 절이 없으면 모든 행을 선택합니다. WHERE 표현식에서는 집계 함수를 제외한 MySQL 지원 함수와 연산자를 모두 사용할 수 있습니다.

   4. `ALL | DISTINCT `: 결과 집합의 중복 처리 방식을 지정합니다. all은 전체 결과를 반환하고 distinct/distinctrow는 중복 열을 제거합니다. 기본값은 all입니다.
   
   5. `ALL EXCEPT`: 전체(all) 결과 집합을 필터링합니다. except는 전체 결과 집합에서 제외할 하나 이상의 열 이름을 지정합니다. 일치하는 열 이름은 모두 출력에서 제외됩니다.
    
   이 기능은 Apache Doris 1.2 버전부터 지원됩니다.
    

   6. `INTO OUTFILE 'file_name' `: 결과를 이전에 존재하지 않던 새 파일에 저장합니다. 저장 형식에 따라 차이가 있습니다.

   7. `Group by having`: 결과 집합을 그룹화하며, having이 있으면 group by의 결과를 필터링합니다. `Grouping Sets`, `Rollup`, `Cube`는 group by의 확장 기능입니다. 자세한 내용은 [GROUPING SETS 설계](https://doris.apache.org/community/design/grouping_sets_design)를 참조하세요.

   8. `Order by`: 최종 결과를 정렬합니다. Order by는 하나 이상의 열 값을 비교하여 결과 집합을 정렬합니다.

      Order by는 시간과 리소스가 많이 필요한 연산입니다. 정렬하려면 모든 데이터를 1개 노드로 전송해야 하며, 정렬 연산에는 정렬하지 않는 연산보다 더 많은 메모리가 필요하기 때문입니다.

      정렬된 상위 N개의 결과를 반환하려면 LIMIT 절을 사용해야 합니다. 메모리 사용량을 제한하기 위해 사용자가 LIMIT 절을 지정하지 않으면 기본적으로 정렬된 결과 중 처음 65535개를 반환합니다.

   9. `Limit n`: 출력 결과의 행 수를 제한합니다. `limit m,n`은 m번째 행부터 n개의 레코드를 출력한다는 뜻입니다. `order by`를 먼저 사용한 다음 `limit m,n`을 사용해야 합니다. 그렇지 않으면 실행할 때마다 데이터가 달라질 수 있습니다.

   10. `Having` 절은 테이블의 행 데이터를 필터링하는 것이 아니라 집계 함수가 생성한 결과를 필터링합니다.

       일반적으로 `having`은 집계 함수(예: `COUNT(), SUM(), AVG(), MIN(), MAX()`) 및 `group by` 절과 함께 사용합니다.

   11. SELECT는 `table_reference`의 테이블 이름 뒤에 파티션 또는 서브파티션(또는 둘 다)의 목록을 포함하는 PARTITION을 사용하여 파티션을 명시적으로 선택할 수 있습니다.

   12. `[TABLET tids] TABLESAMPLE n [ROWS | PERCENT] [REPEATABLE seek]`: FROM 절의 테이블에서 읽을 행 수를 제한합니다. 지정한 행 수 또는 비율에 따라 테이블에서 여러 Tablet을 의사 난수 방식으로 선택하며, REPEATABLE에 시드 값을 지정하면 동일한 표본을 다시 반환할 수 있습니다. 또한 TableID를 직접 지정할 수도 있습니다. 이 기능은 OLAP 테이블에서만 사용할 수 있습니다.
   
   13. `hint_statement`: selectlist 앞에 지정하는 힌트는 옵티마이저의 동작에 영향을 주어 원하는 실행 계획을 얻는 데 사용할 수 있습니다. 자세한 내용은 다음 문서를 참조하세요: [joinHint 사용 문서](https://doris.apache.org/docs/dev/query-acceleration/hints/hints-overview)

**구문 제약 사항:**

1. SELECT는 테이블을 참조하지 않고 계산된 행을 조회하는 데에도 사용할 수 있습니다.
2. 모든 절은 반드시 위 형식의 순서대로 작성해야 하며, HAVING 절은 GROUP BY 절 뒤, ORDER BY 절 앞에 배치해야 합니다.
3. 별칭 키워드 AS는 생략할 수 있습니다. 별칭은 group by, order by 및 having에서 사용할 수 있습니다.
4. Where 절: WHERE 문은 GROUP BY에 포함할 행을 결정하는 데 사용되며, HAVING은 결과 집합에서 사용할 행을 결정하는 데 사용됩니다.
5. HAVING 절은 count, sum, max, min, avg 등의 집계 함수를 참조할 수 있지만 WHERE 절은 참조할 수 없습니다. where 절에서는 집계 함수를 제외한 다른 함수를 참조할 수 있습니다. Where 절에서 조건을 정의할 때는 열 별칭을 사용할 수 없습니다.
6. Group by 뒤에 with rollup을 사용하면 결과를 한 번 이상 집계할 수 있습니다.

**JOIN 쿼리:**

Doris는 JOIN 구문을 지원합니다.

```sql
JOIN
table_references:
    table_reference [, table_reference] …
table_reference:
    table_factor
  | join_table
table_factor:
    tbl_name [[AS] alias]
        [{USE|IGNORE|FORCE} INDEX (key_list)]
  | ( table_references )
  | { OJ table_reference LEFT OUTER JOIN table_reference
        ON conditional_expr }
join_table:
    table_reference [INNER | CROSS] JOIN table_factor [join_condition]
  | table_reference LEFT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [LEFT [OUTER]] JOIN table_factor
  | table_reference RIGHT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [RIGHT [OUTER]] JOIN table_factor
join_condition:
    ON conditional_expr
```

**UNION 구문:**

```sql
SELECT ...
UNION [ALL| DISTINCT] SELECT ......
[UNION [ALL| DISTINCT] SELECT ...]
```

`UNION`은 여러 `SELECT` 문의 결과를 하나의 결과 집합으로 결합하는 데 사용됩니다.

첫 번째 `SELECT` 문의 열 이름이 반환되는 결과의 열 이름으로 사용됩니다. 각 `SELECT` 문에서 같은 위치에 나열된 열은 데이터 타입이 같아야 합니다. 예를 들어 첫 번째 문에서 선택한 첫 번째 열은 다른 문에서 선택한 첫 번째 열과 타입이 같아야 합니다.

`UNION`의 기본 동작은 결과에서 중복 행을 제거하는 것입니다. 선택적 키워드인 `DISTINCT`도 중복 행 제거를 지정하므로 기본 동작과 차이가 없습니다. 선택적 키워드인 `ALL`을 사용하면 중복 행을 제거하지 않으며, 모든 `SELECT` 문에서 조건에 맞는 모든 행이 결과에 포함됩니다.

**WITH 문**:

공통 테이블 표현식을 지정하려면 쉼표로 구분한 하나 이상의 하위 절과 함께 `WITH` 절을 사용합니다. 각 하위 절은 결과 집합을 생성하는 서브쿼리를 제공하고, 해당 서브쿼리에 이름을 연결합니다. 다음 예제에서는 `WITH` 절에서 이름이 `cte1` 및 `cte2`인 CTE를 정의하고, 해당 `WITH` 절을 그 아래의 최상위 `SELECT`에서 참조합니다:

```sql
WITH
  cte1 AS (SELECT a，b FROM table1),
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

`WITH` 절이 포함된 문에서는 각 CTE 이름을 참조하여 해당 CTE의 결과 집합에 접근할 수 있습니다.

다른 CTE에서 CTE 이름을 참조할 수 있으므로, 다른 CTE를 기반으로 CTE를 정의할 수 있습니다.

재귀 CTE는 현재 지원되지 않습니다.

## 예제 {#example}

1. 나이가 18, 20, 25인 학생의 이름 조회

   ```sql
   select Name from student where age in (18,20,25);
   ```
2. ALL EXCEPT 예제
   ```sql
   -- Query all information except the students' age
   select * except(age) from student; 
   ```
   
3. GROUP BY 예제

   ```sql
   --Query the tb_book table, group by type, and find the average price of each type of book,
   select type,avg(price) from tb_book group by type;
   ```

4. DISTINCT 사용

   ```
   --Query the tb_book table to remove duplicate type data
   select distinct type from tb_book;
   ```

5. ORDER BY 예제

   쿼리 결과를 오름차순(기본값) 또는 내림차순(DESC)으로 정렬합니다. 오름차순에서는 NULL이 처음에, 내림차순에서는 NULL이 마지막에 배치됩니다.

   ```sql
   --Query all records in the tb_book table, sort them in descending order by id, and display three records
   select * from tb_book order by id desc limit 3;
   ```

6. LIKE 패턴 검색

   패턴 검색을 수행할 수 있습니다. 와일드카드는 `%`와 `_` 두 가지이며, `%`는 하나 이상의 문자와 일치하고 `_`는 한 문자와 일치합니다.

   ```
   --Find all books whose second character is h
   select * from tb_book where name like('_h%');
   ```

7. LIMIT으로 결과 행 수 제한

   ```sql
   --1. Display 3 records in descending order
   select * from tb_book order by price desc limit 3;
   
   --2. Display 4 records from id=1
   select * from tb_book where id limit 1,4;
   ```

8. CONCAT으로 여러 열 연결

   ```sql
   --Combine name and price into a new string output
   select id,concat(name,":",price) as info,type from tb_book;
   ```

9. 함수 및 표현식 사용

   ```sql
   --Calculate the total price of various books in the tb_book table
   select sum(price) as total,type from tb_book group by type;
   --20% off price
   select *,(price * 0.8) as "20%" from tb_book;
   ```

10. UNION 예제

    ```sql
    SELECT a FROM t1 WHERE a = 10 AND B = 1 ORDER BY a LIMIT 10
    UNION
    SELECT a FROM t2 WHERE a = 11 AND B = 2 ORDER BY a LIMIT 10;
    ```

11. WITH 절 예제

    ```sql
    WITH cte AS
    (
      SELECT 1 AS col1, 2 AS col2
      UNION ALL
      SELECT 3, 4
    )
    SELECT col1, col2 FROM cte;
    ```

12. JOIN 예제

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2, t3, t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```

    다음과 동일합니다.

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2 CROSS JOIN t3 CROSS JOIN t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```

13. INNER JOIN

    ```sql
    SELECT t1.name, t2.salary
      FROM employee AS t1 INNER JOIN info AS t2 ON t1.name = t2.name;
    
    SELECT t1.name, t2.salary
      FROM employee t1 INNER JOIN info t2 ON t1.name = t2.name;
    ```

14. LEFT JOIN

    ```sql
    SELECT left_tbl.*
      FROM left_tbl LEFT JOIN right_tbl ON left_tbl.id = right_tbl.id
      WHERE right_tbl.id IS NULL;
    ```

15. RIGHT JOIN

    ```sql
    mysql> SELECT * FROM t1 RIGHT JOIN t2 ON (t1.a = t2.a);
    +------+------+------+------+
    | a    | b    | a    | c    |
    +------+------+------+------+
    |    2 | y    |    2 | z    |
    | NULL | NULL |    3 | w    |
    +------+------+------+------+
    ```

16. TABLESAMPLE

    ```sql
    --Pseudo-randomly sample 1000 rows in t1. Note that several Tablets are actually selected according to the statistics of the table, and the total number of selected Tablet rows may be greater than 1000, so if you want to explicitly return 1000 rows, you need to add Limit.
    SELECT * FROM t1 TABLET(10001) TABLESAMPLE(1000 ROWS) REPEATABLE 2 limit 1000;
    ```

## 키워드 {#keywords}

    SELECT

## 모범 사례 {#best-practice}

1. SELECT 절에 관한 추가 정보

   - AS alias_name을 사용하여 select_expr에 별칭을 지정할 수 있습니다. 별칭은 표현식에서 열 이름으로 사용되며, GROUP BY, ORDER BY 또는 HAVING 절에서 사용할 수 있습니다. 열의 별칭을 지정할 때는 AS 키워드를 사용하는 것이 좋습니다.

   - FROM 뒤의 table_references는 쿼리에 참여하는 하나 이상의 테이블을 나타냅니다. 테이블을 여러 개 나열하면 JOIN 연산이 수행됩니다. 지정한 각 테이블에 별칭을 정의할 수도 있습니다.

   - SELECT 뒤에서 선택한 열은 ORDER IN 및 GROUP BY에서 열 이름, 열 별칭 또는 열 위치를 나타내는 정수(1부터 시작)로 참조할 수 있습니다.

     ```sql
     SELECT college, region, seed FROM tournament
       ORDER BY region, seed;
     
     SELECT college, region AS r, seed AS s FROM tournament
       ORDER BY r, s;
     
     SELECT college, region, seed FROM tournament
       ORDER BY 2, 3;
     ```

   - 서브쿼리에 ORDER BY가 있고 외부 쿼리에도 ORDER BY가 적용되면 가장 바깥쪽의 ORDER BY가 우선합니다.

   - GROUP BY를 사용하면 그룹화된 열이 자동으로 오름차순 정렬됩니다. 이는 같은 열을 지정한 ORDER BY 문이 있는 것과 같습니다. 자동 정렬로 인한 GROUP BY의 오버헤드를 피하려면 ORDER BY NULL을 추가하면 됩니다:

     ```sql
     SELECT a, COUNT(b) FROM test_table GROUP BY a ORDER BY NULL;
     ```

     

   - SELECT에서 ORDER BY 또는 GROUP BY로 열을 정렬할 때 서버는 각 값의 앞부분에서 max_sort_length 시스템 변수가 지정한 바이트 수만 사용하여 정렬합니다.

   - Having 절은 일반적으로 결과 집합을 MySQL 클라이언트에 반환하기 직전에 마지막으로 적용되며 최적화되지 않습니다. 단, LIMIT은 HAVING 이후에 적용됩니다.

     SQL 표준에서는 HAVING이 GROUP BY 목록에 있는 열이나 집계 함수에서 사용하는 열을 참조하도록 요구합니다. 그러나 MySQL은 이를 확장하여 HAVING이 Select 절 목록에 있는 열과 외부 서브쿼리의 열도 참조할 수 있도록 허용합니다.

     HAVING이 참조하는 열이 모호하면 경고가 발생합니다. 다음 문에서 col2는 모호합니다:

     ```sql
     SELECT COUNT(col1) AS col2 FROM t GROUP BY col2 HAVING col2 = 2;
     ```

   - WHERE를 사용해야 하는 곳에 HAVING을 사용하지 않도록 주의하세요. HAVING은 GROUP BY와 함께 사용합니다.

   - HAVING 절은 집계 함수를 참조할 수 있지만 WHERE는 참조할 수 없습니다.

     ```sql
     SELECT user, MAX(salary) FROM users
       GROUP BY user HAVING MAX(salary) > 10;
     ```

   - LIMIT 절은 SELECT 문이 반환하는 행 수를 제한하는 데 사용할 수 있습니다. LIMIT에는 하나 또는 두 개의 인수를 지정할 수 있으며, 모두 음이 아닌 정수여야 합니다.

     ```sql
     /*Retrieve 6~15 rows in the result set*/
     SELECT * FROM tbl LIMIT 5,10;
     /*Then if you want to retrieve all rows after a certain offset is set, you can set a very large constant for the second parameter. The following query fetches all data from row 96 onwards */
     SELECT * FROM tbl LIMIT 95,18446744073709551615;
     /*If LIMIT has only one parameter, the parameter specifies the number of rows that should be retrieved, and the offset defaults to 0, that is, starting from the first row*/
     ```

   - SELECT...INTO를 사용하면 쿼리 결과를 파일에 쓸 수 있습니다.

2. SELECT 키워드의 수정자

   - 중복 제거

     ALL 및 DISTINCT 수정자는 결과 집합의 행에서 중복을 제거할지 지정합니다. 열의 중복을 제거하는 것은 아닙니다.

     ALL은 기본 수정자로, 조건에 맞는 모든 행을 조회합니다.

     DISTINCT는 중복 행을 제거합니다.

3. 서브쿼리의 주요 장점

    - 서브쿼리를 사용하면 문을 구성하는 각 부분을 분리하여 쿼리를 구조화할 수 있습니다.
    - 일부 연산에는 복잡한 합집합과 조인이 필요합니다. 서브쿼리는 이러한 연산을 수행하는 다른 방법을 제공합니다.

4. 쿼리 속도 향상

    - Doris의 파티션과 버킷을 데이터 필터링 조건으로 최대한 활용하여 데이터 스캔 범위를 줄입니다.
    - Doris의 접두사 인덱스 필드를 데이터 필터링 조건으로 충분히 활용하여 쿼리 속도를 높입니다.
    
5. UNION

   - union 키워드만 사용하는 것은 union disitnct를 사용하는 것과 효과가 같습니다. 중복 제거 작업은 메모리를 더 많이 사용하므로, union all 연산을 사용하면 쿼리 속도가 더 빠르고 메모리 사용량도 줄어듭니다. 반환된 결과 집합에 order by 및 limit 연산을 적용하려면 union 연산을 서브쿼리에 넣고, 바깥쪽 쿼리에서 해당 서브쿼리를 select한 다음 order by와 limit를 적용해야 합니다.
   
       ```sql
       select * from (select age from student_01 union all select age from student_02) as t1
       order by age limit 4;
         
       +-------------+
       | age |
       +-------------+
       | 18 |
       | 19 |
       | 20 |
       | 21 |
       +-------------+
       4 rows in set (0.01 sec)
       ```
   
6. JOIN
   
      - 내부 조인 조건에서는 동등 조인뿐 아니라 비동등 조인도 지원합니다. 성능을 위해 동등 조인을 사용하는 것이 좋습니다.
      - 다른 조인은 동등 조인만 지원합니다.
