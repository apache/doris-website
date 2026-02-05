---
{
    "title": "ARRAYS_OVERLAP",
    "language": "zh-CN",
    "description": "ARRAYSOVERLAP 用于判断两个数组是否存在至少一个相同的元素，如果存在返回 true，否则返回 false。"
}
---

## 功能

`ARRAYS_OVERLAP` 用于判断两个数组是否存在至少一个相同的元素，如果存在返回 `true`，否则返回 `false`。

## 语法

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## 参数

- `arr1`：第一个数组，类型为 `ARRAY<T>`。

- `arr2`：第二个数组，类型为 `ARRAY<T>`。

    - 两个数组的元素类型 `T` 必须一致或可以相互隐式转换。
    - 两个数组的元素类型 `T` 可以是数值类型、字符串类型、时间类型、IP类型。

## 返回值

- 返回 `BOOLEAN` 类型：

    - 如果两个数组有交集，返回 `true`；

    - 如果没有交集，返回 `false`。

## 使用说明

1. **比较方式使用元素的等值判断（= 运算符）**。
2. **`NULL`和`NULL`在这个函数中被认为是相等的**（具体见示例）。
3. 可以在建表语句中指定**倒排索引来加速函数的执行**（具体见示例）。
   - 函数作谓词判断条件使用时，倒排索引会加速函数的执行。
   - 当函数作查询结果使用时，倒排索引不会加速函数的执行。
4. 常用于数据清洗、标签匹配、用户行为交集判断等场景。

## 示例

1. 简单示例

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

2. 错误参数，当输入的参数是不支持的类型时，返回 `INVALID_ARGUMENT`

    ```SQL
    -- [INVALID_ARGUMENT]execute failed, unsupported types for function arrays_overlap
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ```

3. 输入的`ARRAY` 是 `NULL`，返回值是 `NULL`

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
    |                       NULL |
    +----------------------------+
    ```'

4. 输入的`ARRAY` 包含 `NULL` 时，`NULL` 和 `NULL`被视作相等
   
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
    ```'

5. 使用倒排索引加速查询
   
    ```SQL
    -- 建表包含倒排索引
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED --只允许不分词倒排索引
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- 插入两行
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```

 - 当函数作谓词判断条件使用时，倒排索引会加速函数的执行
  
    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')); 
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+

- 当函数作查询结果使用时，倒排索引不会加速函数的执行
  
    ```SQL
    SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+
    ```