---
{
  "title": "Deploy Doris Cluster",
  "language": "en"
}
---

To deploy a Doris cluster on Kubernetes, ensure that [the Doris Operator is deployed](install-doris-operator.md).  
The deployment process for a Doris cluster consists of three steps: download the deployment template, custom the template and deploy cluster, and verify the cluster status.
## Step 1: Download the Doris deployment template
```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
## Step 2: Custom the template and deploy cluster
Perform customized configuration as needed according to the doc of [Config Doris to Deploy](./install-config-cluster.md). After the configuration is completed, deploy it with the following command:
```shell
kubectl apply -f doriscluster-sample.yaml
```
## Step 3: Verify the cluster status
- Check the status of the cluster by checking the status of pods
  ```shell
  kubectl get pods
  ```
  Expected output:
  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```
- Check the status of the deployed resources
  ```shell
  kubectl get dcr -n doris
  ```
  Expected output:
  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
