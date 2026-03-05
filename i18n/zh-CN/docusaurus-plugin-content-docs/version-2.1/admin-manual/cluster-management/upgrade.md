---
{
    "title": "集群升级",
    "language": "zh-CN",
    "description": "Doris 提供了滚动升级的能力，在升级过程中逐步对 FE 与 BE 节点进行升级，减少停机时间，确保在升级过程中系统能够保持正常运行。"
}
---

Doris 提供了滚动升级的能力，在升级过程中逐步对 FE 与 BE 节点进行升级，减少停机时间，确保在升级过程中系统能够保持正常运行。

## 版本兼容性说明

Doris 版本号由三维组成，第一位表示重大里程碑版本，第二位表示功能版本，第三位表示 bug 修复，不在三位版本中发布新的功能。如 Doris 2.1.3 版本，其中 2 表示第 2 个里程碑版本，1 表示该里程碑下的功能版本，3 表示该功能版本下的第三个 bug fix 版本。

在版本升级时，遵循以下规则：

* 三位版本：二位版本相同时，可以跨三位版本升级，如 2.1.3 版本可以直接升级到 2.1.7 版本；

* 二位版本及一位版本：不建议跨二位版本升级，考虑到兼容性问题，建议按照二位版本号依次升级，如 3.0 版本升级到 3.3 版本，需要按照 3.0 -> 3.1 -> 3.2 -> 3.3 的执行路径升级。

详细版本说明可以参考[版本规则](https://doris.apache.org/zh-CN/community/release-versioning)。

## 升级注意事项

在升级时，需要注意以下事项：

* 版本间行为变更：在升级前需要查看 Release Note 中的行为变更以确定版本间的兼容性。

* 对集群内的任务添加重试机制：升级时节点需要依次重启，对于查询任务，Stream Load 导入作业需要添加重试机制，否则会导致任务失败；在 Routine Load 作业，通过 flink-doris-connector 或 spark-doris-connector 导入的作业，已经在代码中实现了重试机制，无需添加重试逻辑；

* 关闭副本修复与均衡功能：在升级时需要关闭副本修复与均衡功能，无论升级是否成功，升级后都需要再次打开副本修复与均衡功能。


## 元数据兼容性测试

:::caution 注意

在生产环境中，建议保持 3 个以上的 FE 做高可用配置。如果只有 1 个 FE 节点，需要先做元数据兼容性测试后，再进行升级操作。元数据兼容非常重要，如果因为元数据不兼容导致的升级失败，能会导致数据丢失。建议每次升级前都进行元数据兼容性测试，在做元数据兼容性测试时，注意以下几点：

* 建议在开发机或 BE 节点上做元数据兼容性测试，尽量避免在 FE 节点上做兼容性测试

* 如果只能在 FE 节点上做兼容性测试，建议选择非 Master 节点，并停止原有 FE 进程
:::

在升级前，建议进行元数据兼容性测试，防止升级过程中元数据不兼容导致的升级失败。

1. 备份元数据信息：

   在开始升级工作前，需要备份 Master FE 节点的元数据信息。

   通过 `show frontends` 中 `IsMaster` 列可以判断 Master FE 节点。在备份 FE 元信息时，无需停止 FE 节点，可以直接热备份元信息。默认情况下，FE 元数据在 `fe/doris-meta` 目录下，可以通过 `fe.conf` 文件中 `meta_dir` 参数确定元数据目录。

2. 修改测试用的 FE 的配置文件 fe.conf

   ```bash
   vi ${DORIS_NEW_HOME}/conf/fe.conf
   ```

   修改以下端口信息，将所有端口设置为与线上不同，同时修改 clusterID 参数：
   ```
   ...
   ## modify port
   http_port = 18030
   rpc_port = 19020
   query_port = 19030
   arrow_flight_sql_port = 19040
   edit_log_port = 19010

   ## modify clusterIP
   clusterId=<a_new_clusterID, such as 123456>
   ...
   ```

3. 将备份的 Master FE 元数据拷贝到新的兼容性测试环境中

   ```bash
   cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
   ```

4. 将拷贝的元数据目文件中的 VERSION 文件中的 cluster\_id 修改为新的 cluster ID，如在上例中修改为 123456：

   ```bash
   vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
   clusterId=123456
   ```

5. 在测试环境中启动 FE 进程
 
   ```bash
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
   ```

   在 2.0.2 之前的版本，需要在 fe.conf 文件中加入 `metadata_failure_recovery` 后在启动 FE 进程：
   ```bash
   echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon 
   ```

6. 验证 FE 启动成功，通过 mysql 命令链接当前 FE，如上文中使用 query port 为 19030：
 
   ```bash
   mysql -uroot -P19030 -h127.0.0.1
   ```

## 升级步骤

升级过程具体流程如下：

1. 关闭副本修复与均衡功能

2. 升级 BE 节点

3. 升级 FE 节点

4. 打开副本修复与均衡功能

升级过程中，要遵循先升级 BE、在升级 FE 的原则。在升级 FE 时，先升级 Observer FE 与 Follower FE 节点，再升级 Master FE 节点。

:::caution 注意

Doris 只需要升级 FE 目录下的 `/bin` 和 `/lib` 以及 BE 目录下的 `/bin` 和 `/lib`

在 2.0.2 及之后的版本，FE 和 BE 部署路径下新增了 `custom_lib/` 目录（如没有可以手动创建）。`custom_lib/` 目录用于存放一些用户自定义的第三方 jar 包，如 `hadoop-lzo-*.jar`，`orai18n.jar` 等。这个目录在升级时不需要替换。

:::

### 第 1 步：关闭副本修复与均衡功能

在升级过程中会有节点重启，可能会触发不必要的集群均衡和副本修复逻辑，先通过以下命令关闭：

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

### 第 2 步：升级 BE 节点

:::info 备注：

为了保证您的数据安全，请使用 3 副本来存储您的数据，以避免升级误操作或失败导致的数据丢失问题。
:::
1. 在多副本的集群中，可以选择一台 BE 节点停止进程，进行灰度升级：

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
   ```

2. 重命名 BE 目录下的 `/bin`，`/lib` 目录：

   ```bash
   mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
   mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
   ```

3. 复制新版本的 `/bin`，`/lib` 目录到原 BE 目录下：

   ```bash
   cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
   cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
   ```

4. 启动该 BE 节点：

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
   ```

5. 连接集群，查看该节点信息：

   ```sql
   show backends\G
   ```

   若该 BE 节点 `alive` 状态为 `true`，且 `Version` 值为新版本，则该节点升级成功。

### 第 3 步：升级 FE 节点

1. 多个 FE 节点情况下，选择一个非 Master 节点进行升级，先停止运行：

   ```bash
   sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
   ```

2. 重命名 FE 目录下的 `/bin`，`/lib`，`/mysql_ssl_default_certificate` 目录：

   ```bash
   mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
   mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
   mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
   ```

3. 复制新版本的 `/bin`，`/lib`，`/mysql_ssl_default_certificate` 目录到原 FE 目录下：

   ```bash
   cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
   cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
   cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
   ```

4. 启动该 FE 节点：

   ```sql
   sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
   ```

5. 连接集群，查看该节点信息：

   ```sql
   show frontends\G
   ```

   若该 FE 节点 `alive` 状态为 `true`，且 `Version` 值为新版本，则该节点升级成功。

6. 依次完成其他 FE 节点升级，最后完成 Master 节点的升级

### 第 4 步：打开副本修复与均衡功能

升级完成，并且所有 BE 节点状态变为 `Alive` 后，打开集群副本修复和均衡功能：

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

