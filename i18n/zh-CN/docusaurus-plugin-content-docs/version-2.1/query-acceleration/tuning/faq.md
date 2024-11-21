---
{
    "title": "常见调优参数",
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



| 参数                       | 说明                        | 默认值 | 使用场景                                                     |
| -------------------------- | --------------------------- | ------ | ------------------------------------------------------------ |
| enable_nereids_planner     | 是否打开新优化器            | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true  |
| enable_nereids_dml         | 是否启用新优化器的 DML 支持 | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true  |
| parallel_pipeline_task_num | Pipeline 并行度             | 0      | 低版本升级等场景，此值为之前设置的固定值；升级后，可设置为 0，表示由系统自适应策略决定并行度 |
| runtime_filter_mode        | Runtime Filter 类型         | GLOBAL | 低版本升级等场景，此值为 NONE，表示不启用 Runtime Filter；升级后，可设置为 GLOBAL，表示默认启用 Runtime Filter |

