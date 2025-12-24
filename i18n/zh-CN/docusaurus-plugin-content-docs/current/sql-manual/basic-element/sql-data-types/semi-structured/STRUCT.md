---
{
    "title": "STRUCT",
    "language": "zh-CN",
    "description": "STRUCT 类型用于将多个字段组合成一个结构体，每个字段可以有自己的名字和类型，适合表示嵌套或复杂的业务数据结构。"
}
---

## 类型描述

STRUCT 类型用于将多个字段组合成一个结构体，每个字段可以有自己的名字和类型，适合表示嵌套或复杂的业务数据结构。
- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >` 
  - `field_name` 表征名字，**不可为空，不可重复，名字不区分大小写**。
  - `field_type` 表征类型，类型是Nullable的，不可指定NOT NULL，支持的类型有：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPTV4, IPV6, ARRAY, MAP, STRUCT`。
  - `[COMMENT 'comment-string']` 表征注释，可选的。

## 类型约束
- `STRUCT`类型支持的最大嵌套深度为 9。
- `STRUCT` 类型之间的转换取决于内部的类型之间是否能转换(名字不影响转换)，`STRUCT`类型不能转成其他类型。
  - 字符串类型可以转换成`STRUCT`类型（通过解析的形式，解析失败返回 NULL）。
- `STRUCT` 类型在`AGGREGATE`表模型中只支持`REPLACE`和`REPLACE_IF_NOT_NULL`，**在任何表模型中都无法作为KEY列，无法作为分区分桶列。**
- `STRUCT`类型的列不支持比较或者算数运算，**不支持`ORDER BY`和`GROUP BY`操作，不支持作为`JOIN KEY`，不支持在`DELETE`语句中使用**。
- `STRUCT`类型的列不支持建立任何索引。
  
## 类型构造

- 使用`STRUCT()`可以构造一个的`STRUCT`类型的值,`STRUCT`内部的名字从col1开始。
  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```
- 使用`NAMED_STRUCT()` 构造一个既定的`STRUCT`类型的值。
  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## 修改类型

- `STRUCT`的子列类型为`VARCHAR`时，才允许进行修改。
   - 只允许将`VARCHAR`的参数从小改到大。反之不行。

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

- `STRUCT`类型内部的子列不支持删除，可以在末尾增加子列。

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

  -- 在末尾增加一个子列
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;
```

## 元素访问

- 使用`STRUCT_ELEMENT(struct, k/field_name)`访问`STRUCT`内部的某一个子列。
  - k表征位置，从1开始。
  - `filed_name` 是`STRUCT`的子列的名字。
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
## 示例

- 嵌套复杂类型

  ```SQL
  -- 建表
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

  -- 插入
  INSERT INTO struct_table VALUES (1, STRUCT(
    STRUCT('John', 25),
    STRUCT('john@example.com', '1234567890'),
    STRUCT(['tag1', 'tag2'], MAP('setting1', 1, 'setting2', 2)),
    STRUCT('2021-01-01 00:00:00', '2021-01-02 00:00:00', STRUCT(100, 50))
  ));

  -- 查询
  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name')  FROM struct_table order by id;
  +----------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name') |
  +----------------------------------------------------------------------+
  | John                                                                 |
  +----------------------------------------------------------------------+

  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') FROM struct_table order by id;
  +----------------------------------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') |
  +----------------------------------------------------------------------------------------------+
  |                                                                                          100 |
  +----------------------------------------------------------------------------------------------+
  ```

- 修改类型

```SQL
-- 建表
CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- 修改 name 这一列的类型
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(20), age: INT>;

  -- 查看列类型
  DESC struct_table;
  +----------------+----------------------------------+------+-------+---------+-------+
  | Field          | Type                             | Null | Key   | Default | Extra |
  +----------------+----------------------------------+------+-------+---------+-------+
  | k              | int                              | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(20),age:int> | Yes  | false | NULL    | NONE  |
  +----------------+----------------------------------+------+-------+---------+-------+
  
  -- 建表
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- 在末尾增加一个子列
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;

  -- 查看列类型
  DESC struct_table;
  +----------------+-----------------------------------------+------+-------+---------+-------+
  | Field          | Type                                    | Null | Key   | Default | Extra |
  +----------------+-----------------------------------------+------+-------+---------+-------+
  | k              | int                                     | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(10),age:int,id:int> | Yes  | false | NULL    | NONE  |
  +----------------+-----------------------------------------+------+-------+---------+-------+
```