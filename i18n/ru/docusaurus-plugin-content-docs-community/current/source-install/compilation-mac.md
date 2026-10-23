---
title: Компиляция Apache Doris в macOS
language: ru
description: Скомпилируйте Apache Doris в macOS (Intel / Apple Silicon) и подготовьте среду для локальной отладки.
keywords:
    - компиляция в macOS
    - Apple Silicon
    - Intel Mac
    - Apache Doris
    - компиляция из исходного кода
    - Homebrew
    - Thrift
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
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Local development / macOS debugging -->

# Компиляция в macOS {#compiling-on-macos}

В этом документе описано, как установить зависимости, скомпилировать Apache Doris из исходного кода, запустить его и подготовить среду для локальной отладки в macOS (Intel и Apple Silicon).

:::tip
Компиляция и развёртывание в режиме с разделением вычислений и хранения пока не поддерживаются в macOS.
:::

## 1. Требования к среде {#1-environment-requirements}

- macOS 12 (Monterey) или более поздняя версия (поддерживаются Intel и Apple Silicon)
- [Homebrew](https://brew.sh/)
- JDK 8 или JDK 17 (в настоящее время Doris поддерживает только эти две версии)

## 2. Установка зависимостей {#2-install-dependencies}

Установите основные зависимости с помощью Homebrew:

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@22 llvm@20 openjdk@17 npm
```

> Необходимы обе версии LLVM. `llvm@22` используется для компиляции BE (LLVM 22.1.8 стал первым выпуском, в котором среда выполнения AddressSanitizer запускается в macOS 26.4 и более поздних версиях). `llvm@20` используется для компиляции сторонних библиотек при их сборке из исходного кода: `thirdparty/build-thirdparty.sh` завершает работу, если эта версия отсутствует, а `build.sh` автоматически запускает такую сборку, когда в `thirdparty/installed` нет нужной ему библиотеки. Скрипты сборки находят обе версии через Homebrew, поэтому ни одну из них не нужно добавлять в `PATH`.

> В версии brew для arm64 в macOS по умолчанию нет JDK 8, поэтому рекомендуется использовать `openjdk@17`. Если вам нужен JDK 8, установите [Zulu JDK 8](https://www.azul.com/downloads/?version=java-8-lts&os=macos&package=jdk#zulu) вручную. Maven также можно скачать отдельно с [сайта Maven](https://maven.apache.org/download.cgi) и настроить с помощью переменных окружения.

Для некоторых зависимостей на Apple Silicon также нужно вручную настроить переменные окружения:

```Shell
export PATH="/opt/homebrew/opt/bison/bin:$PATH"
export PATH="/opt/homebrew/opt/texinfo/bin:$PATH"
ln -s -f /opt/homebrew/bin/python3 /opt/homebrew/bin/python
```

## 3. Получение исходного кода и настройка DORIS_HOME {#3-pull-the-source-code-and-set-doris_home}

```Shell
cd ~
mkdir DorisDev && cd DorisDev
git clone https://github.com/apache/doris.git

export DORIS_HOME=~/DorisDev/doris
export PATH=$DORIS_HOME/bin:$PATH
```

## 4. (Необязательно) Отдельная установка Thrift {#4-optional-install-thrift-separately}

Отдельная установка Thrift требуется только для отладки FE без BE. При отладке BE и FE Thrift уже входит в состав сторонних библиотек BE.

```Shell
brew install thrift@0.16.0

mkdir -p ./thirdparty/installed/bin

# Apple Silicon
ln -s /opt/homebrew/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift

# Intel
ln -s /usr/local/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift
```

Если при выполнении `brew install thrift@0.16.0` сообщается, что версия не найдена, выполните следующие команды:

```Shell
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

Подробнее: <https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

## 5. Ускорение сборки с помощью готовых сторонних библиотек (рекомендуется) {#5-speed-up-the-build-with-prebuilt-third-party-libraries-recommended}

Вы можете скачать готовые сторонние библиотеки, предоставленные сообществом, чтобы пропустить их компиляцию:

```Shell
cd thirdparty
rm -rf installed

# Intel chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# Verify that protoc and thrift run correctly
cd installed/bin
./protoc --version
./thrift --version
```

> Если при запуске `protoc` и `thrift` появляется сообщение **невозможно открыть, так как не удаётся проверить разработчика**, перейдите в `Security & Privacy → General` и нажмите `Open Anyway`. Подробнее: <https://support.apple.com/zh-cn/HT202491>

Вы также можете скачать исходный код сторонних библиотек [doris-thirdparty-source.tgz](https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-source.tgz) со страницы [Готовые сторонние библиотеки Apache Doris](https://github.com/apache/doris-thirdparty/releases/tag/automation) и скомпилировать их самостоятельно.

## 6. Настройка лимита файловых дескрипторов {#6-adjust-the-file-handle-limit}

```Shell
ulimit -n 65536

# Write to the startup script so it takes effect automatically next time the terminal opens
# bash
echo 'ulimit -n 65536' >>~/.bashrc
# zsh
echo 'ulimit -n 65536' >>~/.zshrc
```

## 7. Компиляция {#7-compile}

```Shell
cd $DORIS_HOME
bash build.sh
```

## 8. Запуск BE / FE {#8-start-be--fe}

```Shell
cd output/be/bin && ./start_be.sh --daemon
cd output/fe/bin && ./start_fe.sh --daemon
```

## 9. Настройка среды локальной отладки {#9-configure-the-local-debugging-environment}

```Shell
# Copy the build output to use as the runtime directory
cp -r output ../doris-run
```

Затем внесите следующие изменения в `conf` для FE / BE:

1. Настройте IP и каталоги
2. Дополнительно задайте `min_file_descriptor_number = 10000` для BE

Далее настройте отладку в своей IDE:

- [Настройка среды разработки FE - IntelliJ IDEA](../developer-guide/fe-idea-dev)
- [Настройка среды разработки BE - CLion](../developer-guide/be-clion-dev) (см. «Вариант 2: Локальная разработка в macOS»)

## Часто задаваемые вопросы {#faq}

### CMake не может найти OpenMP {#cmake-cannot-find-openmp}

При компиляции BE CMake может не найти OpenMP и сообщить о следующих ошибках:

```text
Could NOT find OpenMP_C (missing: OpenMP_C_FLAGS OpenMP_C_LIB_NAMES)
fatal error: 'omp.h' file not found
```

Установите `libomp`, затем убедитесь, что установленный через Homebrew пакет содержит `omp.h`:

```Shell
brew install libomp
LIBOMP_PREFIX="$(brew --prefix libomp)"
test -f "${LIBOMP_PREFIX}/include/omp.h"
```

Добавьте следующие переменные окружения в `custom_env.sh` в корневом каталоге исходного кода Doris:

```Shell
LIBOMP_PREFIX="$(brew --prefix libomp)"
export CPPFLAGS="-I${LIBOMP_PREFIX}/include ${CPPFLAGS:-}"
export CFLAGS="-I${LIBOMP_PREFIX}/include ${CFLAGS:-}"
export CXXFLAGS="-I${LIBOMP_PREFIX}/include ${CXXFLAGS:-}"
export LDFLAGS="-L${LIBOMP_PREFIX}/lib ${LDFLAGS:-}"
export EXTRA_CXX_FLAGS="-I${LIBOMP_PREFIX}/include ${EXTRA_CXX_FLAGS:-}"
```

Файл `be/CMakeLists.txt` сбрасывает `CMAKE_C_FLAGS` и `CMAKE_CXX_FLAGS`, поэтому при проверках OpenMP в CMake значения `CPPFLAGS`, `CFLAGS` и `CXXFLAGS` могут не учитываться. `EXTRA_CXX_FLAGS` передаёт путь к заголовочным файлам `libomp` в сборку BE и необходим для этого обходного решения.

`custom_env.sh` содержит локальные настройки сборки. Не добавляйте этот файл в репозиторий.

### Сборка завершается ошибкой из-за слишком новой версии Node.js {#compilation-fails-due-to-nodejs-version-too-high}

Сообщение об ошибке:

```
opensslErrorStack: ['error:03000086:digital envelope routines::initialization error']
library: 'digital envelope routines'
reason: 'unsupported'
code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

Решение:

```Shell
export NODE_OPTIONS=--openssl-legacy-provider
```

Подробнее: <https://stackoverflow.com/questions/74726224/opensslerrorstack-error03000086digital-envelope-routinesinitialization-e>
