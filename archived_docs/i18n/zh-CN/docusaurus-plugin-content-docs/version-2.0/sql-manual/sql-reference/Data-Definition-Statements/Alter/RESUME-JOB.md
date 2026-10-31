---
{
"title": "RESUME-JOB",
"language": "zh-CN"
}
---

## RESUME-JOB

### Name

RESUME JOB

## 描述

用于重启一个 PAUSE 状态的 JOB 作业。重启的作业，将继续按照周期执行。STOP 状态的 JOB 无法被恢复。

```sql
RESUME JOB FOR job_name;
```

## 举例

1. 重启名称为 test1 的 JOB。

   ```sql
   RESUME JOB FOR test1;
   ```

### Keywords

       RESUME, JOB

### Best Practice

