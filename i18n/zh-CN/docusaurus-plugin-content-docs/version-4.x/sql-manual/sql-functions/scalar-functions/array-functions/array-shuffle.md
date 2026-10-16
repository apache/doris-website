---
{
    "title": "ARRAY_SHUFFLE",
    "language": "zh-CN",
    "description": "ARRAYSHUFFLE 用来随机打乱数组内元素的顺序。"
}
---

<a id="功能"></a>

## 描述

随机打乱数组内元素的顺序，保留元素及其数量。输入数组或种子为 NULL 时返回 NULL。`SHUFFLE` 是此函数的别名。

:::caution 版本行为变更（4.1.5）

Doris 4.1 系列自 4.1.5 起，`seed` 必须是常量，支持任意 BIGINT 值，包括负数，并使用全部 64 位。常量数组也会逐行打乱，因此相同种子的结果可能与旧版本不同。此前的 4.1 版本只使用每批第一行的种子，负数或大于 4294967295 的种子会报错，常量数组在每行得到相同顺序。

:::

## 语法

```sql
ARRAY_SHUFFLE(<arr> [, <seed>])
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<arr>` | ARRAY 类型，待打乱的数组。 |
| `<seed>` | 可选，BIGINT 类型的常量随机种子，支持常量表达式。省略时，每批数据使用新的随机种子。 |

## 返回值

返回与输入数组同类型的数组，元素被随机重排，元素数量与类型保持不变。输入数组或种子为 NULL 时返回 NULL，空数组返回空数组。

<a id="使用说明"></a>

数据按批处理。指定种子时，每批都从该种子开始生成随机序列，批内各行依次使用这个序列。因此多行数据中某一行的排列可能随分批方式变化；指定种子不保证所有相同数组的排列相同。常量数组也逐行打乱。

## 示例

打乱后，排序可验证元素保持不变。使用负数种子或常量表达式均有效：

```sql
SELECT ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], -1)),
       ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], 1 + 1));
```

```text
[1, 2, 3, 4]    [1, 2, 3, 4]
```

NULL 和空数组：

```sql
SELECT ARRAY_SHUFFLE(CAST(NULL AS ARRAY<INT>), 1),
       ARRAY_SHUFFLE([1, 2, 3], NULL), ARRAY_SHUFFLE([], 1);
```

```text
NULL    NULL    []
```

使用列作为种子会报错，错误信息包含以下内容：

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3], number) FROM numbers("number" = "2");
```

```text
The seed of array_shuffle must be a constant
```
