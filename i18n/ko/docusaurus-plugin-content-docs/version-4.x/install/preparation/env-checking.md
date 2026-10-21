---
{
    "title": "하드웨어 및 소프트웨어 환경 점검",
    "language": "ko",
    "description": "Doris를 배포하기 전에 하드웨어 구성, 서버 사양, 디스크 공간 및 Java 환경을 점검하세요."
}
---

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Pre-deployment check / Hardware planning / Environment acceptance -->

이 문서는 Doris 배포에 필요한 하드웨어 및 소프트웨어 환경의 참고 기준을 제공합니다.

## 하드웨어 환경 점검 {#hardware-environment-check}

<!-- Knowledge type: Hardware requirements -->

| 점검 항목   | 최소 구성 | 권장 구성 |
| -------- | -------- | -------- |
| CPU      | AVX2 명령어 집합 지원 | AVX2 명령어 집합 지원 |
| 메모리     | CPU 코어 수 x 4 GB | CPU 코어 수 x 8 GB |
| 스토리지     | SSD 또는 HDD | SSD |
| 파일 시스템 | ext4 또는 xfs | ext4 또는 xfs |
| 네트워크 카드     | 1GbE | 10GbE + 링크 집계 |

### CPU 점검 {#cpu-check}

Doris는 AVX2 벡터화를 사용하여 쿼리 속도를 높입니다. AVX2 명령어 집합을 지원하는 시스템을 권장합니다.

```bash
cat /proc/cpuinfo | grep avx2
```

출력이 있으면 AVX2를 지원합니다. 지원하지 않는 경우 no-AVX2 Doris 설치 패키지를 사용할 수 있습니다.

### 메모리 점검 {#memory-check}

<!-- Knowledge type: Memory configuration reference -->

Doris는 메모리 제한을 강제하지 않습니다. 프로덕션 환경에서는 다음 구성을 권장합니다.

| 구성 요소 | 최소 메모리 | 권장 메모리 |
| ---- | -------- | -------- |
| FE   | 16 GB    | 64 GB+   |
| BE   | CPU 코어 수 x 4 GB | CPU 코어 수 x 8 GB |

### 스토리지 점검 {#storage-check}

<!-- Knowledge type: Storage selection reference -->

| 사용 시나리오 | 권장 스토리지 유형 |
| ---- | ------------ |
| 대규모 데이터에 대한 높은 동시성의 포인트 쿼리 | SSD |
| 대규모 데이터의 빈번한 업데이트 | SSD |
| 콜드 데이터 아카이빙 | HDD / 객체 스토리지 |

### 파일 시스템 점검 {#file-system-check}

| 파일 시스템 | 적합한 사용 시나리오 |
| -------- | -------- |
| ext4     | 범용, 우수한 안정성 |
| xfs      | 대규모 데이터, 높은 동시성의 쓰기 작업 |

### 네트워크 카드 점검 {#network-card-check}

10GbE 이상의 네트워크를 권장합니다. 네트워크 카드가 여러 개인 시스템에서는 링크 집계를 사용하여 대역폭과 이중화 수준을 높이세요.

## 권장 서버 구성 {#recommended-server-configuration}

<!-- Knowledge type: Server specification reference -->

x86-64 및 ARM64 아키텍처를 모두 지원합니다.

### 개발 및 테스트 환경 {#development-and-test-environments}

FE와 BE를 함께 배포할 수 있습니다.

- 단일 서버에 FE 1개 + BE 1개 배포(여러 인스턴스는 권장하지 않음)
- 데이터 복제본 3개를 유지하려면 최소 3대의 서버에 각각 BE 1개 배포

| 모듈       | 최소 CPU | 최소 메모리 | 최소 디스크          | 네트워크           | 인스턴스 수 |
| -------- | -------- | -------- | ----------------- | -------------- | ------ |
| Frontend | 8코어     | 8 GB     | SSD/SATA, 10 GB+  | 1GbE/10GbE    | 1      |
| Backend  | 8코어     | 16 GB    | SSD/SATA, 50 GB+  | 1GbE/10GbE    | 1      |

### 프로덕션 환경 {#production-environment}

FE와 BE를 별도로 배포하는 것을 권장합니다. 리소스가 부족하여 같은 서버에 배포해야 하는 경우에는 각 구성 요소의 데이터를 서로 다른 디스크에 저장하세요.

| 모듈       | 권장 CPU | 권장 메모리 | 권장 디스크          | 네트워크    | 인스턴스 수 |
| -------- | -------- | -------- | ----------------- | ------- | ------ |
| Frontend | 16코어+   | 64 GB+   | SSD, 100 GB+      | 10GbE   | 1      |
| Backend  | 16코어+   | 64 GB+   | SSD/SATA, 100 GB+ | 10GbE   | 3      |

## 디스크 공간 계산 {#disk-space-calculation}

<!-- Knowledge type: Storage capacity calculation -->

| 구성 요소 | 권장 공간 | 설명 |
| ---- | -------- | ---- |
| FE   | 100 GB+  | SSD, 메타데이터 저장에 사용 |
| BE   | 전체 데이터 용량 x 3 x 1.4 | LZ4 압축률 0.3-0.5, 복제본 3개 + 백그라운드 compaction을 위한 예비 공간 40% |

> 위의 BE 스토리지 계산은 주로 **스토리지와 컴퓨팅 통합** 배포 모드를 기준으로 합니다. **스토리지와 컴퓨팅 분리** 배포 모드에서는 모든 데이터가 공유 스토리지에 저장되고 로컬 디스크는 캐싱에만 사용되므로, 필요한 디스크 용량은 핫 데이터의 크기에 따라 달라집니다.

## Java 환경 점검 {#java-environment-check}

<!-- Knowledge type: Java version requirements -->

모든 Doris 프로세스는 Java에 의존합니다.

| Doris 버전 | Java 버전 | 권장 버전 |
| ---------- | --------- | -------- |
| 2.1 이하 | Java 8    | jdk-8u352+ |
| 3.0 이상 | Java 17   | jdk-17.0.10+ |
