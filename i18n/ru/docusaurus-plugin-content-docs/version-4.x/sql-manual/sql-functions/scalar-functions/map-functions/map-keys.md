---
{
    "title": "MAP_KEYS",
    "language": "ru",
    "description": "Извлекает ключи из заданного отображения в ARRAY соответствующего типа."
}
---

## Описание {#description}

Извлекает ключи из заданного `map` в [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) соответствующего типа.

## Синтаксис {#syntax}

```sql
MAP_KEYS(<map>)
```

## Параметры {#parameters}
- `<map>` — значение типа [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md), содержимое входного отображения.

## Возвращаемое значение {#return-value}
Извлекает ключи из заданного `map` в [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) соответствующего типа.

## Примеры {#examples}
1. Обычные параметры
    ```sql
    select map_keys(map()),map_keys(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_keys(map()) | map_keys(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    | []              | [1.0, 0.1, null]                            |
    +-----------------+---------------------------------------------+
    ```
2. Параметры NULL
    ```sql
    select map_keys(NULL);
    ```
    ```text
    +----------------+
    | map_keys(NULL) |
    +----------------+
    | NULL           |
    +----------------+
    ```
