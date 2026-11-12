---
title: Настройка среды разработки BE - Visual Studio Code (VSCode)
language: ru
description: "Настройка среды разработки Apache Doris BE в VSCode: компиляция, отладка с GDB/LLDB и анализ core dump."
keywords:
    - VSCode
    - Apache Doris BE
    - среда разработки BE
    - отладка с GDB
    - отладка с LLDB
    - core dump
    - doris_be
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

# Настройка среды разработки и отладки BE в VSCode {#setting-up-a-be-development-and-debugging-environment-with-vscode}

В этом документе описаны компиляция, запуск и отладка Apache Doris BE в VSCode на Ubuntu 20.04. Рассматриваются три способа отладки: GDB, LLDB и анализ core dump.

> Исполняемый файл BE называется `doris_be`. В старых версиях он назывался `palo_be`.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: IDE configuration / Debugging setup -->

## 1. Предварительные требования {#1-prerequisites}

1. Загрузите исходный код Doris: [apache/doris на GitHub](https://github.com/apache/doris)

2. Установите базовый набор инструментов: GCC 8.3.1+, Oracle JDK 1.8+, Python 2.7+. Убедитесь, что `gcc`, `java` и `python` указывают на нужные версии, и задайте переменную окружения `JAVA_HOME`.

3. Установите остальные зависимости:

    ```bash
    sudo apt install build-essential openjdk-8-jdk maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python brotli
    sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
    sudo apt update
    sudo apt install gcc-10 g++-10
    sudo apt-get install autoconf automake libtool autopoint
    ```

4. Установите OpenSSL:

    ```bash
    sudo apt install -y openssl libssl-dev
    ```

## 2. Компиляция {#2-compilation}

Следующие действия выполняются в каталоге `/home/workspace`.

### 2.1 Загрузка исходного кода {#21-download-the-source-code}

```bash
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

### 2.2 Компиляция сторонних зависимостей {#22-compile-third-party-dependencies}

```bash
cd /home/workspace/doris/thirdparty
./build-thirdparty.sh
```

### 2.3 Компиляция Doris {#23-compile-doris}

```bash
cd /home/workspace/doris
./build.sh
```

`build.sh` поддерживает следующие сочетания параметров:

| Команда                             | Описание                   |
| ----------------------------------- | -------------------------- |
| `./build.sh`                        | Компиляция BE и FE         |
| `./build.sh --be`                   | Компиляция только BE       |
| `./build.sh --fe`                   | Компиляция только FE       |
| `./build.sh --fe --be`              | Компиляция BE и FE         |
| `./build.sh --fe --be --clean`      | Очистка, затем компиляция BE и FE |
| `./build.sh --fe --clean`           | Очистка, затем компиляция FE |
| `./build.sh --be --clean`           | Очистка, затем компиляция BE |

Результаты сборки сохраняются в каталоге `/home/workspace/doris/output/`. При возникновении проблем обратитесь к [официальной документации Doris](http://doris.apache.org).

:::tip Частный репозиторий Maven
Если при компиляции FE требуется указать частный репозиторий Maven, задайте в переменной окружения `USER_SETTINGS_MVN_REPO` путь к `settings.xml`:

```bash
export USER_SETTINGS_MVN_REPO="/xxx/xxx/settings.xml"
```
:::

## 3. Развёртывание и отладка (GDB) {#3-deployment-and-debugging-gdb}

### 3.1 Предоставление прав на выполнение исполняемого файла BE {#31-grant-execute-permission-to-the-be-binary}

```bash
chmod +x /home/workspace/doris/output/be/lib/doris_be
```

`/home/workspace/doris/output/be/lib/doris_be` является исполняемым файлом BE.

### 3.2 Создание каталога для хранения данных {#32-create-the-data-storage-directory}

Проверьте `/home/workspace/doris/output/be/conf/be.conf`:

```bash
# INFO, WARNING, ERROR, FATAL
sys_log_level = INFO
be_port = 9060
be_rpc_port = 9070
webserver_port = 8040
heartbeat_service_port = 9050
brpc_port = 8060
arrow_flight_sql_port = -1

# Note that there should at most one ip match this list.
# If no ip match this rule, will choose one randomly.
# use CIDR format, e.g. 10.10.10.0/
# Default value is empty.
priority_networks = 192.168.59.0/24 # data root path, separate by ';'
storage_root_path = /soft/be/storage
```

Создайте каталог для данных по пути, указанному в `storage_root_path`:

```bash
mkdir -p /soft/be/storage
```

### 3.3 Открытие исходного кода и установка расширения для отладки {#33-open-the-source-code-and-install-the-debugging-extension}

1. Откройте каталог с исходным кодом BE в VSCode (в этом примере `/home/workspace/doris/`).
2. Установите расширение VSCode **C/C++** (ms-vscode.cpptools) для отладки.

    ![](/images/image-20210618104004956.png)

### 3.4 Создание launch.json {#34-create-launchjson}

<!-- Knowledge type: Configuration parameters -->

Создайте конфигурацию для режима запуска (Launch) в `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be/"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": true,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

`environment` определяет переменные окружения, необходимые для работы `doris_be`. Если они не заданы, запуск завершится ошибкой:

| Переменная окружения | Назначение                 |
| -------------------- | -------------------------- |
| `DORIS_HOME`         | Корневой каталог среды выполнения BE |
| `UDF_RUNTIME_DIR`    | Каталог среды выполнения UDF |
| `LOG_DIR`            | Каталог журналов           |
| `PID_DIR`            | Каталог PID-файла          |

`miDebuggerPath` задаёт путь к отладчику (например, `gdb`). Если путь не указан, поиск выполняется в системной переменной `PATH`. Версия GDB, поставляемая с системой, может быть слишком старой, поэтому иногда требуется вручную указать путь к более новой версии.

### 3.5 Отладка в режиме подключения (Attach) {#35-attach-mode-debugging}

Для подключения к работающему процессу BE используйте следующую конфигурацию:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/lib/doris_be",
            "processId": "${command:pickProcess}",
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "internalConsoleOptions": "openOnSessionStart",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

Основные параметры:

- `"request": "attach"`: задаёт режим отладки с подключением к процессу.
- `"processId"`: PID процесса, к которому нужно подключиться. Можно указать конкретное число, `"${command:pickProcess}"` (ручной выбор при запуске) или получить PID следующей командой:

    ```bash
    lsof -i | grep -m 1 doris_be | awk "{print $2}"
    ```

    ![](/images/image-20210618095240216.png)

    На изображении выше `15200` является идентификатором текущего процесса BE.

### 3.6 Полный пример launch.json {#36-complete-launchjson-example}

Ниже приведена полная конфигурация, включающая режимы **запуска (Launch)** и **подключения (Attach)**:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Attach",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "processId": 17016,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        },
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/output/be",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

### 3.7 Запуск отладки {#37-start-debugging}

Нажмите кнопку отладки в VSCode, чтобы начать отладку Doris BE.

![](/images/image-20210618091006146.png)

## 4. Отладка (LLDB) {#4-debugging-lldb}

LLDB подключается к процессу быстрее, чем GDB, и используется аналогичным образом. Установите расширение VSCode `CodeLLDB`, затем добавьте следующую конфигурацию в launch.json:

```json
{
    "name": "CodeLLDB attach",
    "type": "lldb",
    "request": "attach",
    "program": "${workspaceFolder}/output/be/lib/doris_be",
    "pid": "${command:pickMyProcess}"
}
```

:::caution Требование к версии glibc
Для этого способа требуется системная библиотека `glibc` версии `2.18+`. Если это требование не выполнено, воспользуйтесь инструкцией [Как настроить работу CodeLLDB на CentOS7](https://gist.github.com/JaySon-Huang/63dcc6c011feb5bd6deb1ef0cf1a9b96), чтобы установить более новую версию glibc и связать её с расширением.
:::

## 5. Отладка файлов core dump {#5-debugging-core-dump-files}

Чтобы отладить core-файл, созданный при аварийном завершении BE, добавьте следующее в соответствующую конфигурацию:

```json
"coreDumpPath": "/PATH/TO/CORE/DUMP/FILE"
```

## 6. Общие рекомендации по отладке {#6-common-debugging-tips}

### 6.1 Путь выполнения функций {#61-function-execution-path}

Если вы не знакомы с деталями выполнения BE, используйте такие инструменты, как `perf`, для отслеживания вызовов функций и определения цепочки вызовов. Подробнее об использовании `perf` см. в разделе [Инструменты отладки](./debug-tool).

Выполните SQL-запрос, который хотите отследить, на большой таблице, затем увеличьте частоту выборки (например, `perf -F 999`). Результаты позволят получить общее представление о критическом пути выполнения SQL в BE.

### 6.2 Отладка объектов CRTP {#62-debugging-crtp-objects}

Для повышения эффективности выполнения в коде BE широко используется CRTP (Curiously Recurring Template Pattern) в базовых типах. Это не позволяет отладчику просматривать объект как экземпляр его производного типа. В GDB это ограничение можно обойти следующим образом.

Предположим, вам нужно отладить объект `col` типа `IColumn`, но его фактический тип неизвестен:

```bash
set print object on   # Print objects by derived type
p *col.t              # Use col.t to get the concrete type of col
p col.t->size()       # Use it as the derived type, for example, ColumnString supports size()
```

:::caution
Полиморфизм действует для указателя `COW::t`, а не для объекта класса `IColumn`. Чтобы получить объект производного типа, в GDB необходимо заменить каждое использование `col` на `col.t`.
:::

## 7. Часто задаваемые вопросы (FAQ) {#7-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: BE завершается сразу после запуска {#q1-be-exits-immediately-after-startup}

Переменные окружения не заданы или указанные пути не существуют. Убедитесь, что переменные `DORIS_HOME`, `LOG_DIR`, `PID_DIR` и `UDF_RUNTIME_DIR` заданы и соответствующие каталоги созданы.

### Вопрос 2: GDB сообщает о слишком старой версии или неподдерживаемой функции {#q2-gdb-reports-a-version-too-low-or-an-unsupported-feature}

Версия GDB, поставляемая с системой, устарела. Установите более новую версию GDB вручную и укажите путь к ней в `miDebuggerPath`.

### Вопрос 3: CodeLLDB не загружается {#q3-codelldb-fails-to-load}

Версия системной библиотеки `glibc` ниже `2.18`. Для решения проблемы воспользуйтесь ссылкой в разделе 4.

### Вопрос 4: Maven не может подключиться к внешней сети при компиляции FE {#q4-maven-fails-to-reach-the-external-network-when-compiling-fe}

Задайте в переменной окружения `USER_SETTINGS_MVN_REPO` путь к `settings.xml` частного репозитория Maven. См. совет в разделе 2.3.
