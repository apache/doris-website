---
{
    "title": "03 Deploy Doris Cluster",
    "language": "en",
    "description": "Deploy an Apache Doris storage-compute integrated cluster with 1 FE and 1 BE on Kubernetes with Doris Operator: write a DorisCluster resource with persistent storage, wait for the cluster to become ready, troubleshoot common problems, and connect from the FE Pod to create a table, write data, and query it.",
    "keywords": ["Doris cluster deployment", "Kubernetes", "K8s", "DorisCluster", "integrated storage and compute", "quick deployment", "PVC", "read and write verification"]
}
---

This page uses a Doris 4.1.5 storage-compute integrated cluster with 1 FE and 1 BE as an example to describe how to deploy a Doris cluster in the `doris` namespace. After deployment, connect to the cluster from the FE Pod to create a table, write data, and query it.

Before you start, make sure that:

- You have completed the [preparation checks](../doris-operator/preparation.mdx): the cluster has a default StorageClass, the nodes still have at least 4 CPU / 8Gi of allocatable resources, and the Pod security policy allows the privileged BE init container.
- You have installed the CRDs and the Operator as described in [Deploy Doris Operator](install-doris-operator.md), and the Operator Pod is `Running`.

## Step 1: Prepare the DorisCluster resource {#prepare-doriscluster}

Save the following content as `doriscluster-sample.yaml`:

```yaml
apiVersion: doris.selectdb.com/v1
kind: DorisCluster
metadata:
  name: doriscluster-sample
  namespace: doris
spec:
  feSpec:
    replicas: 1
    image: apache/doris:fe-4.1.5
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 10Gi
    persistentVolumes:
    - name: fe-meta
      mountPath: /opt/apache-doris/fe/doris-meta
      persistentVolumeClaimSpec:
        # Without storageClassName, the default StorageClass of the cluster is used
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
  beSpec:
    replicas: 1
    image: apache/doris:be-4.1.5
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 8Gi
    persistentVolumes:
    - name: be-storage
      mountPath: /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 20Gi
```

Key fields:

| Field | Value in the example | Description |
| --- | --- | --- |
| `metadata.namespace` | `doris` | The same namespace as the Operator. All subsequent commands on this page use `-n doris` |
| `feSpec.image`, `beSpec.image` | `apache/doris:fe-4.1.5`, `apache/doris:be-4.1.5` | FE and BE must use the same version. The images are available for both amd64 and arm64 |
| `replicas` | 1 FE and 1 BE | A functional test size. With only one BE, tables must be created with `"replication_num" = "1"` |
| `requests` / `limits` | FE: 2 CPU / 4Gi, up to 4 CPU / 10Gi<br />BE: 2 CPU / 4Gi, up to 4 CPU / 8Gi | `requests` are used for scheduling, and `limits` cap the resources that a container can use. The default maximum JVM heap of the FE image is 8 GB (`-Xmx8192m`), so the FE memory limit is set to 10Gi to leave room for non-heap memory |
| `persistentVolumes` | 10Gi for FE metadata, 20Gi for BE data | The Operator creates PVCs for the FE metadata directory and the BE data directory. Without `storageClassName`, the default StorageClass is used |

:::caution Data lifecycle
- FE metadata and BE data are stored in PVCs. They are kept after a Pod is restarted, deleted, or rescheduled.
- When you delete the `DorisCluster` resource, the Operator deletes the FE and BE StatefulSets but keeps the PVCs. Data is deleted only after you delete the PVCs manually. When the reclaim policy of the StorageClass is `Delete`, the underlying volumes are deleted as well.
- If you remove the `persistentVolumes` sections from the example, FE and BE use temporary storage, and all metadata and data are lost after a Pod is deleted or rebuilt. This is suitable only for a short trial. Decide on persistent storage before the first deployment.
:::

To adjust images, replicas, resources, startup parameters, access methods, or admin user passwords, modify this file as described in [Configure the Doris Cluster](install-config-cluster.md). For production, plan resources and replicas based on your workload.

## Step 2: Deploy the cluster

```shell
kubectl -n doris apply -f doriscluster-sample.yaml
```

Expected output:

```text
doriscluster.doris.selectdb.com/doriscluster-sample created
```

The Operator creates and starts FE first. After FE is available, it creates BE.

## Step 3: Wait for the cluster to become ready

Run the following commands to wait until both FE and BE are `available`:

```shell
kubectl -n doris wait --for=jsonpath='{.status.feStatus.componentCondition.phase}'=available \
  dcr/doriscluster-sample --timeout=900s
kubectl -n doris wait --for=jsonpath='{.status.beStatus.componentCondition.phase}'=available \
  dcr/doriscluster-sample --timeout=900s
```

Expected output:

```text
doriscluster.doris.selectdb.com/doriscluster-sample condition met
doriscluster.doris.selectdb.com/doriscluster-sample condition met
```

The first deployment pulls the FE and BE images from Docker Hub, and the time this takes depends on the network. After the images are pulled, FE and BE are usually ready within 2 minutes.

After the wait finishes, check the cluster, Pods, and PVCs:

```shell
kubectl -n doris get dcr,pods,pvc
```

Expected output:

```text
NAME                                                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster.doris.selectdb.com/doriscluster-sample   available   available

NAME                                  READY   STATUS    RESTARTS   AGE
pod/doris-operator-5665bb679c-ttdh5   1/1     Running   0          36m
pod/doriscluster-sample-be-0          1/1     Running   0          10s
pod/doriscluster-sample-fe-0          1/1     Running   0          83s

NAME                                                        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/be-storage-doriscluster-sample-be-0   Bound    pvc-427f9e99-b89b-4ced-b247-805f0fa351c7   20Gi       RWO            standard       <unset>                 10s
persistentvolumeclaim/fe-meta-doriscluster-sample-fe-0      Bound    pvc-2548f70d-2407-4eb9-9986-fa5bc94f5952   10Gi       RWO            standard       <unset>                 83s
```

The cluster is ready when `FESTATUS` and `BESTATUS` are both `available`, the FE and BE Pods are both `1/1 Running`, and both PVCs are `Bound`. During deployment, `FESTATUS` and `BESTATUS` first show `initializing`.

### Troubleshoot deployment issues {#troubleshooting}

If the wait times out, check the Pod status and events first:

```shell
kubectl -n doris get pods
kubectl -n doris describe pod <pod-name>
kubectl -n doris get events --sort-by=.lastTimestamp
```

| Symptom | Possible causes and solutions |
| --- | --- |
| A Pod is `Pending` | Check the Events in the `describe` output. `Insufficient cpu` or `Insufficient memory` means that the nodes do not have enough resources; `unbound immediate PersistentVolumeClaims` means that the PVC cannot be provisioned, so check the StorageClass |
| A PVC is `Pending` | When the StorageClass uses `WaitForFirstConsumer`, PVCs stay `Pending` until their Pods are scheduled. This is expected. If a PVC is still `Pending` after its Pod has been scheduled, run `kubectl -n doris describe pvc <pvc-name>` to check the StorageClass and the storage provisioner |
| `ImagePullBackOff` or `ErrImagePull` | The nodes cannot pull the image. Check the image name, the network from the nodes to Docker Hub or your private registry, and `imagePullSecrets` |
| FE is ready, but the BE Pod never appears | Run `kubectl -n doris get statefulset` first:<br />- If `doriscluster-sample-be` does not exist, the Operator has not created BE yet. Run `kubectl -n doris annotate dcr doriscluster-sample reconcile-at="$(date +%s)" --overwrite` to trigger a reconciliation.<br />- If `doriscluster-sample-be` exists, run `kubectl -n doris describe statefulset doriscluster-sample-be`. `FailedCreate` events with `violates PodSecurity` mean that the Pod is rejected by the admission policy. See [Pod security policies](../doris-operator/preparation.mdx#pod-security) |
| BE is `Init:Error` or `Init:CrashLoopBackOff` | The privileged BE init container `default-init` failed. Run `kubectl -n doris logs doriscluster-sample-be-0 -c default-init` to see why. If the exit code is 32, swap is usually enabled on the node; see the tip below |
| `CrashLoopBackOff` | Run `kubectl -n doris logs <pod-name> --previous` to view the logs of the previous start. If the container was killed for exceeding its memory limit, the `describe` output shows `OOMKilled`; increase the memory `limits` |

:::tip Swap is enabled on the node
`default-init` runs `swapoff -a`. If swap is enabled on the node and the swap file is not visible inside the container (for example, kind running in Docker Desktop), `swapoff` fails with exit code 32. Even if this step is skipped, the BE startup script refuses to start when it detects swap. Use one of the following solutions:

- Disable swap on the node. kubelet retries the init container automatically; you can also delete the BE Pod to retry immediately.
- Let the node administrator set `vm.max_map_count` to at least `2000000`, then set `skipDefaultSystemInit: true` in `spec.beSpec`. The Operator then no longer adds `default-init` and lets BE skip the system parameter checks at startup. This setting takes effect only when BE is created for the first time: changing it on a deployed cluster does not remove `default-init`. In that case, delete the `DorisCluster` resource (the PVCs are kept), add the setting to the YAML, and deploy the cluster again.
:::

## Step 4: Connect to the cluster and verify reads and writes

The FE image includes a MySQL client, so you can connect to the cluster from inside the FE Pod:

```shell
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot
```

After the first deployment, the `root` user has no password. To set one, see [Configure Admin Username and Password](install-config-cluster.md#configure-admin-username-and-password).

### 1. Check the FE and BE status

```sql
SHOW FRONTENDS\G
SHOW BACKENDS\G
```

Expected output (excerpt):

```text
*************************** 1. row ***************************
              Name: fe_77e335e4_78ea_490d_81dd_7bc94ba0379d
              Host: doriscluster-sample-fe-0.doriscluster-sample-fe-internal.doris.svc.cluster.local
              ...
              Role: FOLLOWER
          IsMaster: true
              ...
             Alive: true
              ...
           Version: doris-4.1.5-release-917b20be838
1 row in set (0.01 sec)

*************************** 1. row ***************************
              BackendId: 1795859523402
                   Host: doriscluster-sample-be-0.doriscluster-sample-be-internal.doris.svc.cluster.local
                   ...
                  Alive: true
                   ...
                Version: doris-4.1.5-release-917b20be838
                   ...
1 row in set (0.00 sec)
```

`SHOW FRONTENDS` returns one row in which `IsMaster` and `Alive` are both `true`, and `SHOW BACKENDS` returns one row in which `Alive` is `true`.

### 2. Write and query test data

```sql
CREATE DATABASE IF NOT EXISTS k8s_demo;
DROP TABLE IF EXISTS k8s_demo.hello;
CREATE TABLE k8s_demo.hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO k8s_demo.hello VALUES (1, 'hello doris');
SELECT * FROM k8s_demo.hello;
```

Expected output of `INSERT`:

```text
Query OK, 1 row affected (0.08 sec)
{'label':'label_bcd4ca04f4c64f68_83f746e7aabb2b6e', 'status':'VISIBLE', 'txnId':'2'}
```

Expected output of `SELECT`:

```text
+------+-------------+
| id   | msg         |
+------+-------------+
|    1 | hello doris |
+------+-------------+
1 row in set (0.03 sec)
```

`k8s_demo.hello` is used only for verification. These statements drop and recreate the table first, so you can run them repeatedly, and each run should return exactly this row. If the row is returned, FE, BE, and the data directory are all working. Run `exit` to quit the MySQL client.

### 3. (Optional) Verify data persistence

Delete the FE and BE Pods, wait for the StatefulSets to recreate them, and run the query again:

```shell
kubectl -n doris delete pod doriscluster-sample-fe-0 doriscluster-sample-be-0
kubectl -n doris rollout status statefulset/doriscluster-sample-fe --timeout=600s
kubectl -n doris rollout status statefulset/doriscluster-sample-be --timeout=600s
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot -e "SELECT * FROM k8s_demo.hello"
```

If the query still returns `1 | hello doris`, the FE metadata and BE data are stored in the PVCs. After the Pods are ready, FE needs a few seconds to receive the BE heartbeat again, so the query may return `has no queryable replicas` during this time. Wait about 10 seconds and try again.

## Clean up the cluster

Delete the cluster and keep the data:

```shell
kubectl -n doris delete dcr doriscluster-sample
```

The PVCs are kept. If you deploy the cluster again with the same `doriscluster-sample.yaml`, it reuses the metadata and data in these PVCs.

If you no longer need the data, delete the PVCs as well. The data cannot be recovered after the PVCs are deleted:

```shell
kubectl -n doris delete pvc -l 'app.doris.ownerreference/name in (doriscluster-sample-fe,doriscluster-sample-be)'
```

## Next steps

- To access Doris from outside the Kubernetes cluster or from other namespaces, see [Access the Doris Cluster](access-cluster.md).
- To adjust replicas, resources, startup parameters, and authentication, see [Configure the Doris Cluster](install-config-cluster.md).
- For scaling, upgrades, and troubleshooting, see [Cluster Operation](cluster-operation.md).
