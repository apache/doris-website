---
{
    "title": "03 Deploy Doris Cluster",
    "language": "en",
    "description": "A complete guide to deploying an Apache Doris cluster on Kubernetes with Doris Operator, covering downloading the deployment template, configuring the cluster, and verifying cluster status.",
    "keywords": ["Doris cluster deployment", "Kubernetes", "K8s", "DorisCluster", "integrated storage and compute", "quick deployment"]
}
---

Before deploying a Doris cluster on Kubernetes, [deploy Doris Operator](install-doris-operator.md) in advance.

The process of deploying a Doris cluster consists of three steps: download the Doris deployment template, configure and install the customized deployment template, and check the cluster status.

## Step 1: Download the Doris deployment template

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```

## Step 2: Install the customized deployment template

Customize the configuration as needed according to the [cluster configuration section](./install-config-cluster.md), and then deploy with the following command:

```shell
kubectl apply -f doriscluster-sample.yaml
```

## Step 3: Check the cluster deployment status

1. **Check the status of pods**:

  ```shell
  kubectl get pods
  ```

  Expected result:

  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```

2. **Check the status of the deployed resource**:

  ```shell
  kubectl get dcr -n doris
  ```

  Expected result:

  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
