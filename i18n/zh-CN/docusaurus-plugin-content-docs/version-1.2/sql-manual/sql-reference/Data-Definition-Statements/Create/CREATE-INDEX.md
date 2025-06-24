---
{
    "title": "CREATE-INDEX",
    "language": "zh-CN"
}
---

## CREATE-INDEX

### Name

CREATE INDEX

## 描述

该语句用于创建索引
语法：

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP] [COMMENT'balabala'];
```
注意：
- 目前只支持bitmap 索引
- BITMAP 索引仅在单列上创建

## 举例

1. 在table1 上为siteid 创建bitmap 索引

   ```sql
   CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING BITMAP COMMENT 'balabala';
   ```


### Keywords

```text
CREATE, INDEX
```

### Best Practice

