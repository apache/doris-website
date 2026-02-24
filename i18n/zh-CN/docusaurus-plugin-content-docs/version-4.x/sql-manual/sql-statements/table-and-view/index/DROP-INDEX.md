---
{
    "title": "DROP INDEX",
    "language": "zh-CN",
    "description": "该语句用于从一个表中删除指定名称的索引，目前仅支持 inverted index, ann index 索引。"
}
---

## 描述

该语句用于从一个表中删除指定名称的索引，目前仅支持 inverted index, ann index 索引。

## 语法

```sql
DROP INDEX [ IF EXISTS ] <index_name> ON [ <db_name> . ] <table_name>;
```

## 必选参数

**1. `<index_name>`**：索引名称。

**2. `<table_name>`**：索引归属的表名。

## 可选参数  

**1. `<db_name>`**：库名，选填，不填默认当前库。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象       | 说明                      |
|:-----------|:---------|:------------------------|
| ALTER_PRIV | 表（Table） | DROP INDEX 属于表 ALTER 操作 |

## 示例

- 删除索引

   ```sql
   DROP INDEX IF NOT EXISTS index_name ON table1 ;
   ```

