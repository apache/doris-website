---
title: Deploying a Doris Cluster on AWS EKS
sidebar_label: AWS EKS Deployment Recommendations
language: en
description: "Complete guide for deploying Doris on AWS EKS: cluster mode selection (autonomous vs non-autonomous), system parameter checks and tuning, privileged mode configuration, and storage and compute resource planning. Resolves issues such as insufficient vm.max_map_count, swap not disabled, transparent huge pages not turned off, and file handle limits."
---

## Overview of AWS EKS Container Service

AWS EKS provides two operating modes:

| Mode | Description | Use Cases |
|------|-------------|-----------|
| **Non-autonomous mode** (recommended) | Standard EKS mode with full control over the underlying EC2 instances | Production environments, stateful services, Doris clusters |
| **Autonomous mode** | Built-in node pool with automatic elastic scaling of resources | Stateless services, lightweight workloads |

:::tip Tip
Autonomous mode is not recommended. In autonomous mode, compute resources are dynamically allocated and reclaimed through a built-in node pool, which may cause Doris cluster nodes to drift and pose security risks in production environments.
:::

## Scenario 1: Creating a New Cluster

### Step 1: Create an EKS Cluster (Non-autonomous Mode)

When creating a cluster in the EKS console, select **non-autonomous mode**.

**Recommended configuration**:
- Operating system image: Amazon Linux 2
- Node group: Use a dedicated node group to deploy Doris

### Step 2: Configure the Node Group Launch Script

Set up the launch template for the node pool through EC2 > Launch Templates > Create Launch Template. Add the following script to the template to automate system parameter configuration:

```bash
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable the firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set the number of virtual memory areas
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set the file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
  echo "* soft nofile 1000000" >> "$config_file"
  echo "* hard nofile 1000000" >> "$config_file"
fi
```

The settings take effect after restarting the node once the cluster has started.

### Step 3: Configure IAM Role Permissions

Make sure the IAM role of the EKS node has the following permissions:

- AmazonEC2FullAccess
- AmazonEKSWorkerNodePolicy
- AmazonEKS_CNI_Policy
- AmazonSSMManagedInstanceCore

### Step 4: Configure Storage

For production environments, [EBS](https://aws.amazon.com/ebs) storage is recommended. Add the EBS storage plugin in the cluster configuration interface, and make sure the plugin has the corresponding [role permissions](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html).

---

## Scenario 2: Existing Cluster

### Step 1: Check Swap Status

```bash
swapon --show
```

**Expected result**: No output (swap is disabled). If there is output indicating that swap is enabled, run `swapoff -a` and restart.

### Step 2: Check the Maximum File Handle Count

```bash
ulimit -n
```

**Expected result**: No less than 65535. If it is below this value, add the following entries in `/etc/security/limits.conf`:

```bash
* soft nofile 1000000
* hard nofile 1000000
```

### Step 3: Check the Number of Virtual Memory Areas

```bash
sysctl vm.max_map_count
```

**Expected result**: No less than 262144. To modify the value, run `sysctl -w vm.max_map_count=2000000`.

### Step 4: Check Transparent Huge Pages

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**Expected result**: Contains `[never]`. If the value is `[always]`, run:

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

---

## Image Repository Access

To access the public DockerHub image repository, add network plugins such as `Amazon VPC CNI`, `CoreDNS`, and `kube-proxy` to the cluster, and select a subnet that can access the public network when configuring the VPC for the cluster.

---

## Privileged Mode

Under EKS, EC2 instances belong entirely to the current EKS user, so there is no situation in which clusters of different users affect each other in a shared resource pool.

- **If your EKS allows privileged mode** (allowed by default): You do not need to worry about system parameters. Doris Operator automatically adjusts system parameters for Doris by default.
- **If privileged mode is not allowed**: You need to make the following system parameter adjustments on the host:

| Parameter | Command | Verification |
|-----------|---------|--------------|
| Number of virtual memory areas | `sysctl -w vm.max_map_count=2000000` | `sysctl vm.max_map_count` |
| Transparent huge pages | Disable | Check whether the output contains `never` |
| Maximum file handle count | Modify `/etc/security/limits.conf` | `ulimit -n` |
| swap | `swapoff -a` | `swapon --show` (no output means disabled) |

For details, see [Operating System Check](../../preparation/os-checking.md).

---

## FAQ

### Q: What are the risks of autonomous mode?

In autonomous mode, compute resources are dynamically allocated and reclaimed through a built-in node pool, and existing resources are reorganized on each allocation or release. For StatefulSet stateful services, especially those with long startup times and services such as Doris that have strict distributed coordination requirements, this can cause instability across all services sharing the node pool, leading all nodes in the entire Doris cluster to drift.

### Q: How do you configure a new node group on an existing cluster?

It is recommended to configure a dedicated node group for the Doris cluster. When system settings related to BE operation are involved, you may need to adjust the system parameters of the host. When creating a node group, you can configure it through EC2 > Launch Templates > Create Launch Template, and use the template to inject scripts that automate the system environment configuration of the EC2 instances.

### Q: What IAM permissions does an EKS node need?

It needs the AmazonEC2FullAccess, AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, and AmazonSSMManagedInstanceCore permissions.

### Q: How do you verify that the system parameters are configured correctly?

Refer to the verification steps in Scenario 2 to check whether parameters such as swap, file handle count, number of virtual memory areas, and transparent huge pages meet the requirements.
