---
{
    "title": "存算分离使用场景",
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

## 使用场景

### 实时分析

10s~分钟级实时场景，支持复杂的sql查询，维表关联，但无法达到毫秒级延迟

### 即席分析

宽表查询，多表关联的即席分析，可以做到秒级别响应，如果应对高并发需要资源较多

### 高并发点查

单节点支持几万并发，限制是限于key值范围查询条件

### 日志搜索

对文本搜索，字段精确匹配，范围查询等，对于按照权重查询的场景暂不支持

### 数据湖分析

应对即席分析，无法保证查询效率，相比trino/presto有3~5倍提升

### 数据加工

支持轻量级的数据ETL，但对于超过可用内存的大查询，还需要算子落盘能力，这部分功能属于试验阶段

### 数据科学场景

在数据科学场景中，一些数据建模、机器学习、数据科学的软件和程序库比如 pandas, sas, numpy, scikit-learn, pytorch 等需要高速读取和加载数据

## 存算分离架构注意事项

1. 理想架构
	1. 元数据统一，既可以简化 k8s 部署，也减少数据孤岛
	2. 元数据能够支持足够的规模
2. 彻底解决存算一体的痛点
	1. doris 两阶段导致的数据不能强一致保障
	2. 规模变大，写入在 FE 有瓶颈
3. 成本
	1. 小写使用 groupcommit 避免对象 put 操作产生过高成本，小表 bucket 调小，较大表配合 single tablet load
	2. 数据回收进展可以监控
4. 查询延迟稳定性
	1. 延迟敏感应用通过 TTL 管理 Cache，确保查询延迟的稳定
	2. 读写分离使用 Cache 预热避免查询命中冷数据
5. 数据可靠性
	1. 反向数据删除方案容易误删，不容易测试充分
	2. 正向数据删除简单易测试充分

