---
{
    "title": "UUID_V7",
    "language": "zh-CN",
    "description": "生成原生 UUID 类型的版本 7 UUID。版本 7 包含 Unix 毫秒时间戳，适合需要按生成时间大致排序的标识符。"
}
---

## 描述

生成原生 UUID 类型的版本 7 UUID。版本 7 包含 Unix 毫秒时间戳，适合需要按生成时间大致排序的标识符。

## 别名

`GENERATE_UUID_V7`, `GENERATEUUIDV7`.

## 使用说明

每行独立生成一个值，函数不接受参数，不能传入 `NULL`。可在建表时用作 UUID 列的动态默认值；`ALTER TABLE ADD COLUMN` 不支持此动态默认值。详见 [UUID 类型](../../../basic-element/sql-data-types/uuid.md)。

生成器在单个 BE 进程内使用递增的时间戳和计数器。不同 BE 之间不保证全局生成顺序；时钟回退或计数器溢出时，编码的时间可能超前于当前墙上时钟时间。不要将其用作精确的事件时间或全局序列号。

## 语法

```sql
UUID_V7()
```

## 参数

| 参数 | 描述 |
| --- | --- |
| 无 | 不接受参数。 |

## 返回值

返回 `UUID` 类型，不返回 `NULL`。显示时使用 36 字符的小写标准格式。

## 示例

```sql
SELECT UUID_VERSION(UUID_V7()) AS version,
       LENGTH(CAST(UUID_V7() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 7       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V7()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV7()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 7             | 7                     |
+---------------+-----------------------+
```
