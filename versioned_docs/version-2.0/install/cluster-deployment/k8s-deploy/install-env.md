---
{
"title": "Cluster Environment Requirements",
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
