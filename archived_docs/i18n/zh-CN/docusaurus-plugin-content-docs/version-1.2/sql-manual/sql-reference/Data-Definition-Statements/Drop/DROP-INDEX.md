---
{
    "title": "DROP-INDEX",
    "language": "zh-CN"
}
---

## DROP-INDEX

### Name

DROP INDEX

## 描述

该语句用于从一个表中删除指定名称的索引，目前仅支持bitmap 索引
语法：

```sql
DROP INDEX [IF EXISTS] index_name ON [db_name.]table_name;
```

## 举例

1. 删除索引

   ```sql
   DROP INDEX [IF NOT EXISTS] index_name ON table1 ;
   ```

### Keywords

    DROP, INDEX

### Best Practice

