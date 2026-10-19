---
{
    "title": "01 Doris Operator 배포",
    "language": "ko",
    "description": "Kubernetes에서 Apache Doris Operator를 설치하는 전체 과정을 설명하는 가이드입니다. CRD 설치, Operator 배포, 상태 확인을 다룹니다.",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator 배포", "스토리지 및 컴퓨팅 통합"]
}
---

Doris Operator 배포는 CRD 설치, Operator 서비스 배포, 배포 상태 확인의 세 단계로 구성됩니다.

## 1단계: Doris Operator CRD 설치 {#step-1-install-the-doris-operator-crd}

다음 명령으로 Doris Operator의 Custom Resource Definition (CRD)을 추가합니다:

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

## 2단계: Doris Operator 배포 {#step-2-deploy-the-doris-operator}

다음 명령으로 Doris Operator를 설치합니다:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

예상 출력:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

## 3단계: Doris Operator 상태 확인 {#step-3-check-the-doris-operator-status}

다음 명령으로 Doris Operator의 배포 상태를 확인합니다:

```shell
kubectl get pods -n doris
```

예상 출력:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
