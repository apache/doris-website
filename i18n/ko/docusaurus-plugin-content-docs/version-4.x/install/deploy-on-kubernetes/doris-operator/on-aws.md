---
title: AWS EKS에 Doris 클러스터 배포하기
sidebar_label: AWS EKS 배포 권장 사항
language: ko
description: "AWS EKS에 Doris를 배포하기 위한 종합 가이드입니다. 클러스터 모드 선택(자율 모드와 비자율 모드), 시스템 매개변수 점검 및 조정, 특권 모드 구성, 스토리지 및 컴퓨팅 리소스 계획을 다룹니다. vm.max_map_count 부족, swap 비활성화 누락, transparent huge pages 비활성화 누락, 파일 핸들 제한 등의 문제를 해결합니다."
---

## AWS EKS 컨테이너 서비스 개요 {#overview-of-aws-eks-container-service}

AWS EKS는 두 가지 운영 모드를 제공합니다.

| 모드 | 설명 | 사용 사례 |
|------|-------------|-----------|
| **비자율 모드**(권장) | 기반 EC2 인스턴스를 완전히 제어할 수 있는 표준 EKS 모드 | 프로덕션 환경, 상태 저장 서비스, Doris 클러스터 |
| **자율 모드** | 리소스를 자동으로 탄력적으로 확장 및 축소하는 내장 노드 풀 | 상태 비저장 서비스, 경량 워크로드 |

:::tip 팁
자율 모드는 권장하지 않습니다. 자율 모드에서는 내장 노드 풀을 통해 컴퓨팅 리소스가 동적으로 할당되고 회수되므로, Doris 클러스터 노드의 위치가 바뀌고 프로덕션 환경에서 보안 위험이 발생할 수 있습니다.
:::

## 시나리오 1: 새 클러스터 생성 {#scenario-1-creating-a-new-cluster}

### 1단계: EKS 클러스터 생성(비자율 모드) {#step-1-create-an-eks-cluster-non-autonomous-mode}

EKS 콘솔에서 클러스터를 생성할 때 **비자율 모드**를 선택하세요.

**권장 구성**:
- 운영 체제 이미지: Amazon Linux 2
- 노드 그룹: Doris 배포 전용 노드 그룹 사용

### 2단계: 노드 그룹 시작 스크립트 구성 {#step-2-configure-the-node-group-launch-script}

EC2 > 시작 템플릿 > 시작 템플릿 생성을 통해 노드 풀의 시작 템플릿을 설정하세요. 시스템 매개변수 구성을 자동화하려면 템플릿에 다음 스크립트를 추가하세요.

```bash
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable the firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set the number of virtual memory areas
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set the file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
  echo "* soft nofile 1000000" >> "$config_file"
  echo "* hard nofile 1000000" >> "$config_file"
fi
```

클러스터가 시작된 후 노드를 재시작하면 설정이 적용됩니다.

### 3단계: IAM 역할 권한 구성 {#step-3-configure-iam-role-permissions}

EKS 노드의 IAM 역할에 다음 권한이 있는지 확인하세요.

- AmazonEC2FullAccess
- AmazonEKSWorkerNodePolicy
- AmazonEKS_CNI_Policy
- AmazonSSMManagedInstanceCore

### 4단계: 스토리지 구성 {#step-4-configure-storage}

프로덕션 환경에서는 [EBS](https://aws.amazon.com/ebs) 스토리지를 권장합니다. 클러스터 구성 화면에서 EBS 스토리지 플러그인을 추가하고, 플러그인에 해당 [역할 권한](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)이 있는지 확인하세요.

---

## 시나리오 2: 기존 클러스터 {#scenario-2-existing-cluster}

### 1단계: Swap 상태 확인 {#step-1-check-swap-status}

```bash
swapon --show
```

**예상 결과**: 출력 없음(swap이 비활성화된 상태). swap이 활성화되어 있음을 나타내는 출력이 있으면 `swapoff -a`를 실행하고 재시작하세요.

### 2단계: 최대 파일 핸들 수 확인 {#step-2-check-the-maximum-file-handle-count}

```bash
ulimit -n
```

**예상 결과**: 65535 이상. 이 값보다 작으면 `/etc/security/limits.conf`에 다음 항목을 추가하세요.

```bash
* soft nofile 1000000
* hard nofile 1000000
```

### 3단계: 가상 메모리 영역 수 확인 {#step-3-check-the-number-of-virtual-memory-areas}

```bash
sysctl vm.max_map_count
```

**예상 결과**: 262144 이상. 값을 변경하려면 `sysctl -w vm.max_map_count=2000000`을 실행하세요.

### 4단계: Transparent Huge Pages 확인 {#step-4-check-transparent-huge-pages}

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**예상 결과**: `[never]` 포함. 값이 `[always]`이면 다음을 실행하세요.

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

---

## 이미지 저장소 접근 {#image-repository-access}

공개 DockerHub 이미지 저장소에 접근하려면 클러스터에 `Amazon VPC CNI`, `CoreDNS`, `kube-proxy` 등의 네트워크 플러그인을 추가하고, 클러스터의 VPC를 구성할 때 공용 네트워크에 접근할 수 있는 서브넷을 선택하세요.

---

## 특권 모드 {#privileged-mode}

EKS에서는 EC2 인스턴스가 전적으로 해당 EKS 사용자에게 속하므로, 공유 리소스 풀에서 서로 다른 사용자의 클러스터가 서로 영향을 미치는 상황이 발생하지 않습니다.

- **EKS에서 특권 모드를 허용하는 경우**(기본적으로 허용됨): 시스템 매개변수를 신경 쓸 필요가 없습니다. Doris Operator가 기본적으로 Doris에 맞게 시스템 매개변수를 자동으로 조정합니다.
- **특권 모드를 허용하지 않는 경우**: 호스트에서 다음과 같이 시스템 매개변수를 조정해야 합니다.

| 매개변수 | 명령 | 확인 방법 |
|-----------|---------|--------------|
| 가상 메모리 영역 수 | `sysctl -w vm.max_map_count=2000000` | `sysctl vm.max_map_count` |
| Transparent huge pages | 비활성화 | 출력에 `never`가 포함되어 있는지 확인 |
| 최대 파일 핸들 수 | `/etc/security/limits.conf` 수정 | `ulimit -n` |
| swap | `swapoff -a` | `swapon --show`(출력이 없으면 비활성화된 상태) |

자세한 내용은 [운영 체제 점검](../../preparation/os-checking.md)을 참조하세요.

---

## 자주 묻는 질문 {#faq}

### 질문: 자율 모드에는 어떤 위험이 있나요? {#q-what-are-the-risks-of-autonomous-mode}

자율 모드에서는 내장 노드 풀을 통해 컴퓨팅 리소스가 동적으로 할당되고 회수되며, 할당하거나 회수할 때마다 기존 리소스가 재구성됩니다. StatefulSet 기반의 상태 저장 서비스, 특히 시작 시간이 긴 서비스나 Doris처럼 분산 조정에 엄격한 요구 사항이 있는 서비스에서는 이로 인해 노드 풀을 공유하는 모든 서비스가 불안정해지고, 전체 Doris 클러스터의 모든 노드 위치가 바뀔 수 있습니다.

### 질문: 기존 클러스터에 새 노드 그룹을 어떻게 구성하나요? {#q-how-do-you-configure-a-new-node-group-on-an-existing-cluster}

Doris 클러스터 전용 노드 그룹을 구성하는 것이 좋습니다. BE 동작과 관련된 시스템 설정이 필요한 경우 호스트의 시스템 매개변수를 조정해야 할 수 있습니다. 노드 그룹을 생성할 때 EC2 > 시작 템플릿 > 시작 템플릿 생성을 통해 구성하고, 템플릿을 사용하여 EC2 인스턴스의 시스템 환경 구성을 자동화하는 스크립트를 주입할 수 있습니다.

### 질문: EKS 노드에는 어떤 IAM 권한이 필요한가요? {#q-what-iam-permissions-does-an-eks-node-need}

AmazonEC2FullAccess, AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, AmazonSSMManagedInstanceCore 권한이 필요합니다.

### 질문: 시스템 매개변수가 올바르게 구성되었는지 어떻게 확인하나요? {#q-how-do-you-verify-that-the-system-parameters-are-configured-correctly}

시나리오 2의 확인 절차를 참조하여 swap, 파일 핸들 수, 가상 메모리 영역 수, transparent huge pages 등의 매개변수가 요구 사항을 충족하는지 확인하세요.
