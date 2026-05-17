---
{
    "title": "MODIFY FRONTEND HOSTNAME",
    "language": "zh-CN",
    "description": "修改 FRONTEND（后续使用简称 FE）的属性。当前，此命令仅能修改 FE 的主机名（HOSTNAME）。当集群中的某一个 FE 实例运行的主机需要变更主机名时，可以使用此命令更改此 FE 在集群中注册的主机名，使其可以继续正常运行。"
}
---

## 描述

修改 FRONTEND（后续使用简称 FE）的属性。当前，此命令仅能修改 FE 的主机名（HOSTNAME）。当集群中的某一个 FE 实例运行的主机需要变更主机名时，可以使用此命令更改此 FE 在集群中注册的主机名，使其可以继续正常运行。

此命令只用于将 DORIS 集群转变为 FQDN 方式部署。有关 FQDN 部署的细节，请参阅“FQDN”章节。

## 语法

```sql
ALTER SYSTEM MODIFY FRONTEND "<frontend_hostname_port>" HOSTNAME "<frontend_new_hostname>"
```

## 必选参数

1. `<frontend_hostname_port>`: 需要变更主机名的 FE 注册的 hostname 和 edit log port。可以通过 SHOW FRONTENDS 命令查看集群中所有 FE 的相关信息。详细用法请参阅“SHOW FRONTENDS”章节。

2. `<frontend_new_hostname>`: FE 的新主机名。

## 权限控制

执行此 SQL 命令的用户必须至少具有 NOD_PRIV 权限。

## 示例

将集群中的一个 FE 实例的 hostname，从 10.10.10.1 变为 172.22.0.1：

```sql
ALTER SYSTEM
MODIFY FRONTEND "10.10.10.1:9010"
HOSTNAME "172.22.0.1"
```