---
{
    "title": "HDFS",
    "language": "zh-CN",
    "description": "HDFS 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 HDFS 上的文件内容。目前支持csv/csvwithnames/csvwithnamesandtypes/json/parquet/orc文件格式。"
}
---

## 描述

HDFS 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 HDFS 上的文件内容。目前支持`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`文件格式。

## 语法
```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>",
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## 必填参数 (Required Parameters)
| 参数                  | 说明                                                                                                       |
|----------------------|------------------------------------------------------------------------------------------------------------|
| `uri`                | 访问 HDFS 的 URI。如果 URI 路径不存在或文件为空，HDFS TVF 将返回空集合。                                           |
| `fs.defaultFS`       | HDFS 的默认文件系统 URI                                                                                      |
| `hadoop.username`    | 必填，可以是任意字符串，但不能为空。                                                                        |
| `format`             | 文件格式，必填，目前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro`                                                                                          |

## 可选参数 (Optional Parameters)

上述语法中的 `optional_property_key` 可以按需从以下列表中选取对应的参数，`optional_property_value` 则为该参数的值

| 参数                         | 说明                                                                                                                                                                            | 备注                                                                          |
|------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `hadoop.security.authentication` | HDFS 安全认证类型                                                                                                                                                                   |                                                                             |
| `hadoop.username`             | 备用 HDFS 用户名                                                                                                                                                                   |                                                                             |
| `hadoop.kerberos.principal`   | Kerberos 主体                                                                                                                                                                   |                                                                             |
| `hadoop.kerberos.keytab`      | Kerberos 密钥表                                                                                                                                                                  |                                                                             |
| `dfs.client.read.shortcircuit`| 启用短路读取                                                                                                                                                                        |                                                                             |
| `dfs.domain.socket.path`     | 域套接字路径                                                                                                                                                                        |                                                                             |
| `dfs.nameservices`            | HA 模式下的命名服务                                                                                                                                                                   |                                                                             |
| `dfs.ha.namenodes.your-nameservices` | HA 模式下的 namenode 节点配置                                                                                                                                                         |                                                                             |
| `dfs.namenode.rpc-address.your-nameservices.your-namenode` | 指定 namenode 的 RPC 地址                                                                                                                                                          |                                                                             |
| `dfs.client.failover.proxy.provider.your-nameservices` | 指定 failover 的代理提供程序                                                                                                                                                           |                                                                             |
| `column_separator`            | 列分割符，默认为 `\t`                                                                                                                                                                 |                                                                             |
| `line_delimiter`              | 行分割符，默认为 `\n`                                                                                                                                                                 |                                                                             |
| `compress_type`               | 目前支持 UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK。默认值为 UNKNOWN, 将会根据 uri 的后缀自动推断类型                                                                          |                                                                             |
| `read_json_by_line`           | 对 JSON 格式导入，默认为 `true`                                                                                                                                                        | 参考：[JSON Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`           | 对 JSON 格式导入，默认为 `false`                                                                                                                                                       | 参考：[JSON Load](../../../data-operate/import/file-format/json) |
| `json_root`                   | 对 JSON 格式导入，默认为空                                                                                                                                                              | 参考：[JSON Load](../../../data-operate/import/file-format/json)                                                                          |
| `json_paths`                  | 对 JSON 格式导入，默认为空                                                                                                                                                              | 参考：[JSON Load](../../../data-operate/import/file-format/json)                                                                          |
| `num_as_string`               | 对 JSON 格式导入，默认为 `false`                                                                                                                                                       | 参考：[JSON Load](../../../data-operate/import/file-format/json)                                                                          |
| `fuzzy_parse`                 | 对 JSON 格式导入，默认为 `false`                                                                                                                                                       | 参考：[JSON Load](../../../data-operate/import/file-format/json)                                                                          |
| `trim_double_quotes`          | 对 CSV 格式导入，布尔类型，默认为 `false`，为 `true` 时裁剪每个字段的外层双引号                                                                                                                            |                                                                             |
| `skip_lines`                  | 对 CSV 格式导入，整数类型，默认为 0，跳过 CSV 文件前几行，`csv_with_names` 或 `csv_with_names_and_types` 时失效                                                                                          |                                                                             |
| `path_partition_keys`         | 指定文件路径中携带的分区列名，例如/path/to/city=beijing/date="2023-07-09", 则填写 path_partition_keys="city,date"，将会自动从路径中读取相应列名和列值进行导入                                                            |                                                                             |
| `resource`                    | 指定 Resource 名，HDFS TVF 可以利用已有的 HFDS Resource 来直接访问 HDFS。创建 HDFS Resource 的方法可以参照 [CREATE-RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE) | 仅支持 2.1.4 及以上版本                                                                            |
|`enable_mapping_varbinary`|默认为 false，在读取 PARQUET / ORC 时将 BYTE_ARRAY 类型映射为 STRING，开启后则会映射到 VARBINAY 类型。| 在 4.0.3 之后开始支持 |


## 权限控制

| 权限（Privilege）      | 对象（Object） | 说明（Notes） |
|:-------------------|:-----------| :------------ |
| USAGE_PRIV         | 表          |               |
| SELECT_PRIV        | 表          |               |


## 示例

- 读取并访问 HDFS 存储上的 CSV 格式文件
  ```sql
  select * from hdfs(
                "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
                "fs.defaultFS" = "hdfs://127.0.0.1:8424",
                "hadoop.username" = "doris",
                "format" = "csv");
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

- 读取并访问 HA 模式的 HDFS 存储上的 CSV 格式文件
  ```sql
  select * from hdfs(
              "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv",
              "dfs.nameservices" = "my_hdfs",
              "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
              "dfs.namenode.rpc-address.my_hdfs.nn1" = "nanmenode01:8020",
              "dfs.namenode.rpc-address.my_hdfs.nn2" = "nanmenode02:8020",
              "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider");
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

- 可以配合 `desc function` 使用。

  ```sql
  desc function hdfs(
              "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student_with_names.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv_with_names");
  ```
