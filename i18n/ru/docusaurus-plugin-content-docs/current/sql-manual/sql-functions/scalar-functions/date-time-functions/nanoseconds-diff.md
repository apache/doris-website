---
{
    "title": "NANOSECONDS_DIFF",
    "language": "ru",
    "description": "Возвращает разность между двумя значениями даты и времени в наносекундах."
}
---

## Описание {#description}

Возвращает разность между двумя значениями даты и времени в наносекундах. Результат равен `<end_time> - <start_time>`.

## Синтаксис {#syntax}

```sql
NANOSECONDS_DIFF(<end_time>, <start_time>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<end_time>` | Конечное время. Как минимум один аргумент должен иметь тип `TIMESTAMP_NS`; другой может иметь тип `TIMESTAMP_NS` или `DATETIME`. |
| `<start_time>` | Начальное время. Как минимум один аргумент должен иметь тип `TIMESTAMP_NS`; другой может иметь тип `TIMESTAMP_NS` или `DATETIME`. |

## Возвращаемое значение {#return-value}

Возвращает значение типа `BIGINT`, представляющее `<end_time> - <start_time>` в наносекундах. Возвращает `NULL`, если хотя бы один аргумент равен `NULL`.

Положительный результат означает, что конечное время позже начального; отрицательный результат означает, что оно раньше. Результат должен укладываться в диапазон `BIGINT`; в противном случае функция сообщает об ошибке переполнения.

## Пример {#example}

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
|    2 |
+------+
```

В аргументах можно сочетать `TIMESTAMP_NS` и `DATETIME`:

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000' AS DATETIME(6))
) AS diff;
```

```text
+------+
| diff |
+------+
|    1 |
+------+
```

```sql
SELECT NANOSECONDS_DIFF(
    CAST(NULL AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
| NULL |
+------+
```
