---
{
    "title": "SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS",
    "language": "zh-CN"
}
---

## SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS

### Name

SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS

## 描述

用来查看将非light schema change的olpa表转换为light schema change表的情况， 需要开启配置`enable_convert_light_weight_schema_change`

语法:

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [FROM db]
```

## 举例

1. 查看在database test上的转换情况

    ```sql
     SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
    ```

2. 查看全局的转换情况

    ```sql
    SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
    ```


### Keywords

    SHOW, CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS

### Best Practice