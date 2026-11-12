---
{
"title": "Cluster Environment Requirements",
"language": "en"
}
---

## Software version requirements

| Software | Version Requirements |
|----------------|----------|
| Docker | \>= 1.20 |
| Kubernetes | \>= 1.19 |
| Doris | \>= 2.0.0 |
| Helm (optional) | \>= 3.7 |

## Operating system requirements

### Firewall configuration

When deploying a Doris cluster on Kubernetes, it is recommended to turn off the firewall configuration:

```shell
systemctl stop firewalld
systemctl disable firewalld
```

If the firewall service cannot be turned off, you can open the FE and BE ports according to your plan:
:::tip Tip
If the firewall cannot be turned off, you need to open the firewall of the corresponding Doris port according to the Kubernetes mapping rules. For specific ports, please refer to [Doris Cluster Port Planning](../standard-deployment.md#2-check-operating-system).
:::


### Disable and close swap

When deploying Doris, it is recommended to turn off the swap partition.

The swap partition can be permanently shut down with the following command.

```shell
echo "vm.swappiness = 0">> /etc/sysctl.conf
swapoff -a && swapon -a
sysctl -p
```

### Set the maximum number of open file handles in the system

```shell
vi /etc/security/limits.conf 
* soft nofile 65536
* hard nofile 65536
```

### Modify the number of virtual memory areas

Modify the virtual memory area to at least 2000000

```shell
sysctl -w vm.max_map_count=2000000
```

### Close transparent large page

When deploying Doris, it is recommended to turn off transparent huge pages.

```shell
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```
