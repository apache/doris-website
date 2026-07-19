---
{
    "title": "Automatic Service Startup",
    "language": "en",
    "description": "Learn how to configure boot-time startup and automatic restart of Doris FE/BE/Broker with Systemd or Supervisor to ensure service availability in production."
}
---

This document describes how to configure automatic service startup for an Apache Doris cluster. The goal is to prevent long outages of FE, BE, or Broker services caused by host reboots or unexpected process exits in production. Doris supports two common approaches: **Systemd** and **Supervisor**. Choose either one based on your operational preferences.

:::caution
Before configuring automatic startup, the Doris cluster must be fully deployed, and FE and BE must start normally by hand.
:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production operations / High-availability deployment -->

## Applicable Scenarios

| Scenario | Recommended approach | Notes |
|------|---------|------|
| Automatically restart Doris services after a host reboot | Systemd | Deeply integrated with the system init; takes effect on reboot |
| Automatically restart a process after an unexpected exit | Systemd / Supervisor | Both support failure-restart policies |
| Manage multiple processes (FE/BE/Broker) in one place | Supervisor | Supports centralized process management and log aggregation |
| Operations that require minimal sudo privileges | Systemd | Grant precise permissions to a specific user with `visudo` |

## Approach Comparison

| Dimension | Systemd | Supervisor |
|------|---------|------------|
| Installation | Built in (mainstream Linux distributions) | Install with `yum` or `pip` |
| Startup management | `systemctl` | `supervisorctl` |
| Configuration file | `/usr/lib/systemd/system/*.service` | `/etc/supervisord.d/*.ini` |
| Restart on failure | `Restart=on-failure` | `autorestart=true` |
| Log output | journald + application logs | Supervisor takes over stdout/stderr |
| Applicable scenarios | Mainstream production environments | Centralized management of multiple processes |

## Prerequisites

- The Doris cluster is deployed, and FE/BE can start normally by hand.
- Java is installed on the host, and the `JAVA_HOME` path is available.
- The current user has root privileges or can run systemctl/supervisord commands through sudo.

---

## Approach 1: Configure Automatic Startup with Systemd

Systemd is the service management tool built into mainstream Linux distributions and suits most production environments. For full parameter documentation, see the [Systemd official documentation](https://systemd.io/).

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Boot-time startup configuration -->

### 1. Configure sudo permissions (optional)

Controlling Doris services with systemd requires sudo privileges. To follow the principle of least privilege, grant systemctl control of `doris-fe` and `doris-be` to a specific non-root user. Add the following entries with `visudo`:

```text
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```

After authorization, the `doris` user can manage Doris services with `sudo systemctl start/stop doris-fe|doris-be` without a password.

### 2. Declare JAVA_HOME in the configuration files

**Purpose**: systemd does not load user-level environment variables such as `~/.bashrc` at startup, so `JAVA_HOME` must be declared explicitly. Otherwise `systemctl start` fails to start the service.

**Commands**:

```shell
echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
```

**Notes**: Replace `your_java_home` with the actual Java installation path, for example `/usr/local/jdk8`.

### 3. Prepare the FE service file

Download [doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service) from the Doris repository. Its contents are:

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
**Notes**

- Update `ExecStart` and `ExecStop` to match the actual FE deployment path.
:::

### 4. Prepare the BE service file

Download [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service) from the Doris repository. Its contents are:

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
**Notes**

- Update `ExecStart` and `ExecStop` to match the actual BE deployment path.
:::

### 5. Key parameters in the service file

| Parameter | Purpose |
|------|------|
| `Type=forking` | Runs the process as a background daemon |
| `LimitCORE=infinity` | Does not limit core dump size, which helps with troubleshooting |
| `LimitNOFILE=200000` | File handle limit, which avoids `Too many open files` |
| `Restart=on-failure` | Automatically restarts the process when it exits unexpectedly |
| `RestartSec=30` | Waits 30 seconds before restarting after an unexpected exit |
| `StartLimitInterval=120` / `StartLimitBurst=3` | Restarts at most 3 times in 120 seconds to avoid cascading failures |
| `KillMode=none` | Does not force kill child processes on stop; the script handles them |
| `ExecStart` / `ExecStop` | Paths to the Doris start/stop scripts |

### 6. Deploy the service files

Copy `doris-fe.service` and `doris-be.service` to the systemd directory:

```shell
cp doris-fe.service doris-be.service /usr/lib/systemd/system/
```

### 7. Enable startup at boot

After adding or modifying a service configuration, reload systemd:

```shell
systemctl daemon-reload
```

Enable startup at boot. This creates service file links under `/etc/systemd/system/multi-user.target.wants/`:

```shell
systemctl enable doris-fe
systemctl enable doris-be
```

### 8. Start the services

```shell
systemctl start doris-fe
systemctl start doris-be
```

Check service status with `systemctl status doris-fe` or `systemctl status doris-be`.

---

## Approach 2: Configure Automatic Startup with Supervisor

Supervisor is a Python-based process management tool. It suits scenarios that require centralized process management and log aggregation. For full parameter documentation, see the [Supervisor official documentation](http://supervisord.org/).

Supervisor can be installed directly with `yum` or manually with `pip`. The `pip` installation procedure is more complex, so this document covers only the `yum` approach. For manual deployment, see the [Supervisor installation documentation](http://supervisord.org/installing.html).

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Centralized multi-process management -->

### 1. Install Supervisor

```shell
yum install epel-release
yum install -y supervisor
```

### 2. Start the Supervisor service and check status

```shell
systemctl enable supervisord    # Enable startup at boot
systemctl start supervisord     # Start the supervisord service
systemctl status supervisord    # Check the supervisord service status
ps -ef | grep supervisord       # Check whether a supervisord process exists
```

### 3. Configure BE process management

**Purpose**: Let Supervisor take over the foreground output of the BE process. Remove the trailing `&` from the BE startup script.

**Modify the startup script**:

```shell
vim /path/doris/be/bin/start_be.sh
```

Change:

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
```

to:

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
```

**Create the BE Supervisor configuration file** `/etc/supervisord.d/doris-be.ini`:

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

### 4. Configure FE process management

**Purpose**: Similar to BE, remove the trailing `&` from the FE startup script so that Supervisor takes over the foreground process.

**Modify the startup script**:

```shell
vim /path/doris/fe/bin/start_fe.sh
```

Change:

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
```

to:

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
```

**Create the FE Supervisor configuration file** `/etc/supervisord.d/doris-fe.ini`:

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

### 5. Configure Broker process management (optional)

**Purpose**: If the cluster has a Broker deployed, you can also place it under Supervisor. As before, remove the trailing `&` from the Broker startup script.

**Modify the startup script**:

```shell
vim /path/apache_hdfs_broker/bin/start_broker.sh
```

Change:

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
```

to:

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
```

**Create the Broker Supervisor configuration file** `/etc/supervisord.d/doris-broker.ini`:

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

### 6. Supervisor configuration parameters

| Parameter | Purpose |
|------|------|
| `program:<name>` | Process identifier; supervisorctl manages the process by this name |
| `directory` | Working directory of the process |
| `command` | Startup command |
| `autostart=true` | Starts the process automatically when supervisord starts |
| `autorestart=true` | Restarts the process automatically after it exits |
| `startretries=3` | Retries up to 3 times on startup failure |
| `startsecs` | Number of seconds the process must stay running to count as a successful start |
| `stopasgroup` / `killasgroup` | Applies stop or kill to the entire process group |
| `environment` | Injects environment variables, such as `JAVA_HOME` |

### 7. Load the configuration and start the services

Confirm that the Doris services are currently stopped, then let Supervisor take over the automatic startup:

```shell
supervisorctl reload    # Reload all configuration files in Supervisor
supervisorctl status    # Check process status to confirm that Doris services started normally
```

**Other common commands**:

```shell
supervisorctl start all          # Start all managed processes
supervisorctl stop doris-be      # Stop a specific process
```

---

## FAQ

### Q: `systemctl start` fails, and the log reports that `JAVA_HOME` cannot be found. How do I handle this?

systemd does not load user-level environment variables. Append `JAVA_HOME=...` explicitly in `fe.conf` and `be.conf`.

### Q: Supervisor fails to start with `pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found`. How do I handle this?

The yum-installed Supervisor supports only Python 2, but the default `/usr/bin/python` points to Python 3. With Python 2 installed, change the first line of `/usr/bin/supervisord` and `/usr/bin/supervisorctl` from `#!/usr/bin/python` to `#!/usr/bin/python2`.

### Q: After a BE crash, `be.out` does not contain the error stack. How do I handle this?

Supervisor took over the process's stdout/stderr, so the error messages went to Supervisor's logs. Look in Supervisor's log directory (`/var/log/supervisor/` by default) for the corresponding process log.

### Q: The service file changes did not take effect. How do I handle this?

systemd did not reload the configuration. Run `systemctl daemon-reload`, then start the service again.

### Q: After frequent restarts, systemd refuses to start the process. How do I handle this?

The `StartLimitBurst` limit triggered. Investigate the root cause, then run `systemctl reset-failed doris-fe` to reset the counter.
