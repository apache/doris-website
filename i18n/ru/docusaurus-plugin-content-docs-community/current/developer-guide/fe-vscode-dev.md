---
title: Настройка среды разработки FE - Visual Studio Code (VSCode)
language: ru
description: Настройка среды разработки Apache Doris FE в VSCode, включая настройку расширения Java, переключение JDK и удалённую отладку.
keywords:
    - VSCode
    - Apache Doris FE
    - среда разработки FE
    - расширение Java
    - удалённая отладка
    - JDWP
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

# Настройка среды разработки FE в VSCode {#set-up-an-fe-development-environment-with-vscode}

В этом документе описано, как с помощью VSCode настроить среду разработки Doris FE на компьютере разработчика, в WSL или в Docker. Разработчики, предпочитающие VSCode, могут использовать расширения Remote для удалённой разработки и отладки.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: IDE configuration / Debugging setup -->

## 1. Предварительные требования {#1-prerequisites}

| Компонент               | Требования к версии                                                                                 | Назначение                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| JDK                     | 11+ (требуется расширению Java); для компиляции можно использовать JDK 8                             | Установите обе версии и переключайтесь между ними в настройках |
| VSCode                  | Последний стабильный выпуск                                                                               | Редактор                                   |
| Extension Pack for Java | Последняя версия                                                                                      | Поддержка языка Java                    |
| Расширения Remote       | Remote - SSH / Remote - WSL / Remote - Containers                                                   | Удалённая разработка                       |

Рекомендуется установить [JDK 11](https://github.com/adoptium/temurin11-binaries/releases/) и JDK 8 отдельно в выделенный каталог, например `~/lib`, для использования расширениями IDE и компиляции исходного кода соответственно.

## 2. Клонирование и открытие исходного кода {#2-clone-and-open-the-source-code}

1. Загрузите исходный код с GitHub:

    ```bash
    git clone https://github.com/apache/doris.git
    ```

2. Откройте в VSCode каталог `fe` в дереве исходного кода (а не корневой каталог всего репозитория).

## 3. Настройка VSCode {#3-configure-vscode}

Создайте файл `settings.json` в каталоге `fe/.vscode/` и настройте среду выполнения Java и путь к Maven.

<!-- Knowledge type: Configuration parameters -->

| Параметр настройки              | Описание                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `java.configuration.runtimes`   | Регистрирует список доступных JDK, которые расширение Java использует для отдельных проектов |
| `java.jdt.ls.java.home`         | Указывает каталог JDK 11+, используемый самим расширением `vscode-java` |
| `maven.executable.path`         | Указывает путь к локальному исполняемому файлу Maven, используемому расширением `maven-language-server` |

Пример:

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/!!!path!!!/jdk-1.8.0_191"
        },
        {
            "name": "JavaSE-11",
            "path": "/!!!path!!!/jdk-11.0.14.1+1",
            "default": true
        }
    ],
    "java.jdt.ls.java.home": "/!!!path!!!/jdk-11.0.14.1+1",
    "maven.executable.path": "/!!!path!!!/maven/bin/mvn"
}
```

## 4. Компиляция FE {#4-compile-fe}

Полная процедура компиляции описана в следующих документах:

- [Компиляция с помощью LDB Toolchain](/community/source-install/compilation-with-ldb-toolchain)
- [Компиляция с использованием образа Docker для разработки](/community/source-install/compilation-with-docker)

## 5. Настройка удалённой отладки {#5-configure-remote-debugging}

<!-- Knowledge type: Configuration parameters -->

Для удалённой отладки FE из VSCode добавьте параметры JDWP при запуске FE:

```shell
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

Для этого отредактируйте `doris/output/fe/bin/start_fe.sh` и добавьте указанные выше параметры после `$JAVA $final_java_opt`.

| Параметр JDWP   | Значение             | Описание                                       |
| ---------------- | ----------------- | ------------------------------------------------- |
| `transport`      | `dt_socket`       | Использовать транспорт Socket                              |
| `server`         | `y`               | Запустить сервер отладки и ожидать подключения отладчика |
| `suspend`        | `n`               | Не приостанавливать выполнение при запуске; работать в обычном режиме           |
| `address`        | `5005`            | Порт прослушивания; можно изменить                      |

После запуска FE используйте расширение Java Debug в VSCode, чтобы **подключиться** к `host:5005` и выполнять отладку с точками останова.

## 6. Часто задаваемые вопросы (FAQ) {#6-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: Расширение Java сообщает, что версия JDK слишком низкая {#q1-the-java-extension-reports-that-the-jdk-version-is-too-low}

`java.jdt.ls.java.home` должен указывать на JDK 11+. Даже если для компиляции используется JDK 8, самому расширению для работы по-прежнему требуется JDK 11+.

### Вопрос 2: Не удаётся выполнить задачи Maven / команда `mvn` не найдена {#q2-maven-tasks-fail--mvn-is-not-found}

Убедитесь, что `maven.executable.path` указывает на существующий исполняемый файл `mvn`, или добавьте его в системную переменную `PATH`.

### Вопрос 3: Не удаётся подключиться для удалённой отладки {#q3-remote-debugging-cannot-connect}

- Убедитесь, что процесс FE действительно загрузил параметры JDWP (проверьте командную строку с помощью `ps -ef | grep java`).
- Убедитесь, что порт `address` не заблокирован межсетевым экраном.
- Если используется `suspend=y`, FE приостановит выполнение в ожидании подключения отладчика. Измените значение на `suspend=n` или подключите отладчик самостоятельно.
