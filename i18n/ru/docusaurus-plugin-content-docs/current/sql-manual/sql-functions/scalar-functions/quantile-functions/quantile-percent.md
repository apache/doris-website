---
{
    "title": "QUANTILE_PERCENT",
    "language": "ru",
    "description": "Функция QUANTILEPERCENT вычисляет значение квантиля для заданного процента."
}
---

## Описание {#description}

Функция `QUANTILE_PERCENT` вычисляет значение квантиля для заданного процента. Она принимает два параметра: столбец quantile_state и константное число с плавающей точкой, задающее процент. Функция возвращает число с плавающей точкой, представляющее значение квантиля в позиции, соответствующей заданному проценту.

## Синтаксис {#syntax}

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<quantile_state>` | Целевой столбец.|
| `<percent>` | Заданный процент.|

## Возвращаемое значение {#return-value}

Значение типа `Double`, представляющее квантиль.

## Пример {#example}

```sql
CREATE TABLE IF NOT EXISTS quantile_state_agg_test (
         `dt` int(11) NULL COMMENT "",
         `id` int(11) NULL COMMENT "",
         `price` quantile_state QUANTILE_UNION NOT NULL COMMENT ""
        ) ENGINE=OLAP
        AGGREGATE KEY(`dt`, `id`)
        COMMENT "OLAP"
        DISTRIBUTED BY HASH(`dt`) BUCKETS 1
        PROPERTIES ("replication_num" = "1");

INSERT INTO quantile_state_agg_test VALUES(20220201,0, to_quantile_state(1, 2048));

INSERT INTO quantile_state_agg_test VALUES(20220201,1, to_quantile_state(-1, 2048)),
            (20220201,1, to_quantile_state(0, 2048)),(20220201,1, to_quantile_state(1, 2048)),
            (20220201,1, to_quantile_state(2, 2048)),(20220201,1, to_quantile_state(3, 2048));

SELECT dt, id, quantile_percent(quantile_union(price), 0) FROM quantile_state_agg_test GROUP BY dt, id ORDER BY dt, id
```

Результат:

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
