---
{
    "title": "CANCEL REBALANCE DISK",
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




## 描述

该语句用于取消优先均衡 BE 的磁盘

语法：

ADMIN CANCEL REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];

说明：

1. 该语句仅表示系统不再优先均衡指定 BE 的磁盘数据。系统仍会以默认调度方式均衡 BE 的磁盘数据。

## 示例

    1. 取消集群所有 BE 的优先磁盘均衡

        ADMIN CANCEL REBALANCE DISK;

    2. 取消指定 BE 的优先磁盘均衡

        ADMIN CANCEL REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");

## 关键词

    ADMIN,CANCEL,REBALANCE,DISK

## 最佳实践

