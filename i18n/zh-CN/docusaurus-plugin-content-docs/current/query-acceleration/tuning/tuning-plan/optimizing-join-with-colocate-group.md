---
{
    "title": "使用 Colocate Group 优化 Join",
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

Colocate Group 是一种高效的 Join 方式，使得执行引擎能有效地规避 Join 操作中数据的 shuffle 开销。相关原理介绍和案例参考详见 Colocate-join）

![](static/Y36kb9S7io25OZx5AKZcg4m3nVh.png)
