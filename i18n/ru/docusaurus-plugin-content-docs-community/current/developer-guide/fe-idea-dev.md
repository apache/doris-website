---
title: Настройка среды разработки FE в IntelliJ IDEA
language: ru
description: Настройка среды разработки и отладки Apache Doris FE в IntelliJ IDEA на Linux, macOS и Windows.
keywords:
    - IntelliJ IDEA
    - Apache Doris FE
    - среда разработки FE
    - отладка FE
    - Thrift
    - generated-source
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Настройка среды разработки FE в IntelliJ IDEA {#setting-up-the-fe-development-environment-with-intellij-idea}

В этом документе описана настройка среды разработки и отладки Doris FE (Frontend) в IntelliJ IDEA на Linux, macOS и Windows.

<!-- Knowledge type: Procedure -->
<!-- Applies to: IDE configuration / Debugging setup -->

## 1. Подготовка окружения {#1-environment-preparation}

Требования: JDK 1.8+, IntelliJ IDEA.

### 1.1 Получение исходного кода {#11-pull-the-source-code}

Загрузите исходный код Doris из GitHub на локальный компьютер:

```bash
git clone https://github.com/apache/doris.git
```

:::tip Примечание для пользователей macOS
**При открытии проекта в IDEA рекомендуется открывать непосредственно подкаталог `fe` в дереве исходного кода, а не корневой каталог всего репозитория Doris.** Это позволит избежать последующих конфликтов с CLion (в котором открывается каталог `be`).
:::

### 1.2 Установка Thrift {#12-install-thrift}

Если вы занимаетесь только разработкой FE и не собирали полностью `thirdparty`, необходимо отдельно установить Thrift и скопировать его либо создать символическую ссылку на него в каталоге `thirdparty/installed/bin`.

| Версия Doris | Соответствующая версия Thrift |
| ------------- | ----------------------- |
| 0.15 ~ 1.2    | 0.13.0                  |
| 1.2+          | 0.16.0                  |

Далее в качестве примера используется 0.16.0; для 0.13.0 порядок действий такой же.

#### macOS {#macos}

```bash
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

Если загрузка не удалась, можно отредактировать файл:

`/usr/local/Homebrew/Library/Taps/$USER/homebrew-local-tap/Formula/thrift@0.16.0.rb`

Замените:

`url "https://www.apache.org/dyn/closer.lua?path=thrift/0.16.0/thrift-0.16.0.tar.gz"`

на:

`url "https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz"`

Дополнительная информация: <https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

#### Linux {#linux}

```bash
wget https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz
yum install -y autoconf automake libtool cmake ncurses-devel openssl-devel lzo-devel zlib-devel gcc gcc-c++
tar zxvf thrift-0.16.0.tar.gz
cd thrift-0.16.0
./configure --without-tests
make
make install
```

После установки проверьте версию:

```bash
thrift --version
```

#### Windows {#windows}

1. Загрузите файл: <http://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.exe>
2. Скопируйте его в `./thirdparty/installed/bin`

> Если вы уже выполнили полную сборку Doris, повторная установка Thrift не требуется. Можно напрямую использовать `$DORIS_HOME/thirdparty/installed/bin/thrift`.

## 2. Генерация кода {#2-generate-code}

### Linux / macOS {#linux--macos}

Выполните следующую команду в корневом каталоге исходного кода:

```bash
sh generated-source.sh
```

Дождитесь появления сообщения `Done`.

> В версиях 1.2 и более ранних используется команда `cd fe && mvn generate-sources`. При возникновении ошибки выполните `cd fe && mvn clean install -DskipTests`.

Соответствующую команду Maven можно также выполнить в интерфейсе IDEA:

![](/images/gen_code.png)

### Windows {#windows-1}

В Windows выполнение `make` или скриптов оболочки может быть недоступно. Используйте один из следующих способов:

- Скопируйте сгенерированный каталог `fe/fe-core/target/generated-sources` с компьютера под управлением Linux в соответствующее расположение в Windows.
- Смонтируйте локальный каталог в Docker и выполните генерацию кода внутри Docker (см. [Сборка из исходного кода](../source-install/compilation-with-docker)).

## 3. Генерация справочной документации {#3-generate-the-help-documentation}

Если справочная документация ещё не сгенерирована, выполните:

```bash
cd doris/docs
sh build_help_zip.sh
cp build/help-resource.zip ../fe/fe-core/target/classes
```

## 4. Настройка отладки в IDEA {#4-configure-debugging-in-idea}

### 4.1 Импорт проекта {#41-import-the-project}

Импортируйте проект `fe` в IDEA.

### 4.2 Подготовка каталогов {#42-prepare-the-directories}

В каталоге `fe` создайте необходимые для отладки каталоги (в новых версиях этот каталог может уже существовать):

![](/images/DEBUG4.png)

### 4.3 Сборка UI (необязательно) {#43-build-the-ui-optional}

Соберите проект `ui` и скопируйте файлы из каталога `ui/dist/` в `webroot`. Этот шаг можно пропустить, если вам не нужен доступ к интерфейсу Doris.

### 4.4 Настройка fe.conf {#44-configure-feconf}

Ниже приведён пример конфигурации `conf/fe.conf`, которую можно изменить в соответствии с вашими потребностями:

```bash
LOG_DIR = ${DORIS_HOME}/log

DATE = `date +%Y%m%d-%H%M%S`
JAVA_OPTS="-Xmx2048m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"

# For jdk 9+, this JAVA_OPTS will be used as default JVM options
JAVA_OPTS_FOR_JDK_9="-Xmx4096m -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xlog:gc*:$DORIS_HOME/log/fe.gc.log.$DATE:time"

sys_log_level = INFO

http_port = 8030
rpc_port = 9020
query_port = 9030
arrow_flight_sql_port = -1
edit_log_port = 9010

# priority_networks = 10.10.10.0/24;192.168.0.0/16
```

:::tip Запуск BE в Docker на macOS
Если вы запускаете BE на macOS через Docker for Mac, учтите, что `docker for Mac` не поддерживает режим Host, поэтому порты BE необходимо опубликовать с помощью `-p`. Кроме того, параметр `priority_networks` в `fe.conf` должен указывать IP-адрес, доступный из контейнера (например, IP-адрес интерфейса Wi-Fi).
:::

### 4.5 Настройка переменных окружения для запуска в IDEA {#45-set-the-idea-run-environment-variables}

Задайте переменные окружения для запуска в IDEA:

![](/images/DEBUG5.png)

<!-- Knowledge type: Configuration parameters -->

Пример конфигурации для macOS (переменная окружения `DORIS_HOME` указывает на каталог среды выполнения Doris, который вы скопировали):

| Переменная окружения | Пример значения               | Описание                                   |
| -------------------- | ----------------------------- | ------------------------------------------ |
| `JAVA_OPTS`          | `-Xmx8092m`                   | Параметры кучи JVM                         |
| `LOG_DIR`            | `~/DorisDev/doris-run/fe/log` | Каталог журналов FE                        |
| `PID_DIR`            | `~/DorisDev/doris-run/fe/log` | Каталог файлов PID                         |
| `DORIS_HOME`         | `~/DorisDev/doris-run/fe`     | Каталог среды выполнения FE (не каталог исходного кода) |

```bash
JAVA_OPTS=-Xmx8092m
LOG_DIR=~/DorisDev/doris-run/fe/log
PID_DIR=~/DorisDev/doris-run/fe/log
DORIS_HOME=~/DorisDev/doris-run/fe
```

![mac-idea-deployment5](/images/mac-idea-deployment5.png)

### 4.6 Настройка дополнительных параметров {#46-configure-modify-options}

Поскольку некоторые зависимости имеют область действия `provided`, в IDEA требуется специальная настройка: в окне `Run/Debug Configurations` нажмите `Modify options` справа и установите флажок `Add dependencies with "provided" scope to classpath`.

![](/images/idea_options.png)

## 5. Запуск FE {#5-start-fe}

Нажмите `Run` или `Debug`. IDEA начнёт компиляцию, после завершения которой запустится FE.

![mac-idea-deployment6](/images/mac-idea-deployment6.png)

Теперь можно приступать к разработке и отладке FE.

## 6. Часто задаваемые вопросы (FAQ) {#6-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: При запуске возникает `ClassNotFoundException` или не удаётся найти некоторые зависимости {#q1-startup-throws-classnotfoundexception-or-some-dependencies-cannot-be-found}

Флажок `Add dependencies with "provided" scope to classpath` не был установлен в `Run/Debug Configurations`. Решение см. в [разделе 4.6](#46-configure-modify-options).

### Вопрос 2: `generated-source.sh` сообщает о несовпадении версии Thrift {#q2-generated-sourcesh-reports-thrift-version-mismatch}

Версия `thirdparty/installed/bin/thrift` не соответствует вашей версии Doris. Переустановите Thrift согласно таблице соответствия версий в [разделе 1.2](#12-install-thrift).

### Вопрос 3: После запуска FE недоступен для BE или клиентов {#q3-fe-cannot-be-accessed-by-be-or-clients-after-startup}

Проверьте, задана ли для `priority_networks` в `fe.conf` подсеть, доступная с локального компьютера или из контейнера. Если BE запущен в Docker на macOS, см. примечание в разделе 4.4.
