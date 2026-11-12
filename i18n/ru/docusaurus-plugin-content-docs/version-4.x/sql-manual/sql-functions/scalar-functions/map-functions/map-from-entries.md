---
{
    "title": "MAP_FROM_ENTRIES",
    "language": "ru",
    "description": "Создаёт MAP из массива элементов STRUCT с двумя полями"
}
---

## Описание {#description}

Создаёт `MAP<K, V>` из массива, элементы которого представляют собой структуры `STRUCT` с двумя полями. Первое поле используется как ключ, а второе как значение.

:::note
Эта функция поддерживается начиная с Apache Doris 4.2.
:::

## Синтаксис {#syntax}

```sql
MAP_FROM_ENTRIES(<entries>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<entries>` | Массив `ARRAY<STRUCT<K, V>>`. Каждая структура STRUCT должна содержать ровно два поля. Массив может быть `NULL`, и оба поля внутри STRUCT могут быть `NULL`, но сам элемент массива типа STRUCT не может быть `NULL`. Тип `K` должен поддерживаться для ключей MAP. |

## Возвращаемое значение {#return-value}

Возвращает `MAP<K, V>`.

- Если `<entries>` равен `NULL`, возвращается `NULL`.
- Поля со значением `NULL` внутри структуры STRUCT, которая сама не равна `NULL`, сохраняются как ключи или значения `NULL`.
- Если сам элемент массива типа STRUCT равен `NULL`, возникает ошибка во время выполнения.
- Если входные данные не являются массивом структур STRUCT или структура STRUCT содержит меньше или больше двух полей, возникает ошибка на этапе анализа.
- Если тип `K` не поддерживается для ключей MAP, возникает ошибка на этапе анализа.
- Если ключ встречается несколько раз, сохраняется значение из последнего вхождения.

## Примеры {#examples}

```sql
SELECT map_from_entries(array(struct(1, 10), struct(2, 20))) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_entries(array(struct(1, 10), struct(1, 20))) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>));
```

```text
+------------------------------------------------------------+
| map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>)) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```

```sql
SELECT map_from_entries(array(
    struct(CAST(NULL AS INT), 10),
    struct(2, CAST(NULL AS INT)))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

Следующий пример завершается ошибкой, поскольку массив содержит элемент STRUCT со значением `NULL`:

```sql
SELECT map_from_entries(array(CAST(NULL AS STRUCT<k:INT,v:INT>)));
```

```text
ERROR 1105 (HY000): Map entry of function map_from_entries cannot be null
```

Следующий пример завершается ошибкой на этапе анализа, поскольку структура STRUCT содержит три поля:

```sql
SELECT map_from_entries(array(struct(1, 2, 3)));
```

```text
ERROR 1105 (HY000): map_from_entries requires an array of structs with exactly two fields
```
