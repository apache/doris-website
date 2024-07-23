---
{
    "title": "DeltaLake Catalog",
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

DeltaLake Catalog 通过 [Trino Connector](../../../../docusaurus-plugin-content-docs-community/current/how-to-contribute/trino-connector-developer-guide.md) 兼容框架，使用 DeltaLake Connector 来访问 DeltaLake 表。

> 该功能自 Doris 3.0.0 版本开始支持。



## 使用须知 / 使用限制
1. 在使用 Trino Catalog 访问 DeltaLake 表之前，必须先编译 Trino 的 DeltaLake 插件，并将其放在指定目录下。具体操作步骤参考下文。
2. 当前 Doris 适配 Trino 435 版本的插件，如果使用低于或高于 435 版本的 Trino 插件，可能会出现兼容性问题。
3. 当前不支持 DeltaLake 的 Time Travel 功能。
4. 当前不支持查询 DeltaLake 的 history 信息。



## 编译 DeltaLake Connector 插件
> 需要 JDK 17 版本。

```Plain Text
$ git clone https://github.com/trinodb/trino.git
$ cd trino
$ git checkout 435
$ cd plugin/trino-delta-lake
$ mvn clean install -DskipTest
```
完成编译后，会在 `trino/plugin/trino-delta-lake/target/` 下得到 `trino-delta-lake-435` 目录。

也可以直接下载预编译的 [DeltaLake.tar.gz](uri) 并解压。



## 部署 DeltaLake Connector
将 `trino-delta-lake-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
...
```
部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。



## 创建 DeltaLake Catalog
```Plain Text
create catalog emr_delta_lake properties ( 
    "type"="trino-connector", 
    "trino.connector.name"="delta_lake",
    "trino.hive.metastore"="thrift",
    "trino.hive.metastore.uri"= "thrift://ip:portrait ",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```
其中：以 `trino.` 为前缀的属性都是 trino 原生的属性，更多有关 DeltaLake 的属性可以参考 Trino

## 列类型映射
|DeltaLake|Trino|doris|
| ----- | ----- | ----- |
|BOOLEAN|BOOLEAN|BOOLEAN|
|INTEGER|INTEGER|INT|
|BYTE|TINYINT|TINYINT|
|SHORT|SMALLINT|SMALLINT|
|LONG|BIGINT|BIGINT|
|FLOAT|REAL|FLOAT|
|DOUBLE|DOUBLE|DOUBLE|
|DECIMAL(p,s)|DECIMAL(p,s)|DECIMAL(p,s)|
|STRING|VARCHAR|STRING|
|BINARY|VARBINARY|STRING|
|DATE|DATE|DATE|
|TIMESTAMPNTZ (TIMESTAMP\_NTZ)|TIMESTAMP(6)|DATETIME|
|TIMESTAMP|TIMESTAMP(3) WITH TIME ZONE|DATETIME|
|ARRAY|ARRAY|ARRAY|
|MAP|MAP|MAP|
|STRUCT|ROW|STRUCT|
