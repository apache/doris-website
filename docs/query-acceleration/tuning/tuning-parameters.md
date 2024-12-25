---
{
    "title": "Common Tuning Parameters",
    "language": "en"
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



| Parameter                  | Description                                         | Default Value | Usage Scenario                                               |
| -------------------------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| enable_nereids_planner     | Whether to enable the new optimizer                 | TRUE          | For scenarios such as low-version upgrades, initially set to false; after upgrading, it can be set to true |
| enable_nereids_dml         | Whether to enable DML support for the new optimizer | TRUE          | For scenarios such as low-version upgrades, initially set to false; after upgrading, it can be set to true |
| parallel_pipeline_task_num | Pipeline parallelism                                | 0             | For scenarios such as low-version upgrades, this value was previously set to a fixed value; after upgrading, it can be set to 0, indicating that the system's adaptive strategy determines the parallelism |
| runtime_filter_mode        | Runtime Filter type                                 | GLOBAL        | For scenarios such as low-version upgrades, this value was NONE, indicating that Runtime Filter was not enabled; after upgrading, it can be set to GLOBAL, indicating that Runtime Filter is enabled by default |