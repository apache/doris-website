---
{
"title": "Workload Group最佳实践",
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

## 操作说明
### 机器环境
实践使用 1FE 与 3BE 的环境，配置如下：

| Host     | Role | CPU    |Memory     |Disk     |
| ---------- | --------- |-----|-----|-----|
| r10  | FE  | 8 |  32G | HDD |
| r11   | BE  | 8 | 32G | HDD |
|  r12  |   BE |8 | 32G  | HDD |
|  r13 |  BE   | 8 | 32G | HDD  |

### 实践方案
#### 压测方案
测试数据集使用 ClickBench 标准测试集，使用 clickbench-29 语句，通过 mysqlslap 50 并发压测：
```
mysqlslap --concurrency=10 --iterations=50  \
  --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
  --query="ckbench-29.sql" --verbose
```

在以上命令中，使用 10 并发，压测 50 轮 SQL Clickbench-29 。Clickbench-29 SQL 如下：
```
SELECT     REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\\1') AS k, 
           AVG(length(Referer)) AS l, 
           COUNT(*) AS c, 
           MIN(Referer) 
FROM       hits 
WHERE      Referer <> '' 
GROUP BY   k 
HAVING     COUNT(*) > 100000 
ORDER BY   l DESC 
LIMIT      25;
```

#### 监控方案
1. 内存监控方案
   通过 ps 命令，可以获取 BE 节点内存使用情况：
```
ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
```

2. CPU 监控方案
   通过 top 命令，可以获取 BE 节点 CPU 使用情况：
```
 top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
```

3. 本地 IO 监控方案
   使用 pidstat 命令，可以获取 BE 进程读写 IO 使用情况：
```
 pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{print "doris_be     kB_rd/s="$3"    kB_wr/s="$4}'

```

4. 资源组使用监控方案
   通过 Doris 内 workload_group_resource_usage  表可以查看 workload 使用情况
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb  
from     information_schema.workload_group_resource_usage usage, 
         information_schema.workload_groups wlg 
where    wlg.id = usage.workload_group_id;
```

## 配置内存硬限
### 实践演示方案
在进行内存硬限实践时，可以按照以下步骤进行对比：
1. 在没有创建资源组时，使用压测命令，观察压测前后内存使用变化
2. 创建资源组后，硬限内存，使用压测命令，观察压测前后内存使用变化

### 实践步骤
未创建资源组时内存使用情况
1. 确保当前集群内，只有 normal 资源组
```
select name from information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+
```

2. 监控空负载时内存使用情况
```
[root@r11 ~]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=17.6%/5.52GB

[root@r12 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=12.2%/3.82GB

[root@r13 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=14.0%/4.39GB
```

3. 执行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控压测过程中内存使用情况
   在操作系统中可以监控到内存从空负载 4GB 增长到 14GB 左右。
```
[root@r11 ~]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=43.9%/13.75GB

[root@r12 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=43.1%/13.50GB

[root@r13 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=52.5%/16.42GB
```

由于没有创建 Workload Group 进行资源隔离，会默认使用 normal 资源组。
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb   
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg  
where    wlg.id = usage.workload_group_id;
+--------+--------------------+
| name   | wg_mem_used_gb     |
+--------+--------------------+
| normal | 4.9592821300029755 |
+--------+--------------------+
```

#### 创建资源组后内存使用情况
1. 监控空负载时内存使用情况
```
[root@r11 ~]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=17.9%/5.60GB


[root@r12 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=12.4%/3.89GB


[root@r13 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=14.2%/4.46GB
```

2. 创建 Workload Group 对内存进行硬限
```
## 创建资源组 g2，规划内存使用限制 20%
create workload group g2 properties('memory_limit'='20%');

## 开启资源硬限
alter workload group g2 properties('enable_memory_overcommit'='false');

## 绑定当前用户的默认资源组为 g2
set property for 'root' 'default_workload_group' = 'g2';
```

3. 运行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```
由于对内存使用了硬限，可能会导致 mysqlslap 压测由于内存不足终止，报以下错误：
```
[CANCELLED]GC wg for hard limit, wg id:12007, name:g2, used:5.69 GB, limit:5.63 GB
```

4. 监控内存资源硬限后内存使用情况
```
[root@r11 ~]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=35.2%/11.03GB

[root@r12 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=29.8%/9.33GB

[root@r13 ~]#  ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=32.0%/10.00GB
```

监控 g2 资源组下的内存使用情况：
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+--------------------+
| name   | wg_mem_used_gb     |
+--------+--------------------+
| g2     | 5.4703264236450195 |
| normal |                  0 |
+--------+--------------------+

```

![wg_mem_hard_limit1](/images/workload-management/wg_mem_hard_limit1.png)
![wg_mem_hard_limit2](/images/workload-management/wg_mem_hard_limit2.png)
![wg_mem_hard_limit3](/images/workload-management/wg_mem_hard_limit3.png)
![wg_mem_hard_limit4](/images/workload-management/wg_mem_hard_limit4.png)

## 配置内存软限
### 实践演示方案
在进行内存软限实践时，可以按照以下步骤进行对比：
1. 在未创建资源组时，使用压测命令，观察压测前后内存使用变化；
2. 在创建资源组后，软限内存，使用压测命令，观察压测前后内存使用变化；
3. 创建多个租户与资源组，同时进行压测，产生资源竞争，观察资源争用后回收情况。

### 实践步骤
#### 未创建资源组时内存使用情况
1. 确保当前集群内，只有 normal 资源组
```
select name from information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+
```

2. 监控空负载时内存使用情况
```
[root@r11 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=5.2%/1.65GB

[root@r12 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=5.2%/1.64GB

[root@r13 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=5.3%/1.66GB

```

3. 执行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=500  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控压测过程中内存使用情况
```
[root@r11 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=70.2%/21.96GB

[root@r12 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=61.3%/19.19GB

[root@r13 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=65.7%/20.57GB
```
由于没有创建资源组进行资源隔离，会默认使用 normal 资源组。
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+--------------------+
| name   | wg_mem_used_gb     |
+--------+--------------------+
| normal | 13.077159613370895 |
+--------+--------------------+

```

#### 创建资源组后内存使用情况
1. 监控空负载时内存使用情况
```
[root@r11 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=3.3%/1.03GB

[root@r12 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=3.1%/0.99GB

[root@r13 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=3.0%/0.94GB

```

2. 创建 Workload 资源组进行资源管控
```
## 创建资源组 g2，规划内存使用限制 20%
create workload group g2 properties('memory_limit'='20%');

## 开启资源软限
alter workload group g2 properties('enable_memory_overcommit'='true');

## 绑定当前用户的默认资源组为 g2
set property 'default_workload_group' = 'g2';
```

3. 运行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控内存资源软限后内存使用情况
```
[root@r11 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=70.0%/21.90GB

[root@r12 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=67.1%/21.00GB

[root@r13 be]# ps -eo comm,%mem,rss | grep doris_be | awk '{ printf "%s  mem_usage=%s%%/%.2fGB\n", $1, $2, $3/1024/1024 }'
doris_be  mem_usage=68.4%/21.39GB

```
监控 g2 资源组下的内存使用情况：
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+--------------------+
| name   | wg_mem_used_gb     |
+--------+--------------------+
| g2     | 22.382209539413452 |
| normal |                  0 |
+--------+--------------------+
2 rows in set (6.78 sec)

```

#### 资源竞争时内存回收情况
1. 创建 test_wlg 租户，绑定 g3 资源组
```
## 创建新用户 test_wlg
create user test_wlg;

## 为 test_wlg 赋权
grant admin_priv on *.*.* to test_wlg;

## 创建 g3 资源组
create workload group g3 properties('memory_limit'='50%');

## 为 test_wlg 租户绑定 g3 资源组
set property for 'test_wlg' 'default_workload_group' = 'g3';
```

2. 使用 root 租户进行压测
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

3. 监控 root 用户默认资源组 g2 的内存使用情况
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | wg_mem_used_gb    |
+--------+-------------------+
| g3     |                 0 |
| g2     | 20.43520560860634 |
| normal |                 0 |
+--------+-------------------+
3 rows in set (0.07 sec)

```
![wg_mem_soft_limit1](/images/workload-management/wg_mem_soft_limit1.png)

4. 使用 test_wlg 租户同时压测
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=test_wlg \
>   --query="ckbench-29.sql" --verbose
```

5. 监控内存资源使用情况
在存在内存资源争用时，g2 资源组借用的资源会缓慢释放。
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+--------------------+
| name   | wg_mem_used_gb     |
+--------+--------------------+
| g3     |   11.9006786942482 |
| g2     | 2.4906590282917023 |
| normal |                  0 |
+--------+--------------------+

```

## 配置 CPU 硬限
### 实践演示方案
在进行 CPU 硬限实践是，可以按照以下步骤进行对比：
1. 在没有创建资源组是，使用压测命令，观察压测前后 CPU 使用变化
2. 在创建资源组后，硬限 CPU，使用压测命令，观察压测前后 CPU 使用变化

### 实践步骤
#### 未创建资源组时 CPU 使用情况
1. 确保当前集群内，只有 normal 资源组
```
select name from information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+

```

2. 监控空负载时 CPU 使用情况
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.2%

[root@r12 ~]#  top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.2%

[root@r13 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%
```

3. 执行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控压测过程中 CPU 使用情况
```
[root@r12 ~]#  top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=762.5%

[root@r13 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=762.5%

[root@r13 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=770.6%

```

#### 创建资源组后 CPU 使用情况
1. 监控空负载时 CPU 使用情况
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%

[root@r12 ~]#  top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.2%

[root@r13 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%

```

2. 创建 Workload Group 对 CPU 资源进行硬限
```
create workload group g2 properties('cpu_hard_limit'='10%');

admin set frontend config ("enable_cpu_hard_limit" = "true");

set property for 'root' 'default_workload_group' = 'g2';
```

3. 运行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控 CPU 硬限后 CPU 使用情况
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=56.2%

[root@r12 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=60.0%

[root@r13 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=66.7%

```

监控 g2 资源组 CPU 使用情况：
```
select   wlg.name, cpu_usage_percent 
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | cpu_usage_percent |
+--------+-------------------+
| normal |                 0 |
| g2     |              9.74 |
+--------+-------------------+

```

![wg_cpu_hard_limit1](/images/workload-management/wg_cpu_hard_limit1.png)
![wg_cpu_hard_limit2](/images/workload-management/wg_cpu_hard_limit2.png)
![wg_cpu_hard_limit3](/images/workload-management/wg_cpu_hard_limit3.png)

## 配置 CPU 软限

### 实践演示方案
在进行 CPU 软限实践时，可以按照以下步骤进行对比：
1. 在未创建资源组时，使用压测命令，观察压测前后 CPU 使用变化；
2. 在创建资源组后，软限 CPU，使用压测命令，挂差压测前后 CPU 使用变化；
3. 创建多个租户与资源组，同时进行压测，产生资源竞争，观察资源争用后回收情况。

### 实践步骤
#### 未创建资源组时 CPU 使用情况
1. 确保当前集群内只用 normal 资源组
```
 select name from information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+

```

2. 监控空负载时 CPU 使用情况
```
[root@r11 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%

[root@r12 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=8.6%

[root@r13 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=7.3%

```

3. 执行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=500  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控压测过程中 CPU 使用情况
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=787.5%

[root@r12 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=768.8%

[root@r13 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=800.0%
```

由于没有创建资源组进行资源隔离，会默认使用 normal 资源组：
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | cpu_usage_percent |
+--------+-------------------+
| normal |             92.81 |
+--------+-------------------+
```

### 创建资源组后 CPU 使用情况
1. 监控空负载时 CPU 使用情况
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%

[root@r12 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.2%

[root@r13 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=6.7%

```

2. 创建 Workload 资源组进行资源管控
由于 CPU 资源软限是相对值，需要调整每一个 CPU 软限的 cpu_share 值。下例中存在 normal 资源组与新创建的 g2 资源组。
```
create workload group g2 properties('cpu_share'='10');

admin set frontend config ("enable_cpu_hard_limit" = "false");

set property for 'root' 'default_workload_group' = 'g2';

alter workload group normal properties('cpu_share'='10');
```

3. 运行压测语句
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=500  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

4. 监控 CPU 资源软限后 CPU 使用情况
由于使用资源软限，其他资源组没有资源争用，租户借用其他资源组 CPU：
```
[root@r11 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=768.8%

[root@r12 ~]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=775.0%

[root@r13 storage]# top -n1 | grep doris_be | awk '{print "doris_be    cpu_usage="$9"%"}'
doris_be    cpu_usage=768.8%
``` 

监控 g2 资源组下的 CPU 使用情况：
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | cpu_usage_percent |
+--------+-------------------+
| g2     |             92.89 |
| normal |                 0 |
+--------+-------------------+

```

#### 资源竞争时 CPU 回收情况
1. 创建 test_wlg 租户，绑定 g3 资源组
```
## 创建新用户 test_wlg
create user test_wlg;

## 为 test_wlg 赋权
grant admin_priv on *.*.* to test_wlg;

## 创建 g3 资源组
create workload group g3 properties('cpu_share'='20');

## 为 test_wlg 租户绑定 g3 资源组
set property for 'test_wlg' 'default_workload_group' = 'g3';
```

2. 使用 root 租户进行压测
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=root \
>   --query="ckbench-29.sql" --verbose
```

3. 监控 root 用户默认资源组 g2 的 CPU 使用情况
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | cpu_usage_percent |
+--------+-------------------+
| g3     |                 0 |
| g2     |             93.69 |
| normal |                 0 |
+--------+-------------------+

```

4. 使用 test_wlg 租户同时压测
```
[root@r10 ~]# mysqlslap --concurrency=10 --iterations=50  \
>   --create-schema=clickbench --host=127.0.0.1 --port=9030 --user=test_wlg \
>   --query="ckbench-29.sql" --verbose
```

5. 监控 CPU 资源使用情况
```
select   wlg.name, usage.memory_usage_bytes / 1024/ 1024 / 1024 as wg_mem_used_gb
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | wg_mem_used_gb    |
+--------+-------------------+
| g3     |  5.08288961648941 |
| g2     | 9.455664187669754 |
| normal |                 0 |
+--------+-------------------+

```

## 管理本地 IO 
### 实践演示方案
在进行本地 IO 资源限制时，可以按照以下步骤进行对比：
1. 在没有创建资源组是，全表扫描，观察压测前后 IO 使用变化
2. 创建资源组后，限制本地 IO，全表扫描，观察压测前后 IO 使用变化
   在测试 IO 资源使用情况时，需要先关闭 BE 的 page cahce，同时要清空操作系统缓存。

### 实践步骤
#### 未创建资源组时本地 IO 使用情况
1. 确保只有 normal 资源组
```
select name from workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+
```

2. 关闭并清空缓存
```
## 清空所有 BE 节点操作系统缓存
[root@r11 ~]# sync; echo 3 > /proc/sys/vm/drop_caches
[root@r12 ~]# sync; echo 3 > /proc/sys/vm/drop_caches
[root@r13 ~]# sync; echo 3 > /proc/sys/vm/drop_caches

## 关闭集群 Page Cache
[root@r10 ~]# curl -X POST http://192.168.0.11:8040/api/update_config?disable_storage_page_cache=true\&persist=true
[root@r10 ~]# curl -X POST http://192.168.0.12:8040/api/update_config?disable_storage_page_cache=true\&persist=true
[root@r10 ~]# curl -X POST http://192.168.0.13:8040/api/update_config?disable_storage_page_cache=true\&persist=true
```

3. 监控空负载时资源使用情况
```
[root@r11 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

[root@r12 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

[root@r13 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

```

4. 压测全表扫描
```
set dry_run_query=true;
select * from clickbench.hits;

```

5. 监控压测过程中本地 IO 使用情况
```
[root@r11 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=28.40    MB_wr/s=0.01

[root@r12 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=27.41    MB_wr/s=0.00

[root@r13 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=22.86    MB_wr/s=0.00

```

查看 normal 资源组 IO 使用情况：

```
select   wlg.name, LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec 
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg
where    wlg.id = usage.workload_group_id;
+--------------------+
| mb_per_sec         |
+--------------------+
| 56.448036193847656 |
+--------------------+

```

不正确，多次出现只有某一个 be 有 io 扫描的问题

![io_test_1](/images/workload-management/io_test_1.png)
![io_test_2](/images/workload-management/io_test_2.png)
![io_test_3](/images/workload-management/io_test_3.png)
![io_test_4](/images/workload-management/io_test_4.png)

以下是第二次重新执行，清空 cache 了
![io_test_21](/images/workload-management/io_test_21.png)
![io_test_22](/images/workload-management/io_test_22.png)
![io_test_23](/images/workload-management/io_test_23.png)
![io_test_24](/images/workload-management/io_test_24.png)

#### 创建资源组后本地 IO 使用情况
1. 关闭并清空缓存
```
## 清空所有 BE 节点操作系统缓存
[root@r11 ~]# sync; echo 3 > /proc/sys/vm/drop_caches
[root@r12 ~]# sync; echo 3 > /proc/sys/vm/drop_caches
[root@r13 ~]# sync; echo 3 > /proc/sys/vm/drop_caches

## 关闭集群 Page Cache
[root@r10 ~]# curl -X POST http://192.168.0.11:8040/api/update_config?disable_storage_page_cache=true\&persist=true
[root@r10 ~]# curl -X POST http://192.168.0.12:8040/api/update_config?disable_storage_page_cache=true\&persist=true
[root@r10 ~]# curl -X POST http://192.168.0.13:8040/api/update_config?disable_storage_page_cache=true\&persist=true
```

2. 监控空负载时 IO 使用情况
```
[root@r11 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

[root@r12 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

[root@r13 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=0.00    MB_wr/s=0.00

```

3. 创建资源组对本地 IO 进行限制
```
create workload group g2 properties('read_bytes_per_second'='10485760');

set property for 'root' 'default_workload_group' = 'g2';
```

4. 执行压测语句
```
set dry_run_query=true;
select * from clickbench.hits;
```

5. 监控空负载时 IO 使用情况
```
[root@r11 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=6.30    MB_wr/s=0.00

[root@r12 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=2.55    MB_wr/s=0.00

[root@r13 ~]# pidstat -d -p $(pgrep doris_be) 1 1 | grep Average | awk '{printf "doris_be     MB_rd/s=%.2f    MB_wr/s=%.2f\n", $4/1024, $5/1024}'
doris_be     MB_rd/s=2.93    MB_wr/s=0.00
```

检测资源组 IO 使用情况：
```
select   wlg.name, LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec  
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg 
where    wlg.id = usage.workload_group_id;
+--------+-------------------+
| name   | mb_per_sec        |
+--------+-------------------+
| g2     | 9.884469985961914 |
| normal |                 0 |
+--------+-------------------+
```

## 管理远程 IO
### 实践演示方案
在进行远程 IO 管理时，可以按照以下步骤进行对比：
1. 在没有创建资源组是，全表扫描，观察压测前后 IO 使用变化
2. 创建资源组后，限制远程地 IO，全表扫描，观察压测前后 IO 使用变化
   以下例子中使用 S3 函数，在 Doris 内联邦查询对象存储中的 CSV 数据文件：

```
select * from s3(
    "uri" = "https://wty-huadong1-bucket.oss-cn-hangzhou-internal.aliyuncs.com/doris/ckbench/hits_split0",
    "s3.access_key"= "********",
    "s3.secret_key" = "********",
    "s3.endpoint" = "oss-cn-hangzhou-internal.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "format" = "csv",
    "use_path_style"="false" 
);
```

### 未创建资源组时远程 IO 使用情况
1. 确保只有 normal 资源组
```
select name from workload_groups;
+--------+
| name   |
+--------+
| normal |
+--------+
```

2. 监控空负载时远程 IO 使用情况
```
[root@r11 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 3.00

[root@r12 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 5.00

[root@r13 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 2.00

```

3. 运行压测语句
```
set dry_run_query = true;

select * from s3(
    "uri" = "https://wty-huadong1-bucket.oss-cn-hangzhou-internal.aliyuncs.com/doris/ckbench/hits_split0",
    "s3.access_key"= "********",
    "s3.secret_key" = "********",
    "s3.endpoint" = "oss-cn-hangzhou-internal.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "format" = "csv",
    "use_path_style"="false" 
);
```

4. 监控压测时远程 IO 使用情况
```
[root@r11 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 54220.00

[root@r12 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 80349.00

[root@r13 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 63368.00
```

查看 normal 资源组使用情况：

```
select   wlg.name, cast(usage.REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as mb_per_sec  
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg 
where    wlg.id = usage.workload_group_id;
+--------+------------+
| name   | mb_per_sec |
+--------+------------+
| normal |         92 |
+--------+------------+
```

#### 创建资源组后远程 IO 使用情况
1. 监控无负载时远程 IO 使用情况
```
[root@r11 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 3.00

[root@r12 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 5.00

[root@r13 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 2.00

```

2. 创建资源组对远程 IO 进行限制
```
create workload group g2 properties('remote_read_bytes_per_second'='10485760');

set property for 'root' 'default_workload_group' = 'g2';
```

3. 运行压测语句

4. 监控压测时远程 IO 使用资源
```
[root@r11 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 19261.00

[root@r12 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 16813.00

[root@r13 ~]# sar -n DEV 1 1 | grep -E "Average:\s+eth0" | awk '{print $2, "rxpck/s =", $3}'
eth0 rxpck/s = 18734.00

```

监控资源组使用情况：
```
select   wlg.name, cast(usage.REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as mb_per_sec  
from     information_schema.workload_group_resource_usage usage,
         information_schema.workload_groups wlg 
where    wlg.id = usage.workload_group_id;
+--------+------------+
| name   | mb_per_sec |
+--------+------------+
| g2     |         31 |
| normal |          0 |
+--------+------------+

```