---
{
    "title": "audit_log",
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

## 概述

存储审计日志

## 所属数据库


`__internal_schema`


## 表信息

| 列名                         | 类型         | 说明                                   |
| :-------------------------- | :----------- | :------------------------------------- |
| query_id          				| varchar(48)  | Query 的 ID。                            |
| time              				| datetime(3)  | 查询发生的时间。                         |
| client_ip         				| varchar(128) | 发送查询的客户端 IP                   |
| user              				| varchar(128) | 用户                                   |
| catalog           				| varchar(128) | 语句执行时的当前 Catalog               |
| db                				| varchar(128) | 语句执行时的当前 Database              |
| state             				| varchar(128) | 语句执行状态                           |
| error_code        				| int          | 错误码                                 |
| error_message     				| text         | 错误信息                               |
| query_time        				| bigint       | 语句执行时间。单位为毫秒。                |
| scan_bytes        				| bigint       | 扫描的数据量。                           |
| scan_rows         				| bigint       | 扫描行数                               |
| return_rows       				| bigint       | 返回的行数                             |
| shuffleSendRows             | bigint  | 语句执行过程中，节点间传输的行数。3.0 版本开始支持。|
| shuffleSendBytes            | bigint    | 语句执行过程中，节点间传输的数据量。3.0 版本开始支持。 |
| scanBytesFromLocalStorage   | bigint    | 从本地磁盘读取的数据量。3.0 版本开始支持。 |
| scanBytesFromRemoteStorage  | bigint    | 从远端存储读取的数据量。3.0 版本开始支持。 |
| stmt_id           				| bigint       | 语句 ID                                |
| stmt_type                   | string    | 语句类型。3.0 版本开始支持。 |
| is_query          				| tinyint      | 是否是查询                             |
| is_nereids                  | booean    | 是否使用了新优化器 |
| frontend_ip       				| varchar(128) | 连接的 Frontend 的 IP                  |
| cpu_time_ms       				| bigint       | 语句执行消耗 Backend 的累计 CPU 毫秒数 |
| sql_hash          				| varchar(128) | 语句的 Hash 值                         |
| sql_digest        				| varchar(128) | 语句的签名                             |
| peak_memory_bytes 				| bigint       | 语句执行所占用的 Backend 内存的峰值    |
| workload_group    				| text         | 语句执行所使用的 Workload Group        |
| compute_group	  				| string    | 存算分离模式下，执行语句所使用的计算组。3.0 版本开始支持。|
| trace_id                    | string    | 执行语句时设置的 Trace ID |
| stmt              				| text         | 语句文本                               |

## 说明

- `client_ip`：如果使用了代理服务，并且没有开启 IP 透传功能，则这里可能记录的是代理服务的 IP 而不是真实客户端 IP。
- `state`：`EOF` 表示查询执行成功。`OK` 表示 DDL、DML语句执行成功。`ERR` 表示语句执行失败。

