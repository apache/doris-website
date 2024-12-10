---
{
    "title": "Alibaba Cloud Max Compute",
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


# Alibaba Cloud MaxCompute

MaxCompute is an enterprise-level SaaS (Software as a Service) cloud data warehouse on Alibaba Cloud.

> [What is MaxCompute](https://www.alibabacloud.com/help/en/maxcompute/product-overview/what-is-maxcompute)

## Connect to MaxCompute

### Example

``` sql 
-- 1. Create Catalog.
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "xxxx",
  "mc.secret_key" = "xxx",
  "mc.endpoint" = "http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api"
);

-- 2. Switch to the newly created Catalog.
SWITCH mc;

-- The following steps are the same as using Mysql.

-- 3. View all databases under this Catalog.
SHOW DATABASES;

-- 4. Use a database. Here, xxx is any database from the results shown in step 3.
USE xxx;

-- 5. View all tables under this database.
SHOW TABLES;

-- 6. Perform SQL queries.
select * from tb  limit 10;
```


### Basic properties of creating Catalog

|Parameter           | Description    | 
|:-------------:|:-------:|
|   type       | Fixed as  `max_compute`. |
|mc.default.project | The name of the MaxCompute project you want to access. It can be created and managed in [MaxCompute project list](https://MaxCompute.console.aliyun.com/cn-beijing/project-list). | 
| mc.access_key | AccessKey.It can be created and managed in [Alibaba Cloud console](https://ram.console.aliyun.com/manage/ak).| 
| mc.secret_key | SecretKey.It can be created and managed in [Alibaba Cloud console](https://ram.console.aliyun.com/manage/ak). | 
|mc.endpoint | The region where MaxCompute is enabled. Please refer to `How to obtain Endpoint and Quota` below for configuration.| 



### Optional properties of creating Catalog

| Parameter     |  Description  | Description | 
|---|---|---|
|   mc.quota      | pay-as-you-go |  Quota name. Please refer to `How to obtain Endpoint and Quota` below for configuration.   | 
| mc.split_strategy | byte_size |   Set the split division method. It can be set to divide by byte size `byte_size` or divide by row count `row_count`. |
|  mc.split_byte_size| 268435456   | The file size read by each split, in bytes. The default is 256MB. It takes effect only when `"mc.split_strategy" = "byte_size"`.  |
| mc.split_row_count | 1048576 | The number of rows read by each split. It takes effect only when `"mc.split_strategy" = "row_count"`. |




## Column type mapping

|MaxCompute               |Doris                    |Remarks     | 
|:-----------------------:|:-----------------------:|:------:|
|TINYINT                  |TINYINT                  |        |
|TINYINT                  |TINYINT                  |        |
|SMALLINT                 |SMALLINT                 |        |
|INT                      |INT                      |        |
|BIGINT                   |BIGINT                   |        |
|BINARY                   |Not supported            |        |
|FLOAT                    |FLOAT                    |        |
|DOUBLE                   |DOUBLE                   |        |
|DECIMAL(precision,scale) |DECIMAL(precision,scale) |        |
|VARCHAR(n)               |VARCHAR(n)               |        |
|CHAR(n)                  |CHAR(n)                  |        |
|STRING                   |STRING                   |        |
|DATE                     |DATE                     |        |
|DATETIME                 |DATETIME(3)              | You can specify the time zone by  `SET [global] time_zone = 'Asia/Shanghai'`. |
|TIMESTAMP                |Not supported            |        |
|TIMESTAMP_NTZ            |DATETIME(6)              |The precision of TIMESTAMP_NTZ in MaxCompute is 9. The maximum precision of DATETIME in Doris is only 6. Therefore, when reading data, the extra parts will be directly truncated. |
|BOOLEAN                  |BOOLEAN                  |        |
|ARRAY                    |ARRAY                    |        |
|MAP                      |MAP                      |        |
|STRUCT                   |STRUCT                   |        |
|JSON                     |Not supported            |        |


## Usage notes

1. The MaxCompute Catalog is developed based on the [Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) .
2. The use of the Open Storage SDK has certain limitations. Please refer to the `Usage limitations` section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) .
3. The Project in MaxCompute is equivalent to the DataBase in Doris.
 


## How to obtain Endpoint and Quota
1. if you use the dedicated resource group of data transmission service , please refer to the `Use exclusive data service resource groups` section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts), and in `2. Authorization`, enable the corresponding permissions. In the `Quota (Quota) management` list, view and copy the corresponding QuotaName, and specify `"mc.quota" = "QuotaName"`. At this time, you can choose VPC/public network to access MaxCompute, but the bandwidth through VPC is guaranteed, and the public network bandwidth resources are small.

2. If you use pay-as-you-go, please refer to the Using `open storage (pay-as-you-go)` section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) to enable the open storage (Storage API) switch and grant permissions to the users corresponding to Ak and SK. At this time, your `mc.quota` is the default value `pay-as-you-go`, and you do not need to specify this value additionally. At this time, you can only use VPC to access MaxCompute.

3. Through steps 1/2, you already know how to access MaxCompute. Now, you need to configure `mc.endpoint` according to the `Endpoints in different regions` in [Alibaba Cloud Endpoints document](https://www.alibabacloud.com/help/en/maxcompute/user-guide/endpoints). Users that access through VPC need to configure `mc.endpoint` according to the `VPC endpoint` column in the `Endpoints in different regions(VPC)`. Users that access through the public network can choose the `Classic network endpoint` column in the `Endpoints in different regions(internal network for connecting cloud products)` or the `Public endpoint` column in the `Endpoints in different regions(Internet)` to configure `mc.endpoint`.


