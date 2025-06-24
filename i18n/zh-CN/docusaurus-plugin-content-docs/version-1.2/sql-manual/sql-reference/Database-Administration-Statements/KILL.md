---
{
    "title": "KILL",
    "language": "zh-CN"
}
---

## KILL

### Name

KILL

## 描述

每个 Doris 的连接都在一个单独的线程中运行。 您可以使用 KILL processlist_id 语句终止线程。

线程进程列表标识符可以从 INFORMATION_SCHEMA PROCESSLIST 表的 ID 列、SHOW PROCESSLIST 输出的 Id 列和性能模式线程表的 PROCESSLIST_ID 列确定。 

语法：

```sql
KILL [CONNECTION | QUERY] processlist_id
```

## 举例

### Keywords

    KILL

### Best Practice

