---
{
    "title": "Statistics",
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

Doris supports automatic or manual statistics collection for tables from external data sources like Hive, Iceberg and Paimon. The accuracy of statistics directly determines the accuracy of cost estimation, which is crucial for selecting the optimal query plan. This can significantly improve query execution efficiency, especially in complex query scenarios.

For details, please refer to the [Statistics](../query-acceleration/optimization-technology-principle/statistics#外表收集) document in the "External Table Collection" section.
