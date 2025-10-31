---
{
"title": "CANCEL BACKUP",
"language": "zh-CN"
}
---

## 描述

该语句用于取消一个正在进行的 BACKUP 任务。

## 语法

```sql
CANCEL BACKUP FROM <db_name>;
```

## 参数

**1.`<db_name>`**

备份任务所属数据库名。

## 示例

1. 取消 example_db 下的 BACKUP 任务。

```sql
CANCEL BACKUP FROM example_db;
```

