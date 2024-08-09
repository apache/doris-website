---
{
    "title": "SSD 和 HDD 层级存储",
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

Doris支持（HDD、SSD）磁盘类型间数据根据数据冷热特性进行迁移，加速读写性能。用户可以设置分区参数将动态分区建在相应be的磁盘类型上

其中dynamic_partition参数可以参考[分区分桶-动态分区](../../table-design/data-partition.md#动态分区)

`dynamic_partition.hot_partition_num`

:::caution
  注意，dynamic_partition.storage_medium必须设置为HDD，否则hot_partition_num将不会生效
:::

  指定最新的多少个分区为热分区。对于热分区，系统会自动设置其 `storage_medium` 参数为 SSD，并且设置 `storage_cooldown_time`。

  注意：若存储路径下没有 SSD 磁盘路径，配置该参数会导致动态分区创建失败。

  `hot_partition_num` 是往前 n 天和未来所有分区

  我们举例说明。假设今天是 2021-05-20，按天分区，动态分区的属性设置为：hot_partition_num=2, end=3, start=-3。则系统会自动创建以下分区，并且设置 `storage_medium` 和 `storage_cooldown_time` 参数：

  ```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
  ```


-   `dynamic_partition.storage_medium`

指定创建的动态分区的默认存储介质。默认是 HDD，可选择 SSD。

:::caution
  注意，当设置为 SSD 时，`hot_partition_num` 属性将不再生效，所有分区将默认为 SSD 存储介质并且冷却时间为 9999-12-31 23:59:59。
:::