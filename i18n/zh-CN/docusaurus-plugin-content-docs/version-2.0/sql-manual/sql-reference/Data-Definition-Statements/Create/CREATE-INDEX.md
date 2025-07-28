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
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING INVERTED] [COMMENT'balabala'];
```
注意：
- 倒排索引仅在单列上创建

## 举例

1. 在table1 上为siteid 创建倒排索引

   ```sql
   CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING INVERTED COMMENT 'balabala';
   ```


### Keywords

```text
CREATE, INDEX
```

### Best Practice

