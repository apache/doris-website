---
{
"title": "OS Checking",
"language": "en"
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

When deploying Doris, the following operating system items need to be checked:

- Ensure swap partition is disabled
- Ensure transparent huge pages are disabled
- Ensure the system has a sufficiently large virtual memory area
- Ensure CPU is not using power-saving mode
- Ensure network connections automatically reset new connections when overflow occurs
- Ensure Doris-related ports are open or the system firewall is disabled
- Ensure the system has a sufficiently large number of open file descriptors
- Ensure cluster deployment machines have NTP service installed

## Ensure Swap Partition is Disabled

When deploying Doris, it is recommended to disable the swap partition. The swap partition is used by the kernel to move some memory data to the configured swap area when it detects memory pressure. Since the kernel's strategy does not fully understand the application's behavior, it can significantly impact Doris's performance. Therefore, it is recommended to disable it.

You can disable it temporarily or permanently using the following commands.

To disable temporarily, the swap will be re-enabled upon the next machine restart.


```bash
swapoff -a
```

To disable it permanently, use a Linux root account to comment out the swap partition in `/etc/fstab` and restart the machine to completely disable the swap partition.

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## Ensure Transparent Huge Pages are Disabled

In high-load, low-latency scenarios, it is recommended to disable the operating system's Transparent Huge Pages (THP) to avoid performance fluctuations and memory fragmentation issues, ensuring that Doris can use memory in a stable and efficient manner.

Use the following commands to temporarily disable Transparent Huge Pages:

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

If you need to disable Transparent Huge Pages permanently, you can use the following command, which will take effect after the next host machine restart:
```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## Ensure the System Has a Sufficiently Large Virtual Memory Area

To ensure Doris has enough memory mapping area to handle large amounts of data, you need to modify the size of the virtual memory area. If there is not enough memory mapping area, Doris may encounter errors like `Too many open files` or similar during startup or runtime.

You can permanently modify the virtual memory area to at least 2000000 with the following command, and it will take effect immediately:

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

# Take effect immediately
sysctl -p
```

## Ensure CPU is Not Using Power-Saving Mode

When deploying Doris, ensure that the CPU's power-saving modes are disabled to guarantee stable high performance under high load. This prevents performance fluctuations, response delays, and system bottlenecks caused by reduced CPU frequencies, thereby enhancing Doris's reliability and throughput. If your CPU does not support Scaling Governor, you can skip this configuration.

You can disable CPU power-saving mode with the following commands:

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Ensure Network Connections Automatically Reset New Connections When Overflow Occurs

When deploying Doris, you need to ensure that when the TCP connection's send buffer overflows, the connection is immediately terminated. This prevents Doris from experiencing buffer blocking under high load or high concurrency, avoids connections being suspended for long periods, and thereby improves the system's responsiveness and stability.

You can permanently configure the system to automatically reset new connections with the following commands, and it will take effect immediately:

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

# Take effect immediately
sysctl -p
```

## Ensure Doris-related Ports are Open or the System Firewall is Disabled

If you find that ports are not accessible, you can try disabling the firewall to confirm whether it is caused by the local firewall. If the firewall is the cause, you can open the corresponding ports for Doris's various components based on their configuration.

```sql
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

## Ensure the System Has a Sufficiently Large Number of Open File Descriptors

Since Doris relies on a large number of files to manage table data, it is necessary to increase the system's limit on the number of open files per program.

You can adjust the maximum number of file descriptors using the following commands. After making the adjustments, you need to restart the session for the configuration to take effect:

```sql
vi /etc/security/limits.conf 
* soft nofile 1000000
* hard nofile 1000000
```

## Ensure NTP Service is Installed on Cluster Deployment Machines

Doris requires the metadata time accuracy to be less than 5000ms. Therefore, all machines in the cluster must synchronize their clocks to prevent metadata inconsistencies caused by clock issues, which could lead to service abnormalities.

Typically, you can ensure clock synchronization across nodes by configuring the NTP service.

```sql
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```
