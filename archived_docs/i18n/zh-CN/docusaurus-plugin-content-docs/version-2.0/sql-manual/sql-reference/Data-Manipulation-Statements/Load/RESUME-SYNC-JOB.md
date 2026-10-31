---
{
    "title": "RESUME-SYNC-JOB",
    "language": "zh-CN"
}
---

## RESUME-SYNC-JOB

### Name

RESUME SYNC JOB

## 描述

通过 `job_name`恢复一个当前数据库已被暂停的常驻数据同步作业，作业将从上一次被暂停前最新的位置继续同步数据。

语法:

```sql
RESUME SYNC JOB [db.]job_name
```

## 举例

1. 恢复名称为 `job_name` 的数据同步作业

   ```sql
   RESUME SYNC JOB `job_name`;
   ```

### Keywords

    RESUME, SYNC, LOAD

### Best Practice

