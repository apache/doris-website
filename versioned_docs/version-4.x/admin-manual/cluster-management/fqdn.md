---
{
    "title": "FQDN",
    "language": "en",
    "description": "This article describes how to enable FQDN (Fully Qualified Domain Name) mode in Apache Doris, covering new cluster setup, migration of existing clusters, Kubernetes deployment, and server IP changes."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenarios: Cluster deployment / Node changes / Kubernetes deployment -->

This article describes how to enable an Apache Doris cluster based on FQDN (Fully Qualified Domain Name). An FQDN is the complete domain name of a specific computer or host on the Internet.

After FQDN is enabled, communication between Doris nodes is fully based on FQDN. When adding a node, specify the FQDN directly. For example, the command to add a BE node is:

```sql
ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port";
```

In FQDN mode, `be_host` must be set to the FQDN of the BE node, not its IP address.

## Applicable Scenarios

<!-- Knowledge type: Architecture decision -->

| Scenario | Description | Operation section |
| --- | --- | --- |
| Newly deployed cluster | Enable FQDN directly when building a new cluster to avoid later migration | [Enable FQDN on a New Cluster](#enable-fqdn-on-a-new-cluster) |
| Kubernetes deployment | After a Pod restarts, its IP may change but its domain name does not. FQDN ensures service continuity. | [Deploy Doris on K8s](#deploy-doris-on-k8s) |
| Server IP change | No need to modify Doris metadata when switching network interfaces or replacing machines | [Server IP Change](#server-ip-change) |
| Migration of an existing cluster | Switch a cluster that already runs on IP to FQDN mode | [Enable FQDN on an Existing Cluster](#enable-fqdn-on-an-existing-cluster) |

## Prerequisites

<!-- Knowledge type: Pre-deployment checks -->

The following conditions must be met before enabling FQDN:

- Set `enable_fqdn_mode = true` in `fe.conf`.
- Every machine in the cluster must have a hostname configured.
- The `/etc/hosts` file on every machine in the cluster must contain the IP-to-FQDN mappings of all the other machines.
- Duplicate IP addresses are not allowed in the `/etc/hosts` file.

## Enable FQDN on a New Cluster

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New cluster deployment -->

Take the deployment of a 3 FE + 3 BE cluster as an example. The procedure is as follows:

1. **Prepare machines**: Prepare machines according to the cluster size (6 machines in this example).

2. **Confirm hostname uniqueness**: Run the `host` command on each machine and make sure the result returned is unique. Assume the hostnames of the 6 machines are `fe1`, `fe2`, `fe3`, `be1`, `be2`, and `be3`.

3. **Configure `/etc/hosts`**: On all 6 machines, configure the real IP addresses for all 6 FQDNs in `/etc/hosts`:

    ```text
    172.22.0.1 fe1
    172.22.0.2 fe2
    172.22.0.3 fe3
    172.22.0.4 be1
    172.22.0.5 be2
    172.22.0.6 be3
    ```

4. **Verify the network**: On any node (for example, `fe1`), run `ping fe2`. If the correct IP is resolved and the node is reachable, the network environment is ready.

5. **Enable FQDN configuration**: On each FE node, set the following in `fe.conf`:

    ```text
    enable_fqdn_mode = true
    ```

6. **Deploy the cluster**: Follow [Manual Deployment](../../install/deploy-manually/integrated-storage-compute-deploy-manually) to complete FE / BE deployment.

7. **Add Broker as needed**: Deploy Broker on the selected machines and run:

    ```sql
    ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;
    ```

## Deploy Doris on K8s

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Kubernetes deployment -->

In a Kubernetes environment, there is no guarantee that the IP of a Pod stays the same after an unexpected restart, but its domain name does. After FQDN is enabled in Doris, you can rely on this property to keep the service reachable after a Pod restart.

For the full procedure of deploying Doris on K8s, see [Deploy Doris on K8s](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster).

## Server IP Change

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Node IP change / Network interface switch / Machine replacement -->

After completing deployment as described in "Enable FQDN on a New Cluster", if you need to change the IP of a machine (for example, to switch the network interface or replace the machine), you only need to update the `/etc/hosts` file on every machine. You do not need to modify the Doris cluster metadata.

## Enable FQDN on an Existing Cluster

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Migration of existing cluster -->

**Version prerequisite**: The current Doris version must support the following syntax:

```sql
ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
```

If the current version does not support it, upgrade to a version that does first.

:::caution
The cluster must have at least 3 Follower nodes to perform the following operations. Otherwise, the cluster will not start normally.
:::

### Enable FQDN on FE Nodes

Perform the following operations on the Follower and Observer nodes one by one, and **operate on the Master node last**:

1. **Stop the node**: Stop the current FE process.

2. **Check the node status**: Use a MySQL client to run `SHOW FRONTENDS` and confirm that the `Alive` status of this FE node has changed to `false`.

3. **Set FQDN**: Run the following SQL (after the Master node is stopped, a new Master is elected automatically. Run this statement on the new Master):

    ```sql
    ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
    ```

4. **Modify the node configuration**: In the FE root directory of the stopped node, edit `conf/fe.conf` and add:

    ```text
    enable_fqdn_mode = true
    ```

    If the node still cannot start normally after this configuration is added, add `enable_fqdn_mode = true` to the `fe.conf` of **all** FEs, and then start the FE node that was just stopped.

5. **Start the node**: Start the FE process so that the node rejoins the cluster.

### Enable FQDN on BE Nodes

Enabling FQDN on a BE node does not require a restart. Run the following command through MySQL:

```sql
ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>";
```

If you do not know the `HeartbeatPort` port number, use the `SHOW BACKENDS` command to look it up.

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q: Can the `enable_fqdn_mode` configuration item be changed at will?

No, it cannot be changed at will. To switch a cluster that already runs on IP to FQDN mode, follow the steps in [Enable FQDN on an Existing Cluster](#enable-fqdn-on-an-existing-cluster).

### Q: Can FQDN be enabled when there are fewer than 3 Follower nodes?

No. The cluster must have at least 3 Follower nodes to perform the migration procedure for an existing cluster. Otherwise, the cluster will not start normally.

### Q: Does Doris metadata need to be modified after a server IP change?

No. You only need to update the IP-to-FQDN mappings in `/etc/hosts` on all machines.

### Q: What should `be_host` be set to when adding a node?

After FQDN is enabled, `be_host` must be set to the FQDN of the BE node, not its IP address.
