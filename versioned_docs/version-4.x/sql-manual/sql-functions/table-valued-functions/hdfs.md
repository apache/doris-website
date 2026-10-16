---
{
    "title": "HDFS | Table Valued Functions",
    "language": "en",
    "description": "Read files on HDFS as a relational table with the HDFS table-valued function.",
    "sidebar_label": "HDFS"
}
---

<a id="local"></a>

# HDFS

## Description

The HDFS table-valued function (TVF) reads files on HDFS as a relational table. It supports `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc`, and `avro` formats.

## Syntax

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Parameters

### Required Parameters

| Parameter | Description |
| --- | --- |
| `uri` | HDFS URI of the file to read. If the path does not exist or the file is empty, the TVF returns an empty result. |
| `fs.defaultFS` | Default HDFS filesystem URI. |
| `hadoop.username` | HDFS username. Provide a nonempty string. |
| `format` | File format: `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc`, or `avro`. |

### Optional Parameters

Use the following keys for `<optional_property_key>` and their corresponding values for `<optional_property_value>`:

| Parameter | Description | Notes |
| --- | --- | --- |
| `hadoop.security.authentication` | HDFS authentication type. | |
| `hadoop.kerberos.principal` | Kerberos principal. | |
| `hadoop.kerberos.keytab` | Kerberos keytab file. | |
| `dfs.client.read.shortcircuit` | Enable HDFS short-circuit reads. | |
| `dfs.domain.socket.path` | Domain socket path. | |
| `dfs.nameservices` | Nameservice used in HA mode. | |
| `dfs.ha.namenodes.<nameservice>` | NameNode IDs for the specified nameservice in HA mode. | |
| `dfs.namenode.rpc-address.<nameservice>.<namenode>` | RPC address of the specified NameNode. | |
| `dfs.client.failover.proxy.provider.<nameservice>` | Failover proxy provider class for the nameservice. | |
| `column_separator` | Column separator; defaults to `\t`. | |
| `line_delimiter` | Line delimiter; defaults to `\n`. | |
| `compress_type` | Compression: `UNKNOWN`, `PLAIN`, `GZ`, `LZO`, `BZ2`, `LZ4FRAME`, `DEFLATE`, or `SNAPPYBLOCK`. Defaults to `UNKNOWN`, which infers compression from the URI suffix. | |
| `read_json_by_line` | Read JSON by line; defaults to `true`. | [JSON Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | Remove the outer JSON array; defaults to `false`. | [JSON Load](../../../data-operate/import/file-format/json) |
| `json_root` | JSON root path; empty by default. | [JSON Load](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON field paths; empty by default. | [JSON Load](../../../data-operate/import/file-format/json) |
| `num_as_string` | Read JSON numbers as strings; defaults to `false`. | [JSON Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | Enable fuzzy JSON parsing; defaults to `false`. | [JSON Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | Boolean for CSV; defaults to `false`. When enabled, removes outer double quotes from each field. | |
| `skip_lines` | Integer for CSV; defaults to `0`. Skips initial lines; ignored for `csv_with_names` and `csv_with_names_and_types`. | |
| `path_partition_keys` | Comma-separated partition column names encoded in the path. For `/path/to/city=beijing/date=2023-07-09`, use `city,date` to extract those values. | |
| `resource` | Existing HDFS Resource used to access HDFS. See [CREATE RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE). | Since 2.1.4 |
| `enable_mapping_varbinary` | Defaults to `false`. For Parquet and ORC binary fields, maps to STRING by default or VARBINARY when enabled. This option is independent of `enable_mapping_timestamp_tz`. | Since 4.0.3 |
| `enable_mapping_timestamp_tz` | Since 4.1.5, accepted only for compatibility; the value is ignored. Parquet Timestamp with `isAdjustedToUTC=true` and ORC `TIMESTAMP_INSTANT` always map to `TIMESTAMPTZ`, even when this option is `false`. | Since 4.0.3 |
| `hive.parquet.time-zone` | Optional string, empty by default. Specifies the Parquet INT96 writer time zone: an IANA time zone or UTC offset from `-12:00` to `+14:00`; short aliases such as `CST` and `PRC` are rejected. See [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility). | Since 4.1.5 |

### Access Control Requirements

When using the `resource` parameter, the querying user needs `USAGE` on that Resource. Doris must also have network access to HDFS and valid HDFS or Kerberos credentials for the files.

## Return Value

Returns a table whose column names and types are inferred from the files. NULL fields are returned as SQL NULL. A nonexistent path or an empty file returns an empty result. Invalid parameters, inaccessible storage, or malformed files can cause analysis or execution to fail.

## Examples

The following examples assume that the HDFS file `student.csv` contains:

```text
1,alice,18
2,bob,20
3,jack,24
4,jackson,19
5,liming,18
```

### Read a CSV file

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### Read a CSV file from HA HDFS

Configure the nameservice and both NameNode addresses for your HA cluster. The URI and `fs.defaultFS` use the logical nameservice:

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://my_hdfs/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://my_hdfs",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ",",
    "dfs.nameservices" = "my_hdfs",
    "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
    "dfs.namenode.rpc-address.my_hdfs.nn1" = "namenode01:8020",
    "dfs.namenode.rpc-address.my_hdfs.nn2" = "namenode02:8020",
    "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### Inspect the inferred schema

```sql
DESC FUNCTION HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
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

## Usage Notes

For other common file options, see the [S3 TVF](./s3.md). HDFS-specific authentication and HA settings are described in [HDFS Storage](../../../lakehouse/storages/hdfs.md).
