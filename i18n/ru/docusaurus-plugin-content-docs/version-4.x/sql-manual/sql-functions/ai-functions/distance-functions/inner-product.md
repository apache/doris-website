---
{
    "title": "INNER_PRODUCT",
    "language": "ru",
    "description": "Вычисляет скалярное произведение двух векторов одинаковой размерности"
}
---

## Описание {#description}

Вычисляет скалярное произведение двух векторов одинаковой размерности

## Синтаксис {#syntax}

```sql
INNER_PRODUCT(<array1>, <array2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- |--|
| `<array1>` | Первый вектор. Поддерживаемые типы элементов входного массива: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE. Количество элементов должно совпадать с количеством элементов в array2 |
| `<array2>` | Второй вектор. Поддерживаемые типы элементов входного массива: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE. Количество элементов должно совпадать с количеством элементов в array1 |

## Возвращаемое значение {#return-value}

Возвращает скалярное произведение двух векторов одинаковой размерности. Тип возвращаемого значения — `FLOAT`.

Если любой из входных массивов равен `NULL` или содержит элемент `NULL`, функция возвращает ошибку.

## Примеры {#examples}

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```

```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```

Если входной массив равен `NULL`, функция возвращает ошибку:

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

Если входной массив содержит элемент `NULL`, функция возвращает ошибку:

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
