---
{
    "title": "backend_metrics",
    "language": "zh-CN"
}
---

## 概述

用于查看 Backend 节点的指标



## 所属数据库


`information_schema`


## 表信息

| 列名              | 类型         | 说明                               |
| :---------------- | :----------- | :------------------------------- |
| BE_ID             | varchar(256) | Backend 实例的 ID                 |
| BE_IP             | varchar(256) | Backend 实例的 IP 地址             |
| METRIC_NAME       | varchar(256) | 指标名称                           |
| METRIC_TYPE       | varchar(256) | 指标类型                           |
| METRIC_VALUE      | varchar(256) | 指标值                             |
| TAG               | varchar(256) | 指标标签                           |
