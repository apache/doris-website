---
{
    "title": "使用 PrepareStatement 加速高并发点查",
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

为了减少 SQL 解析和表达式计算的开销，Doris 在 FE 端提供了与 MySQL 协议完全兼容的`PreparedStatement`特性（目前只支持主键点查），通过 PrepareStatement 加速高并发点查，详情请参考 [高并发点查](../../../query-acceleration/high-concurrent-point-query#使用-preparedstatement)。