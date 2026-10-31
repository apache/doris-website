---
{
    "title": "SET TABLE PARTITION VERSION",
    "language": "zh-CN",
    "description": "存算一体模式，该语句用于手动改变指定分区的可见版本。在某些特殊情况下，元数据中分区的版本有可能和实际副本的版本不一致。该命令可手动改变元数据中分区的版本。此命令一般只用于紧急故障修复，请谨慎操作。"
}
---

## 描述

存算一体模式，该语句用于手动改变指定分区的可见版本。在某些特殊情况下，元数据中分区的版本有可能和实际副本的版本不一致。该命令可手动改变元数据中分区的版本。此命令一般只用于紧急故障修复，请谨慎操作。

## 语法

```sql
ADMIN SET TABLE <table_name> PARTITION VERSION PROPERTIES ("<partition_id>" = "visible_version>");
```

## 必选参数

1. `<table_name>`: 待设置的表名

2. `<partition_id>`: 指定一个 Partition Id

3. `<visible_version>`: 指定 Version

## 示例

1. 设置 partition_id 为 10075 的分区在 FE 元数据上的版本为 100

    ```sql
    ADMIN SET TABLE __internal_schema.audit_log PARTITION VERSION PROPERTIES("partition_id" = "10075", "visible_version" = "100");
    ```

## 注意事项

1. 设置分区的版本需要先确认 BE 机器上实际副本的版本，此命令一般只用于紧急故障修复，请谨慎操作。

2. 存算分离模式不支持这个命令，设置了不会生效