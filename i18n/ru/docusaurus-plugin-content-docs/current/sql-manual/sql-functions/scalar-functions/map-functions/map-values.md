---
{
    "title": "MAP_VALUES",
    "language": "ru",
    "description": "Извлекает значения из заданного MAP в ARRAY соответствующего типа."
}
---

## Описание {#description}

Извлекает значения из заданного [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) в [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) соответствующего типа.

## Синтаксис {#syntax}

```sql
MAP_VALUES(<map>)
```

## Параметры {#parameters}
- `<map>` — входная карта типа [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md).

## Возвращаемое значение {#return-value}
Извлекает значения из заданного `map` в [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) соответствующего типа.

## Примечания по использованию {#usage-notes}
1. Для параметров NULL возвращает NULL.
2. Для пустых объектов MAP возвращает пустой массив.
3. Значения NULL в MAP также включаются в возвращаемый массив.

## Примеры {#examples}
1. Обычные параметры
    ```sql
    select map_values(map()), map_values(map(1, "100", 0.1, 2, 0.3, null));
    ```

    ```text
    +-------------------+----------------------------------------------+
    | map_values(map()) | map_values(map(1, "100", 0.1, 2, 0.3, null)) |
    +-------------------+----------------------------------------------+
    | []                | ["100", "2", null]                           |
    +-------------------+----------------------------------------------+
    ```
2. Параметры NULL
    ```sql
    select map_values(null);
    ```
    ```text
    +------------------+
    | map_values(null) |
    +------------------+
    | NULL             |
    +------------------+
    ```
