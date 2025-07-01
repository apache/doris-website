---
{
    "title": "SHOW-LOAD-WARNINGS",
    "language": "zh-CN"
}
---

## SHOW-LOAD-WARNINGS

### Name

SHOW LOAD WARNINGS

## 描述

如果导入任务失败且错误信息为 `ETL_QUALITY_UNSATISFIED`，则说明存在导入质量问题, 如果想看到这些有质量问题的导入任务，该语句就是完成这个操作的。

语法：

```sql
SHOW LOAD WARNINGS
[FROM db_name]
[
   WHERE
   [LABEL [ = "your_label" ]]
   [LOAD_JOB_ID = ["job id"]]
]
```

1. 如果不指定 db_name，使用当前默认db
2. 如果使用 LABEL = ，则精确匹配指定的 label
3. 如果指定了 LOAD_JOB_ID，则精确匹配指定的 JOB ID

## 举例

1. 展示指定 db 的导入任务中存在质量问题的数据，指定 label 为 "load_demo_20210112" 

   ```sql
   SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112" 
   ```

### Keywords

    SHOW, LOAD, WARNINGS

### Best Practice

