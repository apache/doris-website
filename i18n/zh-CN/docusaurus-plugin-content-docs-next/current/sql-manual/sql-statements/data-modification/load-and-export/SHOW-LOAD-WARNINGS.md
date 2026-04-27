---
{
    "title": "SHOW LOAD WARNINGS",
    "language": "zh-CN",
    "description": "如果导入任务失败且错误信息为 ETLQUALITYUNSATISFIED，则说明存在导入质量问题，如果想看到这些有质量问题的导入任务，该语句就是完成这个操作的。"
}
---

## 描述

如果导入任务失败且错误信息为 `ETL_QUALITY_UNSATISFIED`，则说明存在导入质量问题，如果想看到这些有质量问题的导入任务，该语句就是完成这个操作的。

## 语法：

```sql
SHOW LOAD WARNINGS
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" ]]
   [LOAD_JOB_ID = ["<job_id>"]]
]
```

## 可选参数

**1. `<db_name>`**

> 如果不指定 db_name，使用当前默认数据库。

**2. `<your_label>`**

> 如果使用 `LABEL = <your_label>`，则精确匹配指定的 label。

**3. `<job_id>`**

> 如果指定了 `LOAD_JOB_ID = <job_id>`，则精确匹配指定的 JOB_ID。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | 库（Database）    | 需要对库表的导入权限 |

## 返回值

返回指定 db 的导入任务中存在质量问题的数据。

## 举例

- 展示指定 db 的导入任务中存在质量问题的数据，指定 label 为 "load_demo_20210112" 

   ```sql
   SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112" 
   ```

