---
{
    "title": "操作系统检查",
    "language": "zh-CN",
    "description": "部署 Doris 前，需按清单检查并配置操作系统环境。"
}
---

<!-- 知识类型: 操作指南（Guide）-->
<!-- 适用场景: 部署前检查 / 系统配置 / 环境验收-->

部署 Doris 前，需完成以下操作系统检查与配置：

| 检查项 | 目的 |
|--------|------|
| 关闭 swap 分区 | 避免内核策略影响性能 |
| 关闭透明大页 (THP) | 防止内存碎片与性能波动 |
| 增大虚拟内存区域 | 避免文件句柄不足 |
| 禁用 CPU 省电模式 | 保证高负载下稳定性能 |
| 网络连接溢出重置 | 避免高并发下连接挂起 |
| 端口畅通 / 关闭防火墙 | 保证组件间通信 |
| 增大文件句柄数 | 支撑大量表数据文件 |
| 安装 NTP 服务 | 保证元数据时间精度 < 5000ms |

## 关闭 swap 分区

<!-- 知识类型: 操作步骤 -->

关闭 swap 可避免内核将数据移动到 swap 分区，影响 Doris 性能。

**临时关闭**（重启后失效）：

```bash
swapoff -a
```

**永久关闭**：注释掉 `/etc/fstab` 中的 swap 行，重启生效。

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## 关闭透明大页

<!-- 知识类型: 操作步骤 -->

关闭 THP（Transparent Huge Pages）可减少内存碎片，保证 Doris 稳定使用内存。

**临时关闭**：

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

**永久关闭**：

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## 增大虚拟内存区域

<!-- 知识类型: 操作步骤 -->

增大 VMA（虚拟内存区域）避免 Doris 启动或运行时报 `Too many open files` 错误。

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

sysctl -p
```

## 禁用 CPU 省电模式

<!-- 知识类型: 操作步骤 -->

禁用省电模式可保证高负载下 CPU 频率稳定。若 CPU 不支持 Scaling Governor，可跳过。

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## 网络连接溢出时重置

<!-- 知识类型: 操作步骤 -->

启用 `tcp_abort_on_overflow` 可在连接溢出时立即中断，避免高负载下连接长时间挂起。

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

sysctl -p
```

## 端口畅通

<!-- 知识类型: 操作步骤 -->

若端口不通，排查防火墙：

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

或根据 Doris 端口配置开放相应端口。

## 增大文件句柄数

<!-- 知识类型: 操作步骤 -->

Doris 依赖大量文件管理表数据，需调高文件句柄限制。

```bash
vi /etc/security/limits.conf
* soft nofile 1000000
* hard nofile 1000000
```

修改后需重启会话生效。

## 安装 NTP 服务

<!-- 知识类型: 操作步骤 -->

保证集群所有机器时钟同步，元数据时间精度需 < 5000ms。

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```
