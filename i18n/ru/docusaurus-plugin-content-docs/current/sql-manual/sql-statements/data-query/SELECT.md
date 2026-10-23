---
{
    "title": "SELECT",
    "language": "ru",
    "description": "Основные сведения об использовании синтаксиса Select"
}
---

## Описание {#description}

Основные сведения об использовании синтаксиса Select

Синтаксис:

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

1. **Описание синтаксиса:**

   1. select_expr, ... Столбцы, которые извлекаются и отображаются в результате. При использовании псевдонима ключевое слово as необязательно.

   2. select_expr, ... Целевая таблица для выборки (одна или несколько таблиц, включая временные таблицы, созданные подзапросами).

   3. where_definition задаёт условие выборки (выражение). Если присутствует предложение WHERE, это условие фильтрует строки данных. where_condition — выражение, которое должно принимать значение true для каждой выбираемой строки. Без предложения WHERE оператор выбирает все строки. В выражениях WHERE можно использовать любые функции и операторы, поддерживаемые MySQL, кроме агрегатных функций.

   4. `ALL | DISTINCT `: управляет составом набора результатов: all возвращает всё, distinct/distinctrow удаляет повторяющиеся столбцы; по умолчанию используется all.
   
   5. `ALL EXCEPT`: фильтрует полный набор результатов (all); except задаёт имена одного или нескольких столбцов, которые нужно исключить из полного набора результатов. Все столбцы с совпадающими именами исключаются из вывода.
    
   Эта возможность поддерживается начиная с версии Apache Doris 1.2.
    

   6. `INTO OUTFILE 'file_name' `: сохраняет результат в новый файл, который ранее не существовал; различие заключается в формате сохранения.

   7. `Group by having`: группирует набор результатов, а при наличии having фильтрует результат group by. `Grouping Sets`, `Rollup`, `Cube` — расширения group by. Подробности см. в разделе [Проектирование GROUPING SETS](https://doris.apache.org/community/design/grouping_sets_design).

   8. `Order by`: сортирует итоговый результат. Order by упорядочивает набор результатов, сравнивая значения одного или нескольких столбцов.

      Order by — операция, требующая значительных затрат времени и ресурсов, поскольку перед сортировкой все данные необходимо передать на 1 узел, а сама сортировка требует больше памяти, чем обработка без сортировки.

      Чтобы вернуть первые N отсортированных результатов, необходимо использовать предложение LIMIT. Для ограничения потребления памяти, если пользователь не указал предложение LIMIT, по умолчанию возвращаются первые 65535 отсортированных результатов.

   9. `Limit n`: ограничивает количество строк в результате; `limit m,n` означает вывод n записей, начиная со строки m. Следует использовать `order by` перед `limit m,n`, иначе при каждом выполнении могут возвращаться разные данные.

   10. Предложение `Having` фильтрует не строки данных в таблице, а результаты, полученные с помощью агрегатной функции.

       Обычно `having` используется с агрегатными функциями (например, `COUNT(), SUM(), AVG(), MIN(), MAX()`) и предложениями `group by`.

   11. SELECT поддерживает явный выбор разделов с помощью PARTITION со списком разделов или подразделов (либо тех и других), который указывается после имени таблицы в `table_reference`.

   12. `[TABLET tids] TABLESAMPLE n [ROWS | PERCENT] [REPEATABLE seek]`: ограничивает количество строк, считываемых из таблицы в предложении FROM. В зависимости от указанного количества строк или процента псевдослучайно выбирается некоторое количество Tablets из таблицы. Начальное значение генератора в REPEATABLE позволяет повторно получить ту же выборку. Кроме того, можно вручную указать TableID. Обратите внимание: это можно использовать только для таблиц OLAP.
   
   13. `hint_statement`: подсказка перед selectlist позволяет влиять на поведение оптимизатора, чтобы получить нужный план выполнения. Подробности см. в [документации по использованию joinHint] (https://doris.apache.org/docs/dev/query-acceleration/hints/hints-overview).

**Ограничения синтаксиса:**

1. SELECT также можно использовать для получения вычисляемых строк без обращения к какой-либо таблице.
2. Все предложения должны следовать строго в указанном выше порядке. Предложение HAVING должно располагаться после GROUP BY и перед ORDER BY.
3. Ключевое слово AS для задания псевдонима необязательно. Псевдонимы можно использовать в group by, order by и having.
4. Предложение Where: WHERE определяет, какие строки должны попасть в раздел GROUP BY, а HAVING определяет, какие строки следует использовать в наборе результатов.
5. Предложение HAVING может обращаться к агрегатным функциям, например count, sum, max, min, avg, а WHERE — нет. При этом в where можно обращаться к другим функциям, кроме агрегатных. Псевдонимы столбцов нельзя использовать для задания условий в предложении Where.
6. Group by с последующим with rollup позволяет вычислять итоги на одном или нескольких уровнях.

**Запрос JOIN:**

Doris поддерживает синтаксис JOIN.

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

**Синтаксис UNION:**

```sql
SELECT ...
UNION [ALL| DISTINCT] SELECT ......
[UNION [ALL| DISTINCT] SELECT ...]
```

`UNION` используется для объединения результатов нескольких операторов `SELECT` в единый набор результатов.

Имена столбцов из первого оператора `SELECT` используются в качестве имён столбцов возвращаемого результата. Выбранные столбцы, указанные на соответствующих позициях в каждом операторе `SELECT`, должны иметь одинаковый тип данных. Например, первый столбец, выбранный первым оператором, должен иметь тот же тип, что и первый столбец, выбранный остальными операторами.

По умолчанию `UNION` удаляет повторяющиеся строки из результата. Необязательное ключевое слово `DISTINCT` не меняет поведение по умолчанию, поскольку оно также указывает на необходимость удаления повторяющихся строк. При использовании необязательного ключевого слова `ALL` повторяющиеся строки не удаляются, и результат включает все подходящие строки из всех операторов `SELECT`.

**Оператор WITH**:

Для задания обобщённых табличных выражений используйте предложение `WITH` с одним или несколькими подвыражениями, разделёнными запятыми. Каждое подвыражение содержит подзапрос, формирующий набор результатов, и связывает с ним имя. В следующем примере с помощью `WITH` определяются CTE с именами `cte1` и `cte2`, а результаты `WITH` используются в основном операторе `SELECT`:

```sql
WITH
  cte1 AS (SELECT a，b FROM table1),
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

В операторе, содержащем предложение `WITH`, можно обращаться к каждому имени CTE для доступа к соответствующему набору результатов.

На имена CTE можно ссылаться в других CTE, что позволяет определять CTE на основе других CTE.

Рекурсивные CTE в настоящее время не поддерживаются.

## Примеры {#example}

1. Запрос имён студентов в возрасте 18, 20, 25 лет

   ```sql
   select Name from student where age in (18,20,25);
   ```
2. Пример ALL EXCEPT
   ```sql
   -- Query all information except the students' age
   select * except(age) from student; 
   ```
   
3. Пример GROUP BY

   ```sql
   --Query the tb_book table, group by type, and find the average price of each type of book,
   select type,avg(price) from tb_book group by type;
   ```

4. Использование DISTINCT

   ```
   --Query the tb_book table to remove duplicate type data
   select distinct type from tb_book;
   ```

5. Пример ORDER BY

   Сортировка результатов запроса по возрастанию (по умолчанию) или по убыванию (DESC). При сортировке по возрастанию NULL идёт первым, а при сортировке по убыванию NULL идёт последним.

   ```sql
   --Query all records in the tb_book table, sort them in descending order by id, and display three records
   select * from tb_book order by id desc limit 3;
   ```

6. Поиск по шаблону с LIKE

   Позволяет выполнять поиск по шаблону с двумя подстановочными символами: `%` и `_`. Символ `%` соответствует одному или нескольким символам, а `_` — одному символу.

   ```
   --Find all books whose second character is h
   select * from tb_book where name like('_h%');
   ```

7. Ограничение количества строк результата с помощью LIMIT

   ```sql
   --1. Display 3 records in descending order
   select * from tb_book order by price desc limit 3;
   
   --2. Display 4 records from id=1
   select * from tb_book where id limit 1,4;
   ```

8. Объединение нескольких столбцов с помощью CONCAT

   ```sql
   --Combine name and price into a new string output
   select id,concat(name,":",price) as info,type from tb_book;
   ```

9. Использование функций и выражений

   ```sql
   --Calculate the total price of various books in the tb_book table
   select sum(price) as total,type from tb_book group by type;
   --20% off price
   select *,(price * 0.8) as "20%" from tb_book;
   ```

10. Пример UNION

    ```sql
    SELECT a FROM t1 WHERE a = 10 AND B = 1 ORDER BY a LIMIT 10
    UNION
    SELECT a FROM t2 WHERE a = 11 AND B = 2 ORDER BY a LIMIT 10;
    ```

11. Пример предложения WITH

    ```sql
    WITH cte AS
    (
      SELECT 1 AS col1, 2 AS col2
      UNION ALL
      SELECT 3, 4
    )
    SELECT col1, col2 FROM cte;
    ```

12. Пример JOIN

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2, t3, t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```

    Эквивалентно следующему запросу:

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

## Ключевые слова {#keywords}

    SELECT

## Рекомендации по использованию {#best-practice}

1. Дополнительные сведения о предложении SELECT

   - Для select_expr можно задать псевдоним с помощью AS alias_name. Псевдонимы используются в выражениях как имена столбцов и могут применяться в предложениях GROUP BY, ORDER BY или HAVING. При задании псевдонимов столбцов рекомендуется использовать ключевое слово AS.

   - table_references после FROM указывает одну или несколько таблиц, участвующих в запросе. Если указано несколько таблиц, выполняется операция JOIN. Для каждой указанной таблицы можно определить псевдоним.

   - На выбранный после SELECT столбец можно ссылаться в ORDER IN и GROUP BY по имени столбца, его псевдониму или целому числу (начиная с 1), обозначающему позицию столбца.

     ```sql
     SELECT college, region, seed FROM tournament
       ORDER BY region, seed;
     
     SELECT college, region AS r, seed AS s FROM tournament
       ORDER BY r, s;
     
     SELECT college, region, seed FROM tournament
       ORDER BY 2, 3;
     ```

   - Если ORDER BY присутствует в подзапросе и во внешнем запросе, приоритет имеет самый внешний ORDER BY.

   - При использовании GROUP BY столбцы группировки автоматически сортируются по возрастанию, как если бы после них был указан ORDER BY с теми же столбцами. Чтобы избежать накладных расходов на автоматическую сортировку при GROUP BY, можно добавить ORDER BY NULL:

     ```sql
     SELECT a, COUNT(b) FROM test_table GROUP BY a ORDER BY NULL;
     ```

     

   - При сортировке столбцов в SELECT с помощью ORDER BY или GROUP BY сервер использует только начальные байты значений в количестве, указанном системной переменной max_sort_length.

   - Предложения Having обычно применяются в конце, непосредственно перед возвратом набора результатов клиенту MySQL, и не оптимизируются. При этом LIMIT применяется после HAVING.

     Стандарт SQL требует, чтобы HAVING обращалось к столбцу из списка GROUP BY или к столбцу, используемому агрегатной функцией. Однако MySQL расширяет это правило, позволяя HAVING обращаться к столбцам из списка предложения Select, а также к столбцам из внешних подзапросов.

     Если ссылка на столбец в HAVING неоднозначна, выдаётся предупреждение. В следующем операторе col2 неоднозначен:

     ```sql
     SELECT COUNT(col1) AS col2 FROM t GROUP BY col2 HAVING col2 = 2;
     ```

   - Не используйте HAVING там, где следует использовать WHERE. HAVING применяется вместе с GROUP BY.

   - Предложение HAVING может обращаться к агрегатным функциям, а WHERE — нет.

     ```sql
     SELECT user, MAX(salary) FROM users
       GROUP BY user HAVING MAX(salary) > 10;
     ```

   - Предложение LIMIT можно использовать для ограничения количества строк, возвращаемых оператором SELECT. LIMIT может принимать один или два аргумента, каждый из которых должен быть неотрицательным целым числом.

     ```sql
     /*Retrieve 6~15 rows in the result set*/
     SELECT * FROM tbl LIMIT 5,10;
     /*Then if you want to retrieve all rows after a certain offset is set, you can set a very large constant for the second parameter. The following query fetches all data from row 96 onwards */
     SELECT * FROM tbl LIMIT 95,18446744073709551615;
     /*If LIMIT has only one parameter, the parameter specifies the number of rows that should be retrieved, and the offset defaults to 0, that is, starting from the first row*/
     ```

   - SELECT...INTO позволяет записывать результаты запроса в файл.

2. Модификаторы ключевого слова SELECT

   - Удаление дубликатов

     Модификаторы ALL и DISTINCT определяют, следует ли удалять повторяющиеся строки из набора результатов (речь идёт о строках, а не о столбцах).

     ALL — модификатор по умолчанию: извлекаются все строки, соответствующие условиям.

     DISTINCT удаляет повторяющиеся строки.

3. Основные преимущества подзапросов

    - Подзапросы позволяют структурировать запросы так, чтобы каждую часть оператора можно было обособить.
    - Некоторые операции требуют сложных объединений и соединений. Подзапросы предоставляют другие способы выполнения таких операций.

4. Ускорение запросов

    - По возможности используйте разделы и бакеты Doris в качестве условий фильтрации данных, чтобы сократить объём сканируемых данных.
    - Используйте поля префиксного индекса Doris в условиях фильтрации данных, чтобы ускорить выполнение запросов.
    
5. UNION

   - Использование только ключевого слова union даёт тот же результат, что и union disitnct. Поскольку удаление дубликатов требует больше памяти, запрос с операцией union all выполняется быстрее и потребляет меньше памяти. Если к возвращаемому набору результатов нужно применить order by и limit, поместите операцию union в подзапрос, затем выполните select из этого подзапроса, а order by и limit укажите снаружи подзапроса.
   
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
   
      - Условие внутреннего соединения поддерживает как соединения по равенству, так и соединения по неравенству. Для повышения производительности рекомендуется использовать соединения по равенству.
      - Другие виды соединений поддерживают только соединения по равенству.
