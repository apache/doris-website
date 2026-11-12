---
{
    "title": "ARRAY | Полуструктурированные данные",
    "language": "ru",
    "description": "Тип ARRAY<T> используется для представления упорядоченной коллекции элементов одного типа данных. Например,",
    "sidebar_label": "ARRAY"
}
---

# Документация по ARRAY {#array-documentation}

## Описание типа {#type-description}

Тип `ARRAY<T>` используется для представления упорядоченной коллекции элементов одного типа данных. Например, массив целых чисел можно представить как `[1, 2, 3]`, а массив строк как `["a", "b", "c"]`.

- `ARRAY<T>` представляет массив элементов типа T, допускающего NULL. Поддерживаемые типы T: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, STRUCT, MAP, VARIANT, JSONB, ARRAY<T>`.
  - Примечание: из перечисленных типов T `JSONB` и `VARIANT` поддерживаются только на уровне вычислений Doris; **использование `ARRAY<JSONB>` и `ARRAY<VARIANT>` при создании таблиц в Doris не поддерживается**.

## Ограничения типа {#type-constraints}

- Максимальная поддерживаемая глубина вложенности типа `ARRAY<T>` составляет 9.
- Преобразование между типами `ARRAY<T>` зависит от возможности преобразования T. Тип `Array<T>` нельзя преобразовать в другие типы.
  - Например: `ARRAY<INT>` можно преобразовать в `ARRAY<BIGINT>`, поскольку возможно преобразование между `INT` и `BIGINT`.
  - Тип `Variant` можно преобразовать в тип `Array<T>`.
  - Строковый тип можно преобразовать в тип `ARRAY<T>` путём разбора строки; при ошибке разбора возвращается NULL.
- В модели таблиц `AGGREGATE` тип `ARRAY<T>` поддерживает только `REPLACE` и `REPLACE_IF_NOT_NULL`. **Ни в одной модели таблиц его нельзя использовать в качестве столбца KEY, столбца партиционирования или бакетирования**.
- Столбцы типа `ARRAY<T>` **поддерживают операции `ORDER BY` и `GROUP BY`**.
  - Типы T, поддерживающие `ORDER BY` и `GROUP BY`: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`.
- Столбцы типа `ARRAY<T>` не поддерживают операции `IN` и `NOT IN`.
- Столбцы типа `ARRAY<T>` нельзя использовать в качестве `JOIN KEY` и в операторах `DELETE`.

## Создание констант {#constant-construction}

- Используйте функцию `ARRAY()` для создания значения типа `ARRAY<T>`, где T является общим типом параметров.
    
    ```SQL
    -- [1, 2, 3] T is INT
    SELECT ARRAY(1, 2, 3);

    -- ["1", "2", "abc"] , T is STRING
    SELECT ARRAY(1, 2, 'abc');
    ```
- Используйте `[]` для создания значения типа `ARRAY<T>`, где T является общим типом параметров.
  
   ```SQL
    -- ["abc", "def", "efg"] T is STRING
    SELECT ["abc", "def", "efg"];

    -- ["1", "2", "abc"] , T is STRING
    SELECT [1, 2, 'abc'];
    ```

## Изменение типа {#modifying-type}

- Изменение допускается только в том случае, если элементы `ARRAY` имеют тип `VARCHAR`.
   - Параметр `VARCHAR` можно только увеличивать; уменьшение не допускается.

    ```SQL
    CREATE TABLE `array_table` (
      `k` INT NOT NULL,
      `array_column` ARRAY<VARCHAR(10)>
    ) ENGINE=OLAP
    DUPLICATE KEY(`k`)
    DISTRIBUTED BY HASH(`k`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );

    ALTER TABLE array_table MODIFY COLUMN array_column ARRAY<VARCHAR(20)>;
    ```
- В качестве значения по умолчанию для столбцов типа `ARRAY<T>` можно указать только NULL. После задания изменить его нельзя.

## Доступ к элементам {#element-access}

- Используйте `[k]` для доступа к k-му элементу `ARRAY<T>`, где нумерация k начинается с 1. При выходе за границы массива возвращается NULL.

  ```SQL
  SELECT [1, 2, 3][1];
    +--------------+
    | [1, 2, 3][1] |
    +--------------+
    |            1 |
    +--------------+

  SELECT ARRAY(1, 2, 3)[2];
    +-------------------+
    | ARRAY(1, 2, 3)[2] |
    +-------------------+
    |                 2 |
    +-------------------+

  SELECT [[1,2,3],[2,3,4]][1][3];
    +-------------------------+
    | [[1,2,3],[2,3,4]][1][3] |
    +-------------------------+
    |                       3 |
    +-------------------------+
  ```

- Используйте `ELEMENT_AT(ARRAY, k)` для доступа к k-му элементу `ARRAY<T>`, где нумерация k начинается с 1. При выходе за границы массива возвращается NULL.
  
  ```SQL
  SELECT ELEMENT_AT(ARRAY(1, 2, 3) , 2);
  +--------------------------------+
  | ELEMENT_AT(ARRAY(1, 2, 3) , 2) |
  +--------------------------------+
  |                              2 |
  +--------------------------------+

  SELECT ELEMENT_AT([1, 2, 3] , 3);
  +---------------------------+
  | ELEMENT_AT([1, 2, 3] , 3) |
  +---------------------------+
  |                         3 |
  +---------------------------+

  SELECT ELEMENT_AT([["abc", "def"], ["def", "gef"], [3]] , 3);                      
  +-------------------------------------------------------+
  | ELEMENT_AT([["abc", "def"], ["def", "gef"], [3]] , 3) |
  +-------------------------------------------------------+
  | ["3"]                                                 |
  +-------------------------------------------------------+
  ```

## Правила сравнения {#comparison-relationship}

ARRAY является упорядоченным типом, и [1, 2, 3] и [3, 2, 1] представляют собой два разных массива ARRAY. Два массива ARRAY равны тогда и только тогда, когда их элементы попарно равны с учётом порядка:

```sql
select array(1,2,3) = array(3,2,1);
+-----------------------------+
| array(1,2,3) = array(3,2,1) |
+-----------------------------+
|                           0 |
+-----------------------------+

select array(1,2,3) = array(1,2,3);
+-----------------------------+
| array(1,2,3) = array(1,2,3) |
+-----------------------------+
|                           1 |
+-----------------------------+

select array(1,2,3) = array(1,2,3,3);
+-------------------------------+
| array(1,2,3) = array(1,2,3,3) |
+-------------------------------+
|                             0 |
+-------------------------------+
```

При сравнении в частичном порядке ARRAY использует лексикографический порядок. Для двух массивов `A` и `B`, начиная с индекса `i = 1`, сравниваются элементы на соответствующих позициях `A[i]` и `B[i]`:

- Если `A[i] ≠ B[i]`, результат сравнения (<, >) сразу определяет результат сравнения массивов
- Если `A[i] = B[i]`, сравнение продолжается со следующей позиции
- Если все элементы массивов в пределах общей длины равны, меньшим считается более короткий массив.

```sql
select array(1,2,3) > array(1,2,3,3), array(1,2,3) < array(1,2,3,3);
+-------------------------------+-------------------------------+
| array(1,2,3) > array(1,2,3,3) | array(1,2,3) < array(1,2,3,3) |
+-------------------------------+-------------------------------+
|                             0 |                             1 |
+-------------------------------+-------------------------------+

select array(1,3,2) > array(1,2,3), array(1,3,2) < array(1,2,3);
+-----------------------------+-----------------------------+
| array(1,3,2) > array(1,2,3) | array(1,3,2) < array(1,2,3) |
+-----------------------------+-----------------------------+
|                           1 |                           0 |
+-----------------------------+-----------------------------+

select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+
```

## Ускорение запросов {#query-acceleration}

- Для столбцов типа `ARRAY<T>` в таблицах Doris можно создавать инвертированные индексы, чтобы ускорить вычисления с функциями `ARRAY` для этих столбцов.
  - Типы T, поддерживаемые инвертированными индексами: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`.
  - Ускоряемые функции `ARRAY`: `ARRAY_CONTAINS`, `ARRAYS_OVERLAP`. Если среди параметров функции есть NULL, выполняется переход к обычным векторизованным вычислениям.

## Примеры {#examples}

- Многомерные массивы

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS array_table (
      id INT,
      two_dim_array ARRAY<ARRAY<INT>>,
      three_dim_array ARRAY<ARRAY<ARRAY<STRING>>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_table VALUES (1, [[1, 2, 3], [4, 5, 6]], [[['ab', 'cd', 'ef'], ['gh', 'ij', 'kl']], [['mn', 'op', 'qr'], ['st', 'uv', 'wx']]]);

  INSERT INTO array_table VALUES (2, ARRAY(ARRAY(1, 2, 3), ARRAY(4, 5, 6)), ARRAY(ARRAY(ARRAY('ab', 'cd', 'ef'), ARRAY('gh', 'ij', 'kl')), ARRAY(ARRAY('mn', 'op', 'qr'), ARRAY('st', 'uv', 'wx'))));

  -- Query
  SELECT two_dim_array[1][2], three_dim_array[1][1][2] FROM array_table ORDER BY id;
  +---------------------+--------------------------+
  | two_dim_array[1][2] | three_dim_array[1][1][2] |
  +---------------------+--------------------------+
  |                   2 | cd                       |
  |                   2 | cd                       |
  +---------------------+--------------------------+
  ```

- Вложенные сложные типы
  
  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS array_map_table (
      id INT,
      array_map ARRAY<MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_map_table VALUES (1, ARRAY(MAP('key1', 1), MAP('key2', 2)));
  INSERT INTO array_map_table VALUES (2, ARRAY(MAP('key1', 1), MAP('key2', 2)));

  -- Query
  SELECT array_map[1], array_map[2] FROM array_map_table ORDER BY id;
  +--------------+--------------+
  | array_map[1] | array_map[2] |
  +--------------+--------------+
  | {"key1":1}   | {"key2":2}   |
  | {"key1":1}   | {"key2":2}   |
  +--------------+--------------+

  -- Create table
  CREATE TABLE IF NOT EXISTS array_table (
      id INT,
      array_struct ARRAY<STRUCT<id: INT, name: STRING>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  INSERT INTO array_table VALUES (1, ARRAY(STRUCT(1, 'John'), STRUCT(2, 'Jane')));
  INSERT INTO array_table VALUES (2, ARRAY(STRUCT(1, 'John'), STRUCT(2, 'Jane')));

  SELECT array_struct[1], array_struct[2] FROM array_table ORDER BY id;
  +-------------------------+-------------------------+
  | array_struct[1]         | array_struct[2]         |
  +-------------------------+-------------------------+
  | {"id":1, "name":"John"} | {"id":2, "name":"Jane"} |
  | {"id":1, "name":"John"} | {"id":2, "name":"Jane"} |
  +-------------------------+-------------------------+
  ```

- Изменение типа

  ```SQL
  -- Create table
  CREATE TABLE array_table (
      id INT,
      array_varchar ARRAY<VARCHAR(10)>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Modify ARRAY type
  ALTER TABLE array_table MODIFY COLUMN array_varchar ARRAY<VARCHAR(20)>;

  -- Check column type
  DESC array_table;
  +---------------+--------------------+------+-------+---------+-------+
  | Field         | Type               | Null | Key   | Default | Extra |
  +---------------+--------------------+------+-------+---------+-------+
  | id            | int                | Yes  | true  | NULL    |       |
  | array_varchar | array<varchar(20)> | Yes  | false | NULL    | NONE  |
  +---------------+--------------------+------+-------+---------+-------+
  ```

- Инвертированный индекс

  ```SQL
  -- Create table statement
  CREATE TABLE `array_table` (
    `k` int NOT NULL,
    `array_column` ARRAY<INT>,
    INDEX idx_array_column (array_column) USING INVERTED
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_table VALUES (1, [1, 2, 3]), (2, [4, 5, 6]), (3, [7, 8, 9]);

  -- The inverted index accelerates the execution of the ARRAY_CONTAINS function
  SELECT * FROM array_table WHERE ARRAY_CONTAINS(array_column, 5);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  +------+--------------+

  -- The inverted index accelerates the execution of the ARRAYS_OVERLAP function
  SELECT * FROM array_table WHERE ARRAYS_OVERLAP(array_column, [6, 9]);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  |    3 | [7, 8, 9]    |
  +------+--------------+
  ```
