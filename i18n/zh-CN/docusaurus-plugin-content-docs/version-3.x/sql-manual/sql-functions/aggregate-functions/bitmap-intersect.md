---
{
    "title": "BITMAP_INTERSECT",
    "language": "zh-CN",
    "description": "聚合函数，用于计算分组后的 bitmap 交集。常见使用场景如：计算用户留存率。"
}
---

## 描述

聚合函数，用于计算分组后的 bitmap 交集。常见使用场景如：计算用户留存率。

## 语法

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<value>` | 支持 bitmap 的数据类型 |

## 返回值

返回值的数据类型为 BITMAP。

## 举例

表结构

```
KeysType: AGG_KEY
Columns: tag varchar, date datetime, user_id bitmap bitmap_union

```

```
求今天和昨天不同 tag 下的用户留存
select tag, bitmap_intersect(user_id) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```

和 bitmap_to_string 函数组合使用可以获取交集的具体数据

```
求今天和昨天不同 tag 下留存的用户都是哪些
select tag, bitmap_to_string(bitmap_intersect(user_id)) from (select tag, date, bitmap_union(user_id) user_id from table where date in ('2020-05-18', '2020-05-19') group by tag, date) a group by tag;
```

