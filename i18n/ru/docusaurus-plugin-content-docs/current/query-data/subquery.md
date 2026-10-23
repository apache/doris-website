---
{
    "title": "Подзапрос",
    "language": "ru",
    "description": "Руководство по подзапросам в Doris: синтаксис, ограничения и обработка Mark Join для скалярных, нескалярных, коррелированных и некоррелированных подзапросов.",
    "keywords": [
        "Подзапрос Doris",
        "Подзапрос",
        "Скалярный подзапрос",
        "Коррелированный подзапрос",
        "Подзапрос IN EXISTS",
        "Mark Join"
    ]
}
---

<!-- Knowledge type: Capability definition + Usage limitations -->
<!-- Applicable scenarios: Writing nested SQL queries / Troubleshooting subquery errors -->

Подзапрос — это SQL-запрос, вложенный в другой запрос (обычно в оператор SELECT). Он может находиться в предложении SELECT, FROM, WHERE или HAVING и предоставлять данные или условия для внешнего запроса. С помощью подзапросов можно реализовать более сложную логику фильтрации, агрегирования и соединения в одном операторе SQL.

В этом документе описаны категории подзапросов в Doris, поддерживаемые возможности, ограничения и механизм Mark Join, используемый в особых случаях.

## Сценарии использования {#applicable-scenarios}

Подзапросы обычно используются в следующих сценариях:

- **Сложная фильтрация**: используйте подзапрос в предложении `WHERE` или `HAVING` для динамического вычисления условий фильтрации.
- **Вычисление производных столбцов**: используйте скалярный подзапрос в списке `SELECT`, чтобы добавить дополнительное поле.
- **Производная таблица**: используйте подзапрос в предложении `FROM` как временную таблицу, участвующую в соединении.
- **Проверки существования**: используйте `EXISTS`/`NOT EXISTS` или `IN`/`NOT IN` для проверки отношений между множествами.

## Основные характеристики подзапросов {#basic-characteristics-of-subqueries}

При использовании подзапросов учитывайте следующие основные характеристики:

| Характеристика | Описание |
| --- | --- |
| Расположение | Могут находиться в предложениях `SELECT`, `FROM`, `WHERE` или `HAVING` и использоваться совместно с `SELECT`, `UPDATE`, `INSERT`, `DELETE`, а также с операторами выражений, такими как `=`, `>`, `<`, `<=`, `IN` и `EXISTS`. |
| Связь внешнего и внутреннего запросов | Внешний запрос называется основным запросом, а вложенный в него запрос — подзапросом. |
| Порядок выполнения | Независимый подзапрос обычно выполняется первым; при наличии корреляции синтаксический анализатор определяет необходимый порядок выполнения и передаёт результат подзапроса основному запросу. |
| Синтаксическое ограничение | Подзапрос должен быть заключён в круглые скобки, чтобы отличать его от основного запроса. |

Во всех примерах ниже используются две таблицы: `t1` и `t2`. Их DDL приведён ниже:

```sql
create table t1
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## Категории подзапросов {#categories-of-subqueries}

Подзапросы можно классифицировать по двум признакам: **характеристикам возвращаемых данных** и **наличию ссылок на столбцы внешнего запроса**.

### Классификация по характеристикам возвращаемых данных {#classification-by-returned-data-characteristics}

По характеристикам возвращаемых данных подзапросы делятся на скалярные и нескалярные.

| Тип | Возвращаемый результат | Возвращаемое значение, если таблица пуста | Допустимые места использования |
| --- | --- | --- | --- |
| Скалярный подзапрос | Одно значение (отношение с одной строкой и одним столбцом) | `NULL` | Везде, где допускается выражение, возвращающее одно значение |
| Нескалярный подзапрос | Отношение (может содержать несколько строк и столбцов) | Пустое множество (0 строк) | Везде, где допускается отношение (множество) |

Пример (если `t2` пуста, эти два подзапроса возвращают разные результаты):

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### Классификация по наличию ссылок на столбцы внешнего запроса {#classification-by-whether-outer-columns-are-referenced}

В зависимости от наличия ссылок на столбцы внешнего запроса подзапросы делятся на коррелированные и некоррелированные.

| Тип | Ссылки на столбцы внешнего запроса | Способ выполнения |
| --- | --- | --- |
| Некоррелированный подзапрос | Нет | Обычно может вычисляться независимо и однократно возвращает результат для использования во внешнем запросе. |
| Коррелированный подзапрос | Да (обычно в предложении `WHERE` подзапроса) | Подзапрос должен выполняться для каждой строки внешней таблицы, что эквивалентно операции фильтрации внешней таблицы. |

Примеры:

```sql
-- Correlated subquery. The subquery uses the outer table column t1.c2.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- Uncorrelated subquery. The subquery does not reference any column of the outer table t1.
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Подзапросы, поддерживаемые Doris {#subqueries-supported-by-doris}

<!-- Knowledge type: Capability support matrix -->

Doris поддерживает все некоррелированные подзапросы. Для коррелированных подзапросов поддерживаются следующие возможности:

- Коррелированные скалярные подзапросы в предложениях `WHERE` и `HAVING`.
- Коррелированные нескалярные подзапросы с `IN`, `NOT IN`, `EXISTS` или `NOT EXISTS` в предложениях `WHERE` и `HAVING`.
- Коррелированные скалярные подзапросы в списке `SELECT`.
- Для вложенных подзапросов поддерживается корреляция только с непосредственным родительским запросом. Корреляция через несколько уровней вложенности с более внешним запросом не поддерживается.

## Ограничения коррелированных подзапросов {#limitations-of-correlated-subqueries}

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Для разных форм коррелированных подзапросов в Doris действуют разные ограничения, описанные ниже.

### Ограничения коррелированных скалярных подзапросов {#limitations-of-correlated-scalar-subqueries}

Начиная с версии 4.1.5, подзапросы, которые содержат операции над множествами, такие как `UNION`, `INTERSECT` или `EXCEPT`, и ссылаются на столбцы внешнего запроса, явно отклоняются на этапе анализа, например с сообщением `Unsupported correlated subquery with set operation`. Это не затрагивает некоррелированные подзапросы с операциями над множествами. На верхнем уровне `EXISTS` или `NOT EXISTS` над агрегированием без группировки по-прежнему могут упрощаться до true или false, если результат известен. Это не означает, что все подзапросы с операциями над множествами не поддерживаются.

Следующие два условия должны выполняться одновременно:

- Условие корреляции должно быть условием равенства.
- Результат подзапроса должен быть результатом одной агрегатной функции, а сам подзапрос не должен содержать предложение `group by`.

```sql
-- Single aggregate function and no group by: supported.
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;

-- Non-equality correlation condition: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);

-- No aggregate function: not supported.
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);

-- Aggregate function present but with group by: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### Ограничения коррелированных подзапросов (NOT) EXISTS {#limitations-of-correlated-not-exists-subqueries}

- Подзапрос не может одновременно использовать `offset` и `limit`.

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### Ограничения коррелированных подзапросов (NOT) IN {#limitations-of-correlated-not-in-subqueries}

Следующие три условия должны выполняться одновременно:

- Результат подзапроса должен содержать один столбец.
- Подзапрос не может использовать `limit`.
- Подзапрос не может использовать агрегатные функции или предложение `group by`.

```sql
-- Supported subquery.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;

-- Multi-column output in the subquery: not supported.
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);

-- Subquery with limit: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);

-- With a group by clause: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);

-- With an aggregate function: not supported.
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### Ограничения вложенных подзапросов {#limitations-of-nested-subqueries}

В настоящее время поддерживается корреляция только между подзапросом и его непосредственным родительским запросом. Корреляция с более внешним запросом не поддерживается.

Предположим, что также существует таблица `t3` со следующим определением:

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- Поддерживается: подзапрос ссылается только на столбцы непосредственного родительского запроса.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2
        ) and t2.c2 = t1.c2
    );
    ```

- Не поддерживается: самый внутренний подзапрос ссылается и на `t2.c2` из непосредственного родительского запроса, и на `t1.c1` из самого внешнего запроса.

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2 and t3.c1 = t1.c1
        )
    );
    ```

## Mark Join {#mark-join}

<!-- Knowledge type: Execution mechanism -->
<!-- Applicable scenarios: When a subquery has an OR relationship with other filter conditions -->

Если в предложении `WHERE` подзапрос `(NOT) IN` или `(NOT) EXISTS` объединён с другим условием фильтрации через `OR`, для получения корректного результата требуется специальная обработка. Например:

```sql
select
    t1.c1,
    t1.c2
from t1
where exists (
    select
        t2.c1
    from t2
    where
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

Если приведённое выше предложение `EXISTS` напрямую переписать как `LEFT SEMI JOIN`, то согласно его семантике будут возвращены только строки из `t1`, удовлетворяющие условию `t1.c2 = t2.c2`, хотя строки, удовлетворяющие условию `t1.c1 > 0`, также должны быть возвращены. Для обработки таких случаев Doris использует механизм **Mark Join**.

:::info Примечание
`RIGHT SEMI JOIN` работает аналогично; меняются местами только левая и правая таблицы. В данном примере используется `LEFT SEMI JOIN`.
:::

Пример SQL приведён ниже:

```sql
-- This SQL cannot actually be executed. It is shown for illustration only.
select
    tx.c1,
    tx.c2
from
    (
        select
            t1.c1,
            t1.c2,
            mark_join_flag
        from
            t1 left (mark) semi join t2 on t1.c2 = t2.c2
    ) tx
where
    tx.mark_join_flag or tx.c1 > 0;
```

Разница между Mark Join и обычным `LEFT SEMI JOIN` заключается в следующем: обычный `LEFT SEMI JOIN` сразу возвращает строки левой таблицы, удовлетворяющие условию; Mark Join возвращает исходную левую таблицу с дополнительным столбцом-флагом, значение которого равно `TRUE`, `FALSE` или `NULL` (в примере это `mark_join_flag`). Значение этого флага определяется условием `JOIN`, заданным выражением `t1.c2 = t2.c2`. Для каждой строки формируется соответствующее значение флага, как показано ниже:

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

Благодаря этому столбцу-флагу исходное условие фильтрации `WHERE` можно переписать как `where mark_join_flag or t1.c1 > 0`, что даёт корректный результат.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

Поскольку результат скалярного подзапроса должен быть одним значением, при возврате более одной записи возникает ошибка во время выполнения.

### Коррелированный скалярный подзапрос возвращает несколько строк {#correlated-scalar-subquery-returns-multiple-rows}

Если при использовании коррелированного скалярного подзапроса для некоторой строки внешнего запроса подзапрос возвращает более одной строки, соответствующей условию корреляции, возникает ошибка во время выполнения.

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### Некоррелированный скалярный подзапрос возвращает несколько строк {#uncorrelated-scalar-subquery-returns-multiple-rows}

Doris добавляет оператор `assert num rows` во время выполнения. Если подзапрос возвращает более одной записи, возникает ошибка во время выполнения.

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
