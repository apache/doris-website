---
{
    "title": "HDFS",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## HDFS

### Description

HDFS 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 HDFS 上的文件内容。目前支持`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`文件格式。

#### syntax
```sql
hdfs(
  "uri" = "..",
  "fs.defaultFS" = "...",
  "hadoop.username" = "...",
  "format" = "csv",
  "keyn" = "valuen" 
  ...
  );
```

**参数说明**

访问 HDFS 相关参数：
- `uri`：（必填）访问 HDFS 的 uri。如果 uri 路径不存在或文件都是空文件，HDFS TVF 将返回空集合。
- `fs.defaultFS`：（必填）
- `hadoop.username`：（必填）可以是任意字符串，但不能为空
- `hadoop.security.authentication`：（选填）
- `hadoop.username`：（选填）
- `hadoop.kerberos.principal`：（选填）
- `hadoop.kerberos.keytab`：（选填）
- `dfs.client.read.shortcircuit`：（选填）
- `dfs.domain.socket.path`：（选填）

访问 HA 模式 HDFS 相关参数：
- `dfs.nameservices`：（选填）
- `dfs.ha.namenodes.your-nameservices`：（选填）
- `dfs.namenode.rpc-address.your-nameservices.your-namenode`：（选填）
- `dfs.client.failover.proxy.provider.your-nameservices`：（选填）

文件格式相关参数：
- `format`：(必填) 目前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro`
- `column_separator`：(选填) 列分割符，默认为`\t`。 
- `line_delimiter`：(选填) 行分割符，默认为`\n`。
- `compress_type`: (选填) 目前支持 `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`。默认值为 `UNKNOWN`, 将会根据 `uri` 的后缀自动推断类型。

    下面 6 个参数是用于 JSON 格式的导入，具体使用方法可以参照：[JSON Load](../../../data-operate/import/import-way/load-json-format.md)

- `read_json_by_line`： (选填) 默认为 `"true"`
- `strip_outer_array`： (选填) 默认为 `"false"`
- `json_root`： (选填) 默认为空
- `json_paths`： (选填) 默认为空
- `num_as_string`： (选填) 默认为 `false`
- `fuzzy_parse`： (选填) 默认为 `false`

    下面 2 个参数用于 CSV 格式的导入：

- `trim_double_quotes`：布尔类型，选填，默认值为 `false`，为 `true` 时表示裁剪掉 CSV 文件每个字段最外层的双引号
- `skip_lines`：整数类型，选填，默认值为 0，含义为跳过 CSV 文件的前几行。当设置 Format 设置为 `csv_with_names` 或 `csv_with_names_and_types` 时，该参数会失效

其他参数：
- `path_partition_keys`：（选填）指定文件路径中携带的分区列名，例如/path/to/city=beijing/date="2023-07-09", 则填写`path_partition_keys="city,date"`，将会自动从路径中读取相应列名和列值进行导入。
- `resource`：（选填）指定 Resource 名，HDFS TVF 可以利用已有的 HFDS Resource 来直接访问 HDFS。创建 HDFS Resource 的方法可以参照 [CREATE-RESOURCE](../../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)。该功能自 2.1.4 版本开始支持。
  
:::tip 注意
直接查询 TVF 或基于该 TVF 创建 View，需要拥有该 Resource 的 USAGE 权限，查询基于 TVF 创建的 View，只需要该 View 的 SELECT 权限
:::

### Examples

读取并访问 HDFS 存储上的 CSV 格式文件
```sql
MySQL [(none)]> select * from hdfs(
            "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
            "fs.defaultFS" = "hdfs://127.0.0.1:8424",
            "hadoop.username" = "doris",
            "format" = "csv");
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

读取并访问 HA 模式的 HDFS 存储上的 CSV 格式文件
```sql
MySQL [(none)]> select * from hdfs(
            "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
            "fs.defaultFS" = "hdfs://127.0.0.1:8424",
            "hadoop.username" = "doris",
            "format" = "csv",
            "dfs.nameservices" = "my_hdfs",
            "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
            "dfs.namenode.rpc-address.my_hdfs.nn1" = "nanmenode01:8020",
            "dfs.namenode.rpc-address.my_hdfs.nn2" = "nanmenode02:8020",
            "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider");
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

可以配合 `desc function` 使用。

```sql
MySQL [(none)]> desc function hdfs(
            "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student_with_names.csv",
            "fs.defaultFS" = "hdfs://127.0.0.1:8424",
            "hadoop.username" = "doris",
            "format" = "csv_with_names");
```

### Keywords

    HDFS, table-valued-function, TVF

### Best Practice

  关于 HDFS TVF 的更详细使用方法可以参照 [S3](./s3.md) TVF, 唯一不同的是访问存储系统的方式不一样。
// Because of "use_path_style"="true", s3 will be accessed in 'path style'.
select * from s3(
    "URI" = "https://endpoint/bucket/file/student.csv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv",
    "use_path_style"="true");

// Note how to write your bucket of URI and set the 'use_path_style' parameter, as well as http://.
// Because of "use_path_style"="false", s3 will be accessed in 'virtual-hosted style'.
select * from s3(
    "URI" = "https://bucket.endpoint/file/student.csv",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv",
    "use_path_style"="false");    
    
// The OSS on Alibaba Cloud and The COS on Tencent Cloud will use 'virtual-hosted style' to access s3.
// OSS
select * from s3(
    "URI" = "http://example-bucket.oss-cn-beijing.aliyuncs.com/your-folder/file.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "oss-cn-beijing",
    "format" = "parquet",
    "use_path_style" = "false");
// COS
select * from s3(
    "URI" = "https://example-bucket.cos.ap-hongkong.myqcloud.com/your-folder/file.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "cos.ap-hongkong.myqcloud.com",
    "s3.region" = "ap-hongkong",
    "format" = "parquet",
    "use_path_style" = "false");

// MinIO
select * from s3(
    "uri" = "s3://bucket/file.csv",
    "s3.endpoint" = "http://172.21.0.101:9000",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "format" = "csv"
);

// The BOS on Baidu Cloud will use 'virtual-hosted style' compatible with the S3 protocol to access s3.
// BOS
select * from s3(
    "uri" = "https://example-bucket.s3.bj.bcebos.com/your-folder/file.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "bj",
    "s3.endpoint" = "http://bj.bcebos.com",
    "format" = "parquet",
    "use_path_style" = "false");
```


Example of s3://:

```sql
// Note how to write your bucket of URI, no need to set 'use_path_style'.
// s3 will be accessed in 'virtual-hosted style'.
select * from s3(
    "URI" = "s3://bucket/file/student.csv",
    "s3.endpoint"= "endpont",
    "s3.region" = "region",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "csv");    
```

Example of other uri styles:

```sql
// Virtual Host AWS Client (Hadoop S3) Mixed Style. Used by setting `use_path_style = false` and `force_parsing_by_standard_uri = true`.
select * from s3(
    "URI" = "s3://my-bucket.s3.us-west-1.amazonaws.com/resources/doc.txt?versionId=abc123&partNumber=77&partNumber=88",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint"= "endpont",
    "s3.region"= "region",
    "format" = "csv",
    "use_path_style"="false",
    "force_parsing_by_standard_uri"="true");

// Path AWS Client (Hadoop S3) Mixed Style. Used by setting `use_path_style = true` and `force_parsing_by_standard_uri = true`.
select * from s3(
    "URI" = "s3://s3.us-west-1.amazonaws.com/my-bucket/resources/doc.txt?versionId=abc123&partNumber=77&partNumber=88",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint"= "endpont",
    "s3.region"= "region",
    "format" = "csv",
    "use_path_style"="true",
    "force_parsing_by_standard_uri"="true");
```

**csv format**
`csv` format: Read the file on S3 and process it as a csv file, read the first line in the file to parse out the table schema. The number of columns in the first line of the file `n` will be used as the number of columns in the table schema, and the column names of the table schema will be automatically named `c1, c2, ..., cn`, and the column type is set to `String` , for example:

The file content of student1.csv:

```
1,ftw,12
2,zs,18
3,ww,20
```

use S3 tvf

```sql
MySQL [(none)]> select * from s3("uri" = "http://127.0.0.1:9312/test2/student1.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv",
->                 "use_path_style" = "true") order by c1;
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | ftw  | 12   |
| 2    | zs   | 18   |
| 3    | ww   | 20   |
+------+------+------+
```

use `desc function S3()` to view the table schema

```sql
MySQL [(none)]> Desc function s3("uri" = "http://127.0.0.1:9312/test2/student1.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv",
->                 "use_path_style" = "true");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

**csv_with_names format**
`csv_with_names` format: The first line of the file is used as the number and name of the columns of the table schema, and the column type is set to `String`, for example:

The file content of student_with_names.csv:

```
id,name,age
1,ftw,12
2,zs,18
3,ww,20
```

use S3 tvf

```sql
MySQL [(none)]> select * from s3("uri" = "http://127.0.0.1:9312/test2/student_with_names.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names",
->                 "use_path_style" = "true") order by id;
+------+------+------+
| id   | name | age  |
+------+------+------+
| 1    | ftw  | 12   |
| 2    | zs   | 18   |
| 3    | ww   | 20   |
+------+------+------+
```

You can also use `desc function S3()` to view the Table Schema.

```sql
MySQL [(none)]> Desc function s3("uri" = "http://127.0.0.1:9312/test2/student_with_names.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names",
->                 "use_path_style" = "true");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | TEXT | Yes  | false | NULL    | NONE  |
| name  | TEXT | Yes  | false | NULL    | NONE  |
| age   | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

**csv_with_names_and_types format**

`csv_with_names_and_types` format: Currently, it does not support parsing the column type from a csv file. When using this format, S3 tvf will parse the first line of the file as the number and name of the columns of the table schema, and set the column type to String. Meanwhile, the second line of the file is ignored.

The file content of student_with_names_and_types.csv:

```
id,name,age
INT,STRING,INT
1,ftw,12
2,zs,18
3,ww,20
```

use S3 tvf

```sql
MySQL [(none)]> select * from s3("uri" = "http://127.0.0.1:9312/test2/student_with_names_and_types.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names_and_types",
->                 "use_path_style" = "true") order by id;
+------+------+------+
| id   | name | age  |
+------+------+------+
| 1    | ftw  | 12   |
| 2    | zs   | 18   |
| 3    | ww   | 20   |
+------+------+------+
```

You can also use `desc function S3()` to view the Table Schema.

```sql
MySQL [(none)]> Desc function s3("uri" = "http://127.0.0.1:9312/test2/student_with_names_and_types.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names_and_types",
->                 "use_path_style" = "true");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | TEXT | Yes  | false | NULL    | NONE  |
| name  | TEXT | Yes  | false | NULL    | NONE  |
| age   | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

**json format**

`json` format: The json format involves many optional parameters, and the meaning of each parameter can be referred to: [Json Load](../../../data-operate/import/import-way/load-json-format.md). When S3 tvf queries the json format file, it locates a json object according to the `json_root` and `jsonpaths` parameters, and uses the `key` in the object as the column name of the table schema, and sets the column type to String. For example:

The file content of data.json:

```
[{"id":1, "name":"ftw", "age":18}]
[{"id":2, "name":"xxx", "age":17}]
[{"id":3, "name":"yyy", "age":19}]
```

use S3 tvf:

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/data.json",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "json",
    "strip_outer_array" = "true",
    "read_json_by_line" = "true",
    "use_path_style"="true");
+------+------+------+
| id   | name | age  |
+------+------+------+
| 1    | ftw  | 18   |
| 2    | xxx  | 17   |
| 3    | yyy  | 19   |
+------+------+------+

MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/data.json",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "json",
    "strip_outer_array" = "true",
    "jsonpaths" = "[\"$.id\", \"$.age\"]",
    "use_path_style"="true");
+------+------+
| id   | age  |
+------+------+
| 1    | 18   |
| 2    | 17   |
| 3    | 19   |
+------+------+
```

**parquet format**

`parquet` format: S3 tvf supports parsing the column names and column types of the table schema from the parquet file. Example:

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "parquet",
    "use_path_style"="true") limit 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

```sql
MySQL [(none)]> desc function s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "parquet",
    "use_path_style"="true");
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

**orc format**

`orc` format: Same as `parquet` format, set `format` parameter to orc.

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.orc",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "orc",
    "use_path_style"="true") limit 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

**avro format**

`avro` format: S3 tvf supports parsing the column names and column types of the table schema from the avro file. Example:

```sql
select * from s3(
         "uri" = "http://127.0.0.1:9312/test2/person.avro",
         "ACCESS_KEY" = "ak",
         "SECRET_KEY" = "sk",
         "s3.endpoint" = "http://127.0.0.1:9312",
         "s3.region" = "us-east-1",
         "FORMAT" = "avro");
+--------+--------------+-------------+-----------------+
| name   | boolean_type | double_type | long_type       |
+--------+--------------+-------------+-----------------+
| Alyssa |            1 |     10.0012 | 100000000221133 |
| Ben    |            0 |    5555.999 |      4009990000 |
| lisi   |            0 | 5992225.999 |      9099933330 |
+--------+--------------+-------------+-----------------+
```

**uri contains wildcards**

uri can use wildcards to read multiple files. Note: If wildcards are used, the format of each file must be consistent (especially csv/csv_with_names/csv_with_names_and_types count as different formats), S3 tvf uses the first file to parse out the table schema. For example:

The following two csv files:

```
// file1.csv
1,aaa,18
2,qqq,20
3,qwe,19

// file2.csv
5,cyx,19
6,ftw,21
```

You can use wildcards on the uri to query.

```sql
MySQL [(none)]> select * from s3(
        "uri" = "http://127.0.0.1:9312/test2/file*.csv",
        "s3.access_key"= "minioadmin",
        "s3.secret_key" = "minioadmin",
        "s3.endpoint" = "http://127.0.0.1:9312",
        "s3.region" = "us-east-1",
        "format" = "csv",
        "use_path_style"="true");
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | aaa  | 18   |
| 2    | qqq  | 20   |
| 3    | qwe  | 19   |
| 5    | cyx  | 19   |
| 6    | ftw  | 21   |
+------+------+------+
```

**Using `S3` tvf with `insert into` and `cast`**

```sql
// Create doris internal table
CREATE TABLE IF NOT EXISTS ${testTable}
    (
        id int,
        name varchar(50),
        age int
    )
    COMMENT "my first table"
    DISTRIBUTED BY HASH(id) BUCKETS 32
    PROPERTIES("replication_num" = "1");

// Insert data using S3
insert into ${testTable} (id,name,age)
select cast (id as INT) as id, name, cast (age as INT) as age
from s3(
    "uri" = "${uri}",
    "s3.access_key"= "${ak}",
    "s3.secret_key" = "${sk}",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "${format}",
    "strip_outer_array" = "true",
    "read_json_by_line" = "true",
    "use_path_style" = "true");
```
