---
{
"title": "PAUSE-JOB",
"language": "zh-CN"
}
---

## PAUSE-JOB

### Name

PAUSE JOB

## 描述

用户暂停一个 JOB 作业。被停止的作业可以通过 RESUME JOB 恢复。

```sql
PAUSE JOB FOR job_name;
```

## 举例

1. 暂停名称为 test1 的作业。

```sql
   PAUSE JOB FOR test1;
```

### Keywords

    PAUSE, JOB

### Best Practice

