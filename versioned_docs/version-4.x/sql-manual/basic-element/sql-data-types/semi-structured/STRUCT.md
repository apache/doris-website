---
{
    "title": "STRUCT",
    "language": "en",
    "description": "The STRUCT type is used to combine multiple fields into a single structure, where each field can have its own name and type,"
}
---

## Type Description

The STRUCT type is used to combine multiple fields into a single structure, where each field can have its own name and type, suitable for representing nested or complex business data structures.

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name` represents the name, **cannot be empty, cannot be duplicated, and is case-insensitive**.

  - `field_type` represents the type, which is nullable and cannot be specified as NOT NULL. Supported types include: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT`.

  - `[COMMENT 'comment-string']` represents an optional comment.

## Type Constraints

- The maximum nesting depth supported by the `STRUCT` type is 9.

- Conversion between `STRUCT` types depends on whether the internal types can be converted (names do not affect conversion). `STRUCT` types cannot be converted to other types.

  - String types can be converted to `STRUCT` types (through parsing, returning NULL if parsing fails).

- In the `AGGREGATE` table model, `STRUCT` types only support `REPLACE` and `REPLACE_IF_NOT_NULL`. **In any table model, they cannot be used as KEY columns, nor as partition or bucket columns.**

- Columns of `STRUCT` type do not support comparison or arithmetic operations, **do not support `ORDER BY` and `GROUP BY` operations, cannot be used as `JOIN KEY`, and cannot be used in `DELETE` statements.**

- Columns of `STRUCT` type do not support creating any indexes.

## Type Construction

- Use `STRUCT()` to construct a value of type `STRUCT`, where the internal names start from col1.

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```

- Use `NAMED_STRUCT()` to construct a specific `STRUCT` type value.

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## Modifying Type

- Modification is allowed only when the subcolumn type of `STRUCT` is `VARCHAR`.

   - Only allows changing the parameter of `VARCHAR` from smaller to larger, not the other way around.

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

- Subcolumns inside `STRUCT` type do not support deletion, but new subcolumns can be added at the end.

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

## Element Access

- Use `STRUCT_ELEMENT(struct, k/field_name)` to access a specific subcolumn inside the `STRUCT`.

  - k represents the position, starting from 1.

  - `field_name` is the name of the subcolumn in the `STRUCT`.

  ```SQL
  SELECT STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1);

  +----------------------------------------------------------------+
  | STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1) |
  +----------------------------------------------------------------+
  | Jack                                                           |
  +----------------------------------------------------------------+

  SELECT STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), "id");

  +-------------------------------------------------------------------+
  | STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), "id") |
  +-------------------------------------------------------------------+
  |                                                           1728923 |
  +-------------------------------------------------------------------+
  ```

## Examples

- Nested Complex Types

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
  DISTRIBUTED BY HASH(id) BUCKETS 1
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

  -- Query
  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name')  FROM struct_table ORDER BY id;

  +----------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name') |
  +----------------------------------------------------------------------+
  | John                                                                 |
  +----------------------------------------------------------------------+

  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') FROM struct_table ORDER BY id;

  +----------------------------------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') |
  +----------------------------------------------------------------------------------------------+
  |                                                                                          100 |
  +----------------------------------------------------------------------------------------------+
  ```

- Modifying Type

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