---
{
"title": "SSD and HDD tiered storage",
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

You can set parameters for dynamic partitions across different disk types, facilitating data migration from SSDs to HDDs based on the parameters. This strategy improves read and write performance in Doris while lowering costs.

By configuring `dynamic_partition.hot_partition_num` and `dynamic_partition.storage_medium`, you can use SSD and HDD tiered storage. For specific usage, please refer to [Data Partitioning - Dynamic Partitioning](../../table-design/data-partitioning/dynamic-partitioning).

*`dynamic_partition.hot_partition_num`*

  :::tip

  If the storage path does not include an SSD disk path, configuring this parameter will result in the failure of dynamic partition creation.

  :::

  `hot_partition_num` indicates that the current partition and the previous hot_partition_num - 1 partitions, along with all future partitions, will be stored on SSD media.

  Let us give an example. Suppose today is 2021-05-20, partition by day, and the properties of dynamic partition are set to: hot_partition_num=2, end=3, start=-3. Then the system will automatically create the following partitions, and set the `storage_medium` and `storage_cooldown_time` properties:

  ```sql
  p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
  ```

*`dynamic_partition.storage_medium`*

  
  :::info Note
  This parameteres is supported since Doris version 1.2.3
  :::

  Specifies the final storage medium for the newly created dynamic partition. HDD is the default, but SSD can be selected.

  Note that when set to SSD, the `hot_partition_num` property will no longer take effect, all partitions will default to SSD storage media and the cooldown time will be 9999-12-31 23:59:59.