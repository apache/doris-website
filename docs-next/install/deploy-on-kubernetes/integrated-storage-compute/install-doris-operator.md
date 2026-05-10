---
{
    "title": "01 Deploy Doris Operator",
    "language": "en",
    "description": "A complete guide to installing the Apache Doris Operator on Kubernetes, covering CRD installation, Operator deployment, and status verification.",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator deployment", "integrated storage and compute"]
}
---

Deploying the Doris Operator consists of three steps: installing the CRD, deploying the Operator service, and checking the deployment status.

## Step 1: Install the Doris Operator CRD

Add the Doris Operator Custom Resource Definition (CRD) with the following command:

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

## Step 2: Deploy the Doris Operator

Install the Doris Operator with the following command:

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

## Step 3: Check the Doris Operator Status

Check the deployment status of the Doris Operator with the following command:

```shell
kubectl get pods -n doris
```

Expected output:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
