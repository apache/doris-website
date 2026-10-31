---
{
    "title": "workload_group_resource_usage",
    "language": "zh-CN",
    "description": "存储 Workload Group 资源的使用信息"
}
---

## 概述

存储 Workload Group 资源的使用信息

## 所属数据库


`information_schema`


## 表信息

| 列名                         | 类型   | 说明                   |
| :--------------------------- | :----- | :--------------------- |
| BE_ID                        | bigint | Backend 的 ID          |
| WORKLOAD_GROUP_ID            | bigint | Workload Group 的 ID   |
| MEMORY_USAGE_BYTES           | bigint | 内存占用字节数         |
| CPU_USAGE_PERCENT            | double | CPU 使用百分比         |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | 本地每秒扫描数据字节数 |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | 远端每秒扫描数据字节数 |