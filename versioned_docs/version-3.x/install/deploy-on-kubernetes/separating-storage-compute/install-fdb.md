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
        "SelectDB",
        "VeloDB"
    ]
}
---

FoundationDB (FDB) stores metadata for Doris compute-storage decoupled clusters. You can reuse a reachable existing FDB or [deploy it on machines](../../deploy-manually/separating-storage-compute-deploy-manually.md). This guide covers a **fresh Kubernetes installation**; it does not upgrade existing databases, controllers or shared CRDs.

## Before you start

- Check existing FDB controllers and databases before installing anything. CRDs are cluster-wide. Reuse a compatible controller instead of deploying another controller with overlapping watch scope; do not replace shared CRDs without an upgrade plan.
- Prepare Kubernetes permissions for CRDs/RBAC/workloads, a writable SSD-backed StorageClass, working cluster DNS and connectivity from MetaService to FDB Pods.
- Check the FoundationDB client library included in your **MetaService build**. The 7.3.69 example requires a compatible 7.3 client. An Operator client initializer does not update MetaService. For builds requiring 7.1, follow [the 7.1 option](#fdb-71) before creating a database.
- These resource presets are planning examples, not universal minimum requirements or production-capacity certification. Validate the chosen combination with your Doris build and workload before production.

## Versions and image sources

The installation uses [versioned assets in Doris Operator](https://github.com/apache/doris-operator/tree/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0), with CRDs copied unchanged from FoundationDB Operator v2.35.0. [Provenance and SHA-256 checksums](https://github.com/apache/doris-operator/blob/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0/UPSTREAM.md) identify the upstream revision. All installation URLs below are pinned to the same Doris Operator commit.

| Component | Version | SelectDB image | VeloDB alternative |
| --- | --- | --- | --- |
| FDB Operator / matching CRDs | v2.35.0 | `selectdb/fdb-kubernetes-operator:v2.35.0` | `velodb/fdb-kubernetes-operator:v2.35.0` |
| Controller client initializer / FDB database | 7.3.69 | `selectdb/fdb-kubernetes-monitor:7.3.69` | `velodb/fdb-kubernetes-monitor:7.3.69` |

Both listed image tags support linux/amd64 and linux/arm64. The database uses `imageType: unified`: the main image supplies both the `foundationdb` and `foundationdb-kubernetes-sidecar` containers. No separate split sidecar image is required. The controller initializer is a separate use of the Monitor image.

Do not combine this versioned bundle with the legacy `config/operator/fdb-operator.yaml`, root FDB CRDs, older cluster examples or the legacy `doris-foundationdb` Helm chart. Changing an image namespace alone does not make their versions compatible.

## Resource planning {#resource-planning}

FDB Operator is a controller, not the database. Its example requests and limits are **500m CPU / 256Mi**; its client initializer requests and limits are **10m CPU / 50Mi**. Database sizing is separate:

| Setting | Single replica: development only | Double replica: starting configuration |
| --- | --- | --- |
| storage / log / stateless Pods | 1 / 1 / 2 | 3 / 4 / 9 |
| Main container requests per Pod | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Main container limits per Pod | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Sidecar requests = limits per Pod | 100m CPU / 256Mi | 100m CPU / 256Mi |
| PVC per storage / log Pod | 10Gi / 10Gi | 200Gi / 100Gi |
| Total Pods / PVCs | 4 / 2 | 16 / 7 |
| Total requests including sidecars | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| Total requested PVC capacity | 20Gi | 1000Gi |

Totals are calculated from the sample YAML. They exclude the Operator, MS/FE/BE, Kubernetes overhead and temporary replacement Pods/PVCs. Stateless Pods have no persistent data PVC. The low-memory single profile is only for small functional tests; check memory/cache configuration and OOM behavior under your workload. Upstream's default main-container request is 1 CPU / 8Gi, with the same limits; see [upstream resource requirements](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements).

For double replication, provide at least three independent host failure domains and check actual storage/log/coordinator placement. Pod count is not host count. Preferred anti-affinity is a placement preference, not a guarantee. Requiring one same-role Pod per node would need at least nine schedulable nodes for the nine stateless Pods. See [upstream fault domains](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md).

Use SSD storage and size storage/log PVCs for aggregate metadata volume, write load, replication and recovery headroom across all Doris clusters sharing FDB. The 200Gi / 100Gi values are adjustable starting points, not workload-independent recommendations. Keep one storage/log server per Pod unless you recalculate resources for multiple servers.

## Deploy FoundationDB on Kubernetes

The example uses `fdb-system` for both controller and database. The controller only watches its own namespace. To use another namespace, change every namespaced object and RBAC subject namespace in the downloaded files together.

### Step 1: Download the pinned installation assets

Set your kubeconfig explicitly. Check existing installations and StorageClasses:

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

An existing FDB CRD/controller requires compatibility review before proceeding. Otherwise download the paired files into a new local directory:

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_ASSETS=https://raw.githubusercontent.com/apache/doris-operator/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0
FDB_EXAMPLES=https://raw.githubusercontent.com/apache/doris-operator/9e8feacc6518a4d6d254a42998355a4d58cbd820/doc/examples/disaggregated/fdb/v2.35.0
for resource in clusters backups restores; do
  curl -fSL "$FDB_ASSETS/crds/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# Development profile. Use cluster-double.yaml instead for the double profile.
curl -fSL "$FDB_EXAMPLES/cluster-single.yaml" -o fdb-cluster.yaml
```

### Step 2: Install CRDs, the controller and Monitor RBAC

Review all downloaded files first. To use VeloDB mirrors, replace `selectdb/` with `velodb/` in the Operator image, initializer image and database image config, keeping the version tags.

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

Expected results: all three CRDs become Established and the controller Deployment rolls out successfully. Server-side apply avoids the large client-side last-applied annotation; do not use `--force-conflicts` to overwrite an existing installation.

Monitor RBAC uses a dedicated `fdb-monitor` ServiceAccount and grants only namespace-local Pod get/list/watch/patch permissions. It is separate from the controller's permissions.

### Step 3: Configure and create the database

Before applying `fdb-cluster.yaml`:

1. Replace **both** `REPLACE_WITH_SSD_STORAGE_CLASS` values with a suitable StorageClass.
2. Choose single or double mode and review the resource totals above. Do not use single mode for production.
3. Keep `spec.version`, `mainContainer.imageConfigs[].version` and `tag` aligned with the binary in the Monitor image. For 7.1, complete [the 7.1 option](#fdb-71) first.
4. Retain `runAsUser`, `runAsGroup` and `fsGroup: 4059` for these images, and verify the CSI driver allows the mounted volume to be written by this identity. Custom images may require a different identity.
5. Retain the dedicated Monitor ServiceAccount, hostname fault domain, FQDN routing and one-server-per-Pod settings from the sample.

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

Confirm these separate milestones:

- Volumes are bound and the database containers start successfully. Pod Running alone is insufficient.
- `status.configured`, `status.health.available` and `status.health.fullReplication` are `true`.
- `status.generations.reconciled` has caught up with `metadata.generation`. An available database may still be reconciling replacements or shrink operations.

Then configure MetaService using the generated ConfigMap and verify its actual FDB connection before creating tables. Check database health/fault tolerance and coordinator placement before relying on host-failure resilience. These examples do not constitute a failure-injection or production-load test.

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

See [Configure MetaService](config-ms.md) for the full configuration. Several Doris clusters can share FDB; account for their combined load. Deleting a Doris cluster must not delete a shared FDB. Deleting the FDB resource or its PVCs can destroy metadata; plan backup and recovery separately.

## Option for MetaService builds requiring FDB 7.1 {#fdb-71}

For a **fresh amd64 installation** requiring a 7.1 client/server combination, use the mirrored Monitor `7.1.67` and add its controller client before creating the database:

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

Change `spec.version` and the main image config's `version` and `tag` to `7.1.67` in the copied cluster YAML. If using VeloDB, also change the patch image to `velodb/fdb-kubernetes-monitor:7.1.67`. The 7.1.67 image is amd64-only: in mixed-architecture clusters, set `nodeSelector: {kubernetes.io/arch: amd64}` on the controller and every database Pod template. Confirm MetaService compatibility. This is not a downgrade procedure for an existing database.

## Private registries and troubleshooting

For a private registry, mirror the controller and **every enabled initializer/database image**, preserving the required platforms. Update the Operator and initializer `image` fields and the database `mainContainer.imageConfigs[].baseImage`. Configure `imagePullSecrets` in both controller and database Pod templates if required. With unified mode, do not reintroduce a separate split sidecar image. Keep binary versions consistent.

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

Do not resolve startup or reconciliation problems by deleting shared CRDs, databases or PVCs.
