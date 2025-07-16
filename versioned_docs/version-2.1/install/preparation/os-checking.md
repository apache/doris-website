---
{
"title": "OS Checking",
"language": "en"
}
---

When deploying Doris, ensure the following operating system configurations:

- Disable the swap partition
- Disable transparent huge pages
- Ensure the system has enough virtual memory space
- Disable CPU power-saving mode
- Ensure new network connections are reset on overflow
- Ensure Doris-related ports are open or the firewall is disabled
- Ensure the system allows a sufficient number of open file descriptors
- Install and configure NTP service for clock synchronization

## Disable Swap Partition

It is recommended to disable the swap partition when deploying Doris. The kernel may move memory data to the swap area when it detects memory pressure, but this can negatively impact Doris performance due to the kernel’s limited understanding of application behavior.

To disable swap temporarily (swap will be re-enabled after a restart):

```bash
swapoff -a
```

To permanently disable swap, edit `/etc/fstab` and comment out the swap partition entry, then restart the machine:

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## Disable Transparent Huge Pages

In high-load, low-latency scenarios, disabling Transparent Huge Pages (THP) is recommended to avoid performance degradation and memory fragmentation, ensuring stable memory usage for Doris.

Use the following commands to disable THP temporarily:

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

To permanently disable THP, add the following commands to `/etc/rc.d/rc.local` to ensure it takes effect after a restart:

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## Ensure Sufficient Virtual Memory Area

To allow Doris to handle large datasets, the system must have enough virtual memory space. Without adequate memory mapping, Doris may encounter errors like Too many open files during startup or runtime.

You can permanently modify the virtual memory area to at least 2000000 with the following command, and it will take effect immediately:

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

# Take effect immediately
sysctl -p
```

## Disable CPU Power-Saving Mode

Disabling CPU power-saving mode ensures stable high performance during high load, preventing fluctuations and delays caused by reduced CPU frequency.

Use the following command to set the CPU governor to "performance," disabling power-saving modes:

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Reset New Connections on Network Overflow

Ensure that when TCP connection buffers overflow, new connections are reset immediately. This prevents buffer blocking during high load and improves responsiveness and stability.

You can permanently configure the system to automatically reset new connections with the following commands, and it will take effect immediately:

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

# Take effect immediately
sysctl -p
```

## Open Doris-related Ports
If Doris-related ports are blocked, you can try disabling the firewall to verify whether it is the cause. If the firewall is the issue, open the relevant ports for Doris components.

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

## Increase System's Open File Descriptors Limit

Since Doris manages a large number of files, you need to increase the system's file descriptor limit.

To change the maximum number of open files, add the following to `/etc/security/limits.conf`:

```bash
vi /etc/security/limits.conf 
* soft nofile 1000000
* hard nofile 1000000
```

## Ensure NTP Service is Installed on Cluster Deployment Machines

Doris requires the metadata's timestamp accuracy to be within 5000ms. To ensure consistent time across all nodes in the cluster and avoid metadata inconsistencies, you need to synchronize clocks across all machines using the NTP service.

Use the following commands to start and enable the NTP service:

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```
