---
{
    "title": "CANCEL-LOAD",
    "language": "zh-CN"
}
---

## CANCEL-LOAD

### Name

CANCEL LOAD

## 描述

该语句用于撤销指定 label 的导入作业。或者通过模糊匹配批量撤销导入作业

```sql
CANCEL LOAD
[FROM db_name]
WHERE [LABEL = "load_label" | LABEL like "label_pattern" | STATE = "PENDING/ETL/LOADING"]
```

注：1.2.0 版本之后支持根据 State 取消作业。

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


   :::tip 提示
   该功能自 Apache Doris  1.2 版本起支持
   :::

### Keywords

    CANCEL, LOAD

### Best Practice

1. 只能取消处于 PENDING、ETL、LOADING 状态的未完成的导入作业。
2. 当执行批量撤销时，Doris 不会保证所有对应的导入作业原子的撤销。即有可能仅有部分导入作业撤销成功。用户可以通过 SHOW LOAD 语句查看作业状态，并尝试重复执行 CANCEL LOAD 语句。
