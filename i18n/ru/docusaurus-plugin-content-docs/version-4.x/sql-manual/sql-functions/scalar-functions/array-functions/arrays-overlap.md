---
{
    "title": "ARRAYS_OVERLAP",
    "language": "ru",
    "description": "ARRAYSOVERLAP определяет, есть ли у двух массивов хотя бы один общий элемент. Если есть, возвращает true, иначе возвращает false."
}
---

## Назначение {#function}

`ARRAYS_OVERLAP` определяет, есть ли у двух массивов хотя бы один общий элемент. Если есть, возвращает `true`, иначе возвращает `false`.

## Синтаксис {#syntax}

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## Параметры {#parameters}

- `arr1`: первый массив типа `ARRAY<T>`.

- `arr2`: второй массив типа `ARRAY<T>`.

    - Типы элементов `T` обоих массивов должны совпадать или допускать неявное преобразование друг в друга.
    - Тип элементов `T` может быть числовым, строковым, типом даты/времени или IP.

## Возвращаемое значение {#return-value}

- Возвращает значение типа `BOOLEAN`:

    - Если у двух массивов есть общие элементы, возвращает `true`;
    - Если общих элементов нет, возвращает `false`.

## Примечания по использованию {#usage-notes}

1. **Сравнение выполняется по равенству элементов (оператор `=`)**.
2. **В этой функции `NULL` и `NULL` считаются равными** (см. пример).
3. Можно указать **инвертированный индекс в инструкции создания таблицы для ускорения выполнения** (см. пример).
   - Если функция используется в качестве условия предиката, инвертированный индекс ускоряет выполнение.
   - Если функция используется в результате запроса, инвертированный индекс не ускоряет выполнение.
4. Обычно используется для очистки данных, сопоставления тегов и анализа пересечений в поведении пользователей.

## Примеры {#examples}

1. Простой пример

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey'));
    +----------------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey')) |
    +----------------------------------------------------------------------+
    |                                                                    1 |
    +----------------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey'));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey')) |
    +----------------------------------------------------------------+
    |                                                              0 |
    +----------------------------------------------------------------+
    ```

2. Недопустимый тип параметра: при передаче неподдерживаемых типов возвращается `INVALID_ARGUMENT`

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ERROR 1105 (HY000): errCode = 2, detailMessage = arrays_overlap does not support types: ARRAY<ARRAY<TEXT>>
    ```

3. Если входной `ARRAY` равен `NULL`, возвращаемое значение равно `NULL`

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL);
    +-----------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL) |
    +-----------------------------------------------+
    |                                          NULL |
    +-----------------------------------------------+

    SELECT ARRAYS_OVERLAP(NULL, NULL);
    +----------------------------+
    | ARRAYS_OVERLAP(NULL, NULL) |
    +----------------------------+
    |                        NULL |
    +----------------------------+
    ```

4. Если входной `ARRAY` содержит `NULL`, значения `NULL` и `NULL` считаются равными
   
   ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL));
    +---------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------------------+
    |                                                             1 |
    +---------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +----------------------------------------------------------------+
    |                                                             0  |
    +----------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL));
    +---------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------+
    |                                                 1 |
    +---------------------------------------------------+
    ```

5. Использование инвертированного индекса для ускорения запроса
   
    ```SQL
    -- Create table with inverted index
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED -- only non-tokenized inverted indexes are allowed
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- Insert two rows
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```

 - Если функция используется в качестве условия предиката, инвертированный индекс ускоряет выполнение
  
    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')); 
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+

- Если функция используется в результате запроса, инвертированный индекс не ускоряет выполнение
  
    ```SQL
    SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+
    ```
