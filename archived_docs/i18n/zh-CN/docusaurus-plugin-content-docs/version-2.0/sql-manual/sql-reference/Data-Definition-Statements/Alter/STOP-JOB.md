---
{
"title": "STOP-JOB",
"language": "zh-CN"
}
---

## STOP-JOB

### Name

STOP JOB

## 描述

用户停止一个 JOB 作业。被停止的作业无法再重新运行。

```sql
STOP JOB FOR job_name;
```

## 举例

1. 停止名称为 test1 的作业。

   ```sql
   STOP JOB FOR test1;
   ```

### Keywords

    STOP, JOB

### Best Practice

