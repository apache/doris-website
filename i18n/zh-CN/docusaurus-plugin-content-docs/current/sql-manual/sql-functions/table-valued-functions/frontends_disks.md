---
{
    "title": "FRONTENDS_DISK",
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

## 描述

`frontends_disks` 表函数会生成一个临时表，允许查看当前 Doris 集群中 FE 节点的磁盘信息。

该函数可用于 `FROM` 子句中。


## 语法
```sql
FRONTENDS_DISK()
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| ADMIN_PRIV       | 全局         |               |

## 返回值
- **Name**：FE 节点的名称。
- **Host**：FE 节点的 IP 地址。
- **DirType**：磁盘目录的类型（如 `meta`、`log` 等）。
- **Dir**：磁盘目录的路径。
- **Filesystem**：磁盘的文件系统类型。
- **Capacity**：磁盘的总容量。
- **Used**：磁盘已用空间。
- **Available**：磁盘可用空间。
- **UseRate**：磁盘使用率。
- **MountOn**：磁盘挂载路径。

## 注意事项

- `frontends_disks()` tvf 展示出来的信息基本与 `show frontends disks` 语句展示出的信息一致，但是 `frontends_disks()` tvf 的各个字段类型更加明确，且可以利用 tvf 生成的表去做过滤、join 等操作。
- 对 `frontends_disks()` tvf 信息展示进行了鉴权，与 `show frontends disks` 行为保持一致。

## 示例
查看 doris 集群 frontends 的磁盘信息
```sql
select * from frontends_disks();
```
```text
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| Name                                    | Host       | DirType   | Dir                                                       | Filesystem   | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | meta      | /mnt/disk2/doris/fe/doris-meta | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | log       | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | audit-log | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | temp      | /mnt/disk2/doris/fe/temp_dir   | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | deploy    | /mnt/disk2/doris/fe            | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
```