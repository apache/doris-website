---
{
    "title": "REGR_SYY",
    "language": "ru",
    "description": "Возвращает сумму квадратов зависимой переменной (y) для пар, не содержащих NULL, в группе."
}
---

## Описание {#description}

Возвращает сумму квадратов отклонений зависимой переменной `y` от её среднего значения, вычисленную по парам `(y, x)`, не содержащим NULL, в группе, где `x` является независимой переменной, а `y` является зависимой переменной. Эквивалентно `REGR_COUNT(y, x) * VAR_POP(y)`.

## Синтаксис {#syntax}

```sql
REGR_SYY(<y>, <x>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<y>` | Зависимая переменная. Поддерживаемый тип: Double. |
| `<x>` | Независимая переменная. Поддерживаемый тип: Double. |

## Возвращаемое значение {#return-value}

Возвращает значение типа Double, представляющее сумму квадратов отклонений `y` от её среднего значения.
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
SELECT id, REGR_SYY(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+-----------------+
| id   | REGR_SYY(y, x)  |
+------+-----------------+
|    1 |            NULL |
|    2 |            20.0 |
+------+-----------------+
```
