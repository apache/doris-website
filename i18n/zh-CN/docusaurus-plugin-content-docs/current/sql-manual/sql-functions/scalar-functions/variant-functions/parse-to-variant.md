---
{
    "title": "PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "将 JSON 文本解析为 VARIANT 值。"
}
---

## 功能

`PARSE_TO_VARIANT` 将 `VARCHAR` 表达式中的一个完整 JSON 值解析为 `VARIANT`。支持 JSON 对象、数组、字符串、数字、布尔值和 JSON 字面量 `null`。

## 语法

```sql
PARSE_TO_VARIANT(json_text)
```

## 参数

- `json_text`：包含一个完整 JSON 值的 `VARCHAR` 表达式。

## 返回值

- 返回 `VARIANT` 值。
- 输入为 SQL `NULL` 时返回 SQL `NULL`。
- 输入为 JSON `null` 时返回 Variant/JSON `null`，它与 SQL `NULL` 不同。

## 实验性行为

`ColumnVariantV2` 是实验性的、仅用于计算的执行路径，默认关闭。可以在当前 FE session 中执行以下语句开启：

```sql
SET enable_variant_v2 = true;
```

该 session variable 只改变表达式结果的执行类型，不改变表存储、读写器或 Compaction 使用的物理 `VARIANT` 类型。

## 错误处理

非法 JSON 会使 `PARSE_TO_VARIANT` 返回错误。如果希望将非法输入转换为 SQL `NULL`，请使用 [PARSE_TO_VARIANT_ERROR_TO_NULL](./parse-to-variant-error-to-null)。

## 示例

### 解析 JSON 值

```sql
SELECT PARSE_TO_VARIANT('{\"id\": 42, \"tags\": [\"doris\", \"sql\"]}');
SELECT PARSE_TO_VARIANT('[10, 20, 30]');
SELECT PARSE_TO_VARIANT('42');
SELECT PARSE_TO_VARIANT('true');
SELECT PARSE_TO_VARIANT('\"doris\"');
SELECT PARSE_TO_VARIANT('null');
```

### 提取值并 CAST 为确定类型

```sql
SET enable_variant_v2 = true;

SELECT CAST(
           PARSE_TO_VARIANT('{\"user\": {\"id\": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;

SELECT CAST(ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), 0) AS INT) AS first_item,
       CAST(ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), -1) AS INT) AS last_item;
```

对于 `ColumnVariantV2`，VARIANT 数组的非负索引从 0 开始（`0` 表示第一个元素），负数索引从数组末尾倒数。访问规则请参见 [ELEMENT_AT](./element-at)。

### 区分 JSON 解析与字符串 CAST

```sql
-- 解析 JSON 对象并返回结构化 VARIANT 值。
SELECT PARSE_TO_VARIANT('{\"a\": 1}');

-- 创建带类型的 VARIANT 字符串，不会把字符串按 JSON 解析。
SELECT CAST('{\"a\": 1}' AS VARIANT);
```

### 非法输入

```sql
-- JSON 对象不完整，会返回错误。
SELECT PARSE_TO_VARIANT('{\"id\":');
```
