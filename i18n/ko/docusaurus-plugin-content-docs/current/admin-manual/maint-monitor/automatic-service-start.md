---
{
    "title": "서비스 자동 시작",
    "language": "ko",
    "description": "Systemd 또는 Supervisor로 Doris FE/BE/Broker의 부팅 시 자동 시작과 자동 재시작을 설정하여 운영 환경의 서비스 가용성을 확보하는 방법을 알아봅니다."
}
---

이 문서에서는 Apache Doris 클러스터의 서비스 자동 시작을 설정하는 방법을 설명합니다. 운영 환경에서 호스트 재부팅이나 예기치 않은 프로세스 종료로 인해 FE, BE 또는 Broker 서비스가 장시간 중단되는 상황을 방지하는 것이 목적입니다. Doris는 **Systemd**와 **Supervisor**라는 두 가지 일반적인 방식을 지원합니다. 운영 방식에 맞게 둘 중 하나를 선택하세요.

:::caution
자동 시작을 설정하기 전에 Doris 클러스터 배포를 완료해야 하며, FE와 BE가 수동으로 정상적으로 시작되는지 확인해야 합니다.
:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production operations / High-availability deployment -->

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 방식 | 참고 사항 |
|------|---------|------|
| 호스트 재부팅 후 Doris 서비스 자동 재시작 | Systemd | 시스템 init과 긴밀하게 통합되어 있으며, 재부팅 시 적용됩니다 |
| 예기치 않은 종료 후 프로세스 자동 재시작 | Systemd / Supervisor | 두 방식 모두 장애 시 재시작 정책을 지원합니다 |
| 여러 프로세스(FE/BE/Broker)를 한곳에서 관리 | Supervisor | 중앙 집중식 프로세스 관리와 로그 집계를 지원합니다 |
| 최소한의 sudo 권한만 필요한 운영 작업 | Systemd | `visudo`로 특정 사용자에게 필요한 권한만 부여할 수 있습니다 |

## 방식 비교 {#approach-comparison}

| 항목 | Systemd | Supervisor |
|------|---------|------------|
| 설치 | 기본 제공(주요 Linux 배포판) | `yum` 또는 `pip`로 설치 |
| 시작 관리 | `systemctl` | `supervisorctl` |
| 설정 파일 | `/usr/lib/systemd/system/*.service` | `/etc/supervisord.d/*.ini` |
| 장애 시 재시작 | `Restart=on-failure` | `autorestart=true` |
| 로그 출력 | journald + 애플리케이션 로그 | Supervisor가 stdout/stderr를 관리 |
| 적용 시나리오 | 일반적인 운영 환경 | 여러 프로세스의 중앙 집중식 관리 |

## 사전 요구 사항 {#prerequisites}

- Doris 클러스터가 배포되어 있고, FE/BE를 수동으로 정상적으로 시작할 수 있어야 합니다.
- 호스트에 Java가 설치되어 있고, `JAVA_HOME` 경로를 사용할 수 있어야 합니다.
- 현재 사용자에게 root 권한이 있거나, sudo를 통해 systemctl/supervisord 명령을 실행할 수 있어야 합니다.

---

## 방법 1: Systemd로 자동 시작 설정 {#approach-1-configure-automatic-startup-with-systemd}

Systemd는 주요 Linux 배포판에 기본으로 포함된 서비스 관리 도구로, 대부분의 운영 환경에 적합합니다. 전체 매개변수 설명은 [Systemd 공식 문서](https://systemd.io/)를 참조하세요.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Boot-time startup configuration -->

### 1. sudo 권한 설정(선택 사항) {#1-configure-sudo-permissions-optional}

systemd로 Doris 서비스를 제어하려면 sudo 권한이 필요합니다. 최소 권한 원칙에 따라, root가 아닌 특정 사용자에게 `doris-fe`와 `doris-be`를 systemctl로 제어할 수 있는 권한을 부여하세요. `visudo`로 다음 항목을 추가하세요.

```text
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```

권한을 부여하면 `doris` 사용자는 `sudo systemctl start/stop doris-fe|doris-be` 명령으로 비밀번호 없이 Doris 서비스를 관리할 수 있습니다.

### 2. 설정 파일에 JAVA_HOME 선언 {#2-declare-java_home-in-the-configuration-files}

**목적**: systemd는 시작 시 `~/.bashrc`와 같은 사용자 수준 환경 변수를 불러오지 않으므로, `JAVA_HOME`을 명시적으로 선언해야 합니다. 그렇지 않으면 `systemctl start`로 서비스를 시작할 수 없습니다.

**명령어**:

```shell
echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
```

**참고 사항**: `your_java_home`을 실제 Java 설치 경로(예: `/usr/local/jdk8`)로 바꾸세요.

### 3. FE 서비스 파일 준비 {#3-prepare-the-fe-service-file}

Doris 저장소에서 [doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service) 파일을 다운로드하세요. 내용은 다음과 같습니다.

```text
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris FE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/fe/bin/start_fe.sh --daemon 
ExecStop=/home/doris/fe/bin/stop_fe.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**참고 사항**

- `ExecStart`와 `ExecStop`을 실제 FE 배포 경로에 맞게 수정하세요.
:::

### 4. BE 서비스 파일 준비 {#4-prepare-the-be-service-file}

Doris 저장소에서 [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service) 파일을 다운로드하세요. 내용은 다음과 같습니다.

```shell
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris BE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/be/bin/start_be.sh --daemon
ExecStop=/home/doris/be/bin/stop_be.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**참고 사항**

- `ExecStart`와 `ExecStop`을 실제 BE 배포 경로에 맞게 수정하세요.
:::

### 5. 서비스 파일의 주요 매개변수 {#5-key-parameters-in-the-service-file}

| 매개변수 | 용도 |
|------|------|
| `Type=forking` | 프로세스를 백그라운드 데몬으로 실행합니다 |
| `LimitCORE=infinity` | 코어 덤프 크기를 제한하지 않아 문제 해결에 도움이 됩니다 |
| `LimitNOFILE=200000` | 파일 핸들 수를 제한하여 `Too many open files` 오류를 방지합니다 |
| `Restart=on-failure` | 프로세스가 예기치 않게 종료되면 자동으로 재시작합니다 |
| `RestartSec=30` | 예기치 않은 종료 후 30초를 기다린 다음 재시작합니다 |
| `StartLimitInterval=120` / `StartLimitBurst=3` | 재시작 횟수를 최대 3회(120초 이내)로 제한하여 연쇄 장애를 방지합니다 |
| `KillMode=none` | 중지 시 하위 프로세스를 강제로 종료하지 않고 스크립트에서 처리합니다 |
| `ExecStart` / `ExecStop` | Doris 시작/중지 스크립트 경로입니다 |

### 6. 서비스 파일 배포 {#6-deploy-the-service-files}

`doris-fe.service`와 `doris-be.service`를 systemd 디렉터리에 복사하세요.

```shell
cp doris-fe.service doris-be.service /usr/lib/systemd/system/
```

### 7. 부팅 시 자동 시작 활성화 {#7-enable-startup-at-boot}

서비스 설정을 추가하거나 수정한 후에는 systemd 설정을 다시 불러오세요.

```shell
systemctl daemon-reload
```

부팅 시 자동 시작을 활성화하세요. 그러면 `/etc/systemd/system/multi-user.target.wants/` 아래에 서비스 파일 링크가 생성됩니다.

```shell
systemctl enable doris-fe
systemctl enable doris-be
```

### 8. 서비스 시작 {#8-start-the-services}

```shell
systemctl start doris-fe
systemctl start doris-be
```

`systemctl status doris-fe` 또는 `systemctl status doris-be`로 서비스 상태를 확인하세요.

---

## 방법 2: Supervisor로 자동 시작 설정 {#approach-2-configure-automatic-startup-with-supervisor}

Supervisor는 Python 기반 프로세스 관리 도구입니다. 중앙 집중식 프로세스 관리와 로그 집계가 필요한 시나리오에 적합합니다. 전체 매개변수 설명은 [Supervisor 공식 문서](http://supervisord.org/)를 참조하세요.

Supervisor는 `yum`으로 바로 설치하거나 `pip`로 수동 설치할 수 있습니다. `pip`를 이용한 설치 절차는 더 복잡하므로, 이 문서에서는 `yum` 방식만 다룹니다. 수동 배포 방법은 [Supervisor 설치 문서](http://supervisord.org/installing.html)를 참조하세요.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Centralized multi-process management -->

### 1. Supervisor 설치 {#1-install-supervisor}

```shell
yum install epel-release
yum install -y supervisor
```

### 2. Supervisor 서비스 시작 및 상태 확인 {#2-start-the-supervisor-service-and-check-status}

```shell
systemctl enable supervisord    # Enable startup at boot
systemctl start supervisord     # Start the supervisord service
systemctl status supervisord    # Check the supervisord service status
ps -ef | grep supervisord       # Check whether a supervisord process exists
```

### 3. BE 프로세스 관리 설정 {#3-configure-be-process-management}

**목적**: Supervisor가 BE 프로세스의 포그라운드 출력을 관리하도록 합니다. BE 시작 스크립트 끝의 `&`를 제거하세요.

**시작 스크립트 수정**:

```shell
vim /path/doris/be/bin/start_be.sh
```

다음 줄을:

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
```

다음과 같이 변경하세요.

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
```

**BE용 Supervisor 설정 파일 생성**: `/etc/supervisord.d/doris-be.ini`

```ini
[program:doris_be]
process_name=%(program_name)s
directory=/path/doris/be/be
command=sh /path/doris/be/bin/start_be.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr = true
#stdout_logfile_maxbytes = 20MB
#stdout_logfile_backups = 10
#stdout_logfile=/var/log/supervisor-palo_be.log
```

### 4. FE 프로세스 관리 설정 {#4-configure-fe-process-management}

**목적**: BE와 마찬가지로 FE 시작 스크립트 끝의 `&`를 제거하여 Supervisor가 포그라운드 프로세스를 관리하도록 합니다.

**시작 스크립트 수정**:

```shell
vim /path/doris/fe/bin/start_fe.sh
```

다음 줄을:

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
```

다음과 같이 변경하세요.

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
```

**FE용 Supervisor 설정 파일 생성**: `/etc/supervisord.d/doris-fe.ini`

```ini
[program:PaloFe]
environment = JAVA_HOME="/path/jdk8"
process_name=PaloFe
directory=/path/doris/fe
command=sh /path/doris/fe/bin/start_fe.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=10
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-PaloFe.log
```

### 5. Broker 프로세스 관리 설정(선택 사항) {#5-configure-broker-process-management-optional}

**목적**: 클러스터에 Broker가 배포되어 있다면 Supervisor로 함께 관리할 수 있습니다. 앞에서와 마찬가지로 Broker 시작 스크립트 끝의 `&`를 제거하세요.

**시작 스크립트 수정**:

```shell
vim /path/apache_hdfs_broker/bin/start_broker.sh
```

다음 줄을:

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
```

다음과 같이 변경하세요.

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
```

**Broker용 Supervisor 설정 파일 생성**: `/etc/supervisord.d/doris-broker.ini`

```ini
[program:BrokerBootstrap]
environment = JAVA_HOME="/usr/local/java"
process_name=%(program_name)s
directory=/path/apache_hdfs_broker
command=sh /path/apache_hdfs_broker/bin/start_broker.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-BrokerBootstrap.log
```

### 6. Supervisor 설정 매개변수 {#6-supervisor-configuration-parameters}

| 매개변수 | 용도 |
|------|------|
| `program:<name>` | 프로세스 식별자입니다. supervisorctl은 이 이름으로 프로세스를 관리합니다 |
| `directory` | 프로세스의 작업 디렉터리입니다 |
| `command` | 시작 명령어입니다 |
| `autostart=true` | supervisord가 시작되면 프로세스를 자동으로 시작합니다 |
| `autorestart=true` | 프로세스가 종료되면 자동으로 재시작합니다 |
| `startretries=3` | 시작에 실패하면 최대 3회 재시도합니다 |
| `startsecs` | 시작에 성공한 것으로 간주하기 위해 프로세스가 계속 실행되어야 하는 시간(초)입니다 |
| `stopasgroup` / `killasgroup` | 전체 프로세스 그룹에 중지 또는 강제 종료를 적용합니다 |
| `environment` | `JAVA_HOME`과 같은 환경 변수를 주입합니다 |

### 7. 설정 불러오기 및 서비스 시작 {#7-load-the-configuration-and-start-the-services}

Doris 서비스가 현재 중지되어 있는지 확인한 다음, Supervisor가 자동 시작을 관리하도록 하세요.

```shell
supervisorctl reload    # Reload all configuration files in Supervisor
supervisorctl status    # Check process status to confirm that Doris services started normally
```

**자주 사용하는 기타 명령어**:

```shell
supervisorctl start all          # Start all managed processes
supervisorctl stop doris-be      # Stop a specific process
```

---

## 자주 묻는 질문 {#faq}

### 질문: `systemctl start`가 실패하고 로그에 `JAVA_HOME`을 찾을 수 없다고 표시됩니다. 어떻게 해결하나요? {#q-systemctl-start-fails-and-the-log-reports-that-java_home-cannot-be-found-how-do-i-handle-this}

systemd는 사용자 수준 환경 변수를 불러오지 않습니다. `JAVA_HOME=...`를 `fe.conf`와 `be.conf`에 명시적으로 추가하세요.

### 질문: `pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found` 오류가 발생하며 Supervisor가 시작되지 않습니다. 어떻게 해결하나요? {#q-supervisor-fails-to-start-with-pkg_resourcesdistributionnotfound-the-supervisor340-distribution-was-not-found-how-do-i-handle-this}

yum으로 설치한 Supervisor는 Python 2만 지원하지만, 기본 `/usr/bin/python`은 Python 3을 가리킵니다. Python 2가 설치된 상태에서 `/usr/bin/supervisord`와 `/usr/bin/supervisorctl`의 첫 번째 줄을 `#!/usr/bin/python`에서 `#!/usr/bin/python2`로 변경하세요.

### 질문: BE가 비정상 종료된 후 `be.out`에 오류 스택이 없습니다. 어떻게 해결하나요? {#q-after-a-be-crash-beout-does-not-contain-the-error-stack-how-do-i-handle-this}

Supervisor가 프로세스의 stdout/stderr를 관리하므로 오류 메시지는 Supervisor 로그에 기록됩니다. Supervisor 로그 디렉터리(기본값: `/var/log/supervisor/`)에서 해당 프로세스의 로그를 확인하세요.

### 질문: 서비스 파일의 변경 사항이 적용되지 않습니다. 어떻게 해결하나요? {#q-the-service-file-changes-did-not-take-effect-how-do-i-handle-this}

systemd가 설정을 다시 불러오지 않았기 때문입니다. `systemctl daemon-reload`를 실행한 다음 서비스를 다시 시작하세요.

### 질문: 재시작이 자주 발생한 후 systemd가 프로세스 시작을 거부합니다. 어떻게 해결하나요? {#q-after-frequent-restarts-systemd-refuses-to-start-the-process-how-do-i-handle-this}

`StartLimitBurst` 제한에 도달했기 때문입니다. 근본 원인을 조사한 다음, `systemctl reset-failed doris-fe`를 실행하여 카운터를 초기화하세요.
