---
{
    "title": "03 Doris 클러스터 배포",
    "language": "ko",
    "description": "Doris Operator를 사용하여 Kubernetes에 Apache Doris 클러스터를 배포하는 방법을 설명하는 종합 가이드입니다. 배포 템플릿 다운로드, 클러스터 구성, 클러스터 상태 확인을 다룹니다.",
    "keywords": ["Doris 클러스터 배포", "Kubernetes", "K8s", "DorisCluster", "스토리지와 컴퓨팅 통합", "빠른 배포"]
}
---

Kubernetes에 Doris 클러스터를 배포하기 전에 먼저 [Doris Operator를 배포](install-doris-operator.md)하세요.

Doris 클러스터 배포는 Doris 배포 템플릿 다운로드, 사용자 지정 배포 템플릿 구성 및 설치, 클러스터 상태 확인의 세 단계로 이루어집니다.

## 1단계: Doris 배포 템플릿 다운로드 {#step-1-download-the-doris-deployment-template}

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```

## 2단계: 사용자 지정 배포 템플릿 설치 {#step-2-install-the-customized-deployment-template}

[클러스터 구성 섹션](./install-config-cluster.md)을 참고하여 필요에 맞게 구성을 조정한 다음, 아래 명령으로 배포하세요.

```shell
kubectl apply -f doriscluster-sample.yaml
```

## 3단계: 클러스터 배포 상태 확인 {#step-3-check-the-cluster-deployment-status}

1. **pods 상태 확인**:

  ```shell
  kubectl get pods
  ```

  예상 결과:

  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```

2. **배포된 리소스 상태 확인**:

  ```shell
  kubectl get dcr -n doris
  ```

  예상 결과:

  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
