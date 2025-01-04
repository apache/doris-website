---
{
    "title": "Tiered Storage Overview",
    "language": "en-US"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

To help users reduce storage costs, Doris provides flexible options for cold data management.

| **Cold Data Options**       | **Applicable Conditions**                                                          | **Features**                                                                                                           |
|-----------------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| **Compute-Storage Separation** | Users have the capability to deploy a compute-storage separation setup             | - Data is stored as a single replica in object storage<br>- Local caching accelerates hot data access<br>- Independent scaling of storage and compute resources significantly reduces costs |
| **Local Tiering**           | In the compute-storage integrated mode, users want to further optimize local storage resources | - Supports cooling cold data from SSD to HDD<br>- Fully utilizes the tiered characteristics of local storage to save high-performance storage costs         |
| **Remote Tiering**          | In the compute-storage integrated mode, users want to reduce costs using affordable object storage or HDFS | - Cold data is stored as a single replica in object storage or HDFS<br>- Hot data continues to use local storage<br>- Cannot be combined with local tiering for the same table |

With the above options, Doris can flexibly adapt to different deployment scenarios, achieving a balance between query efficiency and storage cost.
