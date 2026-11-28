---
{
    "title": "Deploying a Complete Doris Compute-Storage Decoupled Cluster",
    "language": "en",
    "description": "Deploy a readable and writable Doris compute-storage decoupled test cluster on Kubernetes from scratch: deploy single-replica FoundationDB, deploy Doris Operator, create a DorisDisaggregatedCluster with 1 FE, 1 MS, and 1 compute group, create a Storage Vault on existing object storage, and verify reads and writes.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault", "DorisDisaggregatedCluster"]
}
---

This document is for users who are deploying a Doris compute-storage decoupled cluster on Kubernetes for the first time. After completing the following 5 steps in order, you will have a test cluster that you can read from and write to:

1. Deploy single-replica FoundationDB (FDB) on Kubernetes to store metadata.
2. Deploy Doris Operator.
3. Deploy a compute-storage decoupled cluster with 1 FE, 1 MetaService (MS), and 1 compute group (1 BE).
4. Create a Storage Vault on the object storage that you have prepared.
5. Create a table, write data, and query it to verify the cluster end to end.

## Deployment outcome

| Component | Namespace | Description |
| --- | --- | --- |
| FoundationDB | `fdb-system` | 1 single-replica cluster (4 Pods) that stores metadata, for development and testing only |
| Doris Operator | `doris` | 1 Pod that manages Doris clusters |
| MetaService (MS) | `doris` | 1 Pod, the metadata service that reads and writes FoundationDB |
| FE | `doris` | 1 Pod for SQL parsing and query coordination, with metadata stored in a PVC |
| Compute group `cg1` | `doris` | 1 BE that runs queries and loads; its local disk is used only as cache |
| Storage Vault `s3_vault` | - | Points to the object storage you provide; table data is written to it |

## Before you start

1. Complete checks 1 to 5 of the [preparation checks](../doris-operator/preparation.mdx). All Pods in this tutorial request about 11 CPU / 16.25Gi in total.
2. Collect the endpoint, region, bucket, data path prefix, Access Key / Secret Key, and provider as described in [Prepare object storage](../doris-operator/preparation.mdx#object-storage), and make sure that the Kubernetes nodes can reach the endpoint. **Object storage is required**: without a Storage Vault, the cluster can start but cannot create tables or write data.
3. Decide which StorageClass FoundationDB uses. Run `kubectl get storageclass` to list the available StorageClasses. Use SSD-backed storage in production.

This document uses the following versions as examples:

| Component | Version | Description |
| --- | --- | --- |
| Doris Operator | 26.0.1 | Image `apache/doris:operator-26.0.1` |
| Doris FE, MS, BE | 4.1.5 | All three must use the same version. The MS image includes FoundationDB 7.1 and 7.3 clients |
| FoundationDB Operator | v2.35.0 | Image `velodb/fdb-kubernetes-operator:v2.35.0` |
| FoundationDB | 7.3.69 | Image `velodb/fdb-kubernetes-monitor:7.3.69` |

:::info Source of the FoundationDB deployment files
The FDB CRDs, FDB Operator manifest, cluster example, and images used in Step 1 are published by VeloDB. The download URLs are pinned to commit `d062b417991432f511bf907ba8649bf919ebc17d` of the [velodb/fdb-kubernetes-operator](https://github.com/velodb/fdb-kubernetes-operator) repository so that every download returns the same content. If you can only use artifacts published by Apache Doris, [use an existing FoundationDB](#use-existing-fdb) instead.
:::

## Step 1: Deploy FoundationDB

A compute-storage decoupled cluster stores its metadata in FoundationDB, so an available FoundationDB is required before you deploy Doris. Choose a deployment method based on your existing infrastructure:

| Deployment method | Applicable scenario | Action |
| --- | --- | --- |
| Deploy on Kubernetes | Development and testing, or managing FDB in Kubernetes | Follow sections 1 to 5 of this step |
| Use an existing FDB, or deploy FDB on machines | An FDB cluster already exists, or FDB should run independently of Kubernetes | See [Use an existing FoundationDB](#use-existing-fdb), then go to Step 2 |

This step uses a single-replica FDB cluster as an example. It requests 4.4 CPU / 5Gi in total including sidecars and needs two 10Gi PVCs. **It is not suitable for production.** For the double-replica configuration, resource planning, the FDB 7.1 option, private registries, and more troubleshooting methods, see [Deploy FoundationDB](install-fdb.md).

### 1. Download the deployment files

```shell
FDB_REF=d062b417991432f511bf907ba8649bf919ebc17d
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/${FDB_REF}/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/${FDB_REF}/config/samples/velodb
mkdir -p fdb-install && cd fdb-install
for resource in clusters backups restores; do
  curl -fsSL "${FDB_CRDS}/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fsSL "${FDB_ASSETS}/operator.yaml" -o fdb-operator.yaml
curl -fsSL "${FDB_ASSETS}/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
curl -fsSL "${FDB_ASSETS}/cluster-single.yaml" -o fdb-cluster.yaml
ls
```

Expected output:

```text
fdb-backups-crd.yaml
fdb-cluster.yaml
fdb-clusters-crd.yaml
fdb-monitor-rbac.yaml
fdb-operator.yaml
fdb-restores-crd.yaml
```

### 2. Install the CRDs, FDB Operator, and Monitor RBAC

If FDB CRDs or an FDB Operator already exist in the cluster, check whether they can be reused as described in [Deploy FoundationDB](install-fdb.md), and do not overwrite CRDs that other teams are using. For a new environment, run the following commands:

```shell
kubectl create namespace fdb-system --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl -n fdb-system apply -f fdb-operator.yaml
kubectl -n fdb-system rollout status deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl -n fdb-system apply -f fdb-monitor-rbac.yaml
```

Expected output:

```text
namespace/fdb-system created
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org condition met
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org condition met
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org condition met
serviceaccount/fdb-kubernetes-operator-controller-manager created
clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
deployment.apps/fdb-kubernetes-operator-controller-manager created
deployment "fdb-kubernetes-operator-controller-manager" successfully rolled out
serviceaccount/fdb-monitor created
role.rbac.authorization.k8s.io/fdb-monitor created
rolebinding.rbac.authorization.k8s.io/fdb-monitor created
```

The FDB Operator manages only the FDB clusters in the `fdb-system` namespace. These commands can be run repeatedly; when you run them again, `created` in the output changes to `unchanged`.

### 3. Create the FoundationDB cluster

Replace the StorageClass placeholder in `fdb-cluster.yaml` with the StorageClass that you use. The following example uses `standard`; replace it with your StorageClass:

```shell
STORAGE_CLASS=standard
sed -i.bak "s/REPLACE_WITH_SSD_STORAGE_CLASS/${STORAGE_CLASS}/g" fdb-cluster.yaml
grep -n "storageClassName" fdb-cluster.yaml
```

Expected output (both occurrences are replaced):

```text
103:          storageClassName: standard
156:          storageClassName: standard
```

Create the FDB cluster:

```shell
kubectl -n fdb-system apply -f fdb-cluster.yaml
```

Expected output:

```text
foundationdbcluster.apps.foundationdb.org/fdb-single created
```

### 4. Wait for FoundationDB to become ready

```shell
kubectl -n fdb-system wait --for=jsonpath='{.status.health.available}'=true \
  foundationdbcluster/fdb-single --timeout=900s
kubectl -n fdb-system get fdb fdb-single
kubectl -n fdb-system get fdb fdb-single -o jsonpath='configured={.status.configured} available={.status.health.available} fullReplication={.status.health.fullReplication} generation={.metadata.generation} reconciled={.status.generations.reconciled}{"\n"}'
```

Expected output:

```text
foundationdbcluster.apps.foundationdb.org/fdb-single condition met
NAME         GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
fdb-single   1            1            true        true              7.3.69    2m28s
configured=true available=true fullReplication=true generation=1 reconciled=1
```

FDB is ready when `configured`, `available`, and `fullReplication` are all `true` and `reconciled` equals `generation`. Running Pods alone do not mean that FDB is available. After the FDB images are pulled, the cluster is usually ready within 3 minutes.

Check the Pods and PVCs:

```shell
kubectl -n fdb-system get pods,pvc
```

Expected output:

```text
NAME                                                              READY   STATUS    RESTARTS   AGE
pod/fdb-kubernetes-operator-controller-manager-658c6b44d5-ckcdd   1/1     Running   0          3m3s
pod/fdb-single-log-57659                                          2/2     Running   0          2m29s
pod/fdb-single-stateless-17701                                    2/2     Running   0          2m29s
pod/fdb-single-stateless-42431                                    2/2     Running   0          2m29s
pod/fdb-single-storage-92513                                      2/2     Running   0          2m29s

NAME                                                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/fdb-single-log-57659-data       Bound    pvc-cac044d8-9dce-421e-8c8f-a24f7d4981b5   10Gi       RWO            standard       <unset>                 2m29s
persistentvolumeclaim/fdb-single-storage-92513-data   Bound    pvc-6b13224b-1ea5-43e3-91ce-40cad1c9530a   10Gi       RWO            standard       <unset>                 2m29s
```

If FDB is not ready for a long time, check the events and the FDB Operator logs:

```shell
kubectl -n fdb-system get events --sort-by=.lastTimestamp
kubectl -n fdb-system logs deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

Common causes include a wrong StorageClass that prevents PVCs from being created, insufficient node resources, and volumes that do not grant write permission to `fsGroup: 4059`. For more troubleshooting methods, see [Deploy FoundationDB](install-fdb.md#private-registries-and-troubleshooting).

### 5. Check the connection information

The FDB Operator creates a ConfigMap named `fdb-single-config` in `fdb-system`. Its `cluster-file` is the connection string of FDB:

```shell
kubectl -n fdb-system get configmap fdb-single-config -o jsonpath='{.data.cluster-file}{"\n"}'
```

The output is similar to the following:

```text
fdb_single:CkSr0MxcWyVky600RxkO7zXqwuTK1TcM@fdb-single-log-57659.fdb-single.fdb-system.svc.cluster.local:4501
```

The connection string has the format `<description>:<ID>@<address>:<port>`. The Doris cluster in Step 3 references this ConfigMap (namespace `fdb-system`, name `fdb-single-config`) through `spec.metaService.fdb.configMapNamespaceName`. Doris Operator reads `cluster-file` and passes it to MS when it creates MS, so deploy the Doris cluster only after `cluster-file` appears in the ConfigMap.

### Use an existing FoundationDB {#use-existing-fdb}

If an FDB cluster already exists, or if you deployed FDB on machines as described in [Deploy a Compute-Storage Decoupled Cluster Manually](../../deploy-manually/separating-storage-compute-deploy-manually.md), skip sections 1 to 5 of this step:

1. Get the connection string on any FDB node. With the official FDB packages, the connection string is in `/etc/foundationdb/fdb.cluster`. With the `fdb_ctl.sh` script provided by Doris, it is in `conf/fdb.cluster` under the FDB installation directory.

   ```shell
   cat /etc/foundationdb/fdb.cluster
   ```

   The connection string has the format `<description>:<ID>@<IP>:<port>[,<IP>:<port>...]`, for example `doris_fdb:ra7eOp7x@192.168.1.10:4500,192.168.1.11:4500,192.168.1.12:4500`.

2. In the YAML of Step 3, replace the `configMapNamespaceName` section under `spec.metaService.fdb` with `address`:

   ```yaml
   spec:
     metaService:
       fdb:
         address: "doris_fdb:ra7eOp7x@192.168.1.10:4500,192.168.1.11:4500,192.168.1.12:4500"
   ```

3. Make sure that the Kubernetes nodes running MS can reach all addresses and ports in the connection string, and that the FDB server version is 7.1 or 7.3 (the Doris 4.1.5 MS image includes clients for both series).

## Step 2: Deploy Doris Operator

This step uses Doris Operator 26.0.1 as an example to describe how to install Doris Operator. The namespaces are used as follows: `fdb-system` holds the FDB resources, and `doris` holds Doris Operator and the Doris cluster. The ClusterRole of Doris Operator can read ConfigMaps in all namespaces, so the Operator can read the FDB connection information in `fdb-system` across namespaces.

### 1. Install the CRDs

```shell
DORIS_OPERATOR_VERSION=26.0.1
kubectl apply --server-side -f https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/crd/bases/crds.yaml
kubectl wait --for=condition=Established --timeout=60s \
  crd/dorisclusters.doris.selectdb.com \
  crd/dorisdisaggregatedclusters.disaggregated.cluster.doris.com
```

Expected output:

```text
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com condition met
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com condition met
```

`crds.yaml` contains the CRDs of both the integrated storage and compute mode and the compute-storage decoupled mode. If you have already deployed an integrated storage and compute cluster, you can run this command again without errors.

### 2. Deploy the Operator

Download the deployment manifest for the compute-storage decoupled mode and pin its image to `apache/doris:operator-26.0.1`:

```shell
curl -fsSL -o doris-operator.yaml \
  https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/operator/disaggregated-operator.yaml
sed -i.bak "s#apache/doris:operator-latest#apache/doris:operator-${DORIS_OPERATOR_VERSION}#" doris-operator.yaml
grep 'image:' doris-operator.yaml
kubectl apply -f doris-operator.yaml
kubectl -n doris rollout status deployment/doris-operator --timeout=300s
```

Expected output:

```text
          image: apache/doris:operator-26.0.1
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
validatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-validate-webhook created
mutatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-mutate-webhook created
secret/doris-operator-secret-cert created
service/doris-operator-service created
deployment.apps/doris-operator created
deployment "doris-operator" successfully rolled out
```

Compared with `operator.yaml` used by the integrated storage and compute mode, `disaggregated-operator.yaml` additionally grants the Pod `update` and `delete` permissions and the `pods/exec` permission required by the compute-storage decoupled controller. If you have already installed the Operator by following the integrated storage and compute tutorial, the output of these commands contains `configured` and `unchanged`: the existing resources with the same names are updated in place, the Operator is not restarted, and the deployed integrated storage and compute clusters are not affected. For details, see [Run both modes in one cluster](../integrated-storage-compute/install-doris-operator.md#run-both-modes).

## Step 3: Deploy the compute-storage decoupled cluster

### 1. Write the DorisDisaggregatedCluster resource {#ddc-manifest}

Save the following content as `ddc-sample.yaml`:

```yaml
apiVersion: disaggregated.cluster.doris.com/v1
kind: DorisDisaggregatedCluster
metadata:
  name: test-disaggregated-cluster
  namespace: doris
spec:
  metaService:
    image: apache/doris:ms-4.1.5
    replicas: 1
    requests:
      cpu: 1
      memory: 1Gi
    limits:
      cpu: 2
      memory: 2Gi
    fdb:
      configMapNamespaceName:
        name: fdb-single-config
        namespace: fdb-system
  feSpec:
    image: apache/doris:fe-4.1.5
    replicas: 1
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 10Gi
    persistentVolumes:
    - logNotStore: true
      persistentVolumeClaimSpec:
        # Without storageClassName, the default StorageClass of the cluster is used
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
  computeGroups:
  - uniqueId: cg1
    image: apache/doris:be-4.1.5
    replicas: 1
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 8Gi
```

Key fields:

| Field | Value in the example | Description |
| --- | --- | --- |
| `metadata.namespace` | `doris` | The same namespace as Doris Operator. All subsequent commands in this tutorial use `-n doris` |
| `metaService.image`, `feSpec.image`, `computeGroups[].image` | `apache/doris:ms-4.1.5`, `fe-4.1.5`, `be-4.1.5` | MS, FE, and BE must use the same version |
| `metaService.fdb.configMapNamespaceName` | `fdb-system` / `fdb-single-config` | The FDB connection information generated in Step 1. To use an existing FDB, use `address` instead; see [Use an existing FoundationDB](#use-existing-fdb) |
| `feSpec.replicas` | 1 | The number of FE Followers is set by `electionNumber`, which defaults to 1 and cannot be changed after deployment. For production, plan it before deployment; see [Configure FE](config-fe.md#configure-the-number-of-follower-nodes) |
| `feSpec.persistentVolumes` | 10Gi, `logNotStore: true` | Creates a PVC for the FE metadata directory; logs are not written to a PVC. Without persistent storage, FE metadata is lost when FE is rebuilt |
| `computeGroups[].uniqueId` | `cg1` | The compute group name. It cannot be changed after deployment and must match `[a-zA-Z][0-9a-zA-Z_]+` |
| `computeGroups[].replicas` | 1 | The number of BEs in the compute group. The local disk of a BE is used only as data cache. The cache is not persisted in this example, so it needs to be loaded again after a BE is rebuilt |
| `requests` / `limits` | FE: 2 CPU / 4Gi, up to 4 CPU / 10Gi<br />MS: 1 CPU / 1Gi, up to 2 CPU / 2Gi<br />BE: 2 CPU / 4Gi, up to 4 CPU / 8Gi | A functional test size. The default maximum JVM heap of the FE image is 8 GB, so the FE memory limit is set to 10Gi |

### 2. Deploy and wait for the cluster to become ready

```shell
kubectl -n doris apply -f ddc-sample.yaml
kubectl -n doris wait --for=jsonpath='{.status.clusterHealth.health}'=green \
  ddc/test-disaggregated-cluster --timeout=900s
kubectl -n doris wait --for=jsonpath='{.status.clusterHealth.cgFullAvailableCount}'=1 \
  ddc/test-disaggregated-cluster --timeout=900s
kubectl -n doris get ddc test-disaggregated-cluster
```

Expected output:

```text
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster created
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster condition met
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster condition met
NAME                         CLUSTERHEALTH   MSPHASE   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     Ready     1         1                  1
```

The Operator creates MS, FE, and the compute groups in this order. After the images are pulled, the cluster is usually ready within 2 minutes. The columns mean the following:

| Column | Meaning |
| --- | --- |
| `CLUSTERHEALTH` | The overall cluster status. It is `green` when MS and FE are both `Ready` and every compute group has at least one available BE; `red` when MS or FE is unavailable, or at most half of the compute groups are available; and `yellow` otherwise |
| `MSPHASE`, `FEPHASE` | The status of MS and FE; `Ready` when they are ready |
| `CGCOUNT` | The number of compute groups |
| `CGAVAILABLECOUNT` | The number of compute groups that have at least one available BE |
| `CGFULLAVAILABLECOUNT` | The number of compute groups in which all BEs are ready |

The cluster is ready when `CLUSTERHEALTH` is `green` and `CGFULLAVAILABLECOUNT` equals `CGCOUNT`. `CGAVAILABLECOUNT` only means that a compute group is available, not that all BEs in the group are ready. If you have multiple compute groups, change `1` in the second `wait` command to the number of compute groups.

Check the Pods and PVCs:

```shell
kubectl -n doris get pods,pvc -l app.doris.disaggregated.cluster=test-disaggregated-cluster
```

Expected output:

```text
NAME                                   READY   STATUS    RESTARTS      AGE
pod/test-disaggregated-cluster-cg1-0   1/1     Running   2 (36s ago)   41s
pod/test-disaggregated-cluster-fe-0    1/1     Running   0             90s
pod/test-disaggregated-cluster-ms-0    1/1     Running   0             96s

NAME                                                               STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/doris-meta-test-disaggregated-cluster-fe-0   Bound    pvc-e0cb2d96-2814-40cb-8e70-2277cd11a3e4   10Gi       RWO            standard       <unset>                 90s
```

During the first deployment, BE may restart once or twice (`RESTARTS` is not 0) because it retries registering itself in FE. This is expected as long as it ends up `1/1 Running`.

Check that MS is connected to FDB:

```shell
kubectl -n doris logs test-disaggregated-cluster-ms-0 | grep -E "fdb txn kv is initialized|MetaService has been started"
```

Expected output:

```text
I20261128 09:55:46.269853   231 txn_kv.cpp:162] fdb txn kv is initialized
I20261128 09:55:46.276001   231 main.cpp:292] MetaService has been started successfully
```

When MS starts, it may log a warning that contains `The protocol version of the cluster has changed`. This is a normal log line written while the FDB multi-version client selects the matching version, and you can ignore it.

If the wait times out, troubleshoot as follows:

| Symptom | Possible causes and solutions |
| --- | --- |
| MS keeps restarting, or its logs do not contain `fdb txn kv is initialized` | FDB is not ready, the ConfigMap name or namespace is wrong, or MS cannot reach FDB. Run `kubectl -n doris describe ddc test-disaggregated-cluster`. If the Events contain `FDBAddressNotConfiged`, the Operator did not read `cluster-file` from the ConfigMap; go back to section 5 of Step 1 |
| A Pod is `Pending`, `ImagePullBackOff`, or `ErrImagePull` | The solutions are the same as for the integrated storage and compute mode; see [Troubleshoot deployment issues](../integrated-storage-compute/install-doris-cluster.md#troubleshooting) |
| BE is `Init:CrashLoopBackOff` | Run `kubectl -n doris logs test-disaggregated-cluster-cg1-0 -c default-init`. If the exit code is 32, swap is usually enabled on the node; see [Check node swap](../doris-operator/preparation.mdx#node-swap) |
| BE keeps `CrashLoopBackOff` | Run `kubectl -n doris logs test-disaggregated-cluster-cg1-0 --previous` to view the logs of the previous start |

## Step 4: Create a Storage Vault {#create-storage-vault}

### 1. Connect to FE

The FE image includes a MySQL client, so you can connect to the cluster from inside the FE Pod:

```shell
kubectl -n doris exec -it test-disaggregated-cluster-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot
```

After the first deployment, the `root` user has no password. If a MySQL client is installed on your local computer, you can also run `kubectl -n doris port-forward svc/test-disaggregated-cluster-fe 9030:9030` first, and then run `mysql -h 127.0.0.1 -P 9030 -uroot` in another terminal. For long-term access from outside the cluster, see [Configure FE](config-fe.md#access-configuration).

At this point, there is no Storage Vault yet, so creating a table fails with:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = No default storage vault. You can use `SHOW STORAGE VAULT` to get all available vaults, and pick one set default vault with `SET <vault_name> AS DEFAULT STORAGE VAULT`
```

### 2. Create the Storage Vault

Replace the placeholders in the following statement with the information collected in [Prepare object storage](../doris-operator/preparation.mdx#object-storage):

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "<endpoint>",
    "s3.region" = "<region>",
    "s3.bucket" = "<bucket>",
    "s3.root.path" = "<prefix>",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>",
    "provider" = "<provider>",
    "use_path_style" = "<true_or_false>"
);
```

For example, with Alibaba Cloud OSS in the Beijing region:

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "cn-beijing",
    "s3.bucket" = "doris-data",
    "s3.root.path" = "doris/test-disaggregated-cluster",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>",
    "provider" = "OSS",
    "use_path_style" = "false"
);
```

For an S3-compatible service that you deploy yourself in the Kubernetes cluster, set `s3.endpoint` to the address of its Service, `provider` to `S3`, and `use_path_style` to `true`, for example `"s3.endpoint" = "http://<service>.<namespace>.svc.cluster.local:9000"`.

Expected output:

```text
Query OK, 0 rows affected (0.47 sec)
```

When you create a Storage Vault, FE accesses the object storage to check the endpoint, the credentials, and the put, head, delete, list, and multipartUpload permissions. If the check fails, the Storage Vault is not created. Common errors:

| Error message | Cause |
| --- | --- |
| `pingS3 failed(put)` with `Status Code: 403` | The Access Key / Secret Key is wrong, or the credentials lack write permission on the prefix |
| `pingS3 failed(put)` with `UnknownHostException` | The endpoint is wrong, or the endpoint domain name cannot be resolved inside the Pod |

For the properties and examples of each cloud provider, see [Managing Storage Vaults](../../../compute-storage-decoupled/managing-storage-vault.md). A Storage Vault cannot be deleted after it is created, so confirm the properties before you create it.

### 3. Set the default Storage Vault

```sql
SET s3_vault AS DEFAULT STORAGE VAULT;
SHOW STORAGE VAULTS\G
```

The output is similar to the following:

```text
*************************** 1. row ***************************
     Name: s3_vault
       Id: 1
Propeties: ctime: 1795859872 mtime: 1795859872 ak: "<access_key>" sk: "xxxxxxx" bucket: "<bucket>" prefix: "<prefix>" endpoint: "http://<endpoint>" region: "<region>" provider: <provider> external_endpoint: "" encryption_info { encryption_method: "AES_256_ECB" key_id: 1 } sse_enabled: false use_path_style: <true_or_false>
IsDefault: true
```

`IsDefault` is `true`, so tables created without a specified Storage Vault are written to `s3_vault`. The Secret Key is shown as `xxxxxxx`. If `s3.endpoint` has no scheme, Doris prepends `http://`.

## Step 5: Verify reads and writes

Run the following statements in the same MySQL connection.

### 1. Check the FE and BE status

```sql
SHOW FRONTENDS\G
SHOW BACKENDS\G
```

Expected output (excerpt):

```text
*************************** 1. row ***************************
              Name: fe_bb3b1189_fe1c_4b2a_888f_e626ee55a63a
              Host: test-disaggregated-cluster-fe-0.test-disaggregated-cluster-fe-internal.doris.svc.cluster.local
              ...
              Role: FOLLOWER
          IsMaster: true
              ...
             Alive: true
              ...
1 row in set (0.00 sec)

*************************** 1. row ***************************
              BackendId: 1795859798462
                   Host: test-disaggregated-cluster-cg1-0.test-disaggregated-cluster-cg1.doris.svc.cluster.local
                   ...
                  Alive: true
                   ...
                    Tag: {"cloud_unique_id" : "1:1814801713:OU2S2nox", "compute_group_status" : "NORMAL", "private_endpoint" : "", "compute_group_name" : "cg1", "location" : "default", "public_endpoint" : "", "compute_group_id" : "AoxMKnwT"}
                   ...
1 row in set (0.00 sec)
```

`SHOW FRONTENDS` returns one row in which `IsMaster` and `Alive` are both `true`. `SHOW BACKENDS` returns as many rows as there are BEs in all compute groups (1 in this tutorial); `Alive` is `true`, and `compute_group_name` in `Tag` is `cg1`.

### 2. Write and query test data

```sql
CREATE DATABASE IF NOT EXISTS k8s_demo;
DROP TABLE IF EXISTS k8s_demo.hello;
CREATE TABLE k8s_demo.hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;
INSERT INTO k8s_demo.hello VALUES (1, 'hello doris');
SELECT * FROM k8s_demo.hello;
```

Expected output of `INSERT`:

```text
Query OK, 1 row affected (0.24 sec)
{'label':'label_7703464ad56a4432_afeb67948cec9a2c', 'status':'VISIBLE', 'txnId':'1425240708096'}
```

Expected output of `SELECT`:

```text
+------+-------------+
| id   | msg         |
+------+-------------+
|    1 | hello doris |
+------+-------------+
1 row in set (0.04 sec)
```

`k8s_demo.hello` is used only for verification. These statements drop and recreate the table first, so you can run them repeatedly, and each run should return exactly this row. In the compute-storage decoupled mode, data is written to object storage, so the table does not need a replica count. If the query returns this row and new files appear under the `s3.root.path` prefix in the object storage, the read and write path formed by FE, MetaService, FDB, the compute group, and the Storage Vault works.

The cluster can now read and write data. If you delete the FE or BE Pod, the Pod is rebuilt automatically and the written data can still be queried: FE metadata is stored in a PVC, and table data is stored in object storage.

## Before production use

This tutorial produces a test cluster that can read and write data. It differs from a production-ready cluster in the following ways:

| Item | This tutorial | Recommendation for production |
| --- | --- | --- |
| FoundationDB | Single replica with reduced memory settings | Double replication with at least three independent host failure domains; see [Deploy FoundationDB](install-fdb.md) |
| FE | 1 Follower | Plan the number of Followers before deployment; see [Configure FE](config-fe.md) |
| Compute groups | 1 BE without persistent cache | Plan compute groups and BEs based on the workload, and configure persistent storage for the cache; see [Configure Compute Groups](config-cg.md) |
| Resources | `requests` are smaller than `limits` | Plan resources based on the workload and set `requests` and `limits` to the same values |
| Authentication | The `root` user has no password | Set the root password and admin users; see [Configure Authentication](config-cluster.md) |

## Clean up the test cluster

Delete the resources in the following order. Before deleting them, make sure that they are not used by other Doris clusters:

1. Delete the Doris cluster. The PVC of FE metadata is kept:

   ```shell
   kubectl -n doris delete ddc test-disaggregated-cluster
   kubectl -n doris delete pvc -l app.doris.disaggregated.cluster=test-disaggregated-cluster
   ```

2. Delete the FoundationDB cluster. The FDB Operator also deletes the FDB PVCs and ConfigMap, and **all metadata in FDB is lost and cannot be recovered**. Do not run this step if multiple Doris clusters share the same FDB:

   ```shell
   kubectl -n fdb-system delete foundationdbcluster fdb-single
   ```

3. Data under the `s3.root.path` prefix in the object storage is not deleted automatically. If you no longer need it, delete the prefix in the object storage manually.

## Advanced Configuration

After completing the 5 steps above, you can customize the cluster further as needed:

| Topic | Reference | Main content |
|--------|----------|----------|
| FoundationDB deployment details, double replication/production mode, FDB 7.1, private image registries | [Deploy FoundationDB](install-fdb.md) | Complete principles and all deployment forms of FDB |
| Switch the MetaService image, adjust resources, customize startup parameters, adjust the liveness probe timeout | [Configure MetaService](config-ms.md) | All `spec.metaService.*` fields |
| Adjust FE resources, change the number of Followers, customize startup configuration, configure access modes (NodePort / LoadBalancer), persistent storage | [Configure FE](config-fe.md) | All `spec.feSpec.*` fields |
| Single/multiple compute groups, resource limits, access modes, persistence of cache and logs | [Configure Compute Groups](config-cg.md) | All `spec.computeGroups[*]` fields |
| Set the root / non-root admin user password, Secret credentials, mount Kerberos authentication files | [Configure Authentication](config-cluster.md) | Cluster-level credentials and Kerberos |
| Scale BEs, add or remove compute groups, check scale-in and PVC cleanup | [Scale Compute Capacity](config-cg.md#scaling-compute-groups) | Operation steps, decommissioning behavior, and result verification |
