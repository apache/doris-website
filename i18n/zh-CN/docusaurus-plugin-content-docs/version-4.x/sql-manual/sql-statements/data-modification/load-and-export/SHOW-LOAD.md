---
{
    "title": "SHOW LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示指定的导入任务的执行情况。"
}
---

## 描述

该语句用于展示指定的导入任务的执行情况。

## 语法

```sql
SHOW LOAD
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" | LIKE "<label_matcher>"]]
[ STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " } ]
]
[ORDER BY { <col_name> | <expr> | <position> }]
[LIMIT <limit>[OFFSET <offset>]];
```

## 可选参数

**1. `<db_name>`**

> 不指定 db_name，使用当前默认数据库。

**2. `<label_matcher>`**

> 使用 `LABEL LIKE = "<label_matcher>"`，则会匹配导入任务的 label 包含 label_matcher 的导入任务。

**3. `<your_label>`**

> 使用 `LABEL = "<your_label>"`，则精确匹配指定的 label。

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> 指定了 `PENDING` 表示匹配 LOAD = "PENDING" 状态的 job，其余状态词同理。

**5. `<col_name>`**

> 指定结果集中用于排序的列名。

**6. `<expr>`**

> 使用表达式进行排序。

**7. `<position>`**

> 按列在 SELECT 列表中的位置（从 1 开始）排序。

**8. `<limit>`**

> 如果指定了 `LIMIT`，则显示 limit 条匹配记录。否则全部显示。

**9. `<offset>`**

> 指定从偏移量 offset 开始显示查询结果。默认情况下偏移量为 0。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | 库（Database）    | 需要对库表的导入权限 |

## 返回值

返回指定导入任务的详细状态。

## 举例

1. 展示默认 db 的所有导入任务
    
    ```sql
    SHOW LOAD;
    ```

2. 展示指定 db 的导入任务，label 中包含字符串 "2014_01_02"，展示最老的 10 个
    
    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

3. 展示指定 db 的导入任务，指定 label 为 "load_example_db_20140102" 并按 LoadStartTime 降序排序
    
    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```

4. 展示指定 db 的导入任务，指定 label 为 "load_example_db_20140102" ，state 为 "loading", 并按 LoadStartTime 降序排序
    
    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```

5. 展示指定 db 的导入任务 并按 LoadStartTime 降序排序，并从偏移量 5 开始显示 10 条查询结果
    
    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```
    
6. 小批量导入是查看导入状态的命令
    
    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
