---
{
    "title": "REGR_AVGX",
    "language": "ru",
    "description": "Возвращает среднее значение независимой переменной (x) для пар, не содержащих NULL, в группе."
}
---

## Описание {#description}

Возвращает среднее значение независимой переменной `x` для пар `(y, x)`, не содержащих NULL, в группе, где `x` обозначает независимую переменную, а `y` обозначает зависимую переменную.

## Синтаксис {#syntax}

```sql
REGR_AVGX(<y>, <x>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<y>` | Зависимая переменная. Поддерживаемый тип: Double. |
| `<x>` | Независимая переменная. Поддерживаемый тип: Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа Double, представляющее среднее значение `x` для пар `(y, x)`, не содержащих NULL.
Если в группе нет строк или во всех строках значения выражений равны NULL, функция возвращает `NULL`.

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
SELECT id, REGR_AVGX(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+--------------------+
| id   | REGR_AVGX(y, x)    |
+------+--------------------+
|    1 |               NULL |
|    2 |                2.5 |
+------+--------------------+
```
