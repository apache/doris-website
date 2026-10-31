---
{
    "title": "STOP-SYNC-JOB",
    "language": "zh-CN"
}
---

## STOP-SYNC-JOB

### Name

STOP SYNC JOB

## 描述

通过 `job_name` 停止一个数据库内非停止状态的常驻数据同步作业。

语法:

```sql
STOP SYNC JOB [db.]job_name
```

## 举例

1. 停止名称为 `job_name` 的数据同步作业

	```sql
	STOP SYNC JOB `job_name`;
	```

### Keywords

    STOP, SYNC, JOB

### Best Practice

