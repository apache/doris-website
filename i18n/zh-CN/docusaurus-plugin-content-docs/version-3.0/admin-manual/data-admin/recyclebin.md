---
{
    "title": "从回收站恢复",
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

## 数据生命周期

1. 用户执行命令`drop database/table/partition`之后，Doris 会把删除的数据库/表/分区放到回收站，可以使用命令`recover`来恢复整个数据库/表/分区的所有数据从回收站里恢复，把它们从不可见状态，重新变回可见。
2. BE 侧删除一个 tablet 时，默认会把 tablet 的数据放进 BE 回收站。因为某些误操作或者线上 bug，导致 BE 上部分 tablet 被删除，通过运维工具把这些 tablet 从 BE 回收站中抢救回来。

上面两个，前者针对的是数据库/表/分区在 FE 上已经不可见，且数据库/表/分区的元数据尚保留在 FE 的回收站里。而后者针对的是数据库/表/分区在 FE 上可见，但部分 BE tablet 数据被删除。

下面分别阐述这两种恢复。

## 从 FE 回收站恢复

Doris 为了避免误操作造成的灾难，支持对误删除的数据库/表/分区进行数据恢复，在 drop table 或者 drop database 或者 drop partition 之后，Doris 不会立刻对数据进行物理删除，而是在 FE 的 catalog 回收站中保留一段时间（默认 1 天，可通过 fe.conf 中`catalog_trash_expire_second`参数配置），管理员可以通过 RECOVER 命令对误删除的数据进行恢复。

**注意，如果是使用`drop force`进行删除的，则是直接删除，无法再恢复。**

### 查看可恢复数据

查看 FE 上哪些数据可恢复

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "name" | LIKE "name_matcher"] ]
```

这里 name 可以是数据库/表/分区名。


关于该命令使用的更多详细语法及最佳实践，请参阅 [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN.md) 命令手册，你也可以在 MySql 客户端命令行下输入 `help SHOW CATALOG RECYCLE BIN ` 获取更多帮助信息。

### 开始数据恢复

1.恢复名为 example_db 的 database

```sql
RECOVER DATABASE example_db;
```

2.恢复名为 example_tbl 的 table

```sql
RECOVER TABLE example_db.example_tbl;
```

3.恢复表 example_tbl 中名为 p1 的 partition

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

执行`RECOVER`命令之后，原来的数据将恢复可见。

关于 RECOVER 使用的更多详细语法及最佳实践，请参阅 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER.md) 命令手册，你也可以在 MySql 客户端命令行下输入 `help RECOVER` 获取更多帮助信息。

## 从 BE 回收站恢复 Tablet

### 从 BE 回收站中恢复数据

用户在使用 Doris 的过程中，可能会发生因为一些误操作或者线上 bug，导致一些有效的 tablet 被删除（包括元数据和数据）。

为了防止在这些异常情况出现数据丢失，Doris 提供了回收站机制，来保护用户数据。

用户删除的 tablet 数据在 BE 端不会被直接删除，会被放在回收站中存储一段时间，在一段时间之后会有定时清理机制将过期的数据删除。默认情况下，在磁盘空间占用不超过 81%（BE 配置`config.storage_flood_stage_usage_percent` * 0.9 * 100%）时，BE 回收站中的数据最长保留 1 天（见 BE 配置`config.trash_file_expire_time_sec`）。

BE 回收站中的数据包括：tablet 的 data 文件 (.dat)，tablet 的索引文件 (.idx) 和 tablet 的元数据文件 (.hdr)。数据将会存放在如下格式的路径：

```
/root_path/trash/time_label/tablet_id/schema_hash/
```

* `root_path`：对应 BE 节点的某个数据根目录。
* `trash`：回收站的目录。
* `time_label`：时间标签，为了回收站中数据目录的唯一性，同时记录数据时间，使用时间标签作为子目录。

当用户发现线上的数据被误删除，需要从回收站中恢复被删除的 tablet，需要用到这个 tablet 数据恢复功能。

BE 提供 http 接口和 `restore_tablet_tool.sh` 脚本实现这个功能，支持单 tablet 操作（single mode）和批量操作模式（batch mode）。

* 在 single mode 下，支持单个 tablet 的数据恢复。
* 在 batch mode 下，支持批量 tablet 的数据恢复。

另外，用户可以使用命令 `show trash`查看 BE 中的 trash 数据，可以使用命令`admin clean trash`来清楚 BE 的 trash 数据。

#### 操作

##### single mode

1. http 请求方式

    BE 中提供单个 tablet 数据恢复的 http 接口，接口如下：
    
    ```
    curl -X POST "http://be_host:be_webserver_port/api/restore_tablet?tablet_id=11111\&schema_hash=12345"
    ```
    
    成功的结果如下：
    
    ```
    {"status": "Success", "msg": "OK"}
    ```
    
    失败的话，会返回相应的失败原因，一种可能的结果如下：
    
    ```
    {"status": "Failed", "msg": "create link path failed"}
    ```

2. 脚本方式

    `restore_tablet_tool.sh` 可用来实现单 tablet 数据恢复的功能。
    
    ```
    sh tools/restore_tablet_tool.sh -b "http://127.0.0.1:8040" -t 12345 -s 11111
    sh tools/restore_tablet_tool.sh --backend "http://127.0.0.1:8040" --tablet_id 12345 --schema_hash 11111
    ```

##### batch mode

批量恢复模式用于实现恢复多个 tablet 数据的功能。

使用的时候需要预先将恢复的 tablet id 和 schema hash 按照逗号分隔的格式放在一个文件中，一个 tablet 一行。

格式如下：

```
12345,11111
12346,11111
12347,11111
```

然后如下的命令进行恢复 (假设文件名为：`tablets.txt`)：

```
sh restore_tablet_tool.sh -b "http://127.0.0.1:8040" -f tablets.txt
sh restore_tablet_tool.sh --backend "http://127.0.0.1:8040" --file tablets.txt
```

### 修复缺失或损坏的 Tablet

在某些极特殊情况下，如代码 BUG、或人为误操作等，可能导致部分分片的全部副本都丢失。这种情况下，数据已经实质性的丢失。但是在某些场景下，业务依然希望能够在即使有数据丢失的情况下，保证查询正常不报错，降低用户层的感知程度。此时，我们可以通过使用空白 Tablet 填充丢失副本的功能，来保证查询能够正常执行。

**注：该操作仅用于规避查询因无法找到可查询副本导致报错的问题，无法恢复已经实质性丢失的数据**

1. 查看 Master FE 日志 `fe.log`

    如果出现数据丢失的情况，则日志中会有类似如下日志：
    
    ```
    backend [10001] invalid situation. tablet[20000] has few replica[1], replica num setting is [3]
    ```

    这个日志表示，Tablet 20000 的所有副本已损坏或丢失。
    
2. 使用空白副本填补缺失副本

    当确认数据已经无法恢复后，可以通过执行以下命令，生成空白副本。
    
    ```
    ADMIN SET FRONTEND CONFIG ("recover_with_empty_tablet" = "true");
    ```

    * 注：可以先通过 `SHOW FRONTEND CONFIG;` 命令查看当前版本是否支持该参数。

3. 设置完成几分钟后，应该会在 Master FE 日志 `fe.log` 中看到如下日志：

    ```
    tablet 20000 has only one replica 20001 on backend 10001 and it is lost. create an empty replica to recover it.
    ```

    该日志表示系统已经创建了一个空白 Tablet 用于填补缺失副本。
    
4. 通过查询来判断是否已经修复成功。

5. 全部修复成功后，通过以下命令关闭 `recover_with_empty_tablet` 参数：

    ```
    ADMIN SET FRONTEND CONFIG ("recover_with_empty_tablet" = "false");
    ```

