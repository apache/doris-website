---
{
    "title": "HUDI_META",
    "language": "zh-CN",
    "description": "hudimeta 表函数（table-valued-function,tvf），可以用于读取 hudi 表的各类元数据信息，如操作历史、表的时间线、文件元数据等。"
}
---

## 描述

`hudi_meta` 表函数（table-valued-function,tvf），可以用于读取 hudi 表的各类元数据信息，如操作历史、表的时间线、文件元数据等。

该函数自 3.1.0 版本支持。

## 语法

```sql
HUDI_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 必填参数
`hudi_meta` 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对

| 字段             | 说明                                                      |
|----------------|---------------------------------------------------------|
| `<table>`      | 完整的表名，需要按照目录名。库名。表名的格式，填写需要查看的 Hudi 表名。                 |
| `<query_type>` | 想要查看的元数据类型，目前仅支持 `timeline`。                            |


## 示例（Examples）

- 读取并访问 hudi 表格式的 timeline 元数据。

    ```sql
    select * from hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    
    ```

- 可以配合`desc function`使用

    ```sql
    desc function hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```

- 查看 hudi 表的 timeline

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline");
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    | 20240724195845718 | commit | 20240724195845718.commit | COMPLETED | 20240724195846653     |
    | 20240724195848377 | commit | 20240724195848377.commit | COMPLETED | 20240724195849337     |
    | 20240724195850799 | commit | 20240724195850799.commit | COMPLETED | 20240724195851676     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```

- 根据 timestamp 字段筛选

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline") where timestamp = 20240724195843565;
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```
