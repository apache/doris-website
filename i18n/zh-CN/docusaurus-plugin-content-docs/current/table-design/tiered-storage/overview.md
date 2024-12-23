---
{
    "title": "分层存储",
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

为了帮助用户节省存储成本，Doris 针对冷数据提供了灵活的选择。

| **冷数据选择**          | **适用条件**                                                                 | **特性**                                                                                                           |
|--------------------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| **存算分离**   | 用户具备部署存算分离的条件                                                   | - 数据以单副本完全存储在对象存储中<br>- 通过本地缓存加速热数据访问<br>- 存储与计算资源独立扩展，显著降低存储成本        |
| **本地分层**   | 存算一体模式下，用户希望进一步优化本地存储资源                               | - 支持将冷数据从 SSD 冷却到 HDD<br>- 充分利用本地存储层级特性，节省高性能存储成本                                       |
| **远程分层**   | 存算一体模式下，使用廉价的对象存储或者 HDFS 进一步降低成本                           | - 冷数据以单副本形式保存到对象存储或者 HDFS中<br>- 热数据继续使用本地存储<br>- 不能对一个表和本地分层混合使用            |

通过上述模式，Doris 能够灵活适配用户的部署条件，实现查询效率与存储成本的平衡。
