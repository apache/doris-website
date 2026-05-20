---
{
    "title": "Deploying Doris Cluster on Alibaba Cloud Container Service",
    "sidebar_label": "Alibaba Cloud Container Service Deployment Recommendations",
    "language": "en",
    "description": "Deployment guide for Doris on Alibaba Cloud ACK/ACS, including environment checks, configuration tuning, image registry setup, and common troubleshooting. Resolves issues such as BE nodes failing to start, swap not disabled, and huge page memory configuration."
}
---

## Overview of Alibaba Cloud Container Service

Alibaba Cloud provides two container services:

| Service | Description | Use Case |
|------|------|----------|
| **ACK** (Container Service for Kubernetes) | A managed containerized service after purchasing ECS instances, providing full access control | Scenarios requiring control over the underlying ECS, or BE node deployment in privileged mode |
| **ACS** (Container Service ACS) | A cloud computing service with K8s as the interface, billed on demand, with no need to manage the underlying ECS | Pure elastic compute capacity, pay-as-you-go |

This document describes how to deploy a cluster using Doris Operator on each of these services.

## ACK Deployment

ACK is a managed containerized service after purchasing ECS instances, providing full access control for system parameter tuning. When using the Alibaba Cloud Linux 3 image, the current system parameters fully meet the requirements for running Doris. For other images, parameters can be corrected inside the container through K8s privileged mode.

**When deploying with ACK + Doris Operator, most ECS default configurations meet the requirements, and any unmet parameters are corrected by the Operator.**

### Scenario 1: Existing Cluster

If a container service cluster has already been created, follow these steps to check and correct the parameters:

#### Step 1: Check Swap Status

```bash
swapon --show
```

**Expected result**: No output (swap is disabled). If output indicates swap is enabled, run `swapoff -a` and reboot.

#### Step 2: Check Maximum File Handle Count

```bash
ulimit -n
```

**Expected result**: Not less than 65535. If lower than this value, add the following to `/etc/security/limits.conf`:

```shell
* soft nofile 1000000
* hard nofile 1000000
```

#### Step 3: Check Virtual Memory Area Count

```bash
sysctl vm.max_map_count
```

**Expected result**: Not less than 262144. If modification is required, run `sysctl -w vm.max_map_count=2000000`.

#### Step 4: Check Transparent Huge Pages

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**Expected result**: Contains `[never]`. If the value is `[always]`, run:

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

For details, see [Operating System Checks](../../preparation/os-checking.md).

### Scenario 2: New Cluster

To create a new cluster, click "Create Cluster" in the Alibaba Cloud Container Service ACK console. In the **Node Pool Configuration** step, add the following script under "Instance Pre-Custom Data":

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set virtual memory area count
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
   echo "* soft nofile 1000000" >> "$config_file"
   echo "* hard nofile 1000000" >> "$config_file"
fi
```

Reboot the nodes after the cluster starts for the changes to take effect.

## ACS Deployment

ACS is a cloud computing service with K8s as the interface, providing pay-as-you-go elastic compute capacity. There is no need to manage the underlying ECS, but BE node startup requires privileged mode to modify system parameters (such as `vm.max_map_count`).

:::tip Tip
If the current cluster cannot use privileged mode, BE nodes cannot be started. Consider deploying with ACK + host machines instead.
:::

### Step 1: Configure Image Registry

ACS recommends using the matching Alibaba Cloud image registry [Container Registry (ACR)](https://www.alibabacloud.com/en/product/container-registry), which is available in Personal Edition and Enterprise Edition.

After migrating the official Doris images to the Alibaba Cloud image registry, create a secret if private images are used:

```bash
kubectl create secret docker-registry image-hub-secret \
  --docker-server={your-server} \
  --docker-username={your-username} \
  --docker-password={your-pwd}
```

### Step 2: Configure DCR to Use Private Images

Configure `imagePullSecrets` in the DorisCluster CR:

```yaml
spec:
  feSpec:
    replicas: 1
    image: <your-acr-registry>/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: <your-acr-registry>/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: <your-acr-registry>/selectdb-test/alpine:latest
```

### Step 3: Configure Service

ACS does not have a conventional Node concept, so Service is restricted from using NodePort mode. The following modes are available:

#### ClusterIP Mode (Default)

The default network mode of the Operator. See the [Kubernetes Service documentation](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip).

#### Load Balancer Mode

**Method 1: Configure annotations through DCR**

```yaml
feSpec:
  replicas: 3
  image: <your-image>
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
```

**Method 2: Manage through the ACS console**

1. Set serviceType to ClusterIP (default) in the DCR.
2. In the ACS console: Container Compute Service ACS → Cluster List → Cluster → Services → Create.
3. Select the newly created LB to bind. This Service is managed alongside Doris Operator but is not controlled by the Operator.

---

## FAQ

### Q: What if BE nodes cannot start?

Check the following:
1. **Privileged mode is not enabled**: ACS requires privileged mode to modify `vm.max_map_count`. If it cannot be enabled, use ACK instead.
2. **Image pull failure**: Check whether `imagePullSecrets` is configured correctly.
3. **Insufficient virtual memory area count**: Run `sysctl vm.max_map_count` and ensure the value is not less than 262144.

### Q: Is it normal for cluster nodes to appear as virtual-kubelet?

Yes. ACS uses virtual nodes to schedule containers. Node names such as `virtual-kubelet-cn-hongkong-d` are normal behavior in ACS.

### Q: What if privileged mode is not enabled in an Alibaba Cloud region?

Submit a ticket to request that the ACS privileged mode capability be allowlisted.

### Q: How to choose between ACK and ACS?

| Scenario | Recommendation |
|------|------|
| Full control over the underlying ECS is required | ACK |
| Pure elastic pay-as-you-go, no need to manage the underlying infrastructure | ACS |
| BE nodes require privileged mode | ACK |

