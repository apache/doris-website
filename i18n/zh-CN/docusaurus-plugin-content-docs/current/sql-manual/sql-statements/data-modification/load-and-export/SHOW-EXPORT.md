---
{
    "title": "SHOW EXPORT",
    "language": "zh-CN",
    "description": "该语句用于展示指定的导出任务的执行情况"
}
---

## 描述

该语句用于展示指定的导出任务的执行情况

## 语法

```sql
SHOW EXPORT
[ FROM <db_name> ]
  [
    WHERE
      [ ID = <job_id> ]
      [ STATE = { "PENDING" | "EXPORTING" | "FINISHED" | "CANCELLED" } ]
      [ LABEL = <label> ]
   ]
[ ORDER BY <column_name> [ ASC | DESC ] [, column_name [ ASC | DESC ] ... ] ]
[ LIMIT <limit> ];
```

## 可选参数

**1. `<db_name>`**：可选参数，如果不指定，使用当前默认数据库。

**2. `<job_id>`**：可选参数，用于指定要展示的导出作业 ID。

**3. `<label>`**：可选参数，用于指定要展示的导出作业的标签。

**4. `<column_name>`**：可选参数，用于指定排序的列名。

**5. `<limit>`**：可选参数，如果指定了该参数，则仅显示指定条数的匹配记录；如果未指定，则显示全部记录。


## 返回值

| 列名          | 类型     | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|-------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| JobId       | string | 作业的唯一 ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Label       | string | 该导出作业的标签，如果 Export 没有指定，则系统会默认生成一个。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| State       | string | 作业状态：<br> - `PENDING`：作业待调度<br> - `EXPORTING`：数据导出中<br> - `FINISHED`：作业成功<br> - `CANCELLED`：作业失败                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Progress    | string | 作业进度。该进度以查询计划为单位。假设一共 10 个线程，当前已完成 3 个，则进度为 30%。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TaskInfo    | json   | 以 Json 格式展示的作业信息：<br> - db：数据库名<br> - tbl：表名<br> - partitions：指定导出的分区，`空` 列表表示所有分区<br> - column_separator：导出文件的列分隔符<br> - line_delimiter：导出文件的行分隔符<br> - tablet num：涉及的总 Tablet 数量<br> - broker：使用的 broker 的名称<br> - coord num：查询计划的个数<br> - max_file_size：一个导出文件的最大大小<br> - delete_existing_files：是否删除导出目录下已存在的文件及目录<br> - columns：指定需要导出的列名，空值代表导出所有列<br> - format：导出的文件格式                                                                                                                                                                                                                                |
| Path        | string | 远端存储上的导出路径                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CreateTime  | string | 作业的创建时间                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| StartTime   | string | 作业开始调度时间                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| FinishTime  | string | 作业结束时间                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Timeout     | int    | 作业超时时间（单位：秒）。该时间从 CreateTime 开始计算。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ErrorMsg    | string | 如果作业出现错误，这里会显示错误原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| OutfileInfo | string | 如果作业导出成功，这里会显示具体的 `SELECT INTO OUTFILE` 结果信息                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限          | 对象          | 说明            |
|:------------|:------------|:--------------|
| SELECT_PRIV | 库（Database） | 需要对数据库、表的读权限。 |


## 示例

- 展示默认 db 的所有导出任务
   
    ```sql
    SHOW EXPORT;
    ```

- 展示指定 db 的导出任务，按 StartTime 降序排序
   
    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```

- 展示指定 db 的导出任务，state 为 "exporting", 并按 StartTime 降序排序
   
    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```

- 展示指定 db，指定 job_id 的导出任务
   
    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```

- 展示指定 db，指定 label 的导出任务
   
    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```


