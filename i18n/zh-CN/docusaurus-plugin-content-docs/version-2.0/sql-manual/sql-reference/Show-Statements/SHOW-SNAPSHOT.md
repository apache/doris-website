---
{
    "title": "SHOW-SNAPSHOT",
    "language": "zh-CN"
}
---

## SHOW-SNAPSHOT

### Name

SHOW SNAPSHOT

## 描述

该语句用于查看仓库中已存在的备份。

语法：

```sql
SHOW SNAPSHOT ON `repo_name`
[WHERE SNAPSHOT = "snapshot" [AND TIMESTAMP = "backup_timestamp"]];
```

说明：
        1. 各列含义如下：
            Snapshot：   备份的名称
            Timestamp：  对应备份的时间版本
            Status：     如果备份正常，则显示 OK，否则显示错误信息
                2. 如果指定了 TIMESTAMP，则会额外显示如下信息：
            Database：   备份数据原属的数据库名称
            Details：    以 Json 的形式，展示整个备份的数据目录及文件结构

## 举例

1. 查看仓库 example_repo 中已有的备份
    
    ```sql
    SHOW SNAPSHOT ON example_repo;
    ```

2. 仅查看仓库 example_repo 中名称为 backup1 的备份：
    
    ```sql
    SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
    ```

3. 查看仓库 example_repo 中名称为 backup1 的备份，时间版本为 "2018-05-05-15-34-26" 的详细信息：
    
    ```sql
    SHOW SNAPSHOT ON example_repo
    WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
    ```

### Keywords

    SHOW, SNAPSHOT

### Best Practice

