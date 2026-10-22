---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "ru",
    "description": "Функция KURTOSIS вычисляет эксцесс данных. Используемая формула: четвёртый центральный момент / (квадрат дисперсии) - 3."
}
---

## Описание {#description}

Функция KURTOSIS вычисляет [эксцесс](https://en.wikipedia.org/wiki/Kurtosis) данных. Используемая формула: четвёртый центральный момент / (квадрат дисперсии) - 3.

## Псевдонимы {#alias}

KURT_POP, KURTOSIS

## Синтаксис {#syntax}

```sql
KURTOSIS(<expr>)
KURT_POP(<expr>)
KURT(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Вычисляемое выражение; поддерживается тип Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа DOUBLE.
Возвращает NULL, если дисперсия равна нулю.
Возвращает NULL, если в группе нет допустимых данных.

## Пример {#example}

```sql
-- setup
create table statistic_test(
    tag int,
    val1 double,
    val2 double
) distributed by hash(tag) buckets 1
properties ("replication_num"="1");
insert into statistic_test values
    (1, -10, -10),
    (2, -20, null),
    (3, 100, null),
    (4, 100, null),
    (5, 1000, 1000);
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+---------------------+------------+
| kurt(val1)          | kurt(val2) |
+---------------------+------------+
| 0.16212458373485106 |         -2 |
+---------------------+------------+
```

```sql
select kurt(val1), kurt(val2) from statistic_test group by tag;
```

```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
