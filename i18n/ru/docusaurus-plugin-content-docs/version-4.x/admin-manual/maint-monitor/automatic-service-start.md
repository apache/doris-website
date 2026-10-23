---
{
    "title": "Автоматический запуск служб",
    "language": "ru",
    "description": "Узнайте, как настроить запуск Doris FE/BE/Broker при загрузке системы и автоматический перезапуск с помощью Systemd или Supervisor, чтобы обеспечить доступность служб в производственной среде."
}
---

В этом документе описывается настройка автоматического запуска служб кластера Apache Doris. Цель — предотвратить длительные простои служб FE, BE или Broker из-за перезагрузки хостов или неожиданного завершения процессов в производственной среде. Doris поддерживает два распространённых подхода: **Systemd** и **Supervisor**. Выберите подход в соответствии с вашими предпочтениями в администрировании.

:::caution
Перед настройкой автоматического запуска кластер Doris должен быть полностью развёрнут, а FE и BE должны успешно запускаться вручную.
:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production operations / High-availability deployment -->

## Сценарии использования {#applicable-scenarios}

| Сценарий | Рекомендуемый подход | Примечания |
|------|---------|------|
| Автоматический перезапуск служб Doris после перезагрузки хоста | Systemd | Тесная интеграция с системой инициализации; срабатывает при перезагрузке |
| Автоматический перезапуск процесса после неожиданного завершения | Systemd / Supervisor | Оба инструмента поддерживают политики перезапуска при сбое |
| Единое управление несколькими процессами (FE/BE/Broker) | Supervisor | Поддерживает централизованное управление процессами и сбор журналов |
| Операции, требующие минимальных привилегий sudo | Systemd | Предоставление конкретному пользователю строго определённых разрешений с помощью `visudo` |

## Сравнение подходов {#approach-comparison}

| Критерий | Systemd | Supervisor |
|------|---------|------------|
| Установка | Встроен в основные дистрибутивы Linux | Устанавливается с помощью `yum` или `pip` |
| Управление запуском | `systemctl` | `supervisorctl` |
| Файл конфигурации | `/usr/lib/systemd/system/*.service` | `/etc/supervisord.d/*.ini` |
| Перезапуск при сбое | `Restart=on-failure` | `autorestart=true` |
| Вывод журналов | journald + журналы приложения | Supervisor перехватывает stdout/stderr |
| Сценарии использования | Типовые производственные среды | Централизованное управление несколькими процессами |

## Предварительные требования {#prerequisites}

- Кластер Doris развёрнут, FE/BE успешно запускаются вручную.
- На хосте установлена Java, доступен путь `JAVA_HOME`.
- Текущий пользователь имеет права root или может выполнять команды systemctl/supervisord через sudo.

---

## Подход 1: настройка автоматического запуска с помощью Systemd {#approach-1-configure-automatic-startup-with-systemd}

Systemd — инструмент управления службами, встроенный в основные дистрибутивы Linux и подходящий для большинства производственных сред. Полное описание параметров приведено в [официальной документации Systemd](https://systemd.io/).

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Boot-time startup configuration -->

### 1. Настройте разрешения sudo (необязательно) {#1-configure-sudo-permissions-optional}

Для управления службами Doris через systemd требуются привилегии sudo. Чтобы соблюдать принцип минимальных привилегий, предоставьте конкретному пользователю без прав root разрешение управлять через systemctl службами `doris-fe` и `doris-be`. Добавьте следующие записи с помощью `visudo`:

```text
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```

После предоставления разрешений пользователь `doris` сможет управлять службами Doris с помощью `sudo systemctl start/stop doris-fe|doris-be` без ввода пароля.

### 2. Задайте JAVA_HOME в файлах конфигурации {#2-declare-java_home-in-the-configuration-files}

**Назначение**: при запуске systemd не загружает пользовательские переменные окружения из файлов вроде `~/.bashrc`, поэтому `JAVA_HOME` необходимо задать явно. Иначе команда `systemctl start` не сможет запустить службу.

**Команды**:

```shell
echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
```

**Примечания**: замените `your_java_home` фактическим путём установки Java, например `/usr/local/jdk8`.

### 3. Подготовьте файл службы FE {#3-prepare-the-fe-service-file}

Скачайте [doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service) из репозитория Doris. Содержимое файла:

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
**Примечания**

- Измените `ExecStart` и `ExecStop` в соответствии с фактическим путём развёртывания FE.
:::

### 4. Подготовьте файл службы BE {#4-prepare-the-be-service-file}

Скачайте [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service) из репозитория Doris. Содержимое файла:

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
**Примечания**

- Измените `ExecStart` и `ExecStop` в соответствии с фактическим путём развёртывания BE.
:::

### 5. Основные параметры файла службы {#5-key-parameters-in-the-service-file}

| Параметр | Назначение |
|------|------|
| `Type=forking` | Запускает процесс как фоновый демон |
| `LimitCORE=infinity` | Не ограничивает размер core dump, что помогает при диагностике |
| `LimitNOFILE=200000` | Ограничение числа файловых дескрипторов, позволяющее избежать ошибки `Too many open files` |
| `Restart=on-failure` | Автоматически перезапускает процесс при неожиданном завершении |
| `RestartSec=30` | Ожидает 30 секунд перед перезапуском после неожиданного завершения |
| `StartLimitInterval=120` / `StartLimitBurst=3` | Выполняет не более 3 перезапусков за 120 секунд, чтобы избежать каскадных сбоев |
| `KillMode=none` | Не завершает дочерние процессы принудительно при остановке; их обрабатывает скрипт |
| `ExecStart` / `ExecStop` | Пути к скриптам запуска и остановки Doris |

### 6. Разместите файлы служб {#6-deploy-the-service-files}

Скопируйте `doris-fe.service` и `doris-be.service` в каталог systemd:

```shell
cp doris-fe.service doris-be.service /usr/lib/systemd/system/
```

### 7. Включите запуск при загрузке системы {#7-enable-startup-at-boot}

После добавления или изменения конфигурации службы перечитайте конфигурацию systemd:

```shell
systemctl daemon-reload
```

Включите запуск при загрузке системы. При этом в каталоге `/etc/systemd/system/multi-user.target.wants/` будут созданы ссылки на файлы служб:

```shell
systemctl enable doris-fe
systemctl enable doris-be
```

### 8. Запустите службы {#8-start-the-services}

```shell
systemctl start doris-fe
systemctl start doris-be
```

Проверьте состояние служб с помощью `systemctl status doris-fe` или `systemctl status doris-be`.

---

## Подход 2: настройка автоматического запуска с помощью Supervisor {#approach-2-configure-automatic-startup-with-supervisor}

Supervisor — инструмент управления процессами на основе Python. Он подходит для сценариев, требующих централизованного управления процессами и сбора журналов. Полное описание параметров приведено в [официальной документации Supervisor](http://supervisord.org/).

Supervisor можно установить непосредственно с помощью `yum` или вручную с помощью `pip`. Установка через `pip` сложнее, поэтому в этом документе рассматривается только вариант с `yum`. Сведения о ручном развёртывании приведены в [документации по установке Supervisor](http://supervisord.org/installing.html).

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Centralized multi-process management -->

### 1. Установите Supervisor {#1-install-supervisor}

```shell
yum install epel-release
yum install -y supervisor
```

### 2. Запустите службу Supervisor и проверьте её состояние {#2-start-the-supervisor-service-and-check-status}

```shell
systemctl enable supervisord    # Enable startup at boot
systemctl start supervisord     # Start the supervisord service
systemctl status supervisord    # Check the supervisord service status
ps -ef | grep supervisord       # Check whether a supervisord process exists
```

### 3. Настройте управление процессом BE {#3-configure-be-process-management}

**Назначение**: передать Supervisor управление выводом процесса BE, работающего на переднем плане. Удалите завершающий символ `&` из скрипта запуска BE.

**Измените скрипт запуска**:

```shell
vim /path/doris/be/bin/start_be.sh
```

Замените:

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
```

на:

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
```

**Создайте файл конфигурации Supervisor для BE** `/etc/supervisord.d/doris-be.ini`:

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

### 4. Настройте управление процессом FE {#4-configure-fe-process-management}

**Назначение**: аналогично BE, удалите завершающий символ `&` из скрипта запуска FE, чтобы Supervisor управлял процессом, работающим на переднем плане.

**Измените скрипт запуска**:

```shell
vim /path/doris/fe/bin/start_fe.sh
```

Замените:

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
```

на:

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
```

**Создайте файл конфигурации Supervisor для FE** `/etc/supervisord.d/doris-fe.ini`:

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

### 5. Настройте управление процессом Broker (необязательно) {#5-configure-broker-process-management-optional}

**Назначение**: если в кластере развёрнут Broker, его также можно передать под управление Supervisor. Как и ранее, удалите завершающий символ `&` из скрипта запуска Broker.

**Измените скрипт запуска**:

```shell
vim /path/apache_hdfs_broker/bin/start_broker.sh
```

Замените:

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
```

на:

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
```

**Создайте файл конфигурации Supervisor для Broker** `/etc/supervisord.d/doris-broker.ini`:

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

### 6. Параметры конфигурации Supervisor {#6-supervisor-configuration-parameters}

| Параметр | Назначение |
|------|------|
| `program:<name>` | Идентификатор процесса; supervisorctl управляет процессом по этому имени |
| `directory` | Рабочий каталог процесса |
| `command` | Команда запуска |
| `autostart=true` | Автоматически запускает процесс при запуске supervisord |
| `autorestart=true` | Автоматически перезапускает процесс после его завершения |
| `startretries=3` | Выполняет до 3 повторных попыток при сбое запуска |
| `startsecs` | Время в секундах, в течение которого процесс должен продолжать работать, чтобы запуск считался успешным |
| `stopasgroup` / `killasgroup` | Применяет остановку или принудительное завершение ко всей группе процессов |
| `environment` | Задаёт переменные окружения, например `JAVA_HOME` |

### 7. Загрузите конфигурацию и запустите службы {#7-load-the-configuration-and-start-the-services}

Убедитесь, что службы Doris сейчас остановлены, затем передайте Supervisor управление их автоматическим запуском:

```shell
supervisorctl reload    # Reload all configuration files in Supervisor
supervisorctl status    # Check process status to confirm that Doris services started normally
```

**Другие распространённые команды**:

```shell
supervisorctl start all          # Start all managed processes
supervisorctl stop doris-be      # Stop a specific process
```

---

## Часто задаваемые вопросы {#faq}

### Вопрос: команда `systemctl start` завершается ошибкой, а в журнале сообщается, что `JAVA_HOME` не найден. Что делать? {#q-systemctl-start-fails-and-the-log-reports-that-java_home-cannot-be-found-how-do-i-handle-this}

systemd не загружает пользовательские переменные окружения. Явно добавьте `JAVA_HOME=...` в `fe.conf` и `be.conf`.

### Вопрос: Supervisor не запускается и выдаёт ошибку `pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found`. Что делать? {#q-supervisor-fails-to-start-with-pkg_resourcesdistributionnotfound-the-supervisor340-distribution-was-not-found-how-do-i-handle-this}

Версия Supervisor, установленная через yum, поддерживает только Python 2, но по умолчанию `/usr/bin/python` указывает на Python 3. Установив Python 2, измените первую строку в `/usr/bin/supervisord` и `/usr/bin/supervisorctl` с `#!/usr/bin/python` на `#!/usr/bin/python2`.

### Вопрос: после аварийного завершения BE файл `be.out` не содержит стек ошибки. Что делать? {#q-after-a-be-crash-beout-does-not-contain-the-error-stack-how-do-i-handle-this}

Supervisor перехватил stdout/stderr процесса, поэтому сообщения об ошибках попали в журналы Supervisor. Найдите журнал соответствующего процесса в каталоге журналов Supervisor (по умолчанию `/var/log/supervisor/`).

### Вопрос: изменения файла службы не вступили в силу. Что делать? {#q-the-service-file-changes-did-not-take-effect-how-do-i-handle-this}

systemd не перечитал конфигурацию. Выполните `systemctl daemon-reload`, затем запустите службу снова.

### Вопрос: после частых перезапусков systemd отказывается запускать процесс. Что делать? {#q-after-frequent-restarts-systemd-refuses-to-start-the-process-how-do-i-handle-this}

Сработало ограничение `StartLimitBurst`. Выясните первопричину, затем выполните `systemctl reset-failed doris-fe`, чтобы сбросить счётчик.
