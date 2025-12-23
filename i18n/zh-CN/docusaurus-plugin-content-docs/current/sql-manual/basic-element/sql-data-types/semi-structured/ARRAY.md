---
{
    "title": "ARRAY",
    "language": "zh-CN",
    "description": "ARRAY<T> 类型用于表示有序元素集合，集合中的每个元素具有相同的数据类型。例如，一个整数数组可表示为[1, 2, 3]，一个字符串数组可表示为[\"a\", \"b\", \"c\"]。"
}
---

## 类型描述

`ARRAY<T>` 类型用于表示有序元素集合，集合中的每个元素具有相同的数据类型。例如，一个整数数组可表示为`[1, 2, 3]`，一个字符串数组可表示为`["a", "b", "c"]`。

- `ARRAY<T>` 表示由T类型组成的数组，T类型是Nullable的，T支持的类型有：`BOOLEAN,TINYINT,SMALLINT,INT,BIGINT,LARGEINT,FLOAT,DOUBLE,DECIMAL,DATE,DATETIME,TIMESTAMPTZ,CHAR,VARCHAR,STRING,IPTV4,IPV6,STRUCT,MAP,VARIANT,JSONB,ARRAY<T>`。
  - 注意：上述T类型中的`JSONB`和`VARIANT`只是在Doris层中的计算层支持，**不支持Doris建表中使用`ARRAY<JSONB>`和`ARRAY<VARIANT>`**。

## 类型约束

- `ARRAY<T>`类型支持的最大嵌套深度为9。
- `ARRAY<T>`类型之间的转换取决于T之间是否能转换，`Array<T>`类型不能转成其他类型。
  - 例如：`ARRAY<INT>`可以转换为`ARRAY<BIGINT>`，因为`INT`和`BIGINT`之间可以转换。
  - `Variant`类型可以转换成`Array<T>`类型。
  - 字符串类型可以转换成`ARRAY<T>`类型（通过解析的形式，解析失败返回 NULL）。
- `ARRAY<T>`类型在`AGGREGATE`表模型中只支持`REPLACE`和`REPLACE_IF_NOT_NULL`，**在任何表模型中都无法作为KEY列，无法作为分区分桶列**。
- `ARRAY<T>`类型的列**支持`ORDER BY`和`GROUP BY`操作**。
  - 支持`ORDER BY`和`GROUP BY`的T类型包括：`BOOLEAN,TINYINT,SMALLINT,INT,BIGINT,LARGEINT,FLOAT,DOUBLE,DECIMAL,DATE,DATETIME,TIMESTAMPTZ,CHAR,VARCHAR,STRING,IPTV4,IPV6`。
- `ARRAY<T>`类型的列不支持作为 `JOIN KEY`，不支持在`DELETE`语句中使用。
  
## 常量构造

- 使用`ARRAY()`函数可以构造一个`ARRAY<T>`类型的值，T类型为参数的公共类型。
    
    ```SQL
    -- [1, 2, 3] T 是 INT
    SELECT ARRAY(1, 2, 3);

    --  ["1", "2", "abc"] , T 是 STRING
    SELECT ARRAY(1, 2, 'abc');
    ```
-  使用`[]`可以构造一个`ARRAY<T>`类型的值，T类型为参数的公共类型。
  
   ```SQL
    -- ["abc", "def", "efg"] T 是 STRING
    SELECT ["abc", "def", "efg"];

    --  ["1", "2", "abc"] , T 是 STRING
    SELECT [1, 2, 'abc'];
    ```
  
## 修改类型

- 当`ARRAY`内部的元素类型为`VARCHAR`时，才允许进行修改。
   - 只允许将`VARCHAR`的参数从小改到大。反之不行。

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
- `ARRAY<T>`类型的列默认值只能指定为NULL，如果指定后不能修改。
  
## 元素访问

- 使用`[k]`的方式访问`ARRAY<T>`的第k个元素，k从1开始，越界之后返回NULL。

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

- 使用`ELEMENT_AT(ARRAY, k)`的方式访问`ARRAY<T>`的第k个元素，k从1开始，越界之后返回NULL。
  
  ```SQL
  SELECT ELEMENT_AT(ARRAY(1, 2, 3) , 2);
  +--------------------------------+
  | ELEMENT_AT(ARRAY(1, 2, 3) , 3) |
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

## 比较关系

ARRAY 是有序类型，`[1, 2, 3]` 和 `[3, 2, 1]` 是两个不同的 ARRAY。两个 ARRAY 相等当且仅当它们内部的元素按顺序逐个相等。

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

在偏序比较中，ARRAY 遵循字典序。给定两个数组 `A` 与 `B`，从索引 `i = 1` 开始，对应位置的元素 `A[i]` 与 `B[i]` 进行比较：

- 若 `A[i] ≠ B[i]` 不相等，则其比较结果（<、>）直接决定数组整体的比较结果
- 若 `A[i] = B[i]`，继续比较下一个位置
- 当数组在所有共同长度范围内完全相等时，较短的数组较小。

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

## 查询加速

- Doris表中`ARRAY<T>`类型的列支持添加倒排索引，用来加速这一列执行`ARRAY`函数的计算。
  - T类型为倒排索引支持的类型：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DECIMAL, DATE, DATETIME,TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPTV4, IPV6`。
  - 支持加速的ARRAY函数为：`ARRAY_CONTAINS, ARRAYS_OVERLAP`，但是当函数中的参数包含NULL时，会退化为普通的向量化计算。

## 示例

- 多维数组

  ```SQL
  -- 创建表
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

  -- 插入
  INSERT INTO array_table VALUES (1, [[1, 2, 3], [4, 5, 6]], [[['ab', 'cd', 'ef'], ['gh', 'ij', 'kl']], [['mn', 'op', 'qr'], ['st', 'uv', 'wx']]]);

  INSERT INTO array_table VALUES (2, ARRAY(ARRAY(1, 2, 3), ARRAY(4, 5, 6)), ARRAY(ARRAY(ARRAY('ab', 'cd', 'ef'), ARRAY('gh', 'ij', 'kl')), ARRAY(ARRAY('mn', 'op', 'qr'), ARRAY('st', 'uv', 'wx'))));

  -- 查询
  SELECT two_dim_array[1][2], three_dim_array[1][1][2] FROM ${tableName} ORDER BY id;
  +---------------------+--------------------------+
  | two_dim_array[1][2] | three_dim_array[1][1][2] |
  +---------------------+--------------------------+
  |                   2 | cd                       |
  |                   2 | cd                       |
  +---------------------+--------------------------+
  ```

- 复杂类型嵌套
  
  ```SQL
  -- 创建表
  CREATE TABLE IF NOT EXISTS array_map_table (
      id INT,
      array_map ARRAY<MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- 插入
  INSERT INTO array_map_table VALUES (1, ARRAY(MAP('key1', 1), MAP('key2', 2)));
  INSERT INTO array_map_table VALUES (2, ARRAY(MAP('key1', 1), MAP('key2', 2)))

  -- 查询
  SELECT array_map[1], array_map[2] FROM array_map_table ORDER BY id;
  +--------------+--------------+
  | array_map[1] | array_map[2] |
  +--------------+--------------+
  | {"key1":1}   | {"key2":2}   |
  | {"key1":1}   | {"key2":2}   |
  +--------------+--------------+

  -- 创建表
  CREATE TABLE IF NOT EXISTS array_table (
      id INT,
      array_struct ARRAY<STRUCT<id: INT, name: STRING>>,
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


- 修改类型

  ```SQL
  -- 创建表
  CREATE TABLE array_table (
      id INT,
      array_varchar ARRAY<VARCHAR(10)>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- 修改 ARRAY 类型
  ALTER TABLE array_table  MODIFY COLUMN array_varchar ARRAY<VARCHAR(20)>;

  -- 查看列类型
  DESC array_table;
  +---------------+--------------------+------+-------+---------+-------+
  | Field         | Type               | Null | Key   | Default | Extra |
  +---------------+--------------------+------+-------+---------+-------+
  | id            | int                | Yes  | true  | NULL    |       |
  | array_varchar | array<varchar(20)> | Yes  | false | NULL    | NONE  |
  +---------------+--------------------+------+-------+---------+-------+
  ```

- 倒排索引

  ```SQL
  -- 建表语句
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

  -- 插入
  INSERT INTO array_table VALUES (1, [1, 2, 3]), (2, [4, 5, 6]), (3, [7, 8, 9]);

  -- 倒排索引会加速 ARRAY_CONTAINS 函数的执行
  SELECT * FROM array_table WHERE ARRAY_CONTAINS(array_column, 5);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  +------+--------------+

  -- 倒排索引会加速 ARRAYS_OVERLAP 函数的执行
  SELECT * FROM array_table WHERE ARRAYS_OVERLAP(array_column, [6, 9]);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  |    3 | [7, 8, 9]    |
  +------+--------------+
  ```