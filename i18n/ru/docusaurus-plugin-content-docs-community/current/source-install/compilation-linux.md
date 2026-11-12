---
title: Компиляция Apache Doris непосредственно в Linux
language: ru
description: "Компиляция Apache Doris непосредственно в Linux: JDK, зависимости, проверка поддержки набора инструкций AVX2 и команды сборки."
keywords:
    - Компиляция в Linux
    - Apache Doris
    - Компиляция из исходного кода
    - Ubuntu
    - JDK 17
    - AVX2
    - build.sh
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
<!-- Applicable scenario: First-time compilation / compiling directly on a physical machine -->

В этом документе описано, как скомпилировать Apache Doris непосредственно в Linux (на примере Ubuntu 24.04 или более поздней версии), без использования образа Docker или LDB Toolchain.

## Целевая аудитория, преимущества и недостатки {#target-audience-pros-and-cons}

| Критерий | Описание |
| ---- | ---- |
| Целевая аудитория | Разработчики, использующие современный дистрибутив (например, Ubuntu 24.04+) и желающие работать с GCC, входящим в его состав |
| Преимущества | Минимум действий; установка зависимостей напрямую через системный менеджер пакетов |
| Недостатки | В старых дистрибутивах сборка может завершиться ошибкой из-за слишком старой версии GCC или glibc. В этом случае используйте [LDB Toolchain](./compilation-with-ldb-toolchain) |

## Требования к окружению {#environment-requirements}

<!-- Knowledge type: Hardware requirements -->

| Компонент | Требования к версии |
| ---- | -------- |
| Операционная система | Ubuntu 24.04+ (или сопоставимая версия другого дистрибутива) |
| JDK | 8+ (для версии 2.1 и более ранних); 17 (для версии 3.0 и более поздних или ветки master) |
| GCC | 10+ |
| Python | 2.7+ |
| Apache Maven | 3.5+ |
| CMake | 3.19.2+ |
| Bison | 3.0+ |

## 1. Установите JDK {#1-install-jdk}

<!-- Knowledge type: Procedure -->

Выберите JDK в зависимости от версии Doris, которую собираетесь компилировать:

```bash
# To compile Doris 2.1 or earlier, install JDK 8
sudo apt install openjdk-8-jdk

# To compile Doris 3.0 or later, or the master branch, install JDK 17
sudo apt install openjdk-17-jdk
```

## 2. Установите системные зависимости {#2-install-system-dependencies}

```bash
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10
sudo apt-get install autoconf automake libtool autopoint
```

## 3. Проверьте, поддерживает ли CPU AVX2 {#3-check-whether-the-cpu-supports-avx2}

```bash
cat /proc/cpuinfo | grep avx2
```

Непустой вывод означает, что CPU поддерживает AVX2 и можно использовать параметры компиляции по умолчанию. В противном случае добавьте `USE_AVX2=0` к команде сборки.

## 4. Запустите сборку {#4-run-the-build}

```bash
# Default build, producing AVX2-enabled artifacts
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Build a Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

## 5. Найдите результаты сборки {#5-locate-the-build-artifacts}

После завершения сборки её результаты находятся в каталоге `output/` в корне дерева исходного кода.

## Часто задаваемые вопросы {#faq}

### Q1: Можно ли выполнять компиляцию напрямую в старых версиях Ubuntu или CentOS? {#q1-can-older-versions-of-ubuntu-or-centos-compile-directly}

Старые дистрибутивы обычно поставляются со слишком старыми версиями GCC и glibc. Используйте [LDB Toolchain](./compilation-with-ldb-toolchain) или [образ Docker](./compilation-with-docker).

### Q2: При сборке появляется сообщение `AVX2 not supported`. {#q2-the-build-reports-avx2-not-supported}

CPU не поддерживает набор инструкций AVX2. Повторите сборку с помощью `USE_AVX2=0 sh build.sh` и скачайте предварительно собранные сторонние библиотеки серии `no-avx2`.

### Q3: Сборка завершается ошибкой `Too many open files`. {#q3-the-build-fails-with-too-many-open-files}

Увеличьте лимит файловых дескрипторов для каждого процесса командой `ulimit -n 65536` или задайте его на постоянной основе в `/etc/security/limits.conf`.

### Q4: Сборка принудительно прерывается из-за нехватки памяти. {#q4-the-build-is-killed-midway-due-to-insufficient-memory}

Сообщение `ninja failed with: signal: killed` обычно указывает на нехватку памяти (OOM). Используйте машину с объёмом памяти не менее 16 ГБ или уменьшите степень параллелизма (параметр `-j`).

## Связанные документы {#related-documents}

- [Компиляция с помощью LDB Toolchain](./compilation-with-ldb-toolchain)
- [Компиляция с использованием образа Docker](./compilation-with-docker)
- [Компиляция на ARM](./compilation-arm)
