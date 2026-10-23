---
{
    "title": "QUANTILE_UNION",
    "language": "ru",
    "description": "Функция QUANTILEUNION используется для объединения нескольких промежуточных результатов вычисления квантилей."
}
---

## Описание {#description}

Функция `QUANTILE_UNION` используется для объединения нескольких промежуточных результатов вычисления квантилей. Обычно эта функция используется вместе с `QUANTILE_STATE` и особенно подходит для сценариев, требующих многоэтапного вычисления квантилей.

## Синтаксис {#syntax}

```sql
QUANTILE_UNION(<query_state>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<query_state>` | Данные для агрегации. Поддерживается тип QuantileState. |

## Возвращаемое значение {#return-value}

Возвращает состояние агрегации типа QuantileState для дальнейшего вычисления квантилей.
Возвращает NULL, если в группе нет допустимых данных.

## Пример {#example}

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5, 'east'),
(2, 15.2, 'east'),
(3, 20.1, 'west'),
(4, 25.8, 'east'),
(5, 30.3, 'west'),
(6, 35.7, 'east'),
(7, 40.2, 'west'),
(8, 45.9, 'east'),
(9, 50.4, 'west'),
(10, 100.6, 'east');
```

```sql
SELECT 
    region,
    QUANTILE_PERCENT(
        QUANTILE_UNION(
            TO_QUANTILE_STATE(response_time, 2048)
        ),
        0.5
    ) AS median_response_time
FROM response_times
GROUP BY region;
```

Вычисление 50-го процентиля времени отклика по регионам.

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```

```sql
SELECT QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048))
FROM response_times where response_time is null;
```

Возвращает NULL, если в группе нет допустимых данных.

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
