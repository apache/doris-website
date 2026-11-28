---
{
    "title": "01 Deploy Doris Operator",
    "language": "en",
    "description": "Use Doris Operator 26.0.1 as an example to install Apache Doris Operator on Kubernetes: install the CRDs with server-side apply, pin the Operator image version, wait for the controller to become ready, and run integrated storage and compute and compute-storage decoupled clusters in the same Kubernetes cluster.",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator deployment", "integrated storage and compute", "server-side apply"]
}
---

This page uses Doris Operator 26.0.1 as an example to describe how to install Doris Operator in three steps: install the CRDs, deploy the Operator, and wait for the Operator to become ready. The Operator and the Doris clusters created later are in the `doris` namespace. Before you start, complete the [preparation checks](../doris-operator/preparation.mdx).

The commands on this page can be run repeatedly. The CRDs, the deployment manifest, and the Operator image use the same version, so you do not pick up unreleased changes from the `master` branch or the `latest` image.

## Step 1: Install the CRDs

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

`crds.yaml` contains both `DorisCluster` for the integrated storage and compute mode and `DorisDisaggregatedCluster` for the compute-storage decoupled mode. The CRD file is larger than 1 MB, so `--server-side` is required: a regular `kubectl apply` fails because the `last-applied-configuration` annotation exceeds the size limit, and `kubectl create` fails with `AlreadyExists` when it is run again.

## Step 2: Deploy the Operator

Download the deployment manifest of the same version and pin its image to `apache/doris:operator-26.0.1`:

```shell
DORIS_OPERATOR_VERSION=26.0.1
curl -fsSL -o doris-operator.yaml \
  https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/operator/operator.yaml
sed -i.bak "s#apache/doris:operator-latest#apache/doris:operator-${DORIS_OPERATOR_VERSION}#" doris-operator.yaml
grep 'image:' doris-operator.yaml
```

Expected output:

```text
          image: apache/doris:operator-26.0.1
```

The deployment manifest in the `26.0.1` tag still references `apache/doris:operator-latest`, so the `sed` command replaces it with the pinned version. The `-i.bak` form works on both Linux and macOS, and keeps the original file as `doris-operator.yaml.bak`.

After confirming the image version, deploy the Operator:

```shell
kubectl apply -f doris-operator.yaml
```

Expected output:

```text
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
```

The manifest creates the `doris` namespace, where the Doris cluster is deployed later as well. When you run the command again, `created` in the output changes to `unchanged` or `configured`.

:::tip Tip
If you also plan to deploy a compute-storage decoupled cluster in the same Kubernetes cluster, use `disaggregated-operator.yaml` instead of `operator.yaml`. For details, see [Run both modes in one cluster](#run-both-modes).
:::

## Step 3: Wait for the Operator to become ready

```shell
kubectl -n doris rollout status deployment/doris-operator --timeout=300s
kubectl -n doris get pods
```

Expected output:

```text
deployment "doris-operator" successfully rolled out
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-5665bb679c-ttdh5   1/1     Running   0          20s
```

When `rollout status` succeeds and the Pod is `1/1 Running`, you can [deploy the Doris cluster](install-doris-cluster.md).

If the wait times out, troubleshoot as follows:

```shell
kubectl -n doris describe pod -l control-plane=doris-operator
kubectl -n doris logs deployment/doris-operator -c dorisoperator --tail=100
```

| Symptom | Common causes |
| --- | --- |
| `Pending` | The nodes do not have enough allocatable resources. The Operator requests 1 CPU / 2Gi |
| `ImagePullBackOff` or `ErrImagePull` | The nodes cannot reach Docker Hub, or the image name is wrong. Check the Events in the `describe` output for the specific error |
| `CrashLoopBackOff` | Check the Operator logs. A common cause is that the CRDs are missing or do not match the Operator version; run Step 1 again |

## Run both modes in one cluster {#run-both-modes}

Integrated storage and compute clusters and compute-storage decoupled clusters can run in the same Kubernetes cluster and share one set of CRDs and one Operator:

- **CRDs**: `crds.yaml` already contains the CRDs of both modes, so you only need to install it once. The CRD installation command in the compute-storage decoupled tutorial is the same as Step 1 and can be run again without errors.
- **Operator**: `operator.yaml` and `disaggregated-operator.yaml` create the same set of resources (the `doris-operator` Deployment and ServiceAccount in the `doris` namespace, the cluster-scoped `doris-operator` ClusterRole, and so on). Both start the controllers for both modes. The difference is that `disaggregated-operator.yaml` additionally grants the `update` and `delete` permissions on Pods and the `create` permission on `pods/exec`, which the compute-storage decoupled controller uses.

To run both modes, download `disaggregated-operator.yaml` and pin its image in the same way as Step 2, then run `kubectl apply`. It updates the existing resources with the same names in place, and the deployed clusters are not affected. After that, do not apply `operator.yaml` to the cluster again; otherwise, the additional permissions are removed.
