---
{
    "title": "REGR_COUNT",
    "language": "ru",
    "description": "Возвращает количество пар (y, x) без значений NULL в группе."
}
---

## Описание {#description}

Возвращает количество пар `(y, x)` без значений NULL в группе, где `x` — независимая переменная, а `y` — зависимая переменная. Если допустимых пар без значений NULL нет, функция возвращает `0`.

## Синтаксис {#syntax}

```sql
REGR_COUNT(<y>, <x>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<y>` | Зависимая переменная. Поддерживаемый тип: Double. |
| `<x>` | Независимая переменная. Поддерживаемый тип: Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT, представляющее количество пар `(y, x)` без значений NULL.
Если в группе нет строк или нет допустимых пар `(y, x)` без значений NULL, функция возвращает `0`.

## Пример {#example}

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL);
```

```sql
SELECT id, REGR_COUNT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+-------------------+
| id   | REGR_COUNT(y, x)  |
+------+-------------------+
|    1 |                 0 |
|    2 |                 4 |
+------+-------------------+
```

REGR_COUNT учитывает только пары `(y, x)` без значений NULL, поэтому для группы 1 возвращается `0`.
