---
{
    "title": "SHOW-EXPORT",
    "language": "zh-CN"
}
---

## SHOW-EXPORT

### Name

SHOW EXPORT

## 描述

该语句用于展示指定的导出任务的执行情况

语法：

```sql
SHOW EXPORT
[FROM db_name]
  [
    WHERE
      [ID = your_job_id]
      [STATE = ["PENDING"|"EXPORTING"|"FINISHED"|"CANCELLED"]]
      [LABEL = your_label]
   ]
[ORDER BY ...]
[LIMIT limit];
```
说明：
      1. 如果不指定 db_name，使用当前默认db
      2. 如果指定了 STATE，则匹配 EXPORT 状态
      3. 可以使用 ORDER BY 对任意列组合进行排序
      4. 如果指定了 LIMIT，则显示 limit 条匹配记录。否则全部显示

## 举例

1. 展示默认 db 的所有导出任务
   
    ```sql
    SHOW EXPORT;
    ```
    
2. 展示指定 db 的导出任务，按 StartTime 降序排序
   
    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```
    
3. 展示指定 db 的导出任务，state 为 "exporting", 并按 StartTime 降序排序
   
    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```
    
4. 展示指定db，指定job_id的导出任务
   
    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```
    
5. 展示指定db，指定label的导出任务
   
    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```

### Keywords

    SHOW, EXPORT

### Best Practice

