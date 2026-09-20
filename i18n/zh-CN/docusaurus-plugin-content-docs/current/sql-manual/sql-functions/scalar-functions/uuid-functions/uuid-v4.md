---
{
    "title": "UUID_V4",
    "language": "zh-CN",
    "description": "生成原生 UUID 类型的版本 4 UUID。版本 4 使用随机值。"
}
---

## 描述

生成原生 UUID 类型的版本 4 UUID。版本 4 使用随机值。

## 别名

`GENERATE_UUID_V4`, `GENERATEUUIDV4`.

## 使用说明

每行独立生成一个值，函数不接受参数，不能传入 `NULL`。可在建表时用作 UUID 列的动态默认值；`ALTER TABLE ADD COLUMN` 不支持此动态默认值。详见 [UUID 类型](../../../basic-element/sql-data-types/uuid.md)。

## 语法

```sql
UUID_V4()
```

## 参数

| 参数 | 描述 |
| --- | --- |
| 无 | 不接受参数。 |

## 返回值

返回 `UUID` 类型，不返回 `NULL`。显示时使用 36 字符的小写标准格式。

## 示例

```sql
SELECT UUID_VERSION(UUID_V4()) AS version,
       LENGTH(CAST(UUID_V4() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 4       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V4()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV4()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 4             | 4                     |
+---------------+-----------------------+
```
