---
{
    "title": "MAP | Полуструктурированные данные",
    "language": "ru",
    "description": "```SQL SELECT MAP('Alice', 21, 'Bob', 23);",
    "sidebar_label": "MAP"
}
---

# MAP {#map}

## Описание типа {#type-description}

- Тип `MAP<key_type, value_type>` представляет составной тип, состоящий из пар «ключ — значение», в котором каждому ключу однозначно соответствует значение.
  - `key_type` задаёт тип ключей. Поддерживаются типы `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6`. Ключи допускают NULL; задать для них ограничение NOT NULL нельзя.
  - `value_type` задаёт тип значений. Поддерживаются типы `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT`. Значения допускают NULL; задать для них ограничение NOT NULL нельзя.

## Ограничения типа {#type-constraints}

- Тип `MAP<key_type, value_type>` допускает максимальную глубину вложенности 9.
- В `MAP<key_type, value_type>` ключи могут быть NULL, и допускаются одинаковые ключи (NULL и NULL считаются одним и тем же ключом).
- Преобразование между типами `MAP<key_type, value_type>` зависит от возможности преобразования `key_type` и `value_type`. `MAP<key_type, value_type>` нельзя преобразовать в другие типы.
  - Например: `MAP<INT, INT>` можно преобразовать в `MAP<BIGINT, BIGINT>`, поскольку `INT` можно преобразовать в `BIGINT`.
  - Строковые типы можно преобразовать в `MAP<key_type, value_type>` путём разбора строки; если разбор завершается неудачно, возвращается NULL.
- В модели таблиц `AGGREGATE` тип `MAP<key_type, value_type>` поддерживает только `REPLACE` и `REPLACE_IF_NOT_NULL`. **В любой модели таблиц его нельзя использовать для столбца KEY, а также для столбца партиционирования или бакетирования**.
- Столбцы типа `MAP<key_type, value_type>` не поддерживают операции сравнения и арифметические операции, включая `IN` и `NOT IN`, **не поддерживают операции `ORDER BY` и `GROUP BY`, не могут использоваться в качестве `JOIN KEY` и в инструкциях `DELETE`**.
- Для столбцов типа `MAP<key_type, value_type>` нельзя создавать индексы.

## Создание значений типа {#type-construction}

- Функция `MAP()` может возвращать значение типа `MAP`.

  ```SQL
  SELECT MAP('Alice', 21, 'Bob', 23);

  +-----------------------------+
  | map('Alice', 21, 'Bob', 23) |
  +-----------------------------+
  | {"Alice":21, "Bob":23}      |
  +-----------------------------+
  ```

- `{}` можно использовать для создания значения типа `MAP`.

  ```SQL
  SELECT {'Alice': 20};

  +---------------+
  | {'Alice': 20} |
  +---------------+
  | {"Alice":20}  |
  +---------------+
  ```

## Изменение типа {#modifying-type}

- Изменение допускается, только если `key_type` или `value_type` в `MAP<key_type, value_type>` имеет тип `VARCHAR`.
  - Допускается только увеличение параметра `VARCHAR`; уменьшение не допускается.

    ```SQL
    CREATE TABLE `map_table` (
      `k` INT NOT NULL,
      `map_varchar_int` MAP<VARCHAR(10), INT>,
      `map_int_varchar` MAP<INT, VARCHAR(10)>,
      `map_varchar_varchar` MAP<VARCHAR(10), VARCHAR(10)>
    ) ENGINE=OLAP
    DUPLICATE KEY(`k`)
    DISTRIBUTED BY HASH(`k`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );

    ALTER TABLE map_table MODIFY COLUMN map_varchar_int MAP<VARCHAR(20), INT>;

    ALTER TABLE map_table MODIFY COLUMN map_int_varchar MAP<INT, VARCHAR(20)>;

    ALTER TABLE map_table MODIFY COLUMN map_varchar_varchar MAP<VARCHAR(20), VARCHAR(20)>;
    ```

- Для столбцов типа `MAP<key_type, value_type>` в качестве значения по умолчанию можно указать только NULL. После задания изменить его нельзя.

## Доступ к элементам {#element-access}

- Используйте `[key]` для доступа к значению, соответствующему ключу в `MAP`.

  ```SQL
  SELECT {'Alice': 20}['Alice'];

  +------------------------+
  | {'Alice': 20}['Alice'] |
  +------------------------+
  |                     20 |
  +------------------------+
  ```

- Используйте `ELEMENT_AT(MAP, Key)` для доступа к значению, соответствующему ключу в `MAP`.

  ```SQL
  SELECT ELEMENT_AT({'Alice': 20}, 'Alice');

  +------------------------------------+
  | ELEMENT_AT({'Alice': 20}, 'Alice') |
  +------------------------------------+
  |                                 20 |
  +------------------------------------+
  ```

## Примеры {#examples}

- Вложенные MAP

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_nested MAP<STRING, MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', MAP('key2', 1, 'key3', 2)));
  INSERT INTO map_table VALUES (2, MAP('key1', MAP('key2', 3, 'key3', 4)));

  -- Query
  SELECT map_nested['key1']['key2'] FROM map_table ORDER BY id;
  +----------------------------+
  | map_nested['key1']['key2'] |
  +----------------------------+
  |                          1 |
  |                          3 |
  +----------------------------+
  ```

- Вложенные сложные типы

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_array MAP<STRING, ARRAY<INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', [1, 2, 3])), (2, MAP('key1', [4, 5, 6]));

  -- Query
  SELECT map_array['key1'][1] FROM map_table ORDER BY id;
  +----------------------+
  | map_array['key1'][1] |
  +----------------------+
  |                    1 |
  |                    4 |
  +----------------------+

  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_struct MAP<STRING, STRUCT<id: INT, name: STRING>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', STRUCT(1, 'John'), 'key2', STRUCT(3, 'Jane')));

  -- Query
  SELECT STRUCT_ELEMENT(map_struct['key1'], 1), STRUCT_ELEMENT(map_struct['key1'], 'name') FROM map_table ORDER BY id;
  +---------------------------------------+--------------------------------------------+
  | STRUCT_ELEMENT(map_struct['key1'], 1) | STRUCT_ELEMENT(map_struct['key1'], 'name') |
  +---------------------------------------+--------------------------------------------+
  |                                     1 | John                                       |
  +---------------------------------------+--------------------------------------------+
  ```

- Изменение типа

  ```SQL
  -- Create table
  CREATE TABLE `map_table` (
    `k` INT NOT NULL,
    `map_varchar_int` MAP<VARCHAR(10), INT>,
    `map_int_varchar` MAP<INT, VARCHAR(10)>,
    `map_varchar_varchar` MAP<VARCHAR(10), VARCHAR(10)>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Modify KEY
  ALTER TABLE map_table MODIFY COLUMN map_varchar_int MAP<VARCHAR(20), INT>;

  -- Modify VALUE
  ALTER TABLE map_table MODIFY COLUMN map_int_varchar MAP<INT, VARCHAR(20)>;

  -- Modify KEY and VALUE
  ALTER TABLE map_table MODIFY COLUMN map_varchar_varchar MAP<VARCHAR(20), VARCHAR(20)>;

  -- Check column types
  DESC map_table;
  +---------------------+------------------------------+------+-------+---------+-------+
  | Field               | Type                         | Null | Key   | Default | Extra |
  +---------------------+------------------------------+------+-------+---------+-------+
  | k                   | int                          | No   | true  | NULL    |       |
  | map_varchar_int     | map<varchar(20),int>         | Yes  | false | NULL    | NONE  |
  | map_int_varchar     | map<int,varchar(20)>         | Yes  | false | NULL    | NONE  |
  | map_varchar_varchar | map<varchar(20),varchar(20)> | Yes  | false | NULL    | NONE  |
  +---------------------+------------------------------+------+-------+---------+-------+
  ```
