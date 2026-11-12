---
{
    "title": "FRONTENDS_DISKS",
    "language": "en"
}
---

## `frontends`

### Name

frontends

### description

Table-Value-Function, generate a temporary table named `frontends_disks`. This tvf is used to view the information of FE nodes 's disks in the doris cluster.

This function is used in `FROM` clauses.

#### syntax

`frontends_disks()`

The table schema of `frontends_disks()` tvf：
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

The information displayed by the `frontends_disks` tvf is basically consistent with the information displayed by the `show frontends disks` statement. However, the types of each field in the `frontends_disks` tvf are more specific, and you can use the `frontends_disks` tvf to perform operations such as filtering and joining.

The information displayed by the `frontends_disks` tvf is authenticated, which is consistent with the behavior of `show frontends disks`, user must have ADMIN/OPERATOR privelege.

### example
```
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
