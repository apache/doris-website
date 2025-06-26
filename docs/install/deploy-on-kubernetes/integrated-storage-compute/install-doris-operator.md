---
{
  "title": "Deploy Doris Operator",
  "language": "en"
}
---

Deploying the Doris Operator involves three steps: install the CustomResourceDefinitions, deploy the Operator service, verify the deployment status.

## Step 1: Install CustomResourceDefinitions
Add the custom resource (CRD) of Doris Operator using the following command:
```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```
## Step 2: Install Doris Operator and RBAC rules
Install Doris Operator using the following command:
```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```
Expected output:
```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```
## Step 3: Verify Doris Operator status
Check the deployment status of Doris Operator using the following command:
```shell
kubectl get pods -n doris
```
Expected output:
```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
