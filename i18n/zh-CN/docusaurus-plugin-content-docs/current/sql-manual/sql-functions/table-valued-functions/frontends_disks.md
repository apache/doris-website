---
{
    "title": "FRONTENDS_DISKS",
    "language": "zh-CN",
    "description": "frontendsdisks 表函数会生成一个临时表，允许查看当前 Doris 集群中 FE 节点的磁盘信息。其结果基本与 show frontends disks 语句展示出的信息一致，但是 frontendsdisks() 的各个字段类型更加明确，"
}
---

## 描述

`frontends_disks` 表函数会生成一个临时表，允许查看当前 Doris 集群中 FE 节点的磁盘信息。其结果基本与 `show frontends disks` 语句展示出的信息一致，但是 `frontends_disks()` 的各个字段类型更加明确，且可以利用 tvf 生成的表去做过滤、join 等操作

该函数可用于 `FROM` 子句中。


## 语法
```sql
FRONTENDS_DISKS()
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| SELECT_PRIV | internal.information_schema | 所有用户默认有该 db 的权限 |

## 返回值
查看 frontends_disks() 函数的描述字段
```sql
desc function frontends_disks();
```
```text
+------------+------+------+-------+---------+-------+
| Field      | Type | Null | Key   | Default | Extra |
+------------+------+------+-------+---------+-------+
| Name       | text | No   | false | NULL    | NONE  |
| Host       | text | No   | false | NULL    | NONE  |
| DirType    | text | No   | false | NULL    | NONE  |
| Dir        | text | No   | false | NULL    | NONE  |
| Filesystem | text | No   | false | NULL    | NONE  |
| Capacity   | text | No   | false | NULL    | NONE  |
| Used       | text | No   | false | NULL    | NONE  |
| Available  | text | No   | false | NULL    | NONE  |
| UseRate    | text | No   | false | NULL    | NONE  |
| MountOn    | text | No   | false | NULL    | NONE  |
+------------+------+------+-------+---------+-------+
```

字段含义如下：

| 字段名称          | 类型      | 说明                                                     |
|-------------------|-----------|--------------------------------------------------------|
| `Name`            | TEXT      | 当前 frontend 的名称，用于唯一标识该 frontend。                      |
| `Host`            | TEXT      | Frontend 所在的主机地址。                                      |
| `DirType`         | TEXT      | 磁盘目录的类型，例如 `meta`、`log`、`audit-log`、`temp` 和 `deploy`。 |
| `Dir`             | TEXT      | 目录路径，表示该磁盘目录在服务器上的实际位置。                                |
| `Filesystem`      | TEXT      | 磁盘的文件系统类型。                                             |
| `Capacity`        | TEXT      | 磁盘的总容量。                                                |
| `Used`            | TEXT      | 已使用的磁盘空间。                                              |
| `Available`       | TEXT      | 可用的磁盘空间。                                               |
| `UseRate`         | TEXT      | 磁盘的使用率，表示已用空间与总空间的百分比。                                 |
| `MountOn`         | TEXT      | 磁盘挂载点，即磁盘在系统中的挂载位置。                                    |


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