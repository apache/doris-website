---
title: Компиляция Apache Doris с помощью LDB Toolchain
language: ru
description: Компиляция Apache Doris в Linux с помощью LDB Toolchain. Подробные инструкции по установке набора инструментов и сборке.
keywords:
    - LDB Toolchain
    - Apache Doris
    - компиляция из исходного кода
    - компиляция в Linux
    - предварительно собранные сторонние библиотеки
    - AVX2
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

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation / No Docker environment -->

В этом документе описано, как скомпилировать Apache Doris в Linux с помощью LDB Toolchain. Этот способ дополняет [компиляцию с использованием образа Docker](./compilation-with-docker) и подходит разработчикам, у которых нет среды Docker.

:::tip
Название LDB Toolchain расшифровывается как **Linux Distribution Based Toolchain Generator**. Это автономный, переносимый и современный набор инструментов для компиляции C++, позволяющий собирать современные проекты C++ практически в любом дистрибутиве Linux.
:::

Благодарим [Amos Bird](https://github.com/amosbird) за вклад в проект.

## Соответствие версий {#version-mapping}

<!-- Knowledge type: Configuration parameters -->

| Версия Doris | Рекомендуемая версия LDB Toolchain | Компиляторы в составе набора |
| ---------- | ----------------------- | ---------- |
| master | 0.25 | clang-20, gcc-15 |
| 3.1 / 3.0 / 2.1 | 0.19 | clang-17, gcc-13 |

## Целевая аудитория, преимущества и недостатки {#target-audience-pros-and-cons}

| Аспект | Описание |
| ---- | ---- |
| Целевая аудитория | Разработчики без среды Docker, которые хотят выполнять компиляцию непосредственно на физической или виртуальной машине |
| Преимущества | Нет зависимости от Docker; набор инструментов автономен и не затрагивает системный компилятор |
| Недостатки | Java, Maven, Node и системные зависимости необходимо устанавливать вручную |

## 1. Подготовка среды компиляции {#1-prepare-the-compilation-environment}

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation -->

Инструкции подходят для большинства дистрибутивов Linux (CentOS, Ubuntu и других).

### 1.1 Скачивание `ldb_toolchain_gen.sh` {#11-download-ldb_toolchain_gensh}

Скачайте соответствующую версию со страницы [релизов ldb_toolchain_gen](https://github.com/amosbird/ldb_toolchain_gen/releases):

- Архитектура x86_64: скачайте `ldb_toolchain_gen.sh`
- Архитектура ARM: скачайте `ldb_toolchain_gen.aarch64.sh`

:::tip
Главная страница проекта: <https://github.com/amosbird/ldb_toolchain_gen>
:::

### 1.2 Создание LDB Toolchain {#12-generate-the-ldb-toolchain}

Запустите скрипт для создания набора инструментов:

```bash
bash ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

Здесь `/path/to/ldb_toolchain/` — целевой каталог установки. После успешного выполнения скрипта в этом каталоге появится следующая структура:

```text
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

### 1.3 Установка остальных компонентов для компиляции {#13-install-other-compilation-components}

| Компонент | Рекомендуемая версия | Ссылка для скачивания |
| ---- | -------- | -------- |
| JDK 8 | 1.8.0_391 | [jdk-8u391-linux-x64.tar.gz](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz) |
| JDK 17 | 17.0.10 | [jdk-17.0.10_linux-x64](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz) |
| Maven | 3.9.9 | [apache-maven-3.9.9-bin.tar.gz](https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz) |
| Node | v12.13.0 | [node-v12.13.0-linux-x64.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz) |

Правила выбора версии JDK:

- Для Doris 2.1 и более ранних версий используйте JDK 8
- Для Doris 3.0 и более поздних версий, а также ветки master используйте JDK 17
- Также можно установить OpenJDK 8 или 17 непосредственно через пакетный менеджер вашего дистрибутива Linux (`yum`, `apt` и другие)

Состав системных компонентов различается между дистрибутивами Linux, поэтому может потребоваться установка дополнительных инструментов. Пример для CentOS 6:

```bash
# Install system dependencies
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

# Install autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

# Install bison-3.8.2
wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz && \
    tar xzf bison-3.8.2.tar.gz && \
    cd bison-3.8.2 && \
    ./configure && \
    make && \
    make install
```

### 1.4 Скачивание исходного кода Doris и настройка переменных окружения {#14-download-the-doris-source-code-and-configure-environment-variables}

```bash
git clone https://github.com/apache/doris.git
```

Перейдите в каталог исходного кода и создайте файл `custom_env.sh` со следующими переменными окружения:

```bash
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 2. Компиляция Doris {#2-compile-doris}

<!-- Knowledge type: Procedure -->

:::tip
По умолчанию `build.sh` сначала компилирует сторонние библиотеки. Чтобы пропустить их компиляцию, см. раздел [3. Ускорение сборки с помощью предварительно собранных сторонних библиотек](#3-speed-up-with-precompiled-third-party-libraries).
:::

### 2.1 Проверка поддержки AVX2 {#21-check-whether-avx2-is-supported}

```bash
cat /proc/cpuinfo | grep avx2
```

Непустой вывод означает, что CPU поддерживает AVX2.

### 2.2 Запуск компиляции {#22-run-the-compilation}

```bash
# By default, build artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

Скрипт последовательно компилирует сторонние библиотеки, FE, BE и MS, а затем записывает артефакты в каталог `output/`. Модуль MS используется в режиме разделения хранения и вычислений. Подробности см. в соответствующей документации.

## 3. Ускорение сборки с помощью предварительно собранных сторонних библиотек {#3-speed-up-with-precompiled-third-party-libraries}

<!-- Use case: Speed up compilation / Restricted network -->

По умолчанию `build.sh` компилирует сторонние библиотеки из исходного кода, что занимает много времени. Также можно напрямую скачать предварительно собранную сообществом версию:

```text
https://github.com/apache/doris-thirdparty/releases
```

Сообщество предоставляет предварительно собранные артефакты для Linux, macOS и ARM. После скачивания и распаковки архива вы получите каталог `installed/`. Скопируйте его в каталог `thirdparty/` исходного кода Doris, затем запустите `build.sh`, чтобы пропустить компиляцию сторонних библиотек.

## Часто задаваемые вопросы {#faq}

### Вопрос 1: Как выбрать версию LDB Toolchain? {#q1-how-do-i-choose-an-ldb-toolchain-version}

Следуйте таблице: используйте 0.25 для ветки master и 0.19 для веток 3.1, 3.0 и 2.1. Неподходящая версия может привести к несовместимости ABI и ошибкам компоновки.

### Вопрос 2: Что делать, если `cat /proc/cpuinfo | grep avx2` ничего не выводит? {#q2-what-if-cat-proccpuinfo--grep-avx2-produces-no-output}

CPU не поддерживает AVX2. Добавьте `USE_AVX2=0` при компиляции и используйте предварительно собранные сторонние библиотеки или образы для компиляции с суффиксом `-no-avx2`.

### Вопрос 3: Что делать, если во время компиляции возникает ошибка `Too many open files`? {#q3-what-if-i-hit-too-many-open-files-during-compilation}

Увеличьте лимит файловых дескрипторов с помощью `ulimit -n 65536` или задайте его в `/etc/security/limits.conf`, чтобы изменение сохранялось постоянно.

### Вопрос 4: Что следует учитывать при компиляции на ARM? {#q4-what-should-i-watch-out-for-when-compiling-on-arm}

Скачайте `ldb_toolchain_gen.aarch64.sh`. Инструкции по отключению AVX2, libunwind, Azure и других несовместимых сторонних библиотек см. в разделе [Компиляция для платформы ARM](./compilation-arm).

## Связанные документы {#related-documents}

- [Компиляция с использованием образа Docker](./compilation-with-docker)
- [Компиляция непосредственно в Linux](./compilation-linux)
- [Компиляция для платформы ARM](./compilation-arm)
