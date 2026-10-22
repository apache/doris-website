---
{
    "title": "FIELD",
    "language": "ru",
    "description": "Возвращает позицию первого вхождения <expr> в списке значений <param> [, ...]. Если <expr> не найдено, функция возвращает 0."
}
---

## Описание {#description}

Возвращает позицию первого вхождения `<expr>` в списке значений `<param> [, ...]`.  
Если `<expr>` не найдено, функция возвращает `0`. Эта функция часто используется в `ORDER BY` для задания пользовательского порядка сортировки.

## Синтаксис {#syntax}

```sql
FIELD(<expr>, <param> [, ...])
```

## Параметры {#parameters}

| Параметр  | Описание                                             |
|------------|---------------------------------------------------------|
| `<expr>`   | Значение, которое нужно найти в списке параметров.     |
| `<param>`  | Последовательность значений для сравнения с `<expr>`.       |

## Возвращаемое значение {#return-value}

- Возвращает позицию (индекс, начинающийся с 1) значения `<expr>` в списке значений `<param>`.  
- Если `<expr>` не найдено, возвращает `0`.  
- Если `<expr>` равно `NULL`, возвращает `0`.

## Примеры {#examples}

```sql
-- setup
CREATE TABLE baseall (k1 INT, k7 VARCHAR(64))
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO baseall VALUES
    (1, 'wangjing04'),
    (2, 'wangyu14'),
    (3, 'yuanyuan06');

CREATE TABLE class_test (class_name VARCHAR(64))
DISTRIBUTED BY HASH(class_name) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO class_test VALUES
    ('Suzi'), ('Suzi'),
    ('Ben'), ('Ben'),
    ('Henry'), ('Henry'),
    (NULL);
```

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

Пользовательский порядок сортировки строк. `FIELD` возвращает `0` для значений, отсутствующих в списке, включая `NULL`, поэтому строка с `NULL` оказывается в начале при сортировке по возрастанию, используемой по умолчанию:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```

Сортировка по убыванию: `NULL` (FIELD = 0) теперь находится в конце:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') DESC;
```

```text
+------------+
| class_name |
+------------+
| Henry      |
| Henry      |
| Ben        |
| Ben        |
| Suzi       |
| Suzi       |
| NULL       |
+------------+
```

Также можно использовать `NULLS FIRST` / `NULLS LAST`, чтобы управлять положением `NULL` независимо от направления сортировки:

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') NULLS FIRST;
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```
