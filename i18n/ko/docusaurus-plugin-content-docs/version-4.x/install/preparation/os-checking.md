---
{
    "title": "운영 체제 점검",
    "language": "ko",
    "description": "Doris를 배포하기 전에 점검 목록에 따라 운영 체제 환경을 점검하고 구성하세요."
}
---

<!-- Knowledge type: Guide -->
<!-- Applicable scenarios: Pre-deployment checks / System configuration / Environment validation -->

Doris를 배포하기 전에 다음 운영 체제 점검 및 구성을 완료하세요.

| 점검 항목 | 목적 |
|--------|------|
| swap 파티션 비활성화 | 성능에 영향을 미치는 커널 정책 방지 |
| Transparent Huge Pages(THP) 비활성화 | 메모리 단편화 및 성능 변동 방지 |
| 가상 메모리 영역 한도 증가 | 파일 핸들 고갈 방지 |
| CPU 절전 모드 비활성화 | 부하가 높은 상황에서 안정적인 성능 보장 |
| 네트워크 연결 오버플로 시 연결 재설정 | 동시 연결이 많은 상황에서 연결이 응답 없이 대기하는 현상 방지 |
| 포트 개방 / 방화벽 비활성화 | 구성 요소 간 통신 보장 |
| 파일 핸들 수 증가 | 다수의 테이블 데이터 파일 지원 |
| NTP 서비스 설치 | 메타데이터 시간 오차를 5000ms 미만으로 유지 |

## swap 파티션 비활성화 {#disable-swap-partition}

<!-- Knowledge type: Operation steps -->

swap을 비활성화하면 커널이 데이터를 swap 파티션으로 이동하여 Doris 성능에 영향을 미치는 것을 방지할 수 있습니다.

**일시적으로 비활성화**(재부팅하면 원래 상태로 돌아감):

```bash
swapoff -a
```

**영구적으로 비활성화**: `/etc/fstab`의 swap 행을 주석 처리한 후 재부팅하여 적용합니다.

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## Transparent Huge Pages 비활성화 {#disable-transparent-huge-pages}

<!-- Knowledge type: Operation steps -->

THP(Transparent Huge Pages)를 비활성화하면 메모리 단편화를 줄이고 Doris가 메모리를 안정적으로 사용하도록 할 수 있습니다.

**일시적으로 비활성화**:

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

**영구적으로 비활성화**:

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## 가상 메모리 영역 한도 증가 {#increase-virtual-memory-areas}

<!-- Knowledge type: Operation steps -->

VMA(가상 메모리 영역) 한도를 늘리면 프로세스별 VMA 한도 초과로 인해 Doris에서 `mmap` / `Cannot allocate memory` 오류가 발생하는 것을 방지할 수 있습니다.

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

sysctl -p
```

## CPU 절전 모드 비활성화 {#disable-cpu-power-saving-mode}

<!-- Knowledge type: Operation steps -->

절전 모드를 비활성화하면 부하가 높은 상황에서도 CPU 주파수를 안정적으로 유지할 수 있습니다. CPU가 Scaling Governor를 지원하지 않으면 이 단계를 건너뛸 수 있습니다.

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## 네트워크 연결 오버플로 시 연결 재설정 {#reset-on-network-connection-overflow}

<!-- Knowledge type: Operation steps -->

`tcp_abort_on_overflow`를 활성화하면 오버플로가 발생할 때 연결을 즉시 중단하여 부하가 높은 상황에서 연결이 오랫동안 응답 없이 대기하는 것을 방지할 수 있습니다.

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

sysctl -p
```

## 포트 개방 {#open-ports}

<!-- Knowledge type: Operation steps -->

포트에 접근할 수 없으면 방화벽을 점검하세요.

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

또는 Doris 포트 구성에 따라 해당 포트를 개방하세요.

## 파일 핸들 한도 증가 {#increase-file-handle-limits}

<!-- Knowledge type: Operation steps -->

Doris는 테이블 데이터를 관리하기 위해 많은 파일을 사용하므로 파일 핸들 한도를 늘려야 합니다.

```bash
vi /etc/security/limits.conf
* soft nofile 1000000
* hard nofile 1000000
```

변경 사항이 적용된 후에는 세션을 다시 시작해야 합니다.

## NTP 서비스 설치 {#install-ntp-service}

<!-- Knowledge type: Operation steps -->

클러스터 내 모든 시스템의 시계가 동기화되어 있는지 확인하세요. 메타데이터 시간 오차는 5000ms 미만이어야 합니다.

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```
