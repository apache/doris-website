---
{
    "title": "BigQuery Catalog",
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

Bigquery Catalog 通过 [Trino Connector](../../../../docusaurus-plugin-content-docs-community/current/how-to-contribute/trino-connector-developer-guide.md) 兼容框架，使用 Bigquery Connector 来访问 Bigquery 表。

> 该功能自 Doris 3.0.0 版本开始支持。


## 使用须知
1. 在使用 Trino Catalog 访问 Bigquery 表之前，必须先编译 Trino 的 Bigquery 插件，并将其放在指定目录下，具体操作步骤参考下文
2. 当前 Doris 适配 Trino 435 版本的插件，如果使用低于或高于 435 版本的 Trino 插件，可能会出现兼容性问题。
3. 由于 Trino 435 版本的 BigQuery Connector 插件存在序列化问题，所以需要编译我们修复后的 BigQuery Connector 插件。


## 编译 Bigquery Connector 插件
> 需要 JDK 17 版本。

```Plain Text
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-bigquery
$ mvn clean install -DskipTest
```
完成编译后，会在 `trino/plugin/trino-bigquery/target/` 下得到 `trino-bigquery-435/` 目录。

也可以直接下载我们预编译的 [BigQuery.tar.gz](uri) 并解压。


## 部署 Bigquery Connector
将 `trino-bigquery-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
...
```
部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。


## 准备 Google Cloud ADC 认证
1. 安装gcloud CLI， https://cloud.google.com/sdk/docs/install?hl=zh-cn
2. 执行 gcloud init --console-only --skip-diagnostics
3. 执行 gcloud auth login
4. 执行 gcloud auth application-default login

  这一步是生成ADC认证文件，生成后的json默认放在`～/.config/gcloud/application_default_credentials.json`



## 创建 Bigquery Catalog
```Plain Text
create catalog bigquery_catalog1 properties (
  "type"="trino-connector",
  "trino.connector.name"="bigquery",
  "trino.bigquery.project-id"="your-bigquery-project-id",
  "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json",
  );
```
其中：以 `trino.` 为前缀的属性都是 trino 原生的属性，更多有关 Bigquery 的属性可以参考 Trino

## 列类型映射
|Bigquery|Trino|doris|
| ----- | ----- | ----- |
|BOOLEAN|BOOLEAN|BOOLEAN|
|INT64|BIGINT|BIGINT|
|FLOAT64|DOUBLE|DOUBLE|
|NUMERIC|DECIMAL(p,s)|DECIMAL(p,s)|
|BIGNUMERIC|DECIMAL(P,S)|DECIMAL(p,s)|
|STRING|VARCHAR|STRING|
|BYTES|VARBINARY|STRING|
|DATE|DATE|DATE|
|DATETIME|TIMESTAMP(6)|DATETIME|
|TIME|TIME(6)|STRING|
|TIMESTAMP|TIMESTAMP(6) WITH TIME ZONE|DATETIME|
|GEOGRAPHY|VARCHAR|STRING|
|ARRAY|ARRAY|ARRAY|
|MAP|MAP|MAP|
|RECORD|ROW|STRUCT|

