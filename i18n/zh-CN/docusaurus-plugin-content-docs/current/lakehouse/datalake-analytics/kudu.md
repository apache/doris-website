---
{
    "title": "Kudu Catalog",
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

Kudu Catalog 通过 [Trino Connector](../../../../docusaurus-plugin-content-docs-community/current/how-to-contribute/trino-connector-developer-guide.md) 兼容框架，使用 Kudu Connector 来访问 Kudu 表。

> 该功能自 Doris 3.0.1 版本开始支持。

:::tip 备注
这是一个实验功能。
:::

## 使用须知

1. 在使用 Trino Catalog 访问 Kudu 表之前，必须先编译 Trino 的 Kudu 插件，并将其放在指定目录下，具体操作步骤参考下文
2. 当前 Doris 适配 Trino 435 版本的插件，如果使用低于或高于 435 版本的 Trino 插件，可能会出现兼容性问题。
3. 由于 Trino 435 版本的 Kudu 插件不支持 DATE 类型，所以建议使用我们提供的 Kudu 插件。

## 编译 Kudu Connector 插件

> 需要 JDK 17 版本。

```Plain Text
$ git clone https://github.com/apache/Doris-thirdparty.git
$ cd Doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-kudu
$ mvn clean package -Dmaven.test.skip=true
```

完成编译后，会在 `trino/plugin/trino-kudu/target/` 下得到 `trino-kudu-435/` 目录。

也可以直接下载我们预编译的 [trino-kudu-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz) 并解压。

## 部署 Kudu Connector

将 `trino-kudu-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-kudu-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

## 创建 Kudu Catalog

```sql
create catalog kudu_catalog properties (  
    "type"="trino-connector",  
    "trino.connector.name"="kudu", 
    "trino.kudu.client.master-addresses"="ip1:port1,ip2:port2,ip3,port3", 
    "trino.kudu.authentication.type" = "NONE" 
);
```

其中：以 `trino.` 为前缀的属性都是 trino 原生的属性，更多有关 Kudu 的属性可以参考 [Trino 文档](https://trino.io/docs/current/connector/kudu.html)。

## 列类型映射

|Kudu|Trino|Doris|说明|
| ----- | ----- | ----- |----|
|BOOLEAN|BOOLEAN|BOOLEAN||
|INT8|TINYINT|TINYINT||
|INT16|SMALLINT|SMALLINT||
|INT32|INTEGER|INT||
|INT64|BIGINT|BIGINT||
|FLOAT|REAL|FLOAT||
|DOUBLE|DOUBLE|DOUBLE||
|BINARY|VARBINARY|STRING| 需要 HEX(col) 才会显示的和 Trino 一样  |
|STRING|VARCHAR|STRING||
|DECIMAL(p,s)|DECIMAL(p,s)|DECIMAL(p,s)||
|DATE|DATE|DATE||
|UNIXTIME_MICROS | TIMESTAMP(3) | DATETIME(3)| |
| VARCHAR | UNSUPPORTED|||
| UTF-8 encoded string| UNSUPPORTED|||

