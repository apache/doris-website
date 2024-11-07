---
{
    "title": "Optimizing Join with Colocate Group",
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

Defining colocate group is an efficient way of Join, through which the execution engine can effectively avoid the transmission overhead of input data in Join operations (for an introduction to Colocate Group, see [JOIN](../../../query-data/join))

However, in some use cases, even if a Colocate Group has been successfully established, the execution plan may still show as Shuffle Join or Bucket Shuffle Join. This situation typically occurs when Doris is in the process of data organization, for instance, it may be migrating tablets between BE to ensure a more balanced distribution of data across multiple BE.

You can view the Colocate Group status using the command `show proc "/colocation_group"`; as shown in the figure below: If `IsStable` appears as false, it indicates that there are unavailable `colocation_group` instances.

![Optimizing Join with Colocate Group](/images/use-colocate-group.jpg)