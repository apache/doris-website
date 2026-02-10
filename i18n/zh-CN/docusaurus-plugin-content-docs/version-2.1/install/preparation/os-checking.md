---
{
    "title": "操作系统检查",
    "language": "zh-CN",
    "description": "在部署 Doris 时，需要对以下操作系统项进行检查："
}
---

在部署 Doris 时，需要对以下操作系统项进行检查：

- 确保关闭 swap 分区
  
- 确保系统关闭透明大页
  
- 确保系统有足够大的虚拟内存区域
  
- 确保 CPU 不使用省电模式
  
- 确保网络连接溢出时自动重置新连接
    
- 确保 Doris 相关端口畅通或关闭系统防火墙
  
- 确保系统有足够大的打开文件句柄数
  
- 确定部署集群机器安装 NTP 服务

## 关闭 swap 分区

在部署 Doris 时，建议关闭 swap 分区。swap 分区是内核发现内存紧张时，会按照自己的策略将部分内存数据移动到配置的 swap 分区，由于内核策略不能充分了解应用的行为，会对 Doris 性能造成较大影响。所以建议关闭。

通过以下命令可以临时或者永久关闭。

临时关闭，下次机器启动时，swap 还会被打开。

```bash
swapoff -a
```

永久关闭，使用 Linux root 账户，注释掉 `/etc/fstab` 中的 swap 分区，重启即可彻底关闭 swap 分区。

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## 关闭系统透明大页

在高负载低延迟的场景中，建议关闭操作系统透明大页（Transparent Huge Pages, THP），避免其带来的性能波动和内存碎片问题，确保 Doris 能够稳定高效地使用内存。

使用以下命令临时关闭透明大页：

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

如果需要永久关闭透明大页，可以使用以下命令，在下一次宿主机重启后生效：

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## 增加虚拟内存区域

为了保证 Doris 有足够的内存映射区域来处理大量数据，需要修改 VMA（虚拟内存区域）。如果没有足够的内存映射区域，Doris 在启动或运行时可能会遇到 `Too many open files` 或类似的错误。

通过以下命令可以永久修改虚拟内存区域至少为 2000000，并立即生效：

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

# Take effect immediately
sysctl -p
```

## 禁用 CPU 省电模式

在部署 Doris 时检修关闭 CPU 的省电模式，以确保 Doris 在高负载时提供稳定的高性能，避免由于 CPU 频率降低导致的性能波动、响应延迟和系统瓶颈，提高 Doris 的可靠性和吞吐量。如果您的 CPU 不支持 Scaling Governor，可以跳过此项配置。

通过以下命令可以关闭 CPU 省电模式：

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## 网络连接溢出时自动重置新连接

在部署 Doris 时，需要确保在 TCP 连接的发送缓冲区溢出时，连接会被立即中断，以防止 Doris 在高负载或高并发情况下出现缓冲区阻塞，避免连接被长时间挂起，从而提高系统的响应性和稳定性。

通过以下命令可以永久设置系统自动重置新链接，并立即生效：

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

# Take effect immediately
sysctl -p
```

## 相关端口畅通

如果发现端口不通，可以试着关闭防火墙，确认是否是本机防火墙造成。如果是防火墙造成，可以根据配置的 Doris 各组件端口打开相应的端口通信。

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

## 增加系统的最大文件句柄数

Doris 由于依赖大量文件来管理表数据，所以需要将系统对程序打开文件数的限制调高。

通过以下命令可以调整最大文件句柄数。在调整后，需要重启会话以生效配置：

```bash
vi /etc/security/limits.conf 
* soft nofile 1000000
* hard nofile 1000000
```

## 安装并配置 NTP 服务

Doris 的元数据要求时间精度要小于 5000ms，所以所有集群所有机器要进行时钟同步，避免因为时钟问题引发的元数据不一致导致服务出现异常。

通常情况下，可以通过配置 NTP 服务保证各节点时钟同步。

```bash
sudo systemctl start_ntpd.service
sudo systemctl enable_ntpd.service
```
