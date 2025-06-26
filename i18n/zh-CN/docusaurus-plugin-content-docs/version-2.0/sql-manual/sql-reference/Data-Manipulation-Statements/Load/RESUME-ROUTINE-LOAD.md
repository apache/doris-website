---
{
    "title": "RESUME-ROUTINE-LOAD",
    "language": "zh-CN"
}
---

## RESUME-ROUTINE-LOAD

### Name

RESUME ROUTINE LOAD

## 描述

用于重启一个被暂停的 Routine Load 作业。重启的作业，将继续从之前已消费的 offset 继续消费。

```sql
RESUME [ALL] ROUTINE LOAD FOR job_name
```

## 举例

1. 重启名称为 test1 的例行导入作业。

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```

2. 重启所有例行导入作业。

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```

### Keywords

    RESUME, ROUTINE, LOAD

### Best Practice

