---
{
    "title": "Install FoundationDB",
    "language": "en",
    "description": "Install a version-pinned FoundationDB Operator and database on Kubernetes, with mirrored images, resource planning, client compatibility and readiness checks.",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "VeloDB"
    ]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) (FDB) is a distributed database that provides strong consistency. Doris uses FoundationDB to store metadata in compute-storage decoupled mode.

Prepare a FoundationDB service before deploying Doris. Choose a deployment method based on your environment:

- Deploy directly on machines by following the [manual deployment guide](../../deploy-manually/separating-storage-compute-deploy-manually.md). Make sure MetaService can access FoundationDB after deployment.
- Deploy on Kubernetes with fdb-kubernetes-operator by following the steps below.

## Before you start

To deploy FoundationDB on Kubernetes, prepare:

- A Kubernetes account with permissions to create CRDs, RBAC resources and workloads.
- A writable SSD-backed StorageClass and nodes with enough capacity for the resources listed below.
- Working cluster DNS and connectivity from MetaService to FDB Pods.

The examples use FDB 7.3.69, which requires a compatible 7.3 client library in MetaService. If your Doris version uses a 7.1 client, follow the [FDB 7.1 instructions](#fdb-71). The Operator's client is used by the controller and does not update the client library in MetaService.

:::tip
This guide describes a new FDB installation. If an FDB Operator is already installed, check whether it can be reused to avoid multiple controllers managing the same namespace. CRDs are cluster-wide, so check compatibility with existing FDB clusters before updating them. Plan upgrades to existing clusters separately.
:::

## Versions and image sources

This guide uses the [deployment examples provided by Doris Operator](https://github.com/apache/doris-operator/tree/master/config/fdb/v2.35.0), with CRDs and an Operator based on v2.35.0. File sources and checksums are listed in the [version notes](https://github.com/apache/doris-operator/blob/master/config/fdb/v2.35.0/UPSTREAM.md). The examples use the following images:

| Component | Version | VeloDB image |
| --- | --- | --- |
| FDB Operator / matching CRDs | v2.35.0 | `velodb/fdb-kubernetes-operator:v2.35.0` |
| Controller client initializer / FDB database | 7.3.69 | `velodb/fdb-kubernetes-monitor:7.3.69` |

These images support linux/amd64 and linux/arm64. The examples use `imageType: unified`, so the FDB main container and sidecar share the Monitor image. The controller also uses this image to initialize its client.

Use the CRDs, Operator and cluster examples provided in this guide together. The older `config/operator/fdb-operator.yaml`, root FDB CRDs, cluster examples and `doris-foundationdb` Helm chart use different versions and cannot be used directly with this configuration.

## Resource planning {#resource-planning}

Plan resources for both the FDB Operator and the FDB cluster. The Operator requests and limits are **500m CPU / 256Mi**, and its client initializer requests and limits are **10m CPU / 50Mi**.

The Doris Operator repository provides single- and double-replica cluster examples. Choose one based on your usage:

| Setting | Single replica (development) | Double replica |
| --- | --- | --- |
| storage / log / stateless Pods | 1 / 1 / 2 | 3 / 4 / 9 |
| Main container requests per Pod | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Main container limits per Pod | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Sidecar requests = limits per Pod | 100m CPU / 256Mi | 100m CPU / 256Mi |
| PVC per storage / log Pod | 10Gi / 10Gi | 200Gi / 100Gi |
| Total Pods / PVCs | 4 / 2 | 16 / 7 |
| Total requests including sidecars | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| Total requested PVC capacity | 20Gi | 1000Gi |

The totals include sidecars and exclude the Operator, MS/FE/BE and Kubernetes overhead. Stateless Pods do not need persistent data PVCs. Reserve extra Pod and storage capacity for rolling replacements.

The single-replica example is intended for small functional tests. It uses reduced memory settings, so check memory/cache configuration and watch for OOM errors under your workload. The upstream default is 1 CPU / 8Gi per main container, with equal requests and limits; see [resource requirements](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements).

A double-replica cluster needs at least three independent host failure domains. After deployment, check that storage, log and coordinator processes are distributed appropriately across nodes. The examples use preferred anti-affinity, which allows multiple Pods of the same role on a node. If you require one Pod of each role per node, the nine stateless Pods need at least nine schedulable nodes. See [fault domain configuration](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md).

For production, use SSD storage and adjust resources based on metadata size, write load and recovery space. The example allocates 200Gi per storage Pod and 100Gi per log Pod; change these values as needed. When several Doris clusters share FDB, plan for their combined load and validate capacity before production use. Each storage/log Pod runs one server; adjust CPU and memory if you increase the number of processes.

## Deploy FoundationDB on Kubernetes

Deploying FoundationDB on Kubernetes involves four steps:

1. Download the deployment files.
2. Deploy the CRDs, FDB Operator and Monitor RBAC.
3. Deploy the FoundationDB cluster.
4. Check the cluster status.

The following steps use the `fdb-system` namespace. The Operator manages FDB clusters only in this namespace. To use another namespace, update the object namespaces and RBAC subject namespaces in the deployment files together.

### Step 1: Download the pinned installation assets

Replace `/path/to/kubeconfig` with the configuration file for your Kubernetes cluster, then check existing FDB resources, controllers and StorageClasses:

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

If FDB CRDs or a controller already exist, first check whether they can be reused. For a new environment, download the deployment files with the following commands:

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_ASSETS=https://raw.githubusercontent.com/apache/doris-operator/master/config/fdb/v2.35.0
FDB_EXAMPLES=https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/fdb/v2.35.0
for resource in clusters backups restores; do
  curl -fSL "$FDB_ASSETS/crds/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# Development profile. Use cluster-double.yaml instead for the double profile.
curl -fSL "$FDB_EXAMPLES/cluster-single.yaml" -o fdb-cluster.yaml
```

### Step 2: Install CRDs, the controller and Monitor RBAC

Use the VeloDB images listed above. The following command updates the downloaded Operator, initializer and cluster image settings to use the VeloDB repository:

```shell
sed -i.bak 's|selectdb/|velodb/|g' fdb-operator.yaml fdb-cluster.yaml
```

Deploy the CRDs, Operator and Monitor RBAC with the following commands:

```shell
kubectl --kubeconfig "$KUBECONFIG" create namespace fdb-system
kubectl --kubeconfig "$KUBECONFIG" apply --server-side \
  -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl --kubeconfig "$KUBECONFIG" wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-operator.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-monitor-rbac.yaml
```

When all three CRDs are Established and the Operator Deployment has rolled out successfully, continue with the FDB cluster. The CRDs use `--server-side` because the files are too large for the client-side last-applied annotation. If an existing resource conflicts, check its version and ownership before proceeding rather than overwriting it with `--force-conflicts`.

`fdb-monitor-rbac.yaml` creates a dedicated `fdb-monitor` ServiceAccount for FDB Pods, with get/list/watch/patch permissions on Pods in this namespace.

### Step 3: Configure and create the database

Open `fdb-cluster.yaml` and replace both `REPLACE_WITH_SSD_STORAGE_CLASS` values with your StorageClass. Adjust CPU, memory and PVC capacity using the resource planning section above. The single-replica example is for development; for production, choose double replication and size it for your workload.

The example already configures the Monitor ServiceAccount, host failure domain, FQDN routing and one server per Pod. When changing the configuration:

- Keep `spec.version`, `mainContainer.imageConfigs[].version` and `tag` consistent with the FDB version in the image. For 7.1, complete the [FDB 7.1 configuration](#fdb-71) first.
- The containers run with UID/GID 4059 and use `fsGroup: 4059` for volume permissions. Check that your CSI driver supports writes by this group. For custom images, adjust the identity to match the image.

After updating the configuration, deploy the cluster:

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

The single example creates `fdb-single`; the double example creates `fdb-double`. The following commands use `fdb-single`; substitute `fdb-double` when appropriate.

### Step 4: Verify availability and reconciliation

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

After deployment, check the following:

- Volumes are bound and the database containers start successfully. Pod Running alone is insufficient.
- `status.configured`, `status.health.available` and `status.health.fullReplication` are `true`.
- `status.generations.reconciled` has caught up with `metadata.generation`. An available database may still be reconciling replacements or shrink operations.

Once these checks pass, configure MetaService with the generated ConfigMap and verify that it connects to FDB before creating tables. Before production use, also validate cluster health, coordinator placement and availability during host failures.

## Get the ConfigMap that contains FoundationDB access information {#get-the-configmap-that-contains-foundationdb-access-information}

The Operator creates `<FoundationDBCluster name>-config` in the database namespace:

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get configmap fdb-single-config -o yaml
```

Configure the Doris resource as follows; use `fdb-double-config` for the double example:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        namespace: fdb-system
        name: fdb-single-config
```

Add this configuration to your `DorisDisaggregatedCluster` resource. For details, see [Configure MetaService](config-ms.md).

:::tip
Several Doris clusters can share one FDB. Keep the shared FDB when deleting an individual Doris cluster. Deleting FDB resources or PVCs can cause metadata loss, so prepare a backup and recovery plan.
:::

## Option for MetaService builds requiring FDB 7.1 {#fdb-71}

If MetaService uses a 7.1 client, you can create an FDB 7.1.67 cluster on amd64 nodes. Add the 7.1 client to the Operator with the following commands before deploying the FDB cluster:

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
sed -i.bak 's|selectdb/|velodb/|g' fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

Change `spec.version` and the main image config's `version` and `tag` to `7.1.67` in the copied cluster YAML. The 7.1.67 image is amd64-only: in mixed-architecture clusters, set `nodeSelector: {kubernetes.io/arch: amd64}` on the controller and every database Pod template. Use this configuration to create a new cluster compatible with your MetaService; it is not a procedure for downgrading an existing FDB cluster.

## Private registries and troubleshooting

If your environment cannot access Docker Hub, copy the required images to a private registry and update the deployment files:

- Operator and initializer: change `image`.
- FDB cluster: change `mainContainer.imageConfigs[].baseImage`, keeping the FDB version inside the image consistent with `spec.version`. In unified mode, the main container and sidecar share this image.
- If the registry requires authentication, configure `imagePullSecrets` in both the Operator and FDB Pod templates.

Include all enabled client initializer images and select platforms that match your nodes. Common deployment issues and checks are listed below:

| Symptom | Checks |
| --- | --- |
| Controller init fails / image cannot run | Mirror access, tag, node architecture; the optional 7.1 initializer is amd64-only |
| PVC or Pod Pending | StorageClass, CSI provisioning, capacity, resource requests, node selectors and anti-affinity |
| `File could not be written` | Volume ownership, UID/GID/fsGroup and CSI permission handling |
| FDB is not reconciled | Controller watch namespace/RBAC, Events, controller logs, replacement capacity and recovery progress |
| FDB is available but MS cannot connect | MetaService client compatibility, generated connection information, DNS and Pod networking |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

Keep shared CRDs, FDB clusters and PVCs while troubleshooting to protect data used by existing clusters.
