---
{
    "title": "BITMAP_HASH",
    "language": "zh-CN",
    "description": "对任意类型的输入，计算其 32 位的哈希值，并返回包含该哈希值的 Bitmap。"
}
---

## 描述

对任意类型的输入，计算其 32 位的哈希值，并返回包含该哈希值的 Bitmap。

## 语法

```sql
bitmap_hash(<expr>)
```

## 参数

| 参数        | 描述          |
|-----------|-------------|
| `<expr>` | 任何值或字段表达式 |

## 返回值

包含参数 `<expr>` 的 64 位 hash 值的 Bitmap。
- 当参数存在NULL时，返回 Empty Bitmap

::: note

该函数使用的哈希算法为 MurMur3。  
MurMur3 算法是一种高性能的、低碰撞率的散列算法，其计算出来的值接近于随机分布，并且能通过卡方分布测试。需要注意的是，不同硬件平台、不同 Seed 值计算出来的散列值可能不同。  
关于此算法的性能可以参考 [Smhasher](http://rurban.github.io/smhasher/) 排行榜。

:::

## 举例

如果你想计算某个值的 MurMur3，你可以：

```
select bitmap_to_array(bitmap_hash('hello'))[1];
```

结果如下：

```text
+-------------------------------------------------------------+
| %element_extract%(bitmap_to_array(bitmap_hash('hello')), 1) |
+-------------------------------------------------------------+
|                                                  1321743225 |
+-------------------------------------------------------------+
```

如果你想统计某一列去重后的个数，可以使用位图的方式，某些场景下性能比 `count distinct` 好很多：

```sql
select bitmap_count(bitmap_union(bitmap_hash(`word`))) from `words`;
```

结果如下：

```text
+-------------------------------------------------+
| bitmap_count(bitmap_union(bitmap_hash(`word`))) |
+-------------------------------------------------+
|                                        33263478 |
+-------------------------------------------------+
```


```sql
select bitmap_to_string(bitmap_hash(NULL));
```

结果如下：

```text
+------+
| res  |
+------+
|      |
+------+
```
