---
{
    "title": "Common Operations FAQ",
    "language": "en",
    "description": "Apache Doris operations FAQ and troubleshooting guide. Answers common questions about FE/BE node management, log analysis, configuration optimization, version upgrades, storage medium configuration, load balancing and other practical operation scenarios to help quickly locate and resolve Doris cluster operation issues."
}
---

This document is used to record common operations issues encountered when using Doris. It will be updated from time to time.

**The BE binary file name `doris_be` mentioned in this document was `palo_be` in previous versions.**

### Q1. Why are there always some tablets remaining when decommissioning a BE node through DECOMMISSION?

During the decommission process, by viewing the `tabletNum` of the decommissioned node through `show backends`, you will observe that the `tabletNum` count is decreasing, indicating that data shards are being migrated away from this node. When the count reaches 0, the system will automatically delete this node. However, in some cases, the `tabletNum` stops changing after dropping to a certain value. This usually may be due to the following two reasons:

1.  These tablets belong to tables, partitions, or materialized views that have just been deleted. Newly deleted objects are retained in the recycle bin. The decommission logic does not process these shards. You can modify the FE configuration parameter `catalog_trash_expire_second` to change the retention time of objects in the recycle bin. When objects are deleted from the recycle bin, these tablets will be processed.

2.  The migration tasks for these tablets have encountered problems. At this point, you need to use `show proc "/cluster_balance"` to view the specific task errors.

For the above situations, you can first use `show proc "/cluster_health/tablet_health";` to check if there are any unhealthy shards in the cluster. If it is 0, you can directly delete this BE through the `drop backend` statement. Otherwise, you still need to specifically check the replica status of unhealthy shards.

### Q2. How should priority_networks be configured?

`priority_networks` is a configuration parameter for both FE and BE. This parameter is mainly used to help the system select the correct network card IP as its own IP. It is recommended to explicitly set this parameter in any case to prevent issues with incorrect IP selection caused by adding new network cards to machines later.

The value of `priority_networks` is expressed in CIDR format. It is divided into two parts: the first part is the IP address in dotted decimal notation, and the second part is a prefix length. For example, `10.168.1.0/8` will match all `10.xx.xx.xx` IP addresses, while `10.168.1.0/16` will match all `10.168.xx.xx` IP addresses.

The reason for using CIDR format instead of directly specifying a specific IP is to ensure that all nodes can use a unified configuration value. For example, if there are two nodes: `10.168.10.1` and `10.168.10.2`, we can use `10.168.10.0/24` as the value for `priority_networks`.

### Q3. What are Master, Follower, and Observer in FE?

First, it should be clear that FE has only two roles: Follower and Observer. Master is just one FE selected from a group of Follower nodes. Master can be seen as a special type of Follower. So when we are asked how many FEs a cluster has and what roles they are, the correct answer should of course be the number of all FE nodes, as well as the number of Follower roles and Observer roles.

All FE nodes with the Follower role will form a selectable group, similar to the group concept in the Paxos consensus protocol. A Follower will be elected as Master within the group. When the Master fails, a new Follower will be automatically selected as Master. Observers do not participate in elections, so Observers will not become Masters.

A metadata log needs to be successfully written to the majority of Follower nodes to be considered successful. For example, with 3 FEs, 2 successful writes are required. This is also why the number of Follower roles needs to be odd.

The Observer role, as the word implies, only acts as an observer to synchronize successfully written metadata logs and provides metadata read services. It does not participate in the majority write logic.

Under normal circumstances, you can deploy 1 Follower + 2 Observers or 3 Followers + N Observers. The former is simpler for operations and maintenance, and almost never encounters complex errors caused by consistency protocols between Followers (most enterprises use this approach). The latter can ensure high availability of metadata writes. If it is a high-concurrency query scenario, you can appropriately increase the number of Observers.

### Q4. Why doesn't data balance to new disks when new disks are added to nodes?

The current Doris balancing strategy is node-based. That is, it judges cluster load based on the overall load indicators of nodes (number of shards and total disk utilization). And it migrates data shards from high-load nodes to low-load nodes. If each node adds a disk, from the overall node perspective, the load has not changed, so the balancing logic cannot be triggered.

In addition, Doris currently does not support balancing operations between disks within a single node. Therefore, after adding new disks, data will not be balanced to the new disks.

However, when data is migrated between nodes, Doris will consider disk factors. For example, when a shard is migrated from node A to node B, it will preferentially select disks with lower disk space utilization in node B.

Here we provide 3 ways to solve this problem:

1.  Rebuild new tables

    Create a new table through the `create table like` statement, and then use `insert into select` to synchronize data from the old table to the new table. Because when creating a new table, the data shards of the new table will be distributed on the new disks, so the data will also be written to the new disks. This method is suitable for situations with small amounts of data (within tens of GB).

2.  Through the Decommission command

    The `decommission` command is used to safely decommission a BE node. This command will first migrate the data shards on that node to other nodes, and then delete the node. As mentioned earlier, during data migration, disks with lower disk utilization will be prioritized, so this method can "force" data to migrate to disks on other nodes. After the data migration is complete, we then `cancel` this `decommission` operation, so that the data will be balanced back to this node. When we execute the above steps for all BE nodes, the data will be evenly distributed on all disks of all nodes.

    Note that before executing the `decommission` command, first execute the following command to avoid the node being deleted after decommissioning is complete.

    `admin set frontend config("drop_backend_after_decommission" = "false");`

3.  Manually migrate data using the API

    Doris provides an [HTTP API](https://doris.apache.org/docs/dev/admin-manual/be/tablet-migration) that can manually specify data shards on one disk to be migrated to another disk.

### Q5. How to correctly read FE/BE logs?

In many cases, we need to troubleshoot problems through logs. Here we explain the format and viewing method of FE/BE logs.

1.  FE

    FE logs mainly include:

    -   `fe.log`: Main log. Includes all content except `fe.out`.

    -   `fe.warn.log`: A subset of the main log, recording only WARN and ERROR level logs.

    -   `fe.out`: Standard/error output logs (stdout and stderr).

    -   `fe.audit.log`: Audit log, recording all SQL requests received by this FE.

    A typical FE log entry is as follows:

    ```text
    2021-09-16 23:13:22,502 INFO (tablet scheduler|43) [BeLoadRebalancer.selectAlternativeTabletsForCluster():85] cluster is balance: default_cluster with medium: HDD. skip
    ```

    -   `2021-09-16 23:13:22,502`: Log timestamp.

    -   `INFO`: Log level, default is INFO.

    -   `(tablet scheduler|43)`: Thread name and thread id. Through the thread id, you can view the context information of this thread, which is convenient for troubleshooting what happened on this thread.

    -   `BeLoadRebalancer.selectAlternativeTabletsForCluster():85`: Class name, method name, and code line number.

    -   `cluster is balance xxx`: Log content.

    Under normal circumstances, we mainly view the `fe.log` log. In special cases, some logs may be output to `fe.out`.

2.  BE

    BE logs mainly include:

    -   `be.INFO`: Main log. This is actually a soft link, linking to the latest `be.INFO.xxxx`.

    -   `be.WARNING`: A subset of the main log, recording only WARN and FATAL level logs. This is actually a soft link, linking to the latest `be.WARN.xxxx`.

    -   `be.out`: Standard/error output logs (stdout and stderr).

    A typical BE log entry is as follows:

    ```text
    I0916 23:21:22.038795 28087 task_worker_pool.cpp:1594] finish report TASK. master host: 10.10.10.10, port: 9222
    ```

    -   `I0916 23:21:22.038795`: Log level and date time. Capital letter I represents INFO, W represents WARN, F represents FATAL.

    -   `28087`: Thread id. Through the thread id, you can view the context information of this thread, which is convenient for troubleshooting what happened on this thread.

    -   `task_worker_pool.cpp:1594`: Code file and line number.

    -   `finish report TASK xxx`: Log content.

    Under normal circumstances, we mainly view the `be.INFO` log. In special cases, such as BE crashes, you need to view `be.out`.

### Q6. How to troubleshoot when FE/BE nodes go down?

1.  BE

    The BE process is a C/C++ process, which may crash due to some program bugs (memory out of bounds, illegal address access, etc.) or Out Of Memory (OOM). At this time, we can view the error cause through the following steps:

    1.  Check `be.out`

        The BE process is implemented to print the current error stack to `be.out` when the program exits due to abnormal conditions (note it is `be.out`, not `be.INFO` or `be.WARNING`). Through the error stack, you can usually roughly obtain the location where the program went wrong.

        Note that if an error stack appears in `be.out`, it is usually due to a program bug, and ordinary users may not be able to solve it by themselves. Welcome to seek help in the WeChat group, GitHub Discussion, or dev mailing list, and post the corresponding error stack for quick troubleshooting.

    2.  dmesg

        If there is no stack information in `be.out`, it is most likely because it was forcibly killed by the system due to OOM. At this time, you can use the command `dmesg -T` to view the Linux system log. If there is a log similar to `Memory cgroup out of memory: Kill process 7187 (doris_be) score 1007 or sacrifice child` at the end, it means it was caused by OOM.

        Memory issues may be caused by multiple aspects, such as large queries, imports, compaction, etc. Doris is also constantly optimizing memory usage. Welcome to seek help in the WeChat group, GitHub Discussion, or dev mailing list.

    3.  Check if there are logs starting with F in `be.INFO`

        Logs starting with F are Fatal logs. For example, `F0916` represents the Fatal log on September 16. Fatal logs usually indicate program assertion errors, and assertion errors will directly cause the process to exit (indicating that the program has a bug). Welcome to seek help in the WeChat group, GitHub Discussion, or dev mailing list.

2.  FE

    FE is a Java process, and its robustness is better than C/C++ programs. Usually, the reason for FE crashing may be OOM (Out-of-Memory) or metadata write failure. These errors usually have error stacks in `fe.log` or `fe.out`. Further troubleshooting is needed based on the error stack information.

### Q7. Regarding the configuration of data directories SSD and HDD, sometimes you may encounter the error `Failed to find enough host with storage medium and tag` when creating tables

Doris supports configuring multiple storage paths for a BE node. Under normal circumstances, configuring one storage path per disk is sufficient. At the same time, Doris supports specifying the storage medium attributes of paths, such as SSD or HDD. SSD represents high-speed storage devices, and HDD represents low-speed storage devices.

If the cluster has only one type of medium, such as all HDD or all SSD, the best practice is not to explicitly specify the medium attribute in `be.conf`. If you encounter the above error `Failed to find enough host with storage medium and tag`, it is generally because only the SSD medium is configured in `be.conf`, while `properties {"storage_medium" = "hdd"}` is explicitly specified during table creation; similarly, if only the HDD medium is configured in `be.conf`, while `properties {"storage_medium" = "ssd"}` is explicitly specified during table creation, the above error will also occur. The solution is to modify the `properties` parameter of table creation to match the configuration; or remove the explicit configuration of SSD/HDD in `be.conf`.

By specifying the storage medium attributes of paths, we can use Doris's hot and cold data partition storage function to store hot data on SSD at the partition level, while cold data will be automatically transferred to HDD.

It should be noted that Doris will not automatically sense the actual storage medium type of the disk where the storage path is located. This type needs to be explicitly indicated by the user in the path configuration. For example, the path `/path/to/data1.SSD` indicates that this path is an SSD storage medium. And `data1.SSD` is the actual directory name. Doris determines the storage medium type based on the `.SSD` suffix after the directory name, not the actual storage medium type. That is to say, users can specify any path as an SSD storage medium, and Doris only recognizes the directory suffix and does not judge whether the storage medium matches. If no suffix is written, it defaults to HDD.

In other words, `.HDD` and `.SSD` are only used to identify the "relative" "low-speed" and "high-speed" distinction of storage directories, and do not identify the actual storage medium type. So if there is no medium difference among the storage paths on the BE node, there is no need to fill in the suffix.

### Q8. When using Nginx to implement Web UI load balancing with multiple FEs, unable to log in

Doris can deploy multiple FEs. When accessing the Web UI, if Nginx is used for load balancing, the Session problem will cause constant prompts to log in again. This problem is actually a Session sharing problem. Nginx provides a centralized Session sharing solution. Here we use the `ip_hash` technology in Nginx. `ip_hash` can direct requests from a certain IP to the same backend, so that a certain client under this IP and a certain backend can establish a stable Session. `ip_hash` is defined in the `upstream` configuration:

```text
upstream  doris.com {
   server    172.22.197.238:8030 weight=3;
   server    172.22.197.239:8030 weight=4;
   server    172.22.197.240:8030 weight=4;
   ip_hash;
}
```

The complete Nginx example configuration is as follows:

```text
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
    #include /etc/nginx/custom/*.conf;
    upstream  doris.com {
      server    172.22.197.238:8030 weight=3;
      server    172.22.197.239:8030 weight=4;
      server    172.22.197.240:8030 weight=4;
      ip_hash;
    }

    server {
        listen       80;
        server_name  gaia-pro-bigdata-fe02;
        if ($request_uri ~ _load) {
           return 307 http://$host$request_uri ;
        }

        location / {
            proxy_pass http://doris.com;
            proxy_redirect default;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
 }
```

### Q9. FE startup fails, fe.log keeps scrolling "wait catalog to be ready. FE type UNKNOWN"

This problem usually has two reasons:

1.  The local IP obtained when FE started this time is inconsistent with the last startup, usually because `priority_network` was not set correctly, causing FE to match the wrong IP address when starting. You need to modify `priority_network` and restart FE.

2.  Most Follower FE nodes in the cluster have not started. For example, there are 3 Followers, but only one has started. At this time, you need to start at least one more FE so that the FE electable group can elect a Master to provide services.

If the above situations cannot be resolved, you can recover according to the [Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md) in the Doris official documentation.

### Q10. Lost connection to MySQL server at 'reading initial communication packet', system error: 0

If the following problem occurs when using the MySQL client to connect to Doris, it is usually because the JDK version used when compiling FE is different from the JDK version used when running FE. Note that when compiling with the Docker compilation image, the default JDK version is OpenJDK 11, which can be switched to OpenJDK 8 through commands (see the compilation documentation for details).

### Q11. recoveryTracker should overlap or follow on disk last VLSN of 4,422,880 recoveryFirst= 4,422,882 UNEXPECTED_STATE_FATAL

Sometimes when restarting FE, the above error will occur (usually only in the case of multiple Followers). And the two values in the error differ by 2, causing FE startup to fail.

This is a bug in BDB JE that has not been resolved yet. If you encounter this situation, you can only recover the metadata through the fault recovery operation in the [Metadata Operations Documentation](../admin-manual/trouble-shooting/metadata-operation.md).

### Q12. Doris compilation and installation JDK version incompatibility issue

When compiling Doris using Docker yourself, after the compilation is completed and installed, when starting FE, the exception information `java.lang.Suchmethoderror: java.nio.ByteBuffer.limit(I)Ljava/nio/ByteBuffer;` appears. This is because the default in Docker is JDK 11. If your installation environment uses JDK 8, you need to switch the JDK environment in Docker to JDK 8. For specific switching methods, refer to the [Compilation Documentation](https://doris.apache.org/community/source-install/compilation-with-docker).

### Q13. Starting FE locally or starting unit tests reports error Cannot find external parser table action_table.dat

Execute the following command:

```bash
cd fe && mvn clean install -DskipTests
```

If the same error still occurs, manually execute the following command:

```bash
cp fe-core/target/generated-sources/cup/org/apache/doris/analysis/action_table.dat fe-core/target/classes/org/apache/doris/analysis
```

### Q15. After upgrading to version 1.2, BE fails to start with NoClassDefFoundError issue

:::note
Java UDF dependency error is supported starting from Doris version 1.2
:::

If the following Java `NoClassDefFoundError` error occurs when starting BE after upgrading:

```text
Exception in thread "main" java.lang.NoClassDefFoundError: org/apache/doris/udf/JniUtil
Caused by: java.lang.ClassNotFoundException: org.apache.doris.udf.JniUtil
```

You need to download the Java UDF function dependency package `apache-doris-java-udf-jar-with-dependencies-1.2.0` from the official website, place it in the `lib` directory under the BE installation directory, and then restart BE.

### Q16. After upgrading to version 1.2, BE startup shows Failed to initialize JNI issue

:::note
Java environment issue is supported starting from Doris version 1.2
:::

If the following `Failed to initialize JNI` error occurs when starting BE after upgrading:

```text
Failed to initialize JNI: Failed to find the library libjvm.so.
```

You need to set the `JAVA_HOME` environment variable in the system, or set the `JAVA_HOME` variable in `be.conf`, and then restart the BE node.

### Q17. Docker: backend fails to start
This may be due to the CPU not supporting AVX2, check the backend logs with `docker logs -f be`.
If the CPU does not support AVX2, the `apache/doris:1.2.2-be-x86_64-noavx2` image must be used,
instead of `apache/doris:1.2.2-be-x86_64`.
Note that the image version number will change over time, check [Dockerhub](https://registry.hub.docker.com/r/apache/doris/tags?page=1&name=avx2) for the most recent version.
