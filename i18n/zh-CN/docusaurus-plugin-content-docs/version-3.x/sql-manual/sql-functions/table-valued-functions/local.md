---
{
    "title": "LOCAL",
    "language": "zh-CN",
    "description": "Local 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 be 上的文件内容。目前支持csv/csvwithnames/csvwithnamesandtypes/json/parquet/orc文件格式。"
}
---

## 描述

Local 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 be 上的文件内容。目前支持`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`文件格式。

## 语法

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## Required Parameters
| 参数            | 说明                                                                                                                                                                                                | 备注                                              |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| `file_path`     | 待读取文件的路径，该路径是一个相对于 `user_files_secure_path` 目录的相对路径，其中 `user_files_secure_path` 参数是 [be 的一个配置项](../../../admin-manual/config/be-config.md)。 <br /> 路径中不能包含 `..`，可以使用 glob 语法进行模糊匹配，如：`logs/*.log` |                                                 |
| `backend_id`    |  文件所在的 BE 节点的 ID，可以通过 `show backends` 命令得到                                                                                               | 在 2.1.1 之前的版本中，Doris 仅支持指定某个 BE 节点读取该节点上的本地数据文件 |
| `format`        | 文件格式，必填，当前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`                                                                  |                                                 |

## Optional Parameters
| 参数               | 说明                                                                                                                         | 备注                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `shared_storage`   | 默认为 false。如果为 true，表示指定的文件存在于共享存储上（比如 NAS）。共享存储必须兼容 POXIS 文件接口，并且同时挂载在所有 BE 节点上。 <br /> 当 `shared_storage` 为 true 时，可以不设置 `backend_id`，Doris 可能会利用到所有 BE 节点进行数据访问。如果设置了 `backend_id`，则仍然仅在指定 BE 节点上执行。  | 从 2.1.2 版本开始支持                                                              |
| `column_separator` | 列分隔符，选填，默认为 `\t`                                                                                                           |                                                                             |
| `line_delimiter`   | 行分隔符，选填，默认为 `\n`                                                                                                           |                                                                             |
| `compress_type`    | 压缩类型，选填，目前支持 `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`，默认值为 `UNKNOWN`，将根据 `uri` 后缀自动推断类型                     |                                                                     |
| `read_json_by_line`| 对于 JSON 格式的导入，选填，默认为 `true`                                                                                                | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`| 对于 JSON 格式的导入，选填，默认为 `false`                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_root`        | 对于 JSON 格式的导入，选填，默认为空                                                                                                      | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_paths`       | 对于 JSON 格式的导入，选填，默认为空                                                                                                      | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `num_as_string`    | 对于 JSON 格式的导入，选填，默认为 `false`                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`      | 对于 JSON 格式的导入，选填，默认为 `false`                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`| 对于 CSV 格式的导入，选填，默认为 `false`，为 `true` 时表示裁剪掉 CSV 文件每个字段最外层的双引号                                                              | csv 格式                                                                      |
| `skip_lines`       | 对于 CSV 格式的导入，选填，默认为 0，表示跳过 CSV 文件的前几行。当设置格式为 `csv_with_names` 或 `csv_with_names_and_types` 时，该参数会失效                        | csv 格式                                                                      |
| `path_partition_keys`| 选填，指定文件路径中携带的分区列名，例如 `/path/to/city=beijing/date="2023-07-09"`，则填写 `path_partition_keys="city,date"`，将从路径中自动读取相应的列名和列值进行导入 |                                                                             |
|`enable_mapping_varbinary`|默认为 false，在读取 PARQUET / ORC 时将 BYTE_ARRAY 类型映射为 STRING，开启后则会映射到 VARBINAY 类型。| 在 4.0.3 之后开始支持 |

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| ADMIN_PRIV       | 全局         |               |


## 注意事项

- 关于 local tvf 的更详细使用方法可以参照 [S3](./s3.md) tvf, 唯一不同的是访问存储系统的方式不一样。

- 通过 local tvf 访问 NAS 上的数据

  NAS 共享存储允许同时挂载到多个节点。每个节点都可以像访问本地文件一样访问共享存储中的文件。因此，可以将 NAS 视为本地文件系统，通过 local tvf 进行访问。

  当设置 `"shared_storage" = "true"` 时，Doris 会认为所指定的文件可以在任意 BE 节点访问。当使用通配符指定了一组文件时，Doris 会将访问文件的请求分发到多个 BE 节点上，这样可以利用多个节点的进行分布式文件扫描，提升查询性能。



## 示例
分析指定 BE 上的日志文件：
```sql
select * from local(
        "file_path" = "log/be.out",
        "backend_id" = "10006",
        "format" = "csv")
       where c1 like "%start_time%" limit 10;
```
```text
+--------------------------------------------------------+
| c1                                                     |
+--------------------------------------------------------+
| start time: 2023 年 08 月 07 日 星期一 23:20:32 CST       |
| start time: 2023 年 08 月 07 日 星期一 23:32:10 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:20:50 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:29:15 CST       |
+--------------------------------------------------------+
```

读取和访问位于路径`${DORIS_HOME}/student.csv`的 csv 格式文件：
```sql
select * from local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+------+---------+--------+
| c1   | c2      | c3     |
+------+---------+--------+
| 1    | alice   | 18     |
| 2    | bob     | 20     |
| 3    | jack    | 24     |
| 4    | jackson | 19     |
| 5    | liming  | d18    |
+------+---------+--------+
```

访问 NAS 上的共享数据：
```sql
select * from local(
        "file_path" = "/mnt/doris/prefix_*.txt",
        "format" = "csv",
        "column_separator" =",",
        "shared_storage" = "true");
```
```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
+------+------+------+
```

可以配合`desc function`使用
```sql
desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```







