---
{
    "title": "audit_log",
    "language": "zh-CN",
    "description": "存储审计日志"
}
---

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
| shuffle_send_rows             | bigint  | 语句执行过程中，节点间传输的行数。3.0 版本开始支持。|
| shuffle_send_bytes            | bigint    | 语句执行过程中，节点间传输的数据量。3.0 版本开始支持。 |
| scan_bytes_from_local_storage   | bigint    | 从本地磁盘读取的数据量。3.0 版本开始支持。 |
| scan_bytes_from_remote_storage  | bigint    | 从远端存储读取的数据量。3.0 版本开始支持。 |
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
| stmt              				| text         | 语句文本                               |

## 说明

- `client_ip`：如果使用了代理服务，并且没有开启 IP 透传功能，则这里可能记录的是代理服务的 IP 而不是真实客户端 IP。
- `state`：`EOF` 表示查询执行成功。`OK` 表示 DDL、DML 语句执行成功。`ERR` 表示语句执行失败。
- `scan_bytes`： 表示BE 处理的数据的大小，它表示从磁盘读取的数据解压后的大小，包括了从Doris 内部的page cache 中读取的数据，它真实的反应了一个查询需要处理的数据量。 所以这个值并不等于 `scan_bytes_from_local_storage` + `scan_bytes_from_remote_storage`。
- `scan_rows`：表示查询执行过程中扫描的行数，由于Doris 是列存数据库，所以会首先扫描有谓词过滤的列，根据过滤后的结果再扫描其他列，所以不同的列扫描的行数实际不一样，实际是谓词列扫描的行数比非谓词列多，而这个值反应了查询执行过程中谓词列扫描的行数。
- `scan_bytes_from_local_storage`：表示从本地磁盘读取的数据大小，这是压缩前的数据，如果需要读取的数据位于Doris的 page cache 中，则不会被统计在内，但是如果位于操作系统的page cache内，则会被统计在内。
- `scan_bytes_from_remote_storage`：表示从远端存储读取的数据大小，这是压缩前的数据。

