---
title: Компиляция Apache Doris с помощью образов Docker
language: ru
description: Компиляция исходного кода Apache Doris с помощью официального образа Docker без необходимости вручную настраивать thirdparty или toolchain.
keywords:
    - Компиляция с Docker
    - Apache Doris
    - Компиляция из исходного кода
    - build-env
    - AVX2
    - JDK 8
    - JDK 17
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
"AS IS" BASIS, WITHOUT WARRANTIES OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: First-time compilation / Environment validation -->

В этом документе описано, как скомпилировать исходный код Doris с помощью официального образа Apache Doris для сборки. Сообщество поддерживает образ и оперативно обновляет его зависимости, поэтому вручную устанавливать toolchain и сторонние библиотеки не требуется. Этот способ компиляции **рекомендуется в первую очередь**.

:::tip
При использовании образа Docker компиляция и развёртывание в режиме разделения хранения и вычислений пока не поддерживаются.
:::

## Целевая аудитория, преимущества и недостатки {#target-audience-pros-and-cons}

| Критерий | Описание |
| ---- | ---- |
| Целевая аудитория | Разработчики, которым нужно быстро подготовить среду сборки без ручной настройки зависимостей |
| Преимущества | Образ содержит предустановленные thirdparty, toolchain и JDK и сразу готов к использованию |
| Недостатки | На локальной машине требуется рабочая среда Docker; образ занимает довольно много места (около 3.3 ГБ) |

Если Docker недоступен на машине, воспользуйтесь [компиляцией с LDB Toolchain](./compilation-with-ldb-toolchain).

## 1. Установка Docker {#1-install-docker}

В CentOS установите Docker напрямую через менеджер пакетов:

```bash
yum install docker
```

Для других дистрибутивов см. [официальное руководство по установке Docker](https://docs.docker.com/engine/install/).

## 2. Выбор и загрузка образа для сборки {#2-choose-and-download-the-build-image}

<!-- Knowledge type: Configuration parameters -->

Для разных версий Doris предназначены разные образы для сборки. `apache/doris:build-env-ldb-toolchain-latest` используется для компиляции кода ветки master и непрерывно обновляется вместе с основной веткой.

| Тег образа | Совместимая версия Doris | Примечания |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-2.1` | 2.1.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-3.0` | 3.0.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-3.1` | 3.1.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | Соответствует основной ветке |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | Совместим с CPU без поддержки AVX2 |

На примере компиляции Doris 2.0 загрузим и проверим образ:

```bash
# You can also use docker.io/apache/doris:build-env-for-2.0
docker pull apache/doris:build-env-for-2.0

# Confirm that the image has been downloaded successfully
docker images
# REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
# apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

### Примечания по выбору образа {#notes-on-image-selection}

- Теги образов однозначно соответствуют версиям Doris. Выбирайте образ, соответствующий целевой ветке, и избегайте компиляции с образом для другой версии.
- Сторонние библиотеки в образах `no-avx2` могут работать на CPU без поддержки AVX2. Их необходимо компилировать с параметром `USE_AVX2=0`.
- Историю изменений образов см. в [журнале изменений thirdparty](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md).
- Последняя версия образа `apache/doris:build-env-ldb-toolchain-latest` (на данный момент поддерживает только архитектуру x86_64) включает JDK 8 и JDK 17. Для версий 2.1 и более ранних используйте JDK 8, а для версий 3.0 и более поздних или ветки master используйте JDK 17.
- При компиляции с помощью Docker на архитектуре ARM64 сначала загрузите базовый образ Linux, совместимый с ARM64 (например, `apache/doris:base-latest`, который соответствует Ubuntu 22.04.5 LTS), а затем установите зависимости и выполните компиляцию по инструкциям из документов [Прямая компиляция в Linux](./compilation-linux) и [Компиляция на платформе ARM](./compilation-arm).

Внутри контейнера переключайте JDK с помощью переменных окружения:

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 3. Компиляция Doris {#3-compile-doris}

<!-- Knowledge type: Procedure -->

### 3.1 Загрузка исходного кода Doris {#31-download-the-doris-source-code}

На хосте загрузите код нужной ветки (в примере используется branch-2.0):

```bash
git clone -b branch-2.0 https://github.com/apache/doris.git
```

Предположим, что исходный код находится в каталоге `~/doris-branch-2.0`.

### 3.2 Запуск контейнера для сборки {#32-start-the-build-container}

```bash
# Prepare the maven .m2 directory on the host in advance so that Java dependencies can be reused across multiple builds
mkdir ~/.m2

# Mount the source code and the .m2 directory, then start the build image
docker run -it --network=host \
    --name mydocker \
    -v ~/.m2:/root/.m2 \
    -v ~/doris-branch-2.0:/root/doris-branch-2.0/ \
    apache/doris:build-env-for-2.0

# After the command runs successfully, it enters the container automatically
```

Назначение основных параметров `docker run`:

| Параметр | Назначение |
| ---- | ---- |
| `-v` | Подключает каталог хоста к контейнеру для сохранения исходного кода и зависимостей |
| `--name` | Задаёт имя контейнера для удобства дальнейшего управления |
| `--network` | Задаёт сетевой режим контейнера. `host` использует общий сетевой стек с хостом и не требует проброса портов |

Рекомендации:

- Всегда подключайте каталог с исходным кодом Doris, чтобы артефакты сборки оставались на хосте и не терялись после завершения работы контейнера.
- Подключайте каталог `.m2`, чтобы не загружать зависимости Maven повторно при каждом запуске контейнера.
- Для загрузки сторонних библиотек внутри контейнера требуется доступ в интернет. Рекомендуется использовать режим `--network=host`.

### 3.3 Выполнение сборки {#33-run-the-build}

В контейнере перейдите в каталог исходного кода и выполните:

```bash
# By default, compile artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

По завершении сборки артефакты будут находиться в подкаталоге `output/` каталога с исходным кодом.

:::tip
**Как проверить, поддерживает ли машина набор инструкций AVX2?**

```bash
cat /proc/cpuinfo | grep avx2
```

Непустой вывод означает, что AVX2 поддерживается.
:::

## 4. Создание собственного образа для разработки {#4-build-your-own-development-image}

Чтобы настроить базовый образ под свои задачи (например, выбрать другой базовый дистрибутив или добавить инструменты отладки), обратитесь к файлу `docker/README.md` в исходном коде.

## Часто задаваемые вопросы {#faq}

### Вопрос 1: Что произойдёт, если версия образа не соответствует версии Doris? {#q1-what-happens-if-the-image-version-does-not-match-the-doris-version}

Библиотеки thirdparty и toolchain в образе тесно связаны с исходным кодом Doris. Использование компонентов разных версий с высокой вероятностью приведёт к ошибкам компоновки, таким как `undefined reference` или `incompatible library`, во время компиляции. Выбирайте образ строго по таблице.

### Вопрос 2: При сборке появляется сообщение `AVX2 not supported`? {#q2-the-build-reports-avx2-not-supported}

CPU хоста или целевой машины, на которой будет запускаться Doris, не поддерживает набор инструкций AVX2. Перейдите на образ с суффиксом `no-avx2` и задайте `USE_AVX2=0` при сборке.

### Вопрос 3: Образ загружается слишком медленно с помощью `docker pull`? {#q3-docker-pull-is-too-slow-to-pull-the-image}

Настройте зеркало Docker для ускорения загрузки образов или используйте полный путь `docker.io/apache/doris:...`.

### Вопрос 4: В контейнере не удаётся загрузить библиотеки Java? {#q4-java-library-downloads-fail-inside-the-container}

Убедитесь, что контейнер запущен с параметром `--network=host`, а каталог `~/.m2` подключён к контейнеру, чтобы прокси или сетевая изоляция не препятствовали доступу к центральному репозиторию Maven.

## Связанные документы {#related-documents}

- [Компиляция с LDB Toolchain](./compilation-with-ldb-toolchain)
- [Прямая компиляция в Linux](./compilation-linux)
- [Компиляция на платформах ARM](./compilation-arm)
