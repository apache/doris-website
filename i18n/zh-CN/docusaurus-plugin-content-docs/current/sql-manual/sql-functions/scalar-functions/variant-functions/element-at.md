---
{
    "title": "ELEMENT_AT",
    "language": "zh-CN",
    "description": "ELEMENT_AT 函数按索引、键或字段名从 ARRAY、MAP、STRUCT、VARIANT 或 FILE 中提取元素，并说明各类型的索引起点、负索引语义与越界行为。"
}
---

## 描述 {#功能}

`ELEMENT_AT` 函数用于从数组、map、struct、variant 或 FILE 中按指定的索引、键或字段名提取对应的值。

- 当作用于 **数组（ARRAY）** 时，返回指定位置的元素；
- 当作用于 **MAP** 时，返回指定键对应的值。
- 当作用于 **STRUCT** 时，返回指定位置（从 1 开始）或指定字段名对应的子列，等价于 `STRUCT_ELEMENT`。
- 当作用于 **VARIANT** 时，返回指定子列对应的值。
- 当作用于 **FILE** 时，返回指定字段的值。

## 语法

```sql
ELEMENT_AT(<container>, <key_or_index>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<container>` | 可以是`ARRAY`, `MAP`, `STRUCT`, `VARIANT`, `FILE`。 |
| `<key_or_index>` | 对于 `ARRAY`：为整数类型，索引从 **1** 开始；<br />对于 `MAP`：为 `MAP` 中的键类型（`K`），可为任意支持的基础类型。<br />对于 `STRUCT`：为常量整数（字段位置，从 **1** 开始）或常量字符串（字段名，按**大小写不敏感**匹配）。<br />对于 `VARIANT` 对象访问：为字符串类型的 key；<br />对于 Doris 5.0.0 及后续版本中的 VARIANT 数组：为整数索引，正数索引从 1 开始，负数索引从数组末尾倒数。<br />对于 `FILE`：为非 NULL 常量字符串，字段名为 `uri`、`offset`、`size`、`content_type` 或 `checksum`，不区分大小写。访问 `inline` 会报错；读取二进制内容请使用 [FL_GET_BINARY](../fl-get-binary.md)。 |

## 返回值

- 若为 `ARRAY`，返回数组中对应索引的元素（`T` 类型）；
- 若为 `MAP`，返回对应键的值（`V` 类型）；
- 若为 `STRUCT`，返回指定的子列值；
- 若为 `VARIANT`，返回 `VARIANT` 类型。key 不存在、下标为 `0` 或越界、对数组使用字符串 key、对对象使用整数下标、对标量值使用 key，都返回 `NULL`；
- 若为 `FILE`，返回对应字段类型的值；FILE 或字段为 `NULL` 时返回 `NULL`；
- 如果索引或键不存在，返回 `NULL`（`STRUCT` 位置越界或 `STRUCT`、`FILE` 字段名不存在时会报错）；
- 如果参数为 `NULL`，返回 `NULL`（FILE 的字段名参数必须为非 NULL 常量字符串）。

## 使用说明

1. **ARRAY 数组以及 Doris 5.0.0 及后续版本中的 VARIANT 数组，索引都从 1 开始**，不是从 0 开始；
2. ARRAY 和 VARIANT 数组都支持负数索引，`-1` 表示最后一个元素，`-2` 表示倒数第二个，以此类推；
3. `ELEMENT_AT(container, key_or_index)` 函数的功能与 `container[key_or_index]` 作用一致（详细见示例）；

```sql
SELECT ELEMENT_AT(parse_to_variant('[10, 20, 30]'), 1);  -- 10
SELECT ELEMENT_AT(parse_to_variant('[10, 20, 30]'), 2);  -- 20
SELECT ELEMENT_AT(parse_to_variant('[10, 20, 30]'), -1); -- 30
```

4. 对于 `VARIANT`，在查询中计算出的值里，值为 JSON `null` 的成员会返回 VARIANT `null`，它不是 SQL `NULL`；表中不会存储数组之外、值为 `null` 的对象成员，因此对从表中读取的数据做同样的访问会返回 SQL `NULL`。参见 [NULL 语义](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics)。
5. 对于 `FILE`，未知字段名、动态字段名及数字下标会报错。

## 示例

1. `ELEMENT_AT` 函数的功能与 `[]` 作用一致。

    ```sql
    SELECT ELEMENT_AT([1, 2, 3], 2);
    ```

    ```text
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 2) |
    +--------------------------+
    |                        2 |
    +--------------------------+
    ```

    ```sql
    SELECT [1, 2, 3][2];
    ```

    ```text
    +--------------+
    | [1, 2, 3][2] |
    +--------------+
    |            2 |
    +--------------+
    ```

2. 数组下标从 1 开始，越界会返回 `NULL`。

    ```sql
    SELECT ELEMENT_AT([1, 2, 3], 0);
    ```

    ```text
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 0) |
    +--------------------------+
    |                     NULL |
    +--------------------------+
    ```

    ```sql
    SELECT ELEMENT_AT([1, 2, 3], 4);
    ```

    ```text
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 4) |
    +--------------------------+
    |                     NULL |
    +--------------------------+
    ```

3. 访问 `MAP` 中不存在的 KEY，会返回 `NULL`。

    ```sql
    SELECT ELEMENT_AT({"a": 1, "b": 2}, "c");
    ```

    ```text
    +-----------------------------------+
    | ELEMENT_AT({"a": 1, "b": 2}, "c") |
    +-----------------------------------+
    |                              NULL |
    +-----------------------------------+
    ```

4. 按位置或字段名访问 `STRUCT` 的子列（等价于 `STRUCT_ELEMENT`）。

    ```sql
    SELECT ELEMENT_AT(NAMED_STRUCT('name', 'Jack', 'id', 1728923), 1);
    ```

    ```text
    +------------------------------------------------------------+
    | ELEMENT_AT(NAMED_STRUCT('name', 'Jack', 'id', 1728923), 1) |
    +------------------------------------------------------------+
    | Jack                                                       |
    +------------------------------------------------------------+
    ```

    ```sql
    SELECT NAMED_STRUCT('name', 'Jack', 'id', 1728923)['id'];
    ```

    ```text
    +--------------------------------------------------+
    | NAMED_STRUCT('name', 'Jack', 'id', 1728923)['id'] |
    +--------------------------------------------------+
    |                                          1728923 |
    +--------------------------------------------------+
    ```

5. 访问 `VARIANT` 的某个子列，如果 `VARIANT` 的值不是 OBJECT，返回 `NULL`

    ```sql
    SELECT ELEMENT_AT(PARSE_TO_VARIANT('{"a": 1, "b": 2}'), "a");
    ```

    ```text
    +-------------------------------------------------------+
    | ELEMENT_AT(PARSE_TO_VARIANT('{"a": 1, "b": 2}'), "a") |
    +-------------------------------------------------------+
    | 1                                                     |
    +-------------------------------------------------------+
    ```

    ```sql
    SELECT ELEMENT_AT(PARSE_TO_VARIANT('123'), "");
    ```

    ```text
    +-------------------------------------------+
    | ELEMENT_AT(PARSE_TO_VARIANT('123'), "")   |
    +-------------------------------------------+
    | NULL                                      |
    +-------------------------------------------+
    ```

6. 按字段名访问 `FILE`，字段名不区分大小写。

    ```sql
    SELECT ELEMENT_AT(f, 'URI') AS uri,
           ELEMENT_AT(f, 'size') AS size
    FROM (SELECT CAST(NAMED_STRUCT(
        'uri', 's3://bucket/picture.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
        'content_type', NULL, 'checksum', NULL, 'inline', NULL
    ) AS FILE) AS f) t;
    ```
    ```text
    +-------------------------+------+
    | uri                     | size |
    +-------------------------+------+
    | s3://bucket/picture.jpg |    3 |
    +-------------------------+------+
    ```
