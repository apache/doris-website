---
{
    "title": "PERCENTILE_APPROX_ARRAY",
    "language": "ru",
    "description": "PERCENTILE_APPROX_ARRAY вычисляет несколько приближённых перцентилей за одну агрегацию, используя общее состояние T-Digest."
}
---

## Описание {#description}

`PERCENTILE_APPROX_ARRAY` вычисляет несколько приближённых перцентилей за одну агрегацию. Для входных значений строится один T-Digest, и все запрошенные перцентили вычисляются на основе этого общего состояния, что эффективнее, чем вызывать `PERCENTILE_APPROX` отдельно для каждого перцентиля.

:::note
Эта функция поддерживается начиная с версии 4.2.0.
:::

## Синтаксис {#syntax}

```sql
PERCENTILE_APPROX_ARRAY(<col>, <quantiles> [, <compression>])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Числовое выражение, для которого вычисляются перцентили. Значения преобразуются в `DOUBLE`. Значения `NULL` игнорируются. |
| `<quantiles>` | Константный массив типа `ARRAY<DOUBLE>`. Каждый элемент должен быть конечным, отличным от NULL и находиться в диапазоне `[0.0, 1.0]`. Порядок результатов соответствует порядку элементов массива; повторяющиеся уровни сохраняются. Допускается пустой массив. |
| `<compression>` | Необязательное константное значение типа `DOUBLE` в диапазоне `[2048, 10000]`. Большее значение обычно повышает точность, но требует больше памяти. Значение по умолчанию — `10000`; для неконечных значений и значений за пределами допустимого диапазона также используется `10000`. |

## Возвращаемое значение {#return-value}

Возвращает `ARRAY<DOUBLE>`, содержащий по одному приближённому перцентилю для каждого элемента `<quantiles>`. Функция возвращает пустой массив, если `<quantiles>` пуст или в группе нет входных значений, отличных от NULL. Недопустимые уровни перцентилей и элементы NULL в `<quantiles>` приводят к ошибке.

## Пример {#example}

```sql
CREATE TABLE percentile_approx_array_example (
    id INT,
    value DOUBLE NULL
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO percentile_approx_array_example VALUES
    (1, 1.0), (2, 2.0), (3, 3.0), (4, NULL),
    (5, 10.0), (6, 20.0), (7, 30.0), (8, 100.0);
```

Вычисление нескольких приближённых перцентилей со значением параметра сжатия по умолчанию:

```sql
SELECT percentile_approx_array(value, [0.0, 0.25, 0.5, 0.75, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+--------------------------+
| percentiles              |
+--------------------------+
| [1, 2.25, 10, 27.5, 100] |
+--------------------------+
```

Явное указание параметра сжатия:

```sql
SELECT percentile_approx_array(value, [0.25, 0.5, 0.75], 2048) AS percentiles
FROM percentile_approx_array_example;
```

```text
+------------------+
| percentiles      |
+------------------+
| [2.25, 10, 27.5] |
+------------------+
```

Если все входные значения равны NULL, возвращается пустой массив:

```sql
SELECT percentile_approx_array(CAST(NULL AS DOUBLE), [0.0, 0.5, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```

Пустой массив уровней перцентилей также приводит к возврату пустого массива:

```sql
SELECT percentile_approx_array(value, []) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```
