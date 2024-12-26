---
{
    "title": "Kettle Doris Plugin",
    "language": "en"
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

## Kettle Doris Plugin

[Kettle](https://pentaho.com/) Doris Plugin is used to write data from other data sources to Doris through Stream Load in Kettle.

This plug-in uses the Stream Load function of Doris to import data. It needs to be used in conjunction with the Kettle service.

## About Kettle

Kettle is an open source ETL (Extract, Transform, Load) tool, first developed by Pentaho, Kettle is one of the core components of the Pentaho product suite, mainly used for data integration and data processing, and can easily complete the tasks of extracting data from various sources, cleaning and transforming data, and loading it into the target system.

For more information, please refer to: `https://pentaho.com/`

## User Manual

### Download Kettle and install
Kettle download address: https://pentaho.com/download/#download-pentaho
After downloading, unzip it and run spoon.sh to start kettle
You can also compile it yourself, refer to the [Compilation Chapter](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)

### Compile Kettle Doris Plugin
```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```
After compiling, unzip the plug-in package and copy it to the plugins directory of kettle
```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
mvn clean package -DskipTests
```
### Build a job
Find Doris Stream Loader in the batch loading in Kettle and build a job
![create_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create.png)

Click Start Running the Job to complete data synchronization
![running_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running.png)

### Parameter Description

| Key | Default Value | Required | Comment |
|--------------|----------------| -------- |--------------------------------|
| Step name | -- | Y | Step name |
| fenodes | -- | Y | Doris FE http address, supports multiple addresses, separated by commas |
| Database | -- | Y | Doris write database |
| Target table | -- | Y | Doris's write table |
| Username | -- | Y | Username to access Doris |
| Password | -- | N | Password to access Doris |
| Maximum number of rows for a single import | 10000 | N | Maximum number of rows for a single import |
| Maximum bytes for a single import | 10485760 (10MB) | N | Maximum byte size for a single import |
| Number of import retries | 3 | N | Number of retries after import failure |
| StreamLoad properties | -- | N | Streamload request header |
| Delete Mode | N | N | Whether to enable delete mode. By default, Stream Load performs insert operations. After the delete mode is enabled, all Stream Load writes are delete operations. |