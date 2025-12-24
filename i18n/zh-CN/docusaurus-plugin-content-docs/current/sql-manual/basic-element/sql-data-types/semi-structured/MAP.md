---
{
    "title": "MAP",
    "language": "zh-CN",
    "description": "````SQL SELECT MAP('Alice', 21, 'Bob', 23);"
}
---

## 类型描述

- `MAP<key_type, value_type>`类型用于表示键值对集合的复合类型,每个键（key）唯一地对应一个值（value）。
  - `key_type` 表征键的类型，支持的类型为`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,TIMESTAMPTZ, CHAR, VARCHAR, STRING，IPTV4, IPV6`，key值是Nullable的，不支持指定NOT NULL。
- `value_type` 表征值的类型，支持 `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,TIMESTAMPTZ, CHAR, VARCHAR, STRING，IPV4, IPV6, ARRAY, MAP, STRUCT`，值是 Nullable 的，不支持指定 NOT NULL。

### 语法
`MAP<K, V>`
  
## 类型约束
- `MAP<key_type, value_type>`类型允许的最大嵌套深度是9。
- `MAP<key_type, value_type>` 的**Key可以是 NULL，并且允许相同的Key（NULL和NULL也被认为是相同的Key）**。
- `MAP<key_type, value_type>` 类型之间的转换取决于`key_type`之间以及`value_type`之间是否能转换，`MAP<key_type, value_type>`类型不能转成其他类型。
  - 例如: `MAP<INT,INT>`可以转换为`MAP<BIGINT,BIGINT>`，因为`INT`和`BIGINT`可以转换。
  - 字符串类型可以转换成`MAP<key_type, value_type>`类型（通过解析的形式，解析失败返回 NULL）。
- `MAP<key_type, value_type>` 类型在`AGGREGATE`表模型中只支持`REPLACE`和`REPLACE_IF_NOT_NULL`，**在任何表模型中都无法作为`Key`列，无法作为分区分桶列**。
- `MAP<key_type, value_type>`类型的列不支持比较或者算数运算，**不支持`ORDER BY`和`GROUP BY`操作，不支持作为`JOIN KEY`，不支持在`DELETE`语句中使用**。
- `MAP<key_type, value_type>`类型的列不支持建立任何索引。

## 类型构造
- `MAP()` 函数可以返回一个`MAP`类型的值。

  ````SQL
  SELECT MAP('Alice', 21, 'Bob', 23);

  +-----------------------------+
  | map('Alice', 21, 'Bob', 23) |
  +-----------------------------+
  | {"Alice":21, "Bob":23}      |
  +-----------------------------+
  ````
- `{}`可以构造一个`MAP`类型的值。
  ```SQL
  SELECT {'Alice': 20};

  +---------------+
  | {'Alice': 20} |
  +---------------+
  | {"Alice":20}  |
  +---------------+
  ```

## 修改类型

- 当`MAP<key_type, value_type>`的`key_type`或`value_type`为`VARCHAR`时，才允许进行修改。
   - 只允许将`VARCHAR`的参数从小改到大。反之不行。

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
- `MAP<key_type, value_type>`类型的列默认值只能指定为NULL，如果指定后不能修改。

## 元素访问
- 使用`[key]`的方式访问`MAP`的`Key`对应的`Value`。
  ```SQL
  SELECT {'Alice': 20}['Alice'];

  +------------------------+
  | {'Alice': 20}['Alice'] |
  +------------------------+
  |                     20 |
  +------------------------+`
  ```

- 使用 `ELEMENT_AT(MAP, Key) `的方式访问 `MAP`的`Key`对应的`Value`。
  ```SQL
  SELECT ELEMENT_AT({'Alice': 20}, 'Alice');

  +------------------------------------+
  | ELEMENT_AT({'Alice': 20}, 'Alice') |
  +------------------------------------+
  |                                 20 |
  +------------------------------------+
  ```

## 示例

- 多层`MAP`嵌套

  ```SQL
  -- 建表
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_nested MAP<STRING, MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  --插入
  INSERT INTO map_table VALUES (1, MAP('key1', MAP('key2', 1, 'key3', 2)));
  INSERT INTO map_table VALUES (2, MAP('key1', MAP('key2', 3, 'key3', 4)));

  -- 查询
  SELECT map_nested['key1']['key2'] FROM map_table order by id;
  +----------------------------+
  | map_nested['key1']['key2'] |
  +----------------------------+
  |                          1 |
  |                          3 |
  +----------------------------+

  ```
- 复杂类型嵌套

  ```SQL
  -- 建表
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_array MAP<STRING, ARRAY<INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- 插入
  INSERT INTO map_table VALUES (1, MAP('key1', [1, 2, 3])), (2, MAP('key1', [4, 5, 6]));

  -- 查询
  SELECT map_array['key1'][1] FROM map_table order by id;
  +----------------------+
  | map_array['key1'][1] |
  +----------------------+
  |                    1 |
  |                    4 |
  +----------------------+

  -- 建表
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_struct MAP<STRING, STRUCT<id: INT, name: STRING>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- 插入
  INSERT INTO map_table VALUES (1, MAP('key1', STRUCT(1, 'John'), 'key2', STRUCT(3, 'Jane')));

  -- 查询
  SELECT STRUCT_ELEMENT(map_struct['key1'], 1), STRUCT_ELEMENT(map_struct['key1'], 'name') FROM map_table order by id;
  +---------------------------------------+--------------------------------------------+
  | STRUCT_ELEMENT(map_struct['key1'], 1) | STRUCT_ELEMENT(map_struct['key1'], 'name') |
  +---------------------------------------+--------------------------------------------+
  |                                     1 | John                                       |
  +---------------------------------------+--------------------------------------------+
  ```

- 修改类型

  ```SQL
  -- 建表
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

  -- 修改 KEY
  ALTER TABLE map_table MODIFY COLUMN map_varchar_int MAP<VARCHAR(20), INT>;

  -- 修改 VALUE
  ALTER TABLE map_table MODIFY COLUMN map_int_varchar MAP<INT, VARCHAR(20)>;

  -- 修改 KEY VALUE
  ALTER TABLE map_table MODIFY COLUMN map_varchar_varchar MAP<VARCHAR(20), VARCHAR(20)>;

  -- 查看列类型
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