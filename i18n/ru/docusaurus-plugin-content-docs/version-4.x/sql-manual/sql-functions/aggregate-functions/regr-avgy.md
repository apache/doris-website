---
{
    "title": "REGR_AVGY",
    "language": "ru",
    "description": "Возвращает среднее значение зависимой переменной (y) для пар в группе, не содержащих NULL."
}
---

## Описание {#description}

Возвращает среднее значение зависимой переменной `y` по парам `(y, x)`, не содержащим NULL, в группе, где `x` обозначает независимую переменную, а `y` обозначает зависимую переменную.

## Синтаксис {#syntax}

```sql
REGR_AVGY(<y>, <x>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<y>` | Зависимая переменная. Поддерживаемый тип: Double. |
| `<x>` | Независимая переменная. Поддерживаемый тип: Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа Double, представляющее среднее значение `y` для пар `(y, x)`, не содержащих NULL.
Если в группе нет строк или все строки содержат значения NULL для выражений, функция возвращает `NULL`.

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
SELECT id, REGR_AVGY(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+------------------+
| id   | REGR_AVGY(y, x)  |
+------+------------------+
|    1 |             NULL |
|    2 |              6.0 |
+------+------------------+
```
