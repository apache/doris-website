---
{
    "title": "PAUSE-SYNC-JOB",
    "language": "zh-CN"
}
---

## PAUSE-SYNC-JOB

### Name

PAUSE SYNC JOB

## 描述

通过 `job_name` 暂停一个数据库内正在运行的常驻数据同步作业，被暂停的作业将停止同步数据，保持消费的最新位置，直到被用户恢复。

语法：

```sql
PAUSE SYNC JOB [db.]job_name
```

## 举例

1. 暂停名称为 `job_name` 的数据同步作业。

   ```sql
   PAUSE SYNC JOB `job_name`;
   ```

### Keywords

    PAUSE, SYNC, JOB

### Best Practice

