---
{
    "title": "Deploy FoundationDB",
    "language": "en",
    "description": "Detailed walkthrough of deploying a FoundationDB cluster on Kubernetes with fdb-kubernetes-operator, covering resource definitions, operator deployment, cluster configuration, and status verification. Provides metadata storage for a Doris compute-storage decoupled cluster.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "FoundationDB", "fdb-kubernetes-operator", "metadata storage", "K8s"]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) is a distributed database with strong consistency for structured data, released under the Apache 2.0 open-source license. Doris uses FoundationDB as the metadata store in its compute-storage decoupled mode.

Deploying a compute-storage decoupled cluster on Kubernetes requires that a FoundationDB service be deployed in advance. Two deployment approaches are recommended:

- Deploy directly on machines (including physical machines). To deploy FoundationDB directly on machines, refer to the [Pre-deployment Preparation](../../../compute-storage-decoupled/before-deployment) section in the Doris compute-storage decoupled official documentation to set up a FoundationDB cluster. Before deployment, make sure that the machines hosting FoundationDB and the Kubernetes cluster running Doris are in the same local area network.

- Deploy FoundationDB on Kubernetes. FoundationDB officially provides [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) for deploying and managing FoundationDB on Kubernetes.

## Deploy FoundationDB on Kubernetes

Deploying FoundationDB on Kubernetes consists of 4 steps:

1. Deploy the FoundationDB resource definitions.
2. Deploy the fdb-kubernetes-operator service.
3. Deploy the FoundationDB cluster.
4. Verify the FoundationDB status.

### Step 1: Deploy the FoundationDB resource definitions

Apply the FoundationDB resource definitions with the following commands:

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

Expected result:

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

### Step 2: Deploy the fdb-kubernetes-operator service

The fdb-kubernetes-operator repository provides a sample for deploying a FoundationDB cluster in IP mode. The doris-operator repository provides a sample for deploying a FoundationDB cluster in FQDN mode. Download whichever one fits your needs.

1. Download a deployment sample

    - Download from the official fdb-kubernetes-operator repository
      By default, fdb-kubernetes-operator deploys the FoundationDB cluster in IP mode. You can download the YAML file [default fdb-kubernetes-operator deployment](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml). To use FQDN deployment mode, customize for domain-name mode following the [Using DNS](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns) section in the official documentation.

      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```

    - Download from the doris-operator repository
      The doris-operator repository provides a customized deployment example based on fdb-kubernetes-operator version 1.46.0, which can be used directly to deploy a FoundationDB cluster.

      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```

2. Deploy the fdb-kubernetes-operator service

    After customizing the deployment YAML for `fdb-kubernetes-operator`, deploy fdb-kubernetes-operator with the following command:

    ```shell
    kubectl apply -f fdb-operator.yaml
    ```

    Expected result:

    ```shell
    serviceaccount/fdb-kubernetes-operator-controller-manager created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
    rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
    clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
    deployment.apps/fdb-kubernetes-operator-controller-manager created
    ```
### Step 3: Deploy the FoundationDB cluster

The [fdb-kubernetes-operator repository](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml) provides a sample for deploying FoundationDB. Download it directly with the following command.

1. Download the deployment sample

    Download the IP-mode deployment sample from FoundationDB official:

    ```shell
    wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
    ```

2. Customize the deployment sample

    - Environment with access to dockerhub
      Customize the deployment end state according to the [user manual](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md) provided on the official website. To use FQDN deployment, set the `routing.useDNSInClusterFile` field to true. The configuration is as follows:
      The doris-operator official repository provides a [sample for deploying FoundationDB in FQDN mode](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/) that can be downloaded and used directly.

      ```yaml
      spec:
          routing:
              useDNSInClusterFile: true
      ```

    - Private network environment
      In a private network environment where dockerhub cannot be accessed directly, download the required images from the FoundationDB official repository and push them to a private registry. fdb-kubernetes-operator depends on [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator) and [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar).
      The image required to deploy FoundationDB is [fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags).
      After pushing to the private registry, configure according to the [Customizing the FoundationDB image](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image) section in the fdb-kubernetes-operator official documentation.
      Refer to the following configuration to add private registry image settings:

      ```yaml
      spec:
          mainContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          sidecarContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          version: 7.1.38
      ```

    The doris-operator repository summarizes 4 FoundationDB deployment forms: [minimal single-replica deployment](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml), [minimal two-replica deployment](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml), [two-replica production deployment](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml), and [two-replica production deployment with private registry images](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml).

:::tip Tip
- When deploying FoundationDB, the `.spec.version` field of the FoundationDBCluster resource must be configured and must be a released FoundationDB version number.
- FoundationDB is deployed based on fdb-kubernetes-operator. To meet production-environment high-availability requirements, the Kubernetes cluster must have at least three host machines.
:::

### Step 4: Verify the FoundationDB status

FoundationDB is deployed based on fdb-kubernetes-operator. You can check the FoundationDB cluster status with the following command:

```shell
kubectl get fdb
```

Expected result. If `AVAILABLE` is `true`, the cluster is available:

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```

## Get the ConfigMap that contains FoundationDB access information

When FoundationDB is deployed with [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator), a specific ConfigMap that contains the FoundationDB access information is generated in the deployment namespace. The name of this ConfigMap is the resource name of the deployed FoundationDB plus "-config". Use the following command to view the ConfigMap:

```shell
kubectl get configmap
```

Expected result:

```shell
test-cluster-config   5      15d
```

:::tip Tip
On Kubernetes deployments, deleting the FoundationDBCluster resource causes metadata loss. Handle the FoundationDBCluster resource with care.
:::
