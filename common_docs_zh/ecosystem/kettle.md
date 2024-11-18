---
{
    "title": "Kettle Doris Plugin",
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

## Kettle Doris Plugin

[Kettle](https://pentaho.com/) Doris的插件，用于在Kettle中通过 Stream Load 将其他数据源的数据写入到 Doris 中。

这个插件是利用 Doris 的 Stream Load 功能进行数据导入的。需要配合 Kettle 服务一起使用。

## 关于 Kettle

Kettle 是一款开源的ETL（Extract, Transform, Load）工具，最早由 Pentaho 公司开发，Kettle 是 Pentaho 产品套件中的核心组件之一，主要用于数据集成和数据处理，能够轻松完成从各种来源提取数据、对数据进行清洗和转换，并将其加载到目标系统中的任务。


更多信息请参阅：`https://pentaho.com/`

## 使用手册

### 下载Kettle安装
Kettle 下载地址： https://pentaho.com/download/#download-pentaho
下载后解压，运行spoon.sh即可启动kettle
也可以自行编译，参考[编译章节](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)

### 编译Kettle Doris Plugin
```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```
编译完成后，将插件包解压后拷贝到kettle的plugins目录下
```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip 
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
mvn clean package -DskipTests
```
### 构建作业
在Kettle中的批量加载中找到Doris Stream Loader，构建作业
![create_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create_zh.png)


点击开始运行作业即可完成数据同步
![running_zh.png](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running_zh.png)


### 参数说明

| Key          | Default Value  | Required | Comment                        |
|--------------|----------------| -------- |--------------------------------|
| Step name         | --             | Y        | 步骤名称                           |
| fenodes      | --             | Y        | Doris FE http 地址，支持多个地址，使用逗号分隔 |
| 数据库          | --             | Y        | Doris 的写入数据库                   |
| 目标表          | --             | Y        | Doris 的写入表                     |
| 用户名          | --             | Y        | 访问 Doris 的用户名                  |
| 密码           | --             | N        | 访问 Doris 的密码                   |
| 单次导入最大行数     | 10000          | N        | 单次导入的最大行数                      |
| 单次导入最大字节     | 10485760(10MB) | N        | 单次导入的最大字节大小                    |
| 导入重试次数       | 3              | N        | 导入失败之后的重试次数                    |
| Stream Load属性 | --             | N        | Stream Load的请求头                 |
| 删除模式 | N             | N        | 是否开启删除模式。默认情况下，Stream Load执行插入操作，开启删除模式后，Stream Load写入均为删除操作                 |