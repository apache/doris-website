---
{
    "title": "导入数据格式",
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

Doris 支持对csv、json、parquet、orc格式的数据文件进行导入。本文对各种文件格式支持的导入方式、适用参数、使用方式进行详细的介绍。

## CSV 格式
### 支持的导入方式
以下导入方式支持 CSV 格式的数据导入：
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [Routine Load](./import-way/routine-load-manual.md)
- [MySQL Load](./import-way/mysql-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### 支持的CSV格式
- csv: 文件不带 header 和 type
- csv_with_names: 文件带 header，会自动文件行首过滤
- csv_with_names_and_types: 文件带 header 和 type，会自动对文件前两行过滤

### 适用参数

| 参数       | 参数说明                                                     | 指定方法                                                     |
| :--------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 行分隔符   | 用于指定导入文件中的换行符，默认为 `\n`。可以使用做多个字符的组合作为换行符。对于Windows系统上的文本文件，可能需要指定换行符为 `\r\n`。某些程序在写入文件时可能会使用 `\r`作为行终止符，需要指定 `\r` 为换行符。| <p>- Stream     Load： `line_delimiter` Http Header</p> <p>- Broker Load :`LINES TERMINATED BY`</p> <p>- Routine Load : 不支持</p>  <p>- MySQL Load :`LINES TERMINATED BY`</p> |
| 列分隔符   | 用于指定导入文件中的列分隔符，默认为 `\t`。如果是不可见字符，则需要加 `\x` 作为前缀，使用十六进制来表示分隔符。可以使用多个字符的组合作为列分隔符。因为 MySQL 协议会做转义处理，如果列分隔符是不可见字符，通过 MySQL 协议提交的导入请求需要在列分隔字符前面多加一个反斜线 `\`。例如，Hive的文件分隔符为 `\x01`，Broker Load 需要传入 `\\x01`。 | <p>- Stream     Load： `columns_delimiter` Http Header</p> <p>- Broker Load :`COLUMNS TERMINATED BY`</p> <p>- Routine Load :`COLUMNS TERMINATED BY`</p> <p>- MySQL Load :`COLUMNS TERMINATED BY`</p> |
| 包围符     | 当 CSV 数据字段中含有行分隔符或列分隔符时，为防止意外截断，可指定单字节字符作为包围符起到保护作用，默认值：`NONE`。最常用包围符为单引号 `'` 或双引号 `"`。例如列分隔符为 `,`，包围符为 `'`，数据为 `a,'b,c'`，则 `b,c` 会被解析为一个字段。 | <p>- Stream     Load： `enclose` Http Header</p> <p>- Broker Load : `PROPERTIES` 里指定 `enclose`</p> <p> Routine Load: `PROPERTIES` 里指定 `enclose`</p> <p> MySQL Load: `PROPERTIES` 里指定 `enclose`</p> |
| 转义符     | 用于转义在字段中出现的与包围符相同的字符。例如数据为 `a,'b,'c'`，包围符为 `'`，希望 `b,'c` 被作为一个字段解析，则需要指定单字节转义符，例如`\`，将数据修改为 `a,'b,\'c'`。 | <p>- Stream     Load： `escape` Http Header</p> <p>- Broker Load : `PROPERTIES` 里指定 `escape`</p> <p> Routine Load: `PROPERTIES` 里指定 `escape`</p> <p> MySQL Load: `PROPERTIES` 里指定 `escape`</p> |
| 跳过的行数 | 跳过 CSV 文件的前几行，整数类型，默认值为 0。当设置 format 设置为 `csv_with_names`或`csv_with_names_and_types`时，该参数会失效。 | <p>- Stream     Load： `skip_lines` Http Header</p> <p>- Broker Load : `PROPERTIES` 里指定 `skip_lines`</p> <p> MySQL Load: 不支持</p> <p> Routine Load: 不支持</p> |
| 压缩格式   | CSV 格式数据支持以下压缩格式：plain, gz, lzo, bz2, lz4, LZ4FRAME,lzop, deflate。默认是plain，表示不压缩。不支持 tar 格式， tar 只是归档打包工具，不是压缩格式。 | <p>- Stream     Load： `compress_type` Http Header</p> <p>- Broker Load : `COMPRESS_TYPE AS`</p> <p> MySQL Load: 不支持</p> <p> Routine Load: 不支持</p> |

#### 导入示例

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "line_delimiter:\n" \
    -H "columns_delimiter:|" \
    -H "enclose:'" \
    -H "escape:\\" \
    -H "skip_lines:2" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.txt")
    INTO TABLE load_test
    COLUMNS TERMINATED BY "|"
    LINES TERMINATED BY "\n"
    PROPERTIES
    (
        "enclose" = "'",
        "escape" = "\\",
        "skip_lines = "2"
    )
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
);
```

[Routine Load](./import-way/routine-load-manual.md)
```sql
CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
     COLUMNS TERMINATED BY "|",
     COLUMNS(id, name, age)
     PROPERTIES
     (
         "enclose" = "'",
         "escape" = "\\"
     )
     FROM KAFKA
     (
         "kafka_broker_list" = "10.16.10.6:9092",
         "kafka_topic" = "routineLoad01",
         "property.group.id" = "kafka_job01",
         "property.kafka_default_offsets" = "OFFSET_BEGINNING"
     );  
```

[MySQL Load](./import-way/mysql-load-manual.md)
```sql
LOAD DATA LOCAL
INFILE "testData"
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY "|"
LINES TERMINATED BY "\n"
PROPERTIES
(
    "enclose" = "'",
    "escape" = "\\"
);
```

## JSON 格式

Doris 支持导入 JSON 格式的数据。本文档主要说明在进行 JSON 格式数据导入时的注意事项。

### 支持的导入方式

以下导入方式支持 JSON 格式的数据导入：

- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [Routine Load](./import-way/routine-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### 支持的 JSON 格式

当前仅支持以下三种 JSON 格式：

- 以 Array 表示的多行数据

以 Array 为根节点的 JSON 格式。Array 中的每个元素表示要导入的一行数据，通常是一个 Object。示例如下：

```json
[
    { "id": 123, "city" : "beijing"},
    { "id": 456, "city" : "shanghai"},
    ...
]
```

```json
[
    { "id": 123, "city" : { "name" : "beijing", "region" : "haidian"}},
    { "id": 456, "city" : { "name" : "beijing", "region" : "chaoyang"}},
    ...
]
```

这种方式通常用于 Stream Load 导入方式，以便在一批导入数据中表示多行数据。

这种方式必须配合设置 `strip_outer_array=true` 使用。Doris 在解析时会将数组展开，然后依次解析其中的每一个 Object 作为一行数据。

- 以 Object 表示的单行数据

以 Object 为根节点的 JSON 格式。整个 Object 即表示要导入的一行数据。示例如下：

```json
{ "id": 123, "city" : "beijing"}
```

```json
{ "id": 123, "city" : { "name" : "beijing", "region" : "haidian" }}
```

这种方式通常用于 Routine Load 导入方式，如表示 Kafka 中的一条消息，即一行数据。
   
- 以固定分隔符分隔的多行 Object 数据

Object 表示的一行数据即表示要导入的一行数据，示例如下：

```json
{ "id": 123, "city" : "beijing"}
{ "id": 456, "city" : "shanghai"}
...
```

这种方式通常用于 Stream Load 导入方式，以便在一批导入数据中表示多行数据。

这种方式必须配合设置 `read_json_by_line=true` 使用，特殊分隔符还需要指定`line_delimiter`参数，默认`\n`。Doris 在解析时会按照分隔符分隔，然后解析其中的每一行 Object 作为一行数据。

### 参数配置
- streaming_load_json_max_mb

一些数据格式，如 JSON，无法进行拆分处理，必须读取全部数据到内存后才能开始解析，因此，这个值用于限制此类格式数据单次导入最大数据量。

默认值为 100，单位 MB，可参考[BE 配置项](../../admin-manual/config/be-config.md)修改这个参数

- fuzzy_parse 

在 [STREAM LOAD](../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/STREAM-LOAD.md)中，可以添加 `fuzzy_parse` 参数来加速 JSON 数据的导入效率。

这个参数通常用于导入 **以 Array 表示的多行数据** 这种格式，所以一般要配合 `strip_outer_array=true` 使用。

这个功能要求 Array 中的每行数据的**字段顺序完全一致**。Doris 仅会根据第一行的字段顺序做解析，然后以下标的形式访问之后的数据。该方式可以提升 3-5X 的导入效率。

### JSON Path

Doris 支持通过 JSON Path 抽取 JSON 中指定的数据。

**注：因为对于 Array 类型的数据，Doris 会先进行数组展开，最终按照 Object 格式进行单行处理。所以本文档之后的示例都以单个 Object 格式的 Json 数据进行说明。**

- 不指定 JSON Path

如果没有指定 JSON Path，则 Doris 会默认使用表中的列名查找 Object 中的元素。示例如下：

表中包含两列：`id`, `city`

JSON 数据如下：

```json
{ "id": 123, "city" : "beijing"}
```

则 Doris 会使用 `id`, `city` 进行匹配，得到最终数据 `123` 和 `beijing`。

如果 JSON 数据如下：

```json
{ "id": 123, "name" : "beijing"}
```

则使用 `id`, `city` 进行匹配，得到最终数据 `123` 和 `null`。

- 指定 JSON Path

通过一个 JSON 数据的形式指定一组 JSON Path。数组中的每个元素表示一个要抽取的列。示例如下：

```json
["$.id", "$.name"]
```

```json
["$.id.sub_id", "$.name[0]", "$.city[0]"]
```

Doris 会使用指定的 JSON Path 进行数据匹配和抽取。

- 匹配非基本类型

前面的示例最终匹配到的数值都是基本类型，如整型、字符串等。Doris 当前暂不支持复合类型，如 Array、Map 等。所以当匹配到一个非基本类型时，Doris 会将该类型转换为 JSON 格式的字符串，并以字符串类型进行导入。示例如下：

JSON 数据为：

```json
{ "id": 123, "city" : { "name" : "beijing", "region" : "haidian" }}
```

JSON Path 为 `["$.city"]`。则匹配到的元素为：

```json
{ "name" : "beijing", "region" : "haidian" }
```

该元素会被转换为字符串进行后续导入操作：

```json
"{'name':'beijing','region':'haidian'}"
```

- 匹配失败

当匹配失败时，将会返回 `null`。示例如下：

JSON 数据为：

```json
{ "id": 123, "name" : "beijing"}
```

JSON Path 为 `["$.id", "$.info"]`。则匹配到的元素为 `123` 和 `null`。

Doris 当前不区分 JSON 数据中表示的 null 值，和匹配失败时产生的 null 值。假设 JSON 数据为：

```json
{ "id": 123, "name" : null }
```

则使用以下两种 JSON Path 会获得相同的结果：`123` 和 `null`。

```json
["$.id", "$.name"]
```

```json
["$.id", "$.info"]
```

- 完全匹配失败

为防止一些参数设置错误导致的误操作。Doris 在尝试匹配一行数据时，如果所有列都匹配失败，则会认为这个是一个错误行。假设 JSON 数据为：

```json
{ "id": 123, "city" : "beijing" }
```

如果 JSON Path 错误的写为（或者不指定 JSON Path 时，表中的列不包含 `id` 和 `city`）：

```json
["$.ad", "$.infa"]
```

则会导致完全匹配失败，则该行会标记为错误行，而不是产出 `null, null`。

### JSON Path 和 Columns

JSON Path 用于指定如何对 JSON 格式中的数据进行抽取，而 Columns 指定列的映射和转换关系。两者可以配合使用。

换句话说，相当于通过 JSON Path，将一个 JSON 格式的数据，按照 JSON Path 中指定的列顺序进行了列的重排。之后，可以通过 Columns，将这个重排后的源数据和表的列进行映射。举例如下：

数据内容：

```json
{"k1" : 1, "k2": 2}
```

表结构：

```sql
k2 int, k1 int
```

导入语句 1（以 Stream Load 为例）：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

导入语句 1 中，仅指定了 JSON Path，没有指定 Columns。其中 JSON Path 的作用是将 JSON 数据按照 JSON Path 中字段的顺序进行抽取，之后会按照表结构的顺序进行写入。最终导入的数据结果如下：

```text
+------+------+
| k1   | k2   |
+------+------+
|    2 |    1 |
+------+------+
```

会看到，实际的 k1 列导入了 JSON 数据中的 "k2" 列的值。这是因为，JSON 中字段名称并不等同于表结构中字段的名称。我们需要显式的指定这两者之间的映射关系。

导入语句 2：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -H "columns: k2, k1" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

相比如导入语句 1，这里增加了 Columns 字段，用于描述列的映射关系，按 `k2, k1` 的顺序。即按 JSON Path 中字段的顺序抽取后，指定第一列为表中 k2 列的值，而第二列为表中 k1 列的值。最终导入的数据结果如下：

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    2 |
+------+------+
```

当然，如其他导入一样，可以在 Columns 中进行列的转换操作。示例如下：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -H "columns: k2, tmp_k1, k1 = tmp_k1 * 100" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

上述示例会将 k1 的值乘以 100 后导入。最终导入的数据结果如下：

```text
+------+------+
| k1   | k2   |
+------+------+
|  100 |    2 |
+------+------+
```

导入语句 3：

相比于导入语句 1 和导入语句 2 的表结构，这里增加`k1_copy`列。
表结构：

```sql
k2 int, k1 int, k1_copy int
```
如果你想将 json 中的某一字段多次赋予给表中几列，那么可以在 jsonPaths 中多次指定该列，并且依次指定映射顺序。示例如下：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" -H "columns: k2,k1,k1_copy" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

上述示例会按 JSON Path 中字段的顺序抽取后，指定第一列为表中 k2 列的值，而第二列为表中 k1 列的值，第二列为表中 k1_copy 列的值。最终导入的数据结果如下：

```text
+------+------+---------+
| k2   | k1   | k2_copy |
+------+------+---------+
|    2 |    1 |       2 |
+------+------+---------+
```

导入语句 4：

数据内容：

```json
{"k1" : 1, "k2": 2, "k3": {"k1" : 31, "k1_nested" : {"k1" : 32} } }
```

相比于导入语句 1 和导入语句 2 的表结构，这里增加`k1_nested1`,`k1_nested2`列。
表结构：

```text
k2 int, k1 int, k1_nested1 int, k1_nested2 int
```
如果你想将 json 中嵌套的多级同名字段赋予给表中不同的列，那么可以在 jsonPaths 中指定该列，并且依次指定映射顺序。示例如下：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\",\"$.k3.k1\",\"$.k3.k1_nested.k1\"]" -H "columns: k2,k1,k1_nested1,k1_nested2" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

上述示例会按 JSON Path 中字段的顺序抽取后，指定第一列为表中 k2 列的值，而第二列为表中 k1 列的值，第三列嵌套类型中的 k1 列为表中 k1_nested1 列的值，由此可知 k3.k1_nested.k1 列为表中 k1_nested2 列的值。最终导入的数据结果如下：

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```


### JSON root

Doris 支持通过 JSON root 抽取 JSON 中指定的数据。

**注：因为对于 Array 类型的数据，Doris 会先进行数组展开，最终按照 Object 格式进行单行处理。所以本文档之后的示例都以单个 Object 格式的 Json 数据进行说明。**

- 不指定 JSON root

如果没有指定 JSON root，则 Doris 会默认使用表中的列名查找 Object 中的元素。示例如下：

表中包含两列：`id`, `city`

JSON 数据为：

```json
{ "id": 123, "name" : { "id" : "321", "city" : "shanghai" }}
```

则 Doris 会使用 id, city 进行匹配，得到最终数据 123 和 null。

- 指定 JSON root

通过 json_root 指定 JSON 数据的根节点。Doris 将通过 json_root 抽取根节点的元素进行解析。默认为空。

指定 JSON root `-H "json_root: $.name"`。则匹配到的元素为：

```json
{ "id" : "321", "city" : "shanghai" }
```

该元素会被当作新 JSON 进行后续导入操作，得到最终数据 321 和 shanghai

### NULL 和 Default 值

示例数据如下：

```json
[
    {"k1": 1, "k2": "a"},
    {"k1": 2},
    {"k1": 3, "k2": "c"}
]
```

表结构为：`k1 int null, k2 varchar(32) null default "x"`

导入语句如下：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "strip_outer_array: true" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

用户可能期望的导入结果如下，即对于缺失的列，填写默认值。

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    a |
+------+------+
|    2 |    x |
+------+------+
|    3 |    c |
+------+------+
```

但实际的导入结果如下，即对于缺失的列，补上了 NULL。

```text
+------+------+
| k1   | k2   |
+------+------+
|    1 |    a |
+------+------+
|    2 | NULL |
+------+------+
|    3 |    c |
+------+------+
```

这是因为通过导入语句中的信息，Doris 并不知道“缺失的列是表中的 k2 列”。如果要对以上数据按照期望结果导入，则导入语句如下：

```shell
curl -v --location-trusted -u root: -H "format: json" -H "strip_outer_array: true" -H "jsonpaths: [\"$.k1\", \"$.k2\"]" -H "columns: k1, tmp_k2, k2 = ifnull(tmp_k2, 'x')" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

### 应用示例

#### Stream Load

因为 JSON 格式的不可拆分特性，所以在使用 Stream Load 导入 JSON 格式的文件时，文件内容会被全部加载到内存后，才开始处理。因此，如果文件过大的话，可能会占用较多的内存。

假设表结构为：

```text
id      INT     NOT NULL,
city    VARCHAR NULL,
code    INT     NULL
```

1. 导入单行数据 1

 ```json
 {"id": 100, "city": "beijing", "code" : 1}
 ```

 - 不指定 JSON Path

 ```shell
 curl --location-trusted -u user:passwd -H "format: json" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
 ```

 导入结果：

 ```text
 100     beijing     1
 ```

 - 指定 JSON Path

 ```shell
 curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
 ```

 导入结果：

 ```text
 100     beijing     1
 ```

2. 导入单行数据 2

 ```json
 {"id": 100, "content": {"city": "beijing", "code" : 1}}
 ```

 - 指定 JSON Path

 ```shell
 curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.content.city\",\"$.content.code\"]" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
 ```

 导入结果：

 ```text
 100     beijing     1
 ```

3. 以 Array 形式导入多行数据

```json
[
    {"id": 100, "city": "beijing", "code" : 1},
    {"id": 101, "city": "shanghai"},
    {"id": 102, "city": "tianjin", "code" : 3},
    {"id": 103, "city": "chongqing", "code" : 4},
    {"id": 104, "city": ["zhejiang", "guangzhou"], "code" : 5},
    {
        "id": 105,
        "city": {
            "order1": ["guangzhou"]
        }, 
        "code" : 6
    }
]
```

- 指定 JSON Path

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" -H "strip_outer_array: true" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

导入结果：

```text
100     beijing                     1
101     shanghai                    NULL
102     tianjin                     3
103     chongqing                   4
104     ["zhejiang","guangzhou"]    5
105     {"order1":["guangzhou"]}    6
```

4. 以多行 Object 形式导入多行数据

```json
{"id": 100, "city": "beijing", "code" : 1}
{"id": 101, "city": "shanghai"}
{"id": 102, "city": "tianjin", "code" : 3}
{"id": 103, "city": "chongqing", "code" : 4}
```

StreamLoad 导入：

 ```shell
 curl --location-trusted -u user:passwd -H "format: json" -H "read_json_by_line: true" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
 ```

导入结果：

```text
100     beijing                     1
101     shanghai                    NULL
102     tianjin                     3
103     chongqing                   4
```

5. 对导入数据进行转换

数据依然是示例 3 中的多行数据，现需要对导入数据中的 `code` 列加 1 后导入。

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" -H "strip_outer_array: true" -H "columns: id, city, tmpc, code=tmpc+1" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

导入结果：

```text
100     beijing                     2
101     shanghai                    NULL
102     tianjin                     4
103     chongqing                   5
104     ["zhejiang","guangzhou"]    6
105     {"order1":["guangzhou"]}    7
```

6. 使用 JSON 导入 Array 类型
由于 RapidJSON 处理 decimal 和 largeint 数值会导致精度问题，所以我们建议使用 JSON 字符串来导入数据到`array<decimal>` 或 `array<largeint>`列。

```json
{"k1": 39, "k2": ["-818.2173181"]}
```

```json
{"k1": 40, "k2": ["10000000000000000000.1111111222222222"]}
```

```shell
curl --location-trusted -u root:  -H "max_filter_ratio:0.01" -H "format:json" -H "timeout:300" -T test_decimal.json http://localhost:8030/api/example_db/array_test_decimal/_stream_load
```

导入结果：
```shell
MySQL > select * from array_test_decimal;
+------+----------------------------------+
| k1   | k2                               |
+------+----------------------------------+
|   39 | [-818.2173181]                   |
|   40 | [100000000000000000.001111111]   |
+------+----------------------------------+
```


```json
{"k1": 999, "k2": ["76959836937749932879763573681792701709", "26017042825937891692910431521038521227"]}
```

```shell
curl --location-trusted -u root:  -H "max_filter_ratio:0.01" -H "format:json" -H "timeout:300" -T test_largeint.json http://localhost:8030/api/example_db/array_test_largeint/_stream_load
```

导入结果：
```shell
MySQL > select * from array_test_largeint;
+------+------------------------------------------------------------------------------------+
| k1   | k2                                                                                 |
+------+------------------------------------------------------------------------------------+
|  999 | [76959836937749932879763573681792701709, 26017042825937891692910431521038521227]   |
+------+------------------------------------------------------------------------------------+
```

#### Routine Load

Routine Load 对 JSON 数据的处理原理和 Stream Load 相同。在此不再赘述。

对于 Kafka 数据源，每个 Massage 中的内容被视作一个完整的 JSON 数据。如果一个 Massage 中是以 Array 格式的表示的多行数据，则会导入多行，而 Kafka 的 offset 只会增加 1。而如果一个 Array 格式的 JSON 表示多行数据，但是因为 JSON 格式错误导致解析 JSON 失败，则错误行只会增加 1（因为解析失败，实际上 Doris 无法判断其中包含多少行数据，只能按一行错误数据记录）

## Parquet
### 支持的导入方式
以下导入方式支持 CSV 格式的数据导入：
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### 导入示例

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:parquet" \
    -T streamload_example.parquet \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.parquet")
    INTO TABLE load_test
    FORMAT AS "parquet"
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
);
```

## ORC
### 支持的导入方式
以下导入方式支持 CSV 格式的数据导入：
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### 导入示例

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:orc" \
    -T streamload_example.orc \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.orc")
    INTO TABLE load_test
    FORMAT AS "orc"
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
);
```
