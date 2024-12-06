---
{
    "title": "REBALANCE DISK",
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

该语句用于尝试优先均衡指定的 BE 磁盘数据

语法：

    ```
    ADMIN REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];
    ```

说明：

    1. 该语句表示让系统尝试优先均衡指定 BE 的磁盘数据，不受限于集群是否均衡。
    2. 默认的 timeout 是 24 小时。超时意味着系统将不再优先均衡指定的 BE 磁盘数据。需要重新使用该命令设置。
	3. 指定 BE 的磁盘数据均衡后，该 BE 的优先级将会失效。

## 示例

1. 尝试优先均衡集群内的所有 BE

    ```
    ADMIN REBALANCE DISK;
    ```

2. 尝试优先均衡指定 BE

    ```
    ADMIN REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
    ```

## 关键词

    ADMIN,REBALANCE,DISK

## 最佳实践

