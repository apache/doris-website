---
{
    "title": "STOP-ROUTINE-LOAD",
    "language": "zh-CN"
}
---

## STOP-ROUTINE-LOAD

### Name

STOP ROUTINE LOAD

## 描述

用户停止一个 Routine Load 作业。被停止的作业无法再重新运行。

```sql
STOP ROUTINE LOAD FOR job_name;
```

## 举例

1. 停止名称为 test1 的例行导入作业。

   ```sql
   STOP ROUTINE LOAD FOR test1;
   ```

### Keywords

    STOP, ROUTINE, LOAD

### Best Practice

