---
{
    "title": "COUNT",
    "language": "ru",
    "description": "Возвращает количество записей со значением, отличным от NULL, в указанном столбце или общее количество записей."
}
---

## Описание {#description}

Возвращает количество записей со значением, отличным от NULL, в указанном столбце или общее количество записей.

## Синтаксис {#syntax}

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Если указано выражение, подсчитывает количество записей со значением, отличным от NULL; в противном случае подсчитывает общее количество строк. |

## Возвращаемое значение {#return-value}

Возвращаемое значение имеет тип Bigint. Если значение expr равно NULL, оно не учитывается.

## Пример {#example}

```sql
-- setup
create table test_count(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_count values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);

create table test_insert(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_insert values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);
```

```sql
select count(*) from test_count;
```

```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```

```sql
select count(name) from test_insert;
```

```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```

```sql
select count(distinct sex) from test_insert;
```

```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select count(distinct id,sex) from test_insert;
```

```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
