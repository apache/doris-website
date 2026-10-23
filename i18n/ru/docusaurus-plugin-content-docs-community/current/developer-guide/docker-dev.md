---
title: Быстрое создание среды разработки Doris с помощью Docker
language: ru
description: Быстро настройте среду разработки Apache Doris с помощью Docker, используя пример Dockerfile и настройку VSCode Remote.
keywords:
    - Apache Doris
    - Docker
    - среда разработки
    - Dockerfile
    - VSCode Remote
    - SYS_PTRACE
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

# Быстрое создание среды разработки Doris с помощью Docker {#quick-doris-development-environment-with-docker}

В этой статье описано, как с помощью Docker создать образ для разработки Doris, скомпилировать и запустить FE/BE, а также использовать VSCode Remote для разработки и отладки.

<!-- Knowledge type: Procedure -->
<!-- Use case: IDE configuration / Containerized development environment -->

## Подробная документация по теме {#related-detailed-documents}

- [Компиляция с использованием образа Docker для разработки](/community/source-install/compilation-with-docker)
- [Развёртывание](/docs/dev/install/deploy-manually/integrated-storage-compute-deploy-manually)
- [Разработка и отладка BE в VSCode](./be-vscode-dev)

## 1. Подготовка среды {#1-environment-preparation}

| Компонент     | Описание                          |
| ------------- | --------------------------------- |
| Docker        | Установлен и запущен              |
| VSCode        | Последняя стабильная версия       |
| Плагин Remote | VSCode Remote - Containers / SSH  |

## 2. Сборка образа {#2-build-the-image}

### 2.1 Создание Dockerfile {#21-create-the-dockerfile}

Создайте `Dockerfile` в рабочем каталоге. В VSCode можно использовать Ctrl+D для замены следующих заполнителей:

| Заполнитель                    | Значение                          |
| ------------------------------- | --------------------------------- |
| `<!!! your user !!!>`           | Имя пользователя, создаваемого в контейнере |
| `<!!! your user password !!!>`  | Пароль этого пользователя         |
| `<!!! root password !!!>`       | Пароль пользователя root          |
| `<!!! your git email !!!>`      | Электронная почта для настройки git |
| `<!!! your git username !!!>`   | Имя пользователя для настройки git |

```dockerfile
FROM apache/incubator-doris:build-env-latest

USER root
WORKDIR /root
RUN echo '<!!! root password !!!>' | passwd root --stdin

RUN yum install -y vim net-tools man wget git mysql lsof bash-completion \
        && cp /var/local/thirdparty/installed/bin/thrift /usr/bin

# For better safety, create a user instead of using root
RUN yum install -y sudo \
        && useradd -ms /bin/bash <!!! your user !!!> && echo <!!! your user password !!!> | passwd <!!! your user !!!> --stdin \
        && usermod -a -G wheel <!!! your user !!!>

USER <!!! your user !!!>
WORKDIR /home/<!!! your user !!!>
RUN git config --global color.ui true \
        && git config --global user.email "<!!! your git email !!!>" \
        && git config --global user.name "<!!! your git username !!!>"

# Optionally install zsh and oh my zsh for easier use; remove if not needed
USER root
RUN yum install -y zsh \
        && chsh -s /bin/zsh <!!! your user !!!>
USER <!!! your user !!!>
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh \
        && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
        && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 2.2 Сборка образа {#22-build-the-image}

```shell
docker build -t doris .
```

### 2.3 Запуск образа {#23-run-the-image}

<!-- Knowledge type: Configuration parameters -->

Сведения о параметрах монтирования см. в разделе [Примечания по монтированию при компиляции с Docker](../source-install/compilation-with-docker). Рекомендуется запускать образ, монтируя локальный каталог с исходным кодом Doris.

:::caution Пользователям Windows
В Windows при монтировании возникают проблемы с доступом между файловыми системами. Настройте монтирование с учётом особенностей вашей среды.
:::

Параметр `--cap-add SYS_PTRACE` позволяет использовать ptrace внутри Docker, что необходимо для работы с ptrace и удалённой отладки с помощью GDB:

```shell
docker run -it --cap-add SYS_PTRACE doris:latest /bin/bash
```

| Параметр              | Назначение                                       |
| --------------------- | ------------------------------------------------ |
| `--cap-add SYS_PTRACE` | Разрешает вызов ptrace внутри контейнера (требуется для GDB) |
| `-it`                 | Интерактивный TTY                                |
| `-v <local>:<container>` | Монтирует локальный каталог с исходным кодом (при необходимости) |

### 2.4 Настройка zsh (необязательно) {#24-configure-zsh-optional}

Если вы установили zsh, замените строку плагинов в `~/.zshrc`:

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 2.5 Получение исходного кода Doris {#25-pull-the-doris-source-code}

```shell
su <your user>
mkdir code && cd code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

## 3. Компиляция {#3-compile}

:::caution Первая компиляция
При первой компиляции используйте следующую команду для принудительной сборки с очисткой:

```shell
sh build.sh --clean --be --fe --ui
```

В образе `build-env-for-0.15.0` версия thrift обновлена (с 0.9 до 0.13), поэтому необходимо использовать `--clean`, чтобы принудительно сгенерировать файлы кода новой версией thrift. Иначе возникнет несовместимость кода.
:::

После этого компилируйте Doris обычным способом:

```shell
sh build.sh
```

## 4. Запуск {#4-run}

### 4.1 Подготовка каталога метаданных {#41-prepare-the-metadata-directory}

Вручную создайте каталог `meta_dir` для хранения метаданных. Значение по умолчанию: `${DORIS_HOME}/doris-meta`:

```shell
mkdir meta_dir
```

### 4.2 Запуск FE {#42-start-fe}

```shell
cd output/fe
sh bin/start_fe.sh --daemon
```

### 4.3 Запуск BE {#43-start-be}

```shell
cd output/be
sh bin/start_be.sh --daemon
```

### 4.4 Подключение с помощью mysql-client {#44-connect-with-mysql-client}

```shell
mysql -h 127.0.0.1 -P 9030 -u root
```

## 5. Часто задаваемые вопросы {#5-faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: GDB сообщает об ошибке `ptrace: Operation not permitted` {#q1-gdb-reports-ptrace-operation-not-permitted}

Контейнер был запущен без параметра `--cap-add SYS_PTRACE`. Перезапустите контейнер, добавив этот параметр.

### Вопрос 2: При компиляции возникает ошибка несоответствия версии thrift {#q2-compilation-reports-thrift-version-mismatch}

При первой компиляции не был указан параметр `--clean`. Выполните очистку и повторную компиляцию с помощью команды из раздела 3.

### Вопрос 3: FE / BE завершает работу сразу после запуска {#q3-fe--be-exits-immediately-after-starting}

Проверьте, созданы ли каталоги `meta_dir` и `storage_root_path`, свободны ли порты и охватывает ли `priority_networks` IP контейнера.

### Вопрос 4: Не удаётся подключиться к процессу для отладки в контейнере VSCode Remote {#q4-vscode-remote-container-cannot-attach-to-a-process-for-debugging}

Не добавлена возможность `SYS_PTRACE`, либо в плагине VSCode C/C++ не указан подходящий `miDebuggerPath`.
