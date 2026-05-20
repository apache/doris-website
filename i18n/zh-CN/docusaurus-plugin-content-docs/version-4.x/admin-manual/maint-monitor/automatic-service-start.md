---
{
    "title": "服务自动拉起",
    "language": "zh-CN",
    "description": "介绍如何使用 Systemd 或 Supervisor 为 Doris FE/BE/Broker 配置开机自启与异常自动拉起，保障生产环境服务可用性。"
}
---

本文介绍如何为 Apache Doris 集群配置服务自动拉起，避免生产环境中因主机重启、进程异常退出等情况导致 FE、BE、Broker 服务长时间宕机而影响业务。Doris 提供两种常用方案：基于 **Systemd** 和基于 **Supervisor**，可根据运维习惯任选其一。

:::caution
配置自动拉起前，Doris 集群必须已完全部署完成，并能够手动正常启动 FE 与 BE。
:::

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 生产环境运维 / 高可用部署 -->

## 适用场景

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| 主机重启后自动拉起 Doris 服务 | Systemd | 与系统 init 深度集成，重启即生效 |
| 进程异常退出后自动重启 | Systemd / Supervisor | 两者均支持失败重启策略 |
| 多进程统一管理（FE/BE/Broker） | Supervisor | 支持集中化进程管理与日志聚合 |
| 需要最小化 sudo 权限的运维场景 | Systemd | 可通过 `visudo` 精细授权指定用户 |

## 方案对比

| 维度 | Systemd | Supervisor |
|------|---------|------------|
| 安装方式 | 系统自带（主流 Linux 发行版） | `yum` 或 `pip` 安装 |
| 启动管理 | `systemctl` | `supervisorctl` |
| 配置文件 | `/usr/lib/systemd/system/*.service` | `/etc/supervisord.d/*.ini` |
| 异常重启 | `Restart=on-failure` | `autorestart=true` |
| 日志输出 | journald + 应用日志 | Supervisor 接管 stdout/stderr |
| 适用场景 | 主流生产环境 | 多进程集中管理 |

## 前置条件

- Doris 集群已部署完成，可手动正常启动 FE/BE。
- 主机已安装 Java，并能获取到 `JAVA_HOME` 路径。
- 当前用户具备 root 权限或可通过 sudo 执行 systemctl/supervisord 相关命令。

---

## 方案一：使用 Systemd 配置自动拉起

Systemd 是主流 Linux 发行版自带的服务管理工具，适合大多数生产环境。完整参数说明可参考 [Systemd 官方文档](https://systemd.io/)。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 生产环境部署 / 开机自启配置 -->

### 1. 配置 sudo 权限（可选）

在使用 systemd 控制 Doris 服务时需要 sudo 权限。出于最小权限原则，可将 `doris-fe` 与 `doris-be` 的 systemctl 控制权限单独授予指定非 root 用户，通过 `visudo` 添加以下配置：

```text
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```

授权后，`doris` 用户即可通过 `sudo systemctl start/stop doris-fe|doris-be` 管理 Doris 服务，且无需密码。

### 2. 在配置文件中声明 JAVA_HOME

**目的**：systemd 启动时不会加载用户级 `~/.bashrc` 等环境变量，必须显式声明 `JAVA_HOME`，否则 `systemctl start` 将无法启动服务。

**命令**：

```shell
echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
```

**说明**：将 `your_java_home` 替换为实际 Java 安装路径（例如 `/usr/local/jdk8`）。

### 3. 准备 FE service 文件

从 Doris 仓库下载 [doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service)，内容如下：

```text
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris FE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/fe/bin/start_fe.sh --daemon 
ExecStop=/home/doris/fe/bin/stop_fe.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**注意事项**

- `ExecStart`、`ExecStop` 需根据实际部署的 FE 路径进行修改。
:::

### 4. 准备 BE service 文件

从 Doris 仓库下载 [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service)，内容如下：

```shell
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris BE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/be/bin/start_be.sh --daemon
ExecStop=/home/doris/be/bin/stop_be.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**注意事项**

- `ExecStart`、`ExecStop` 需根据实际部署的 BE 路径进行修改。
:::

### 5. service 文件关键参数说明

| 参数 | 作用 |
|------|------|
| `Type=forking` | 进程以 daemon 形式后台运行 |
| `LimitCORE=infinity` | 不限制 core dump 大小，便于故障排查 |
| `LimitNOFILE=200000` | 文件句柄上限，避免 `Too many open files` |
| `Restart=on-failure` | 进程异常退出时自动重启 |
| `RestartSec=30` | 异常退出后等待 30 秒再重启 |
| `StartLimitInterval=120` / `StartLimitBurst=3` | 120 秒内最多重启 3 次，避免雪崩 |
| `KillMode=none` | 停止服务时不强制 kill 子进程，由脚本处理 |
| `ExecStart` / `ExecStop` | Doris 启动/停止脚本路径 |

### 6. 部署 service 文件

将 `doris-fe.service`、`doris-be.service` 两个文件复制到 systemd 目录：

```shell
cp doris-fe.service doris-be.service /usr/lib/systemd/system/
```

### 7. 启用开机自启

新增或修改 service 配置后，需要重新加载 systemd：

```shell
systemctl daemon-reload
```

启用开机自启（实质是在 `/etc/systemd/system/multi-user.target.wants/` 下创建服务文件链接）：

```shell
systemctl enable doris-fe
systemctl enable doris-be
```

### 8. 启动服务

```shell
systemctl start doris-fe
systemctl start doris-be
```

通过 `systemctl status doris-fe` / `systemctl status doris-be` 可查看服务运行状态。

---

## 方案二：使用 Supervisor 配置自动拉起

Supervisor 是基于 Python 的进程管理工具，适合需要集中化进程管理和日志聚合的场景。完整参数说明可参考 [Supervisor 官方文档](http://supervisord.org/)。

Supervisor 可通过 `yum` 直接安装，也可通过 `pip` 手工安装。`pip` 安装流程较复杂，本文仅介绍 `yum` 方式，手工部署请参考 [Supervisor 安装文档](http://supervisord.org/installing.html)。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 生产环境部署 / 多进程集中管理 -->

### 1. 安装 Supervisor

```shell
yum install epel-release
yum install -y supervisor
```

### 2. 启动 Supervisor 服务并查看状态

```shell
systemctl enable supervisord    # 开机自启动
systemctl start supervisord     # 启动 supervisord 服务
systemctl status supervisord    # 查看 supervisord 服务状态
ps -ef | grep supervisord       # 查看是否存在 supervisord 进程
```

### 3. 配置 BE 进程管理

**目的**：让 Supervisor 接管 BE 进程的前台输出，因此需要去掉 BE 启动脚本末尾的 `&` 符号。

**修改启动脚本**：

```shell
vim /path/doris/be/bin/start_be.sh
```

将：

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
```

修改为：

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
```

**创建 BE 的 Supervisor 配置文件** `/etc/supervisord.d/doris-be.ini`：

```ini
[program:doris_be]
process_name=%(program_name)s
directory=/path/doris/be/be
command=sh /path/doris/be/bin/start_be.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr = true
#stdout_logfile_maxbytes = 20MB
#stdout_logfile_backups = 10
#stdout_logfile=/var/log/supervisor-palo_be.log
```

### 4. 配置 FE 进程管理

**目的**：与 BE 类似，需要去掉 FE 启动脚本末尾的 `&` 符号，让 Supervisor 接管前台进程。

**修改启动脚本**：

```shell
vim /path/doris/fe/bin/start_fe.sh
```

将：

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
```

修改为：

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
```

**创建 FE 的 Supervisor 配置文件** `/etc/supervisord.d/doris-fe.ini`：

```ini
[program:PaloFe]
environment = JAVA_HOME="/path/jdk8"
process_name=PaloFe
directory=/path/doris/fe
command=sh /path/doris/fe/bin/start_fe.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=10
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-PaloFe.log
```

### 5. 配置 Broker 进程管理（可选）

**目的**：若集群部署了 Broker，可一并交由 Supervisor 管理。同样需要去掉 Broker 启动脚本末尾的 `&` 符号。

**修改启动脚本**：

```shell
vim /path/apache_hdfs_broker/bin/start_broker.sh
```

将：

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
```

修改为：

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
```

**创建 Broker 的 Supervisor 配置文件** `/etc/supervisord.d/doris-broker.ini`：

```ini
[program:BrokerBootstrap]
environment = JAVA_HOME="/usr/local/java"
process_name=%(program_name)s
directory=/path/apache_hdfs_broker
command=sh /path/apache_hdfs_broker/bin/start_broker.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-BrokerBootstrap.log
```

### 6. Supervisor 配置参数说明

| 参数 | 作用 |
|------|------|
| `program:<name>` | 进程标识，supervisorctl 通过此名称管理 |
| `directory` | 进程工作目录 |
| `command` | 启动命令 |
| `autostart=true` | supervisord 启动时自动拉起该进程 |
| `autorestart=true` | 进程退出后自动重启 |
| `startretries=3` | 启动失败时最多重试 3 次 |
| `startsecs` | 启动后保持运行 N 秒才视为成功 |
| `stopasgroup` / `killasgroup` | 停止/杀死时作用于整个进程组 |
| `environment` | 注入环境变量，例如 `JAVA_HOME` |

### 7. 加载配置并启动服务

确认 Doris 服务当前为停止状态后，由 Supervisor 接管自动拉起：

```shell
supervisorctl reload    # 重新加载 Supervisor 中的所有配置文件
supervisorctl status    # 查看进程状态，确认 Doris 服务是否正常启动
```

**其他常用命令**：

```shell
supervisorctl start all          # 启动所有受管理的进程
supervisorctl stop doris-be      # 停止指定进程
```

---

## 常见问题

### Q: `systemctl start` 启动失败，日志提示找不到 `JAVA_HOME`，怎么处理？

systemd 不会加载用户级环境变量。在 `fe.conf` 与 `be.conf` 中显式追加 `JAVA_HOME=...`。

### Q: Supervisor 启动报错 `pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found`，怎么处理？

yum 安装的 Supervisor 仅支持 Python 2，但默认 `/usr/bin/python` 指向 Python 3。在已安装 Python 2 的前提下，将 `/usr/bin/supervisord` 与 `/usr/bin/supervisorctl` 文件首行 `#!/usr/bin/python` 改为 `#!/usr/bin/python2`。

### Q: BE 异常宕机后，`be.out` 中找不到错误堆栈，怎么处理？

Supervisor 接管了进程的 stdout/stderr，错误信息被 Supervisor 日志拦截。到 Supervisor 的日志目录（默认 `/var/log/supervisor/`）查找对应进程日志。

### Q: service 文件修改后未生效，怎么处理？

systemd 未重新加载配置。执行 `systemctl daemon-reload` 后再启动服务。

### Q: 进程频繁重启后被 systemd 拒绝拉起，怎么处理？

触发了 `StartLimitBurst` 限制。根据故障原因排查后，执行 `systemctl reset-failed doris-fe` 重置计数。
