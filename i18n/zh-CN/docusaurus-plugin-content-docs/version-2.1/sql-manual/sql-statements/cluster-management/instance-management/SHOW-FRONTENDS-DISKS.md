---
{
    "title": "SHOW FRONTENDS DISKS",
    "language": "zh-CN",
    "description": "该语句用于查看 FE 节点的重要目录如：元数据、日志、审计日志、临时目录对应的磁盘信息"
}
---

## 描述

该语句用于查看 FE 节点的重要目录如：元数据、日志、审计日志、临时目录对应的磁盘信息

## 语法

```sql
SHOW FRONTENDS DISKS;
```

## 返回值

| 列名                 | 说明                                              |
|--------------------|-------------------------------------------------|
| Name               | 该 FE 节点在 bdbje 中的名称                             |
| Host               | 该 FE 节点的 IP                                     |
| DirType        | 要展示的目录类型，分别有四种类型：meta、log、audit-log、temp、deploy |
| Dir           | 要展示的目录类型的目录                                     |
| FileSystem          | 要展示的目录类型所在的 linux 系统的文件系统                       |
| Capacity            | 文件系统的容量                                         |
| Used | 文件系统已用大小                                        |
| Available               | 文件系统剩余容量                                        |
| UseRate           | 文件系统使用容量占比                                      |
| MountOn          | 文件系统挂载目录                                        |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限                     | 对象 | 说明 |
|------------------------|----|----|
| ADMIN_PRIV 或 NODE_PRIV |    |    |

## 注意事项

如果需要对查询结果进行进一步的过滤，可以使用表值函数[frontends_disks()](../../../sql-functions/table-valued-functions/frontends_disks.md)。`SHOW FRONTENDS DISKS` 与下面语句等价：

```sql
SELECT * FROM FRONTENDS_DISKS();
```

## 示例

```sql
SHOW FRONTENDS DISKS; 
```

```text
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| Name                                    | Host        | DirType   | Dir                             | Filesystem | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | meta      | /home/disk/output/fe/doris-meta | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | log       | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | audit-log | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | temp      | /home/disk/output/fe/temp_dir   | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | deploy    | /home/disk/output/fe            | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
```
