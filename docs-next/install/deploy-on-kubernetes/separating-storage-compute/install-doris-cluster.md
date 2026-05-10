---
{
    "title": "Deploying a Complete Doris Compute-Storage Decoupled Cluster",
    "language": "en",
    "description": "An end-to-end tutorial for building a working Doris compute-storage decoupled cluster on Kubernetes from scratch: deploy FoundationDB, deploy Doris Operator, deploy a Doris cluster, and create a Storage Vault.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

This document targets users who are setting up a Doris compute-storage decoupled cluster on Kubernetes for the first time, providing an end-to-end tutorial from zero deployment to writable data. After reading this document, you will be able to:

- Complete the deployment of or connection to FoundationDB (metadata storage)
- Deploy Doris Operator on Kubernetes
- Deploy a complete compute-storage decoupled cluster through Doris Operator
- Create an object storage backend (Storage Vault) through SQL

## Deployment Outcome

After completing this tutorial, you will have a Doris compute-storage decoupled cluster composed of the following components:

| Component | Description | Default Replicas |
|------|------|-----------|
| FE | Responsible for SQL parsing and coordination | 1 |
| MS (MetaService) | Metadata management | 1 |
| Compute Group (CG) | Data ingestion and caching | 2 |
| FoundationDB | Metadata storage | - |
| Storage Vault | S3-compatible object storage | - |

## Deployment Path Overview

The whole flow is divided into 5 sequential steps. The input and output of each step are as follows:

| Step | Stage Goal | Input | Output |
|------|----------|------|------|
| Step 1 | Deploy FoundationDB | K8s cluster / available machines | Available FDB cluster + access information |
| Step 2 | Deploy Doris Operator | K8s cluster access | Running Operator + CRDs |
| Step 3 | Deploy Doris compute-storage decoupled cluster | `ddc-sample.yaml` + FDB access information | Running compute-storage decoupled cluster |
| Step 4 | Create remote storage backend | Running cluster + S3-compatible object storage credentials | Storage Vault available for data persistence |
| Step 5 | Connect to the cluster and verify end-to-end | MySQL connection established in Step 4 | Available cluster verified by read and write |

After Step 4, the cluster is ready to accept writes. Step 5 completes end-to-end verification through SQL. For advanced customization of FE / MS / Compute Group, see the [Advanced Configuration](#advanced-configuration) section at the end of this document.

## Step 1: Deploy FoundationDB

A compute-storage decoupled cluster relies on FoundationDB (FDB) to store metadata. You must prepare an available FDB before deployment. Choose the deployment method based on the existing infrastructure:

| Deployment Method | Applicable Scenario | Follow-up Action |
|----------|----------|----------|
| Direct deployment on machines (recommended) | Already have available physical machines / virtual machines | Refer to [Compute-Storage Decoupled - Pre-Deployment Preparation](../../deploy-manually/separating-storage-compute-deploy-manually) to complete the deployment, ensuring that the deployment machines and the K8s cluster are in the same LAN |
| Deploy on Kubernetes | Want to manage FDB uniformly within K8s | Directly execute the "K8s Quick Deployment" below |

### K8s Quick Deployment (Simplest Path)

Execute the following 4 steps in order to bring up a minimal FDB cluster (single replica) on K8s:

**1. Apply the FoundationDB CRDs:**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. Deploy fdb-kubernetes-operator:**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. Deploy the FoundationDB cluster (single-replica minimal mode):**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. Verify the FDB status:**

```shell
kubectl get fdb
```

When the `AVAILABLE` column returned by `kubectl get fdb` is `true`, the FDB cluster is ready.

:::tip Advanced Options
The single-replica mode is only suitable for development and testing. The two-replica mode is recommended for production, and the Kubernetes cluster needs at least three host machines. For other deployment forms (two-replica, production deployment, private repository images, FQDN mode, etc.), refer to [Deploy FoundationDB](install-fdb.md).
:::

## Step 2: Deploy Doris Operator

**Input**: Kubernetes cluster access
**Action**: Apply CRD resource definitions, deploy the Operator and RBAC rules
**Output**: Doris Operator running in the `doris` namespace

### 1. Apply CRD Resource Definitions

Choose the corresponding command based on the current cluster state:

- **Scenario A: First-time deployment (or only deploying compute-storage decoupled)**: apply all CRDs:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **Scenario B: A non-decoupled cluster has already been deployed**: only append the CRDs related to compute-storage decoupled:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Deploy the Operator and RBAC Rules

Run the following command to deploy Doris Operator and the RBAC rules it depends on:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

After the deployment, check the status of the Operator Pod:

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

A `STATUS` of `Running` indicates that the Operator is ready.

## Step 3: Deploy the Compute-Storage Decoupled Cluster

**Input**: Deployment example `ddc-sample.yaml` + FoundationDB access information
**Action**: Download the example, modify key fields as needed, and deploy the cluster
**Output**: A running Doris compute-storage decoupled cluster

### 1. Download the Deployment Example

Download the default deployment example from the Doris Operator repository:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. Modify Key Configurations

After downloading the example, you must modify at least the following two categories of fields before deployment. Keep the default values for all other fields:

| Field | Required / Optional | Description |
|------|-------------|------|
| `spec.metaService.fdb` | **Required** | FDB access information deployed in Step 1 (choose one of address or ConfigMap) |
| `spec.computeGroups[].image` | **Required** | BE image version. Must match the Doris version you expect |
| `spec.metaService.image` | Optional | MetaService image version. Uses the version in the example by default |
| `spec.feSpec.electionNumber` | Optional | Number of FE Followers. Default is 1; **cannot be modified after deployment** |
| `spec.computeGroups[].replicas` | Optional | Number of replicas in the Compute Group. Defaults to the example value |
| `spec.feSpec.requests` / `limits` | Optional | FE compute resource limits (recommended for production environments) |

The modified `spec` section roughly looks as follows (**Method A: FDB deployed on machines**):

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}      # Required: FDB client access address (machine deployment)
  feSpec:
    electionNumber: 1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}            # Required: BE image
      replicas: 2
      requests:
        cpu: 8
        memory: 8Gi
      limits:
        cpu: 8
        memory: 8Gi
```

**Method B: FDB deployed on K8s**: replace the `metaService.fdb` section with:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

To obtain the ConfigMap, run `kubectl get configmap` (see [Deploy FoundationDB - Get the ConfigMap with access information](install-fdb.md#get-the-configmap-containing-foundationdb-access-information) for details).

Parameter description:

| Parameter | Description |
|------|------|
| `${fdbEndpoint}` | FoundationDB client access address. For default Linux VM deployments, it is stored in `/etc/foundationdb/fdb.cluster`. See [FoundationDB cluster file documentation](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) for details |
| `${beImage}` | BE image. Use images provided by the [Apache Doris official image repository](https://hub.docker.com/r/apache/doris) |
| `${foundationdbConfigMapName}` | ConfigMap name generated by `fdb-kubernetes-operator` |
| `${namespace}` | Namespace where the ConfigMap resides |

### 3. Deploy and Verify

```shell
kubectl apply -f ddc-sample.yaml
```

After the resources are applied, wait for the cluster to be set up automatically. Check the cluster status with the following command:

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**Readiness criteria:** `CLUSTERHEALTH` is `green` and `CGAVAILABLECOUNT` equals `CGCOUNT`.

## Step 4: Create the Remote Storage Backend

**Input**: A running Doris cluster + S3-compatible object storage credentials
**Action**: Run SQL through a MySQL client to create and enable the Vault
**Output**: A configured storage backend that can be used for data persistence

After the cluster is started successfully, you need to register an object storage as a persistent storage backend through SQL (called a Vault in Doris) and set it as the default Vault, so that the written data can be persisted.

### 1. Get the Access Address of the FE Service

Run the following command to find the Service that can access the FE:

```shell
kubectl get svc
```

Example output:

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

Services without the `-internal` suffix are used for external access.

### 2. Connect Through a MySQL Client

Bring up a temporary Pod that contains the MySQL Client in the Kubernetes cluster and enter it:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Inside the Pod, use the FE Service name to connect to the Doris cluster:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Create a Storage Vault

Use SQL to create an object storage that supports the S3 protocol as a Vault. The following example uses Alibaba Cloud OSS:

```mysql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
        "s3.region" = "bj",
        "s3.bucket" = "bucket",
        "s3.root.path" = "big/data/prefix",
        "s3.access_key" = "your-ak",
        "s3.secret_key" = "your-sk",
        "provider" = "OSS"
    );
```

For the creation methods of other storage backends and the detailed description of each field, refer to [Managing Storage Vault](../../deploy-manually/separating-storage-compute-deploy-manually) in the compute-storage decoupled documentation.

### 4. Set the Default Storage Vault

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

Where `${vaultName}` is the name of the Vault you want to use (such as `s3_vault` from the previous step).

At this point, the cluster is ready to accept writes. The next step is to complete the end-to-end verification through SQL.

## Step 5: Connect to the Cluster and Verify End-to-End

**Input**: The MySQL connection established in Step 4
**Action**: Run verification SQL to confirm that the cluster is ready and can read and write normally
**Output**: An available cluster that has passed end-to-end verification

Continuing with the MySQL client connection established in Step 4 (if you have already exited, repeat [Step 4 - Connect Through a MySQL Client](#2-connect-through-a-mysql-client)), execute the following commands in order to complete the verification.

### 1. Confirm That BE Nodes Are Alive

```mysql
SHOW BACKENDS;
```

In the output, the `Alive` column of each BE node is `true`, indicating that the BEs in the Compute Group are ready and recognized by FE.

### 2. Confirm That the Storage Vault Is in Effect

```mysql
SHOW STORAGE VAULTS;
```

You should see the Vault created in Step 4 (such as `s3_vault`) in the output, with `IsDefault` being `true`, indicating that the storage backend is ready.

### 3. Write and Query Test Data

Run the following SQL in order to complete the full path of "create database, create table, write, query":

```mysql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE IF NOT EXISTS hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO hello VALUES (1, 'hello doris');
SELECT * FROM hello;
```

If the `SELECT` returns the written data, it indicates that the end-to-end path of FE to MetaService to Compute Group to Storage Vault is fully working, and the cluster is ready for use.

## Advanced Configuration

After completing the 5 steps above, the cluster is ready for use. In production scenarios, further customization is usually needed. Refer to the following index for the corresponding documentation:

| Topic | Reference Document | Main Content |
|--------|----------|----------|
| FoundationDB deployment details, two-replica/production mode, FQDN deployment, private image repository | [Deploy FoundationDB](install-fdb.md) | Complete principles and all deployment forms of FDB |
| Switch the MetaService image, adjust resources, customize startup parameters, adjust liveness probe timeout | [Configure MetaService](config-ms.md) | All fields under `spec.metaService.*` |
| Adjust FE resources, change the number of Followers, customize startup configuration, configure access mode (NodePort / LoadBalancer), persistent storage | [Configure FE](config-fe.md) | All fields under `spec.feSpec.*` |
| Single-group / multi-group Compute Groups, resource limits, access mode configuration, persistence of cache and logs | [Configure Compute Group](config-cg.md) | All fields under `spec.computeGroups[*]` |
| Set root / non-root admin user passwords, Secret credentials, mount Kerberos authentication files | [Configure Authentication](config-cluster.md) | Cluster-level credentials and Kerberos |
