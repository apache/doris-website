---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
    "language": "ru",
    "description": "Возвращает коэффициент асимметрии выражения expr. Для этой функции используется формула: 3-й центральный момент / ((дисперсия)^{1.5})."
}
---

## Описание {#description}

Возвращает [коэффициент асимметрии](https://en.wikipedia.org/wiki/Skewness) выражения expr.
Для этой функции используется формула `3rd central moment / ((variance)^{1.5})`.

**Связанные команды**

[kurt](./kurt.md)

## Псевдонимы {#alias}

- SKEW
- SKEW_POP

## Синтаксис {#syntax}

```sql
SKEWNESS(<col>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Столбец, для которого вычисляется коэффициент асимметрии. Поддерживается тип Double. |

## Возвращаемое значение {#return-value}

Возвращает коэффициент асимметрии выражения expr в виде значения типа Double.
Если дисперсия равна нулю, возвращает NULL.
Если в группе нет допустимых данных, возвращает NULL.

## Примеры {#examples}
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL is ignored
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- Each group just has one row, result is NULL
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
