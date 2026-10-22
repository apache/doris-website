---
{
    "title": "REGR_SLOPE",
    "language": "ru",
    "description": "Возвращает угловой коэффициент прямой линейной регрессии для пар значений, не содержащих NULL, в группе."
}
---

## Описание {#description}

Возвращает угловой коэффициент прямой линейной регрессии, вычисленный по парам `(y, x)`, не содержащим NULL, в группе, где `x` — независимая переменная, а `y` — зависимая переменная. Результат эквивалентен `COVAR_POP(y, x) / VAR_POP(x)`.

## Синтаксис {#syntax}

```sql
REGR_SLOPE(<y>, <x>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<y>` | Зависимая переменная. Поддерживаемый тип: Double. |
| `<x>` | Независимая переменная. Поддерживаемый тип: Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа Double, представляющее угловой коэффициент прямой линейной регрессии.
Если в группе нет строк или во всех строках выражения принимают значения NULL, функция возвращает `NULL`.

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
SELECT id, REGR_SLOPE(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+--------------------+
| id   | REGR_SLOPE(y, x)   |
+------+--------------------+
|    1 |               NULL |
|    2 |                2.0 |
+------+--------------------+
```
