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

It is possible to set parameters to create dynamic partitions on the corresponding disk types, while supporting data migration between (HDD, SSD) disk types based on the data's hot and cold characteristics, which can accelerate the read and write performance of Doris.

- `dynamic_partition.hot_partition_num`

  Doris supports data migration between different disk types (HDD, SSD) based on the cold/hot characteristics of the data, which can accelerate read and write performance. Users can set partition parameters to create dynamic partitions on the corresponding disk types.

  For the 'dynamic_partition' parameter, please refer to [data-partition](../../table-design/data-partition.md#dynamic-partitioning)."



  :::tip

  If there is no SSD disk path under the storage path, configuring this parameter will cause dynamic partition creation to fail.

  :::

  `hot_partition_num` is all partitions in the previous n days and in the future.

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

- `dynamic_partition.storage_medium`

  
  :::info Note
  This parameteres is supported since Doris version 1.2.3
  :::

  Specifies the default storage medium for the created dynamic partition. HDD is the default, SSD can be selected.

  Note that when set to SSD, the `hot_partition_num` property will no longer take effect, all partitions will default to SSD storage media and the cooldown time will be 9999-12-31 23:59:59.