---
{
    "title": "VARIANT_TYPE",
    "language": "zh-CN",
    "description": "VARIANTTYPE 函数用于返回 VARIANT 类型值的实际类型。 该函数通常用于调试或分析 VARIANT 数据的结构，辅助进行类型判断和数据处理。"
}
---

## 功能

`VARIANT_TYPE` 函数用于返回 `VARIANT` 类型值的实际类型。  
该函数通常用于调试或分析 `VARIANT` 数据的结构，辅助进行类型判断和数据处理。

## 语法

```sql
VARIANT_TYPE(variant_value)
```

## 参数

- `variant_value`：一个 `VARIANT` 类型的值。

## 返回值

- 返回一个字符串，表示该 `VARIANT` 值的实际类型。
    - 字符串的结构是 `{"key":"value"}` 结构
    - key 表示子列的 path，value 表示类型

## 使用说明

1. 用于查找 `VARIANT` 类型的列中实际存储的类型；
2. 对于表中的每一行都会读取子列获取类型，实际使用中用 LIMIT 限制行数以避免执行速度太慢。

## 示例

    ```SQL
    CREATE TABLE variant_table(
        k INT,
        v VARIANT NULL
    )
    DUPLICATE KEY(`k`)
    DISTRIBUTED BY HASH(`k`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );

    INSERT INTO variant_table VALUES(1, '{"a": 10, "b": 1.2, "c" : "ddddd"}'), (2, NULL);
   
    SELECT VARIANT_TYPE(v) FROM variant_table;
    +-------------------------------------------+
    | VARIANT_TYPE(v)                           |
    +-------------------------------------------+
    | {"a":"tinyint","b":"double","c":"string"} |
    | NULL                                      |
    +-------------------------------------------+

    ```


