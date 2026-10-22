---
{
    "title": "ANY_VALUE",
    "language": "ru",
    "description": "Возвращает произвольное значение выражения или столбца в группе. Если есть значение, отличное от NULL, возвращает произвольное такое значение; иначе возвращает NULL."
}
---

## Описание {#description}

Возвращает произвольное значение выражения или столбца в группе. Если есть значение, отличное от NULL, возвращает произвольное такое значение; иначе возвращает NULL.

## Псевдоним {#alias}

- ANY

## Синтаксис {#syntax}

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Столбец или выражение для агрегирования. Поддерживаемые типы: String, Date, DateTime, Timestamptz, IPv4, IPv6, Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Array, Map, Struct, AggState, Bitmap, HLL, QuantileState. |

## Возвращаемое значение {#return-value}

Возвращает произвольное значение, отличное от NULL, если такое значение существует; иначе возвращает NULL.
Тип возвращаемого значения совпадает с типом входного выражения expr.

## Пример {#example}

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01),
    (1, 'banana', 20.02),
    (2, 'orange', 30.03),
    (2, null, null),
    (3, null, null);
```

```sql
select k1, any_value(k_string) from t1 group by k1;
```

Тип String: для каждой группы возвращает произвольное значение, отличное от NULL.

```text
+------+---------------------+
| k1   | any_value(k_string) |
+------+---------------------+
|    1 | apple               |
|    2 | orange              |
|    3 | NULL                |
+------+---------------------+
```

```sql
select k1, any_value(k_decimal) from t1 group by k1;
```

Тип Decimal: возвращает произвольное десятичное значение высокой точности, отличное от NULL.

```text
+------+----------------------+
| k1   | any_value(k_decimal) |
+------+----------------------+
|    1 |                10.01 |
|    2 |                30.03 |
|    3 |                 NULL |
+------+----------------------+
```

```sql
select any_value(k_string) from t1 where k1 = 3;
```

Если все значения в группе равны NULL, возвращает NULL.

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select k1, any(k_string) from t1 group by k1;
```

Использование псевдонима ANY даёт тот же результат, что и ANY_VALUE.

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
