---
{
    "title": "LOCAL",
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

## local

### Name

local

### Description

Local表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 be 上的文件内容。目前支持`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`文件格式。

该函数需要 ADMIN 权限。

#### syntax

```sql
local(
  "file_path" = "path/to/file.txt", 
  "backend_id" = "be_id",
  "format" = "csv",
  "keyn" = "valuen" 
  ...
  );
```

**参数说明**

- 访问local文件的相关参数：

    - `file_path`
    
        （必填）待读取文件的路径，该路径是一个相对于 `user_files_secure_path` 目录的相对路径, 其中 `user_files_secure_path` 参数是 [be的一个配置项](../../../admin-manual/config/be-config.md) 。
    
        路径中不能包含 `..`，可以使用 glob 语法进行模糊匹配，如：`logs/*.log`

- 执行方式相关：

    在 2.1.1 之前的版本中，Doris 仅支持指定某一个 BE 节点，读取该节点上的本地数据文件。
    
    - `backend_id`:
    
        文件所在的 be id。 `backend_id` 可以通过 `show backends` 命令得到。
    
    从 2.1.2 版本开始，Doris 增加了新的参数 `shared_storage`。
    
    - `shared_storage`
    
        默认为 false。如果为 true，表示指定的文件存在于共享存储上（比如 NAS）。共享存储必须兼容 POXIS 文件接口，并且同时挂载在所有 BE 节点上。
    
        当 `shared_storage` 为 true 时，可以不设置 `backend_id`，Doris 可能会利用到所有 BE 节点进行数据访问。如果设置了 `backend_id`，则仍然仅在指定 BE 节点上执行。

- 文件格式相关参数：

    - `format`：(必填) 目前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`
    - `column_separator`：(选填) 列分割符, 默认为`,`。 
    - `line_delimiter`：(选填) 行分割符，默认为`\n`。
    - `compress_type`: (选填) 目前支持 `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`。 默认值为 `UNKNOWN`, 将会根据 `uri` 的后缀自动推断类型。

- 以下参数适用于json格式的导入，具体使用方法可以参照：[Json Load](../../../data-operate/import/import-way/load-json-format.md)

    - `read_json_by_line`： (选填) 默认为 `"true"`
    - `strip_outer_array`： (选填) 默认为 `"false"`
    - `json_root`： (选填) 默认为空
    - `json_paths`： (选填) 默认为空
    - `num_as_string`： (选填) 默认为 `false`
    - `fuzzy_parse`： (选填) 默认为 `false`

- 以下参数适用于csv格式的导入：

    - `trim_double_quotes`： 布尔类型，选填，默认值为 `false`，为 `true` 时表示裁剪掉 csv 文件每个字段最外层的双引号
    - `skip_lines`： 整数类型，选填，默认值为0，含义为跳过csv文件的前几行。当设置format设置为 `csv_with_names` 或 `csv_with_names_and_types` 时，该参数会失效 

- 其他参数：
    - `path_partition_keys`：（选填）指定文件路径中携带的分区列名，例如 `/path/to/city=beijing/date="2023-07-09"`, 则填写 `path_partition_keys="city,date"`，将会自动从路径中读取相应列名和列值进行导入。

### Examples

分析指定 BE 上的日志文件：

```sql
mysql> select * from local(
        "file_path" = "log/be.out",
        "backend_id" = "10006",
        "format" = "csv")
       where c1 like "%start_time%" limit 10;
+--------------------------------------------------------+
| c1                                                     |
+--------------------------------------------------------+
| start time: 2023年 08月 07日 星期一 23:20:32 CST       |
| start time: 2023年 08月 07日 星期一 23:32:10 CST       |
| start time: 2023年 08月 08日 星期二 00:20:50 CST       |
| start time: 2023年 08月 08日 星期二 00:29:15 CST       |
+--------------------------------------------------------+
```

读取和访问位于路径`${DORIS_HOME}/student.csv`的 csv格式文件：

```sql
mysql> select * from local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
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
mysql> select * from local(
        "file_path" = "/mnt/doris/prefix_*.txt",
        "format" = "csv",
        "column_separator" =",",
        "shared_storage" = "true");
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
mysql> desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

### Keywords

    local, table-valued-function, tvf

### Best Practice

- 关于 local tvf 的更详细使用方法可以参照 [S3](./s3.md) tvf, 唯一不同的是访问存储系统的方式不一样。

- 通过 local tvf 访问 NAS 上的数据

    NAS 共享存储允许同时挂载到多个节点。每个节点都可以像访问本地文件一样访问共享存储中的文件。因此，可以将 NAS 视为本地文件系统，通过 local tvf 进行访问。

    当设置 `"shared_storage" = "true"` 时，Doris 会认为所指定的文件可以在任意 BE 节点访问。当使用通配符指定了一组文件时，Doris 会将访问文件的请求分发到多个 BE 节点上，这样可以利用多个节点的进行分布式文件扫描，提升查询性能。









