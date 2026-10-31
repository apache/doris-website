---
{
    "title": "SHOW-SYNC-JOB",
    "language": "zh-CN"
}

---

## SHOW-SYNC-JOB

### Name

SHOW SYNC JOB

## 描述

此命令用于当前显示所有数据库内的常驻数据同步作业状态。

语法：

```sql
SHOW SYNC JOB [FROM db_name]
```

## 举例

1. 展示当前数据库的所有数据同步作业状态。

  ```sql
  SHOW SYNC JOB;
  ```

2. 展示数据库 `test_db` 下的所有数据同步作业状态。

	```sql
	SHOW SYNC JOB FROM `test_db`;
	```

### Keywords

    SHOW, SYNC, JOB

### Best Practice

