---
{
    "title": "JSON_ARRAY_IGNORE_NULL",
    "language": "ru",
    "description": "Формирует массив JSON, содержащий указанные элементы. Если параметры не переданы, возвращает пустой массив."
}
---

# JSON_ARRAY_IGNORE_NULL {#json_array_ignore_null}
## Описание {#description}
Формирует массив JSON, содержащий указанные элементы. Если параметры не переданы, возвращает пустой массив.

## Синтаксис {#syntax}
```sql
JSON_ARRAY_IGNORE_NULL([<expression>, ...]) 
```

## Параметры {#parameters}
### Переменное число параметров: {#variable-parameters}
- `<expression>`: Элементы, которые нужно включить в массив JSON. Можно передать одно или несколько значений разных типов, включая NULL.

## Возвращаемое значение {#return-value}
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): Возвращает массив JSON, состоящий из значений, переданных в списке параметров.

## Примечания по использованию {#usage-notes}
- Реализация JSON_ARRAY_IGNORE_NULL преобразует параметры разных типов в значения JSON, неявно вызывая функцию [`TO_JSON`](./to-json.md), поэтому параметры должны иметь типы, поддерживаемые функцией [`TO_JSON`](./to-json.md).
- Значения NULL игнорируются. Если же требуется сохранить значения null в массиве, можно использовать функцию [`JSON_ARRAY`](./json-array.md).
- Если тип параметра не поддерживается функцией [`TO_JSON`](./to-json.md), возникнет ошибка. Сначала можно преобразовать этот параметр в тип String, например:
    ```sql
    select JSON_ARRAY_IGNORE_NULL(CAST(NOW() as String));
    ```
    > Функция NOW() возвращает значение типа DateTime, которое необходимо преобразовать в тип String с помощью функции CAST
- Если параметр представляет собой строку JSON и вы хотите добавить её в массив как объект JSON, следует явно вызвать функцию `JSON_PARSE`, чтобы разобрать строку как объект JSON:
  ```sql
  select JSON_ARRAY_IGNORE_NULL(JSON_PARSE('{"key": "value"}'));
  ```

## Примеры {#examples}
1. Обычные параметры
    ```sql
    select json_array_ignore_null() as empty_array, json_array_ignore_null(1) v1, json_array_ignore_null(1, 'abc') v2;
    ```
    ```
    +-------------+------+-----------+
    | empty_array | v1   | v2        |
    +-------------+------+-----------+
    | []          | [1]  | [1,"abc"] |
    +-------------+------+-----------+
    ```
2. Параметры NULL
    ```sql
    select json_array_ignore_null(null) v1, json_array_ignore_null(1, null, 'I am a string') v2;
    ```
    ```
    +------+---------------------+
    | v1   | v2                  |
    +------+---------------------+
    | []   | [1,"I am a string"] |
    +------+---------------------+
    ```
3. Неподдерживаемые типы параметров
    ```sql
    select json_array_ignore_null('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. Параметры типа Map можно явно преобразовать в JSON

    ```sql
    select json_array_ignore_null(1, cast(map('key', 'value') as json));
    ```
    ```
    +--------------------------------------------------------------+
    | json_array_ignore_null(1, cast(map('key', 'value') as json)) |
    +--------------------------------------------------------------+
    | [1,{"key":"value"}]                                          |
    +--------------------------------------------------------------+
    ```
5. Строки JSON можно разобрать с помощью `json_parse`
    ```sql
    select json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}'));
    ```
    ```
    +------------------------------------------------------------------------------------------+
    | json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}')) |
    +------------------------------------------------------------------------------------------+
    | [{"key1":"value","key2":[1,"I am a string",3]}]                                          |
    +------------------------------------------------------------------------------------------+
    ```
