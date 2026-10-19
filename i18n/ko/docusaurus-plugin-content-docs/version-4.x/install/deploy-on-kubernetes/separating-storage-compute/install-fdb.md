---
{
    "title": "FoundationDB 배포",
    "language": "ko",
    "description": "fdb-kubernetes-operator를 사용해 Kubernetes에 FoundationDB 클러스터를 배포하는 과정을 자세히 안내합니다. 리소스 정의, Operator 배포, 클러스터 구성, 상태 확인을 다루며, 컴퓨팅과 스토리지가 분리된 Doris 클러스터에 메타데이터 저장소를 제공합니다.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "FoundationDB", "fdb-kubernetes-operator", "metadata storage", "K8s"]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview)는 정형 데이터에 강한 일관성을 제공하는 분산 데이터베이스로, Apache 2.0 오픈 소스 라이선스로 배포됩니다. Doris는 컴퓨팅·스토리지 분리 모드에서 FoundationDB를 메타데이터 저장소로 사용합니다.

Kubernetes에 컴퓨팅과 스토리지가 분리된 클러스터를 배포하려면 FoundationDB 서비스를 미리 배포해야 합니다. 다음 두 가지 배포 방식을 권장합니다.

- 머신에 직접 배포합니다(물리 머신 포함). 머신에 FoundationDB를 직접 배포하려면 Doris 컴퓨팅·스토리지 분리 공식 문서의 [배포 전 준비](../../deploy-manually/separating-storage-compute-deploy-manually) 절을 참고하여 FoundationDB 클러스터를 구성하세요. 배포하기 전에 FoundationDB를 호스팅하는 머신과 Doris를 실행하는 Kubernetes 클러스터가 동일한 근거리 통신망에 있는지 확인하세요.

- Kubernetes에 FoundationDB를 배포합니다. FoundationDB는 Kubernetes에서 FoundationDB를 배포하고 관리하기 위한 [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)를 공식적으로 제공합니다.

## Kubernetes에 FoundationDB 배포 {#deploy-foundationdb-on-kubernetes}

Kubernetes에 FoundationDB를 배포하는 과정은 4단계로 구성됩니다.

1. FoundationDB 리소스 정의를 배포합니다.
2. fdb-kubernetes-operator 서비스를 배포합니다.
3. FoundationDB 클러스터를 배포합니다.
4. FoundationDB 상태를 확인합니다.

### 1단계: FoundationDB 리소스 정의 배포 {#step-1-deploy-the-foundationdb-resource-definitions}

다음 명령으로 FoundationDB 리소스 정의를 적용합니다.

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

예상 결과:

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

### 2단계: fdb-kubernetes-operator 서비스 배포 {#step-2-deploy-the-fdb-kubernetes-operator-service}

fdb-kubernetes-operator 저장소는 IP 모드로 FoundationDB 클러스터를 배포하는 예제를 제공합니다. doris-operator 저장소는 FQDN 모드로 FoundationDB 클러스터를 배포하는 예제를 제공합니다. 필요에 맞는 예제를 다운로드하세요.

1. 배포 예제 다운로드

    - 공식 fdb-kubernetes-operator 저장소에서 다운로드
      기본적으로 fdb-kubernetes-operator는 IP 모드로 FoundationDB 클러스터를 배포합니다. [기본 fdb-kubernetes-operator 배포](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml) YAML 파일을 다운로드할 수 있습니다. FQDN 배포 모드를 사용하려면 공식 문서의 [DNS 사용](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns) 절에 따라 도메인 이름 모드에 맞게 설정을 조정하세요.

      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```

    - doris-operator 저장소에서 다운로드
      doris-operator 저장소는 fdb-kubernetes-operator 버전 1.46.0을 기반으로 조정한 배포 예제를 제공하며, 이를 바로 사용하여 FoundationDB 클러스터를 배포할 수 있습니다.

      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```

2. fdb-kubernetes-operator 서비스 배포

    `fdb-kubernetes-operator`의 배포 YAML을 환경에 맞게 수정한 후, 다음 명령으로 fdb-kubernetes-operator를 배포합니다.

    ```shell
    kubectl apply -f fdb-operator.yaml
    ```

    예상 결과:

    ```shell
    serviceaccount/fdb-kubernetes-operator-controller-manager created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
    rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
    clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
    deployment.apps/fdb-kubernetes-operator-controller-manager created
    ```
### 3단계: FoundationDB 클러스터 배포 {#step-3-deploy-the-foundationdb-cluster}

[fdb-kubernetes-operator 저장소](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml)는 FoundationDB 배포 예제를 제공합니다. 다음 명령으로 직접 다운로드합니다.

1. 배포 예제 다운로드

    FoundationDB에서 공식적으로 제공하는 IP 모드 배포 예제를 다운로드합니다.

    ```shell
    wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
    ```

2. 배포 예제 수정

    - dockerhub에 접근할 수 있는 환경
      공식 웹사이트에서 제공하는 [사용자 매뉴얼](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md)에 따라 배포의 최종 상태를 원하는 구성으로 설정합니다. FQDN 배포를 사용하려면 `routing.useDNSInClusterFile` 필드를 true로 설정합니다. 구성은 다음과 같습니다.
      doris-operator 공식 저장소는 다운로드하여 바로 사용할 수 있는 [FQDN 모드의 FoundationDB 배포 예제](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/)를 제공합니다.

      ```yaml
      spec:
          routing:
              useDNSInClusterFile: true
      ```

    - 사설 네트워크 환경
      dockerhub에 직접 접근할 수 없는 사설 네트워크 환경에서는 FoundationDB 공식 저장소에서 필요한 이미지를 다운로드하여 사설 레지스트리에 푸시합니다. fdb-kubernetes-operator는 [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator)와 [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar)에 의존합니다.
      FoundationDB를 배포하는 데 필요한 이미지는 [fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags)입니다.
      사설 레지스트리에 푸시한 후에는 fdb-kubernetes-operator 공식 문서의 [FoundationDB 이미지 사용자 지정](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image) 절에 따라 구성합니다.
      다음 구성을 참고하여 사설 레지스트리 이미지 설정을 추가합니다.

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

    doris-operator 저장소는 FoundationDB 배포 형태를 4가지로 정리하여 제공합니다. [최소 구성의 단일 복제본 배포](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml), [최소 구성의 두 복제본 배포](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml), [프로덕션용 두 복제본 배포](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml), [사설 레지스트리 이미지를 사용하는 프로덕션용 두 복제본 배포](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml)입니다.

:::tip 팁
- FoundationDB를 배포할 때는 FoundationDBCluster 리소스의 `.spec.version` 필드를 반드시 설정해야 하며, 정식으로 릴리스된 FoundationDB 버전 번호를 지정해야 합니다.
- FoundationDB는 fdb-kubernetes-operator를 기반으로 배포됩니다. 프로덕션 환경의 고가용성 요구 사항을 충족하려면 Kubernetes 클러스터에 호스트 머신이 최소 세 대 있어야 합니다.
:::

### 4단계: FoundationDB 상태 확인 {#step-4-verify-the-foundationdb-status}

FoundationDB는 fdb-kubernetes-operator를 기반으로 배포됩니다. 다음 명령으로 FoundationDB 클러스터 상태를 확인할 수 있습니다.

```shell
kubectl get fdb
```

예상 결과입니다. `AVAILABLE`이 `true`이면 클러스터를 사용할 수 있습니다.

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```

## FoundationDB 접속 정보가 포함된 ConfigMap 조회 {#get-the-configmap-that-contains-foundationdb-access-information}

[fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)로 FoundationDB를 배포하면 배포 네임스페이스에 FoundationDB 접속 정보가 포함된 ConfigMap이 생성됩니다. 이 ConfigMap의 이름은 배포된 FoundationDB의 리소스 이름에 "-config"를 붙인 형태입니다. 다음 명령으로 ConfigMap을 조회합니다.

```shell
kubectl get configmap
```

예상 결과:

```shell
test-cluster-config   5      15d
```

:::tip 팁
Kubernetes에 배포한 환경에서 FoundationDBCluster 리소스를 삭제하면 메타데이터가 손실됩니다. FoundationDBCluster 리소스를 다룰 때는 주의하세요.
:::
