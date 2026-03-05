---
{
    "title": "ARRAY_REPEAT",
    "language": "zh-CN",
    "description": "生成一个包含 n 个重复元素 T 的数组"
}
---

## 描述

生成一个包含 n 个重复元素 T 的数组

## 语法

```sql
ARRAY_REPEAT(<element>, <n>)
```

## 参数

| 参数 | 说明   |
|--|------|
| `<n>` | 元数个数 |
| `<element>` | 指定元素 |

## 返回值

返回一个数组，包含 n 个重复的 element 元素。array_with_constant 与 array_repeat 功能相同，用来兼容 hive 语法格式。

## 举例

```sql
SELECT ARRAY_REPEAT("hello", 2),ARRAY_REPEAT(12345, 3);
```

```text
+--------------------------+------------------------+
| array_repeat('hello', 2) | array_repeat(12345, 3) |
+--------------------------+------------------------+
| ["hello", "hello"]       | [12345, 12345, 12345]  |
+--------------------------+------------------------+
```
