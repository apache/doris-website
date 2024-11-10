---
{
    "title": "阿里云 MaxCompute",
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


# 阿里云 MaxCompute

MaxCompute 是阿里云上的企业级 SaaS（Software as a Service）模式云数据仓库。

> [什么是 MaxCompute](https://help.aliyun.com/zh/MaxCompute/product-overview/what-is-MaxCompute)


## 连接 MaxCompute

### 示例

``` sql 
-- 1. 创建Catalog。
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "xxxx",
  "mc.secret_key" = "xxx",
  "mc.endpoint" = "http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api"
);

-- 2. 切换到新创建的Catalog下。
SWITCH mc;

-- 下面的步骤就和使用Mysql一样了。

-- 3. 查看该Catalog下所有的数据库。
SHOW DATABASES;

-- 4. 使用数据库, 这里的xxx为第三步展示出来结果的任意一个数据库。
USE xxx;

-- 5. 查看该数据库下所有的表。
SHOW TABLES;

-- 6. 进行SQL查询。
select * from tb  limit 10;
```


### 创建Catalog的基本属性 

|参数           | 说明    | 
|:-------------:|:-------:|
|   type       | 固定为 `max_compute`. |
|mc.default.project | 想要访问的 MaxCompute 项目名称。可以在 [MaxCompute 项目列表](https://MaxCompute.console.aliyun.com/cn-beijing/project-list) 中创建和管理。 | 
| mc.access_key | AccessKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。| 
| mc.secret_key | SecretKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。 | 
|mc.endpoint | MaxCompute 开通的地域。请参照下文的`如何获取Endpoint 和 Quota`来配置。 | 



### 创建Catalog的可选属性 

| 参数     |  默认值  | 说明 | 
|---|---|---|
|   mc.quota      | pay-as-you-go |  Quota名称。请参照下文的 `如何获取Endpoint 和 Quota` 来配置。   | 
| mc.split_strategy | byte_size |   设置split的划分方式， 可设置为按照字节大小划分 `byte_size` 和按照数据行数划分 `row_count` |
|  mc.split_byte_size| 268435456   |  每个split读取的文件大小，单位为字节，默认为256MB，当且仅当 `"mc.split_strategy" = "byte_size"` 时生效 |
| mc.split_row_count | 1048576 | 每个split读多少行，当且仅当 `"mc.split_strategy" = "row_count"` 时生效  |




## 列类型映射

|MaxCompute               |Doris                    |备注     | 
|:-----------------------:|:-----------------------:|:------:|
|TINYINT                  |TINYINT                  |        |
|TINYINT                  |TINYINT                  |        |
|SMALLINT                 |SMALLINT                 |        |
|INT                      |INT                      |        |
|BIGINT                   |BIGINT                   |        |
|BINARY                   |不支持                    |        |
|FLOAT                    |FLOAT                    |        |
|DOUBLE                   |DOUBLE                   |        |
|DECIMAL(precision,scale) |DECIMAL(precision,scale) |        |
|VARCHAR(n)               |VARCHAR(n)               |        |
|CHAR(n)                  |CHAR(n)                  |        |
|STRING                   |STRING                   |        |
|DATE                     |DATE                     |        |
|DATETIME                 |DATETIME(3)              | 可以通过`SET [global] time_zone = 'Asia/Shanghai'`来指定时区 |
|TIMESTAMP                |不支持                    |        |
|TIMESTAMP_NTZ            |DATETIME(6)              |MaxCompute 的 TIMESTAMP_NTZ 精度为9, Doris 的 DATETIME 最大精度只有6，故读取数据时会将多的部分直接截断。 |
|BOOLEAN                  |BOOLEAN                  |        |
|ARRAY                    |ARRAY                    |        |
|MAP                      |MAP                      |        |
|STRUCT                   |STRUCT                   |        |
|JSON                     |不支持                    |        |


## 使用须知

1. 自3.0.3版本开始, MaxCompute Catalog 基于 [开放存储SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) 开发。
2. 开放存储SDK的使用有一定的限制，请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) 中 `使用限制` 的章节。
3. MaxCompute 中的 Project 相当于 Doris 中的 DataBase 。 


## 如何获取 Endpoint 和 Quota


1. 如果您使用数据传输服务独享资源组, 请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts) 中 `使用独享数据服务资源组` 章节中的 `2.授权` 来开启相应的权限，并在 `配额（Quota）管理` 列表中，查看并复制对应的QuotaName，指定 `"mc.quota" = "QuotaName"`。此时您可以选择 VPC / 公网来访问 MaxCompute，但是走 VPC 的带宽有保障，公网带宽资源小。

2. 如果您使用按量付费，请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)
中 `使用开放存储（按量付费）` 的章节，来开启开放存储(Storage API)开关，并给 Ak,SK 对应的用户赋予权限。此时您的 `mc.quota` 为默认值 `pay-as-you-go`，不需要额外指定该值。此时您只能使用 VPC 来访问 MaxCompute。

3. 通过第 1/2 步，您已经知道该如何访问 MaxCompute，下面需要根据 [阿里云 Endpoints 文档](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints) 中的 `地域Endpoint对照表` 来配置 `mc.endpoint` 。使用 VPC 访问的用户，需要根据 `各地域Endpoint对照表（阿里云VPC网络连接方式）` 表中的 `VPC网络Endpoint` 列来配置 `mc.endpoint` 。使用公网访问的用户，可以选择 `各地域Endpoint对照表（阿里云经典网络连接方式）` 表中的 `经典网络Endpoint` 列、或者选择 `各地域Endpoint对照表（外网连接方式)` 表中的 `外网Endpoint` 列来配置 `mc.endpoint`。

