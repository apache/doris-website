---
{
    "title": "PARSE_TO_VARIANT_ERROR_TO_NULL",
    "language": "zh-CN",
    "description": "将 JSON 文本解析为 VARIANT 值，非法输入返回 SQL NULL。"
}
---

## 功能

`PARSE_TO_VARIANT_ERROR_TO_NULL` 将 JSON 文本解析为 `VARIANT`。输入不是合法 JSON 时返回 SQL `NULL`，不会使查询失败。

## 语法

```sql
PARSE_TO_VARIANT_ERROR_TO_NULL(json_text)
```

## 参数

- `json_text`：包含一个完整 JSON 值的 `VARCHAR` 表达式。

## 返回值

- 返回可为 NULL 的 `VARIANT` 值。
- 输入为 SQL `NULL` 时返回 SQL `NULL`。
- 输入为非法 JSON 时返回 SQL `NULL`。
- 合法 JSON `null` 仍然是 Variant/JSON `null`，与 SQL `NULL` 不同。

## 实验性行为

`ColumnVariantV2` 是实验性的、仅用于计算的执行路径，默认关闭。可以在当前 FE session 中执行以下语句开启：

```sql
SET enable_variant_v2 = true;
```

该 session variable 只改变表达式结果的执行类型，不改变表存储、读写器或 Compaction 使用的物理 `VARIANT` 类型。

## 示例

### 保留合法值，将非法 JSON 转为 NULL

```sql
SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\": 1}') AS valid_value,
       PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value,
       PARSE_TO_VARIANT_ERROR_TO_NULL(NULL) AS sql_null_value;
```

第一个表达式返回 VARIANT 对象，第二个和第三个表达式返回 SQL `NULL`。

### 解析数组并访问元素

```sql
SET enable_variant_v2 = true;

SELECT CAST(ELEMENT_AT(
           PARSE_TO_VARIANT_ERROR_TO_NULL('[10, 20, 30]'),
           0
       ) AS INT) AS first_item,
       CAST(ELEMENT_AT(
           PARSE_TO_VARIANT_ERROR_TO_NULL('[10, 20, 30]'),
           -1
       ) AS INT) AS last_item;
```

对于 `ColumnVariantV2`，数组非负索引从 0 开始，负数索引从数组末尾倒数。

### 选择严格解析或容错解析

如果非法 JSON 应该让查询失败并暴露错误，请使用 [PARSE_TO_VARIANT](./parse-to-variant)；如果非法 JSON 应该转换为 SQL `NULL` 并继续处理其他行，请使用本函数。
