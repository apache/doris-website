---
{
"title": "SHOW-JOB-TASK",
"language": "zh-CN"
}
---

## SHOW-JOB-TASK

### Name

SHOW JOB TASK

## 描述

该语句用于展示 JOB 子任务的执行结果列表, 默认会保留最新的 20 条记录。

语法：

```sql
SHOW JOB TASKS FOR job_name;
```



结果说明：

```
                          JobId: JobId
                          TaskId: TaskId
                       StartTime: 开始执行时间
                         EndTime: 结束时间
                          Status: 状态
                          Result: 执行结果
                          ErrMsg: 错误信息
```

* State

        有以下 2 种 State：
        * SUCCESS
        * FAIL

## 举例

1. 展示名称为 test1 的 JOB 的任务执行列表

    ```sql
    SHOW JOB TASKS FOR test1;
    ```
   
### Keywords

    SHOW, JOB, TASK

### Best Practice
