---
{
    "title": "Alibaba Cloud Container Service에 Doris 클러스터 배포",
    "sidebar_label": "Alibaba Cloud Container Service 배포 권장 사항",
    "language": "ko",
    "description": "Alibaba Cloud ACK/ACS에 Doris를 배포하는 가이드로, 환경 점검, 구성 조정, 이미지 레지스트리 설정 및 일반적인 문제 해결 방법을 다룹니다. BE 노드 시작 실패, swap 비활성화 누락, huge page 메모리 구성 등의 문제를 해결합니다."
}
---

## Alibaba Cloud Container Service 개요 {#overview-of-alibaba-cloud-container-service}

Alibaba Cloud는 두 가지 컨테이너 서비스를 제공합니다.

| 서비스 | 설명 | 활용 사례 |
|------|------|----------|
| **ACK** (Container Service for Kubernetes) | ECS 인스턴스를 구매한 후 사용하는 관리형 컨테이너 서비스로, 완전한 액세스 제어 기능 제공 | 기반 ECS를 제어해야 하거나 특권 모드로 BE 노드를 배포해야 하는 경우 |
| **ACS** (Container Service ACS) | K8s를 인터페이스로 사용하는 클라우드 컴퓨팅 서비스로, 사용량에 따라 과금되며 기반 ECS를 관리할 필요가 없음 | 탄력적 컴퓨팅 용량만 필요하고 사용한 만큼 요금을 지불하려는 경우 |

이 문서에서는 각 서비스에서 Doris Operator를 사용하여 클러스터를 배포하는 방법을 설명합니다.

## ACK 배포 {#ack-deployment}

ACK는 ECS 인스턴스를 구매한 후 사용하는 관리형 컨테이너 서비스로, 시스템 매개변수를 조정할 수 있는 완전한 액세스 제어 기능을 제공합니다. Alibaba Cloud Linux 3 이미지를 사용하는 경우 현재 시스템 매개변수가 Doris 실행 요구 사항을 모두 충족합니다. 다른 이미지를 사용하는 경우 K8s 특권 모드를 통해 컨테이너 내부에서 매개변수를 수정할 수 있습니다.

**ACK + Doris Operator로 배포하면 ECS의 기본 구성은 대부분 요구 사항을 충족하며, 요구 사항을 충족하지 않는 매개변수는 Operator가 수정합니다.**

### 시나리오 1: 기존 클러스터 {#scenario-1-existing-cluster}

컨테이너 서비스 클러스터가 이미 생성되어 있다면 다음 단계에 따라 매개변수를 점검하고 수정합니다.

#### 1단계: Swap 상태 확인 {#step-1-check-swap-status}

```bash
swapon --show
```

**예상 결과**: 출력이 없어야 합니다(swap이 비활성화된 상태). 출력에 swap이 활성화되어 있다고 표시되면 `swapoff -a`를 실행한 후 재부팅합니다.

#### 2단계: 최대 파일 핸들 수 확인 {#step-2-check-maximum-file-handle-count}

```bash
ulimit -n
```

**예상 결과**: 65535 이상이어야 합니다. 이 값보다 작으면 `/etc/security/limits.conf`에 다음 내용을 추가합니다.

```shell
* soft nofile 1000000
* hard nofile 1000000
```

#### 3단계: 가상 메모리 영역 수 확인 {#step-3-check-virtual-memory-area-count}

```bash
sysctl vm.max_map_count
```

**예상 결과**: 262144 이상이어야 합니다. 수정이 필요하면 `sysctl -w vm.max_map_count=2000000`을 실행합니다.

#### 4단계: Transparent Huge Pages 확인 {#step-4-check-transparent-huge-pages}

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**예상 결과**: `[never]`가 포함되어 있어야 합니다. 값이 `[always]`이면 다음 명령을 실행합니다.

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

자세한 내용은 [운영 체제 점검](../../preparation/os-checking.md)을 참조하세요.

### 시나리오 2: 새 클러스터 {#scenario-2-new-cluster}

새 클러스터를 생성하려면 Alibaba Cloud Container Service ACK 콘솔에서 "클러스터 생성"을 클릭합니다. **노드 풀 구성** 단계에서 "인스턴스 사전 사용자 지정 데이터"에 다음 스크립트를 추가합니다.

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set virtual memory area count
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
   echo "* soft nofile 1000000" >> "$config_file"
   echo "* hard nofile 1000000" >> "$config_file"
fi
```

클러스터가 시작된 후 노드를 재부팅하여 변경 사항을 적용합니다.

## ACS 배포 {#acs-deployment}

ACS는 K8s를 인터페이스로 사용하는 클라우드 컴퓨팅 서비스로, 사용한 만큼 요금을 지불하는 탄력적 컴퓨팅 용량을 제공합니다. 기반 ECS를 관리할 필요는 없지만, BE 노드를 시작하려면 시스템 매개변수(예: `vm.max_map_count`)를 수정하기 위한 특권 모드가 필요합니다.

:::tip 팁
현재 클러스터에서 특권 모드를 사용할 수 없다면 BE 노드를 시작할 수 없습니다. 대신 ACK + 호스트 머신으로 배포하는 방안을 고려하세요.
:::

### 1단계: 이미지 레지스트리 구성 {#step-1-configure-image-registry}

ACS에서는 호환되는 Alibaba Cloud 이미지 레지스트리인 [Container Registry (ACR)](https://www.alibabacloud.com/en/product/container-registry) 사용을 권장합니다. Personal Edition과 Enterprise Edition으로 제공됩니다.

공식 Doris 이미지를 Alibaba Cloud 이미지 레지스트리로 이전한 후, 비공개 이미지를 사용한다면 secret을 생성합니다.

```bash
kubectl create secret docker-registry image-hub-secret \
  --docker-server={your-server} \
  --docker-username={your-username} \
  --docker-password={your-pwd}
```

### 2단계: 비공개 이미지를 사용하도록 DCR 구성 {#step-2-configure-dcr-to-use-private-images}

`imagePullSecrets`를 DorisCluster CR에 구성합니다.

```yaml
spec:
  feSpec:
    replicas: 1
    image: <your-acr-registry>/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: <your-acr-registry>/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: <your-acr-registry>/selectdb-test/alpine:latest
```

### 3단계: Service 구성 {#step-3-configure-service}

ACS에는 일반적인 Node 개념이 없으므로 Service에서 NodePort 모드를 사용할 수 없습니다. 다음 모드를 사용할 수 있습니다.

#### ClusterIP 모드(기본값) {#clusterip-mode-default}

Operator의 기본 네트워크 모드입니다. [Kubernetes Service 문서](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)를 참조하세요.

#### Load Balancer 모드 {#load-balancer-mode}

**방법 1: DCR을 통해 annotations 구성**

```yaml
feSpec:
  replicas: 3
  image: <your-image>
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
```

**방법 2: ACS 콘솔을 통해 관리**

1. DCR에서 serviceType을 ClusterIP(기본값)로 설정합니다.
2. ACS 콘솔에서 Container Compute Service ACS → 클러스터 목록 → 클러스터 → 서비스 → 생성으로 이동합니다.
3. 새로 생성한 LB를 선택하여 연결합니다. 이 Service는 Doris Operator와 함께 관리되지만 Operator의 제어를 받지는 않습니다.

---

## 자주 묻는 질문 {#faq}

### 질문: BE 노드가 시작되지 않으면 어떻게 해야 하나요? {#q-what-if-be-nodes-cannot-start}

다음 사항을 확인하세요.
1. **특권 모드가 활성화되지 않음**: ACS에서 `vm.max_map_count`를 수정하려면 특권 모드가 필요합니다. 활성화할 수 없다면 ACK를 사용하세요.
2. **이미지 가져오기 실패**: `imagePullSecrets`가 올바르게 구성되어 있는지 확인하세요.
3. **가상 메모리 영역 수 부족**: `sysctl vm.max_map_count`를 실행하여 값이 262144 이상인지 확인하세요.

### 질문: 클러스터 노드가 virtual-kubelet으로 표시되는 것이 정상인가요? {#q-is-it-normal-for-cluster-nodes-to-appear-as-virtual-kubelet}

네. ACS는 가상 노드를 사용하여 컨테이너를 스케줄링합니다. `virtual-kubelet-cn-hongkong-d`와 같은 노드 이름이 표시되는 것은 ACS의 정상적인 동작입니다.

### 질문: Alibaba Cloud 리전에서 특권 모드가 활성화되어 있지 않으면 어떻게 해야 하나요? {#q-what-if-privileged-mode-is-not-enabled-in-an-alibaba-cloud-region}

지원 티켓을 제출하여 ACS 특권 모드 기능을 허용 목록에 추가해 달라고 요청하세요.

### 질문: ACK와 ACS 중 무엇을 선택해야 하나요? {#q-how-to-choose-between-ack-and-acs}

| 시나리오 | 권장 서비스 |
|------|------|
| 기반 ECS에 대한 완전한 제어가 필요한 경우 | ACK |
| 기반 인프라를 관리할 필요 없이 사용한 만큼 요금을 지불하는 탄력적 컴퓨팅만 필요한 경우 | ACS |
| BE 노드에 특권 모드가 필요한 경우 | ACK |
