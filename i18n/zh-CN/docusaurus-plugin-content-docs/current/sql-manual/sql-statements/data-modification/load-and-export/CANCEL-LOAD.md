---
{
    "title": "CANCEL LOAD",
    "language": "zh-CN",
    "description": "该语句用于撤销指定 label 的导入作业。或者通过模糊匹配批量撤销导入作业"
}
---

## 描述

该语句用于撤销指定 `label` 的导入作业。或者通过模糊匹配批量撤销导入作业

## 语法

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```

## 必选参数

**1. `<db_name>`**

> 撤销导入作业名称

## 可选参数

**1. `<load_label>`**

> 如果使用 `LABEL = "<load_label>"`，则精确匹配指定的 label。

**2. `<label_pattern>`**

> 如果使用 `LABEL LIKE "<label_pattern>"`，则会匹配导入任务的 label 包含 label_matcher 的导入任务。

**3. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> 指定了 `PENDING` 表示撤销 STATE = "PENDING" 状态的 job，其余状态同理。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 库（Database）    | 需要对库表的导入权限 |

## 注意事项

- 1.2.0 版本之后支持根据 State 取消作业。

- 只能取消处于 PENDING、ETL、LOADING 状态的未完成的导入作业。

- 当执行批量撤销时，Doris 不会保证所有对应的导入作业原子的撤销。即有可能仅有部分导入作业撤销成功。用户可以通过 SHOW LOAD 语句查看作业状态，并尝试重复执行 CANCEL LOAD 语句。

## 举例

1. 撤销数据库 example_db 上，label 为 `example_db_test_load_label` 的导入作业

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL = "example_db_test_load_label";
   ```

2. 撤销数据库 example*db 上，所有包含 example* 的导入作业。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL like "example_";
   ```

3. 取消状态为 LOADING 的导入作业。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```
