---
{
    "title": "FRONTENDS_DISKS",
    "language": "zh-CN"
}
---

## `frontends_disks`

### Name

frontends_disks

## 描述

表函数，生成 frontends_disks 临时表，可以查看当前 doris 集群中的 FE 节点的磁盘信息。

该函数用于 from 子句中。

## 语法
`frontends_disks()`

frontends_disks() 表结构：
```
mysql> desc function frontends_disks();
+-------------+------+------+-------+---------+-------+
| Field       | Type | Null | Key   | Default | Extra |
+-------------+------+------+-------+---------+-------+
| Name        | TEXT | No   | false | NULL    | NONE  |
| Host        | TEXT | No   | false | NULL    | NONE  |
| DirType     | TEXT | No   | false | NULL    | NONE  |
| Dir         | TEXT | No   | false | NULL    | NONE  |
| Filesystem  | TEXT | No   | false | NULL    | NONE  |
| Capacity    | TEXT | No   | false | NULL    | NONE  |
| Used        | TEXT | No   | false | NULL    | NONE  |
| Available   | TEXT | No   | false | NULL    | NONE  |
| UseRate     | TEXT | No   | false | NULL    | NONE  |
| MountOn     | TEXT | No   | false | NULL    | NONE  |
+-------------+------+------+-------+---------+-------+
11 rows in set (0.14 sec)
```

`frontends_disks()` tvf 展示出来的信息基本与 `show frontends disks` 语句展示出的信息一致，但是 `frontends_disks()` tvf 的各个字段类型更加明确，且可以利用 tvf 生成的表去做过滤、join 等操作。

对 `frontends_disks()` tvf 信息展示进行了鉴权，与 `show frontends disks` 行为保持一致，要求用户具有 ADMIN/OPERATOR 权限。

## 举例
```sql
mysql> select * from frontends_disk()\G
*************************** 1. row ***************************
       Name: fe_fe1d5bd9_d1e5_4ccc_9b03_ca79b95c9941
       Host: 172.XX.XX.1
    DirType: log
        Dir: /data/doris/fe-github/log
 Filesystem: /dev/sdc5
   Capacity: 366G
       Used: 119G
  Available: 228G
    UseRate: 35%
    MountOn: /data
......    
12 row in set (0.03 sec)
```

### keywords

    frontends_disks