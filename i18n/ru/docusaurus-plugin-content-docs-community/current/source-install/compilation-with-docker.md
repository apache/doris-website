---
title: Компиляция Apache Doris с помощью Docker-образов
language: ru
description: Компиляция исходного кода Apache Doris с помощью официального Docker-образа без ручной настройки thirdparty и toolchain.
keywords:
    - компиляция в Docker
    - Apache Doris
    - компиляция исходного кода
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

В этом документе описано, как компилировать исходный код Doris с помощью официального образа Apache Doris для сборки. Сообщество поддерживает этот образ и своевременно обновляет его зависимости, поэтому устанавливать toolchain и сторонние библиотеки вручную не требуется. Это **наиболее рекомендуемый** способ компиляции.

:::tip
Способ с использованием Docker-образа пока не поддерживает компиляцию и развёртывание в режиме разделения хранения и вычислений.
:::

## Для кого предназначен этот способ: преимущества и недостатки {#target-audience-pros-and-cons}

| Критерий | Описание |
| ---- | ---- |
| Для кого | Для разработчиков, которые хотят быстро подготовить среду сборки без ручной настройки зависимостей |
| Преимущества | В образе уже установлены thirdparty, toolchain и JDK: можно сразу приступать к работе |
| Недостатки | На локальной машине должен работать Docker; образ довольно большой (около 3.3 GB) |

Если Docker недоступен на машине, используйте [компиляцию с LDB Toolchain](./compilation-with-ldb-toolchain).

## 1. Установка Docker {#1-install-docker}

В CentOS установите Docker через менеджер пакетов:

```bash
yum install docker
```

Для других дистрибутивов обратитесь к [официальному руководству по установке Docker](https://docs.docker.com/engine/install/).

## 2. Выбор и загрузка образа для сборки {#2-choose-and-download-the-build-image}

<!-- Knowledge type: Configuration parameters -->

Для разных версий Doris предназначены разные образы для сборки. Образ `apache/doris:build-env-ldb-toolchain-latest` используется для компиляции кода ветки master и постоянно обновляется вместе с основной веткой.

| Тег образа | Подходящая версия Doris | Примечания |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-2.1` | 2.1.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-3.0` | 3.0.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-for-3.1` | 3.1.x | Поддерживает набор инструкций AVX2 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | Совместим с CPU без поддержки AVX2 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | Обновляется вместе с основной веткой |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | Совместим с CPU без поддержки AVX2 |

Выполняйте следующие команды на хосте. В примере компилируется ветка `master`; для ветки выпуска измените и ветку, и образ согласно таблице выше. Остальные команды для хоста выполняйте в той же оболочке, чтобы сохранить значения переменных. Варианты для ARM64 и JDK описаны в разделе [«Примечания по выбору образа»](#notes-on-image-selection).

```bash
DORIS_BRANCH=master
DORIS_BUILD_IMAGE=apache/doris:build-env-ldb-toolchain-latest
DORIS_SOURCE_DIR="$PWD/doris"

docker pull "$DORIS_BUILD_IMAGE"
```

## 3. Компиляция Doris {#3-compile-doris}

<!-- Knowledge type: Procedure -->

### 3.1 Загрузка исходного кода Doris {#31-download-the-doris-source-code}

На хосте клонируйте выбранную ветку в каталог, указанный выше:

```bash
git clone --branch "$DORIS_BRANCH" https://github.com/apache/doris.git "$DORIS_SOURCE_DIR"
```

### 3.2 Запуск контейнера для сборки {#32-start-the-build-container}

```bash
mkdir -p "$HOME/.m2"

docker run -it --network=host \
    --name doris-build \
    -v "$HOME/.m2:/root/.m2" \
    -v "$DORIS_SOURCE_DIR:/root/doris" \
    --workdir /root/doris \
    "$DORIS_BUILD_IMAGE"
```

Команда открывает Bash внутри контейнера. Рабочим каталогом становится смонтированный каталог с исходным кодом `/root/doris`.

Основные параметры `docker run`:

| Параметр | Назначение |
| ---- | ---- |
| `-v` | Монтирует каталог хоста в контейнер, чтобы сохранять исходный код и зависимости |
| `--name` | Задаёт имя контейнера для удобства дальнейшего управления |
| `--workdir` | Запускает оболочку в смонтированном каталоге с исходным кодом |
| `--network` | Задаёт сетевой режим контейнера. Режим `host` позволяет использовать сетевой стек хоста без проброса портов |

Рекомендации:

- Всегда монтируйте каталог с исходным кодом Doris, чтобы результаты сборки оставались на хосте и не терялись после завершения работы контейнера.
- Монтируйте каталог `.m2`, чтобы не загружать зависимости Maven заново при каждом запуске контейнера.
- Для загрузки сторонних библиотек внутри контейнера нужен доступ к интернету. Рекомендуется режим `--network=host`.

### 3.3 Запуск сборки {#33-run-the-build}

Внутри контейнера запустите сборку с параметрами по умолчанию:

```bash
bash build.sh
```

После завершения сборки её результаты находятся в каталоге `output/` внутри каталога с исходным кодом.

:::tip
**Как проверить, поддерживает ли машина набор инструкций AVX2?**

```bash
cat /proc/cpuinfo | grep avx2
```

Если вывод не пустой, AVX2 поддерживается.
:::

### Другие варианты сборки {#other-build-options}

При необходимости вместо сборки с параметрами по умолчанию используйте одну из следующих команд:

```bash
# For CPUs without AVX2
USE_AVX2=0 bash build.sh

# Build the Debug version of BE
BUILD_TYPE=Debug bash build.sh
```

### Примечания по выбору образа {#notes-on-image-selection}

- Теги образов соответствуют версиям Doris. Выбирайте образ для целевой ветки и избегайте компиляции с образом для другой версии.
- Сторонние библиотеки в образах `no-avx2` могут работать на CPU без поддержки AVX2. При сборке с этими образами необходимо задать параметр `USE_AVX2=0`.
- Историю изменений образа см. в [thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md).
- Последний образ `apache/doris:build-env-ldb-toolchain-latest` (в настоящее время поддерживает только архитектуру x86_64) содержит как JDK 8, так и JDK 17. Для версий 2.1 и более ранних используйте JDK 8, а для версий 3.0 и более поздних либо ветки master — JDK 17.
- При компиляции с Docker на архитектуре ARM64 сначала загрузите базовый Linux-образ, совместимый с ARM64 (например, `apache/doris:base-latest`, соответствующий Ubuntu 22.04.5 LTS), затем установите зависимости и выполните компиляцию согласно документам [«Прямая компиляция в Linux»](./compilation-linux) и [«Компиляция на платформах ARM»](./compilation-arm).

Внутри контейнера переключайте JDK с помощью переменных окружения:

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 4. Создание собственного образа для разработки {#4-build-your-own-development-image}

Чтобы настроить базовый образ (например, выбрать другой базовый дистрибутив или добавить средства отладки), обратитесь к файлу `docker/README.md` в исходном коде.

## Часто задаваемые вопросы {#faq}

### Q1: Что произойдёт, если версия образа не соответствует версии Doris? {#q1-what-happens-if-the-image-version-does-not-match-the-doris-version}

Библиотеки thirdparty и toolchain в образе тесно связаны с исходным кодом Doris. Сочетание разных версий с высокой вероятностью вызовет при компиляции ошибки компоновщика, например `undefined reference` или `incompatible library`. Выбирайте образ строго по таблице.

### Q2: При сборке появляется сообщение `AVX2 not supported`? {#q2-the-build-reports-avx2-not-supported}

CPU хоста или целевой машины, на которой будет работать программа, не поддерживает набор инструкций AVX2. Перейдите на образ с суффиксом `no-avx2` и задайте `USE_AVX2=0` при сборке.

### Q3: Команда `docker pull` загружает образ слишком медленно? {#q3-docker-pull-is-too-slow-to-pull-the-image}

Настройте зеркало для ускорения загрузки Docker-образов или используйте полный путь `docker.io/apache/doris:...`.

### Q4: Не удаётся загрузить библиотеки Java внутри контейнера? {#q4-java-library-downloads-fail-inside-the-container}

Убедитесь, что контейнер запущен с параметром `--network=host`, а каталог `~/.m2` смонтирован в контейнер. Иначе прокси-сервер или сетевая изоляция могут сделать центральный репозиторий Maven недоступным.

### Q5: Git сообщает `detected dubious ownership in repository`? {#q5-git-reports-detected-dubious-ownership-in-repository}

Смонтированный каталог с исходным кодом может принадлежать другому пользователю хоста. Убедившись, что доверяете репозиторию с исходным кодом, добавьте внутри контейнера исключение для смонтированного пути:

```bash
git config --global --add safe.directory /root/doris
```

Если вы изменили путь монтирования внутри контейнера, соответственно замените `/root/doris`.

## Связанные документы {#related-documents}

- [Компиляция с LDB Toolchain](./compilation-with-ldb-toolchain)
- [Прямая компиляция в Linux](./compilation-linux)
- [Компиляция на платформах ARM](./compilation-arm)
