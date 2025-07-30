---
{
    "title": "PAUSE-ROUTINE-LOAD",
    "language": "zh-CN"
}
---

## PAUSE-ROUTINE-LOAD

### Name

PAUSE ROUTINE LOAD 

## 描述

用于暂停一个 Routine Load 作业。被暂停的作业可以通过 RESUME 命令重新运行。

```sql
PAUSE [ALL] ROUTINE LOAD FOR job_name
```

## 举例

1. 暂停名称为 test1 的例行导入作业。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

2. 暂停所有例行导入作业。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```

### Keywords

    PAUSE, ROUTINE, LOAD

### Best Practice

