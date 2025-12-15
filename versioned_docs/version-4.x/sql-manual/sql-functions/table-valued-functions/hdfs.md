---
{
  "title": "LOCAL",
  "language": "en"
}
---

## Description

Local table-valued-function(tvf), allows users to read and access local file contents on be node, just like accessing relational table. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` file format.

## syntax

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## Required Parameters
| Parameter         | Description                                                                                                                                                                                          | Remarks                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | The path of the file to be read, which is relative to the `user_files_secure_path` directory. The `user_files_secure_path` parameter is a [BE configuration item](../../../admin-manual/config/be-config.md). <br /> The path cannot include `..`, and glob syntax can be used for pattern matching, such as `logs/*.log`. |                                                   |
| `backend_id`      | The ID of the BE node where the file is located. It can be obtained via the `show backends` command.                                                                                                  | Before version 2.1.1, Doris only supports specifying a BE node to read local data files on that node. |
| `format`          | The file format, which is required. Supported formats are `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`.                                                                             |                                                   |

## Optional Parameters
| Parameter              | Description                                                                                                                                                                       | Remarks                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | Defaults to false. If true, the specified file is located on shared storage (e.g., NAS). The shared storage must support POSIX file interfaces and be mounted on all BE nodes. <br /> When `shared_storage` is true, `backend_id` can be omitted. Doris may utilize all BE nodes to access the data. If `backend_id` is set, the data will be accessed only on the specified BE node. | Supported starting from version 2.1.2                                      |
| `column_separator`      | The column separator, optional, defaults to `\t`.                                                                                                                                 |                                                                       |
| `line_delimiter`        | The line delimiter, optional, defaults to `\n`.                                                                                                                                   |                                                                       |
| `compress_type`         | The compression type, optional. Supported types are `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`. Defaults to `UNKNOWN`, and the type will be automatically inferred from the `uri` suffix. |                                                                       |
| `read_json_by_line`     | For JSON format imports, optional, defaults to `true`.                                                                                                                            | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`     | For JSON format imports, optional, defaults to `false`.                                                                                                                           | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `json_root`             | For JSON format imports, optional, defaults to empty.                                                                                                                               | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `json_paths`            | For JSON format imports, optional, defaults to empty.                                                                                                                               | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `num_as_string`         | For JSON format imports, optional, defaults to `false`.                                                                                                                            | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`           | For JSON format imports, optional, defaults to `false`.                                                                                                                            | Refer to: [Json Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`    | For CSV format imports, optional, defaults to `false`. If true, it will trim the outermost double quotes around each field in the CSV file.                                          | For CSV format                                                           |
| `skip_lines`            | For CSV format imports, optional, defaults to `0`, which means skipping the first few lines of the CSV file. When the format is `csv_with_names` or `csv_with_names_and_types`, this parameter is ignored. | For CSV format                                                           |
| `path_partition_keys`   | Optional, specifies the partition column names carried in the file path, e.g., `/path/to/city=beijing/date="2023-07-09"`, then fill in `path_partition_keys="city,date"`. This will automatically read the corresponding column names and values from the path for import. |                                                                       |
| `enable_mapping_varbinary` | Defaults to false. When reading PARQUET/ORC, it maps the BYTE_ARRAY type to STRING. When enabled, it maps to VARBINARY type. | Supported since 4.0.3 |

## Access Control Requirements
| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## Usage Notes

- For more detailed usage of local tvf, please refer to [S3](./s3.md) tvf, The only difference between them is the way of accessing the storage system.

- Access data on NAS through local tvf

  NAS shared storage allows to be mounted to multiple nodes at the same time. Each node can access files in the shared storage just like local files. Therefore, the NAS can be thought of as a local file system, accessed through local tvf.

  When setting `"shared_storage" = "true"`, Doris will think that the specified file can be accessed from any BE node. When a set of files is specified using wildcards, Doris will distribute requests to access files to multiple BE nodes, so that multiple nodes can be used to perform distributed file scanning and improve query performance.


## Examples

Analyze the log file on specified BE:
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

Read and access csv format files located at path `${DORIS_HOME}/student.csv`:
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
```--+---------+--------+
```

Query files on NAS:
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

Can be used with `desc function` :
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