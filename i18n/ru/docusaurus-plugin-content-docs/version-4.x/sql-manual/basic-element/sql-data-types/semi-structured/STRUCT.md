---
{
    "title": "STRUCT | Полуструктурированные данные",
    "language": "ru",
    "description": "Тип STRUCT используется для объединения нескольких полей в единую структуру, в которой каждое поле может иметь собственное имя и тип,",
    "sidebar_label": "STRUCT"
}
---

# STRUCT {#struct}

## Описание типа {#type-description}

Тип STRUCT используется для объединения нескольких полей в единую структуру, в которой каждое поле может иметь собственное имя и тип. Он подходит для представления вложенных или сложных структур бизнес-данных.

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name` обозначает имя, которое **не может быть пустым, не может повторяться и обрабатывается без учёта регистра**.

  - `field_type` обозначает тип, который допускает NULL и не может быть объявлен как NOT NULL. Поддерживаются следующие типы: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT`.

  - `[COMMENT 'comment-string']` обозначает необязательный комментарий.

## Ограничения типа {#type-constraints}

- Максимальная глубина вложенности, поддерживаемая типом `STRUCT`, составляет 9.

- Преобразование между типами `STRUCT` зависит от возможности преобразования внутренних типов (имена не влияют на преобразование). Типы `STRUCT` нельзя преобразовать в другие типы.

  - Строковые типы можно преобразовать в типы `STRUCT` путём разбора строки. Если разбор не удался, возвращается NULL.

- В модели таблиц `AGGREGATE` типы `STRUCT` поддерживают только `REPLACE` и `REPLACE_IF_NOT_NULL`. **Ни в одной модели таблиц они не могут использоваться в качестве столбцов KEY, а также столбцов разбиения на секции или бакеты.**

- Столбцы типа `STRUCT` не поддерживают операции сравнения и арифметические операции, включая `IN` и `NOT IN`, **не поддерживают операции `ORDER BY` и `GROUP BY`, не могут использоваться в качестве `JOIN KEY` и в операторах `DELETE`.**

- Для столбцов типа `STRUCT` нельзя создавать индексы.

## Создание значений типа {#type-construction}

- Используйте `STRUCT()` для создания значения типа `STRUCT`; внутренние имена начинаются с col1.

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```

- Используйте `NAMED_STRUCT()` для создания значения заданного типа `STRUCT`.

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## Изменение типа {#modifying-type}

- Изменение допускается только в том случае, если вложенный столбец `STRUCT` имеет тип `VARCHAR`.

   - Параметр `VARCHAR` можно только увеличивать; уменьшать его нельзя.

  ```SQL
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(20), age: INT>;
  ``` 

- Вложенные столбцы типа `STRUCT` нельзя удалять, но можно добавлять новые вложенные столбцы в конец.

```SQL
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Add a subcolumn at the end
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;
```

## Доступ к элементам {#element-access}

К определённому вложенному столбцу внутри `STRUCT` можно обратиться следующими эквивалентными способами:

- С помощью функции `ELEMENT_AT(struct, k/field_name)`.

- С помощью оператора индексирования `struct[k]` / `struct['field_name']`.

- С помощью оператора точки `struct_col.field_name` (только для столбца `STRUCT`).

Здесь `k` обозначает позицию (константу со значением от 1), а `field_name` обозначает имя вложенного столбца (строковую константу). Имена полей сопоставляются **без учёта регистра**. При обращении к несуществующему имени поля или позиции за пределами допустимого диапазона возникает ошибка.

:::caution
Поскольку ни одна другая база данных или движок запросов не предоставляет такой функции, функция `STRUCT_ELEMENT` удалена начиная с версии 4.1.3. Вместо неё используйте `ELEMENT_AT` или операторы индексирования / точки.
:::

- Используйте `ELEMENT_AT` или оператор индексирования для доступа по позиции или имени поля.

  ```SQL
  SELECT ELEMENT_AT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1);

  +------------------------------------------------------------+
  | ELEMENT_AT(NAMED_STRUCT('name', 'Jack', 'id', 1728923), 1) |
  +------------------------------------------------------------+
  | Jack                                                       |
  +------------------------------------------------------------+

  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923)['id'];

  +--------------------------------------------------+
  | NAMED_STRUCT('name', 'Jack', 'id', 1728923)['id'] |
  +--------------------------------------------------+
  |                                          1728923 |
  +--------------------------------------------------+
  ```

- Для столбца `STRUCT` используйте оператор точки, чтобы обратиться к вложенному столбцу по имени, включая доступ к вложенным полям, например `s.a.b`.

  ```SQL
  -- Table with a STRUCT column: s STRUCT<a: INT, b: DOUBLE>
  SELECT s.a, s.b FROM struct_table;

  -- Nested STRUCT column: s STRUCT<s: STRUCT<s: STRUCT<s: INT>>>
  SELECT s.s.s.s FROM nested_struct_table;
  ```

## Примеры {#examples}

- Вложенные сложные типы

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS struct_table (
      id INT,
      struct_complex STRUCT<
          basic_info: STRUCT<name: STRING, age: INT>,
          contact: STRUCT<email: STRING, phone: STRING>,
          preferences: STRUCT<tags: ARRAY<STRING>, settings: MAP<STRING, INT>>,
          metadata: STRUCT<
              created_at: DATETIME,
              updated_at: DATETIME,
              stats: STRUCT<views: INT, clicks: INT>
          >
      >
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO struct_table VALUES (1, STRUCT(
    STRUCT('John', 25),
    STRUCT('john@example.com', '1234567890'),
    STRUCT(['tag1', 'tag2'], MAP('setting1', 1, 'setting2', 2)),
    STRUCT('2021-01-01 00:00:00', '2021-01-02 00:00:00', STRUCT(100, 50))
  ));

  -- Query (use the dot operator for nested struct field access)
  SELECT struct_complex.basic_info.name FROM struct_table ORDER BY id;

  +--------------------------------+
  | struct_complex.basic_info.name |
  +--------------------------------+
  | John                           |
  +--------------------------------+

  SELECT struct_complex.metadata.stats.views FROM struct_table ORDER BY id;

  +-------------------------------------+
  | struct_complex.metadata.stats.views |
  +-------------------------------------+
  |                                 100 |
  +-------------------------------------+
  ```

- Изменение типа

```SQL
-- Create table
CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Modify the type of the 'name' subcolumn
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(20), age: INT>;

  -- Check column types
  DESC struct_table;

  +----------------+----------------------------------+------+-------+---------+-------+
  | Field          | Type                             | Null | Key   | Default | Extra |
  +----------------+----------------------------------+------+-------+---------+-------+
  | k              | int                              | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(20),age:int> | Yes  | false | NULL    | NONE  |
  +----------------+----------------------------------+------+-------+---------+-------+

  -- Create table
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Add a subcolumn at the end
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;

  -- Check column types
  DESC struct_table;

  +----------------+-----------------------------------------+------+-------+---------+-------+
  | Field          | Type                                    | Null | Key   | Default | Extra |
  +----------------+-----------------------------------------+------+-------+---------+-------+
  | k              | int                                     | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(10),age:int,id:int> | Yes  | false | NULL    | NONE  |
  +----------------+-----------------------------------------+------+-------+---------+-------+
```
