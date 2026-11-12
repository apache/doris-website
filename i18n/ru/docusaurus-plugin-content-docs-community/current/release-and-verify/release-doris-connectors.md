---
title: Выпуск коннекторов Apache Doris
language: ru
description: "Процесс выпуска Apache Doris Spark/Flink Connector: Maven Staging, загрузка в SVN и голосование сообщества."
keywords:
    - выпуск Apache Doris Connector
    - Spark Connector
    - Flink Connector
    - Maven Staging
    - голосование Apache
    - SVN dist
    - менеджер выпуска
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

# Выпуск коннекторов Apache Doris {#release-apache-doris-connectors}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Release / Apache vote process -->

В настоящее время коннекторы Doris включают Flink Connector и Spark Connector. Оба репозитория независимы от основного репозитория Doris:

| Коннектор | Репозиторий |
| --- | --- |
| Flink Connector | [https://github.com/apache/doris-flink-connector](https://github.com/apache/doris-flink-connector) |
| Spark Connector | [https://github.com/apache/doris-spark-connector](https://github.com/apache/doris-spark-connector) |

В этом документе на примере Spark Connector 1.2.0 описан полный процесс выпуска компонентов типа Connector: от публикации в Maven Staging и подготовки SVN до голосования сообщества.

## Подготовка к выпуску {#prepare-for-release}

Сначала настройте окружение для подписи, SVN и Maven, следуя документу [Подготовка к выпуску](./release-prepare).

## Публикация в Maven {#release-to-maven}

### 1. Подготовка ветки и тега {#1-prepare-the-branch-and-tag}

Создайте в репозитории ветку `release-1.2.0` и переключитесь на неё.

Измените значение версии `revision` в `pom.xml` на `1.2.0`, затем зафиксируйте изменение:

```bash
git commit -a -m "Commit for release 1.2.0"
```

Создайте и отправьте тег:

```bash
git tag 1.2.0
git push origin 1.2.0
```

### 2. Публикация в Maven Staging {#2-release-to-maven-staging}

Для разных версий Spark (например, 2.3, 3.1, 3.2) выпускаются отдельные версии Spark Connector, поэтому каждую из них нужно собирать и публиковать отдельно. Далее в качестве примера используются Spark 2.3 и Scala 2.11.

Сначала выполните локальную установку и проверку:

```bash
mvn clean install \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

> Сведения о соответствующих параметрах см. в командах сборки в скрипте `build.sh`. Параметр `revision` задаёт номер версии этого выпуска.

Опубликуйте артефакты в репозитории Apache Staging:

```bash
mvn deploy \
-Papache-release \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

После успешного выполнения команды опубликованная версия появится по адресу [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories):

![](/images/staging-repositories.png)

:::caution Примечание
Убедитесь, что среди артефактов есть файл подписи `.asc`.
:::

Если обнаружены ошибки, удалите этот staging-репозиторий и повторите описанные выше шаги.

Проверив, что всё корректно, нажмите кнопку `close`, чтобы завершить публикацию в Staging.

### 3. Подготовка SVN {#3-prepare-svn}

Получите рабочую копию репозитория Dev SVN:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Создайте архив исходного кода тега, файл подписи и файл контрольной суммы SHA512 (в следующем примере используется `1.2.0`):

```bash
git archive --format=tar release-1.2.0 --prefix=apache-doris-spark-connector-1.2.0-src/ | gzip > apache-doris-spark-connector-1.2.0-src.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-spark-connector-1.2.0-src.tar.gz.asc  --detach-sign apache-doris-spark-connector-1.2.0-src.tar.gz
sha512sum apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

В macOS используйте:

```bash
shasum -a 512 apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

В результате будут созданы три файла:

| Файл | Назначение |
| --- | --- |
| `apache-doris-spark-connector-1.2.0-src.tar.gz` | Архив исходного кода |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.asc` | Файл подписи GPG |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.sha512` | Файл контрольной суммы SHA512 |

Переместите эти три файла в каталог SVN:

```text
doris/spark-connector/1.2.0/
```

Полная структура каталогов SVN выглядит так:

```text
|____0.15
| |____0.15.0-rc04
| | |____apache-doris-0.15.0-incubating-src.tar.gz.sha512
| | |____apache-doris-0.15.0-incubating-src.tar.gz.asc
| | |____apache-doris-0.15.0-incubating-src.tar.gz
|____KEYS
|____spark-connector
| |____1.2.0
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.asc
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

В этой структуре каталог `0.15` содержит основной исходный код Doris, а каталог `spark-connector/1.2.0` содержит файлы этого выпуска.

> О подготовке файла KEYS см. соответствующий раздел документа [Подготовка к выпуску](./release-prepare).

### 4. Голосование {#4-vote}

Начните голосование в списке рассылки `dev@doris.apache.org`, используя следующий шаблон:

```text
Hi all,

This is a call for the vote to release Apache Doris Spark Connector 1.2.0

The git tag for the release:
https://github.com/apache/doris-spark-connector/releases/tag/1.2.0

Release Notes are here:
https://github.com/apache/doris-spark-connector/issues/109

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/spark-connector/1.2.0/

Maven 2 staging repository:
https://repository.apache.org/content/repositories/orgapachedoris-1031


KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...
```

## Завершение выпуска {#complete-the-release}

Выполните оставшиеся шаги выпуска, следуя документу [Завершение выпуска](./release-complete).

## Приложение: публикация в SNAPSHOT {#appendix-publish-to-snapshot}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot не является версией Apache Release и используется только для предварительного ознакомления перед выпуском. Версию Snapshot можно публиковать только после обсуждения и одобрения PMC.

Перейдите в каталог Spark Connector (в примере используются Spark 2.3 и Scala 2.11):

```bash
cd spark-doris-connector
mvn deploy \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3 \
```

После публикации версия snapshot доступна по адресу:

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-spark-connector/
```

## Частые вопросы и устранение неполадок {#faq--troubleshooting}

**Вопрос: При выполнении `mvn deploy` возникает ошибка `gpg: signing failed: Inappropriate ioctl for device`?**

Выполните `export GPG_TTY=$(tty)` и повторите попытку.

**Вопрос: Файл подписи `.asc` отсутствует в репозитории Staging. Что делать?**

Проверьте, содержит ли команда `mvn deploy` параметр `-Papache-release`, и убедитесь, что `~/.m2/settings.xml` и `settings-security.xml` настроены правильно. Если набор артефактов неполный, удалите этот staging-репозиторий и снова выполните `mvn deploy`.

**Вопрос: Как опубликовать несколько артефактов для разных версий Spark в рамках одного выпуска?**

Для каждого сочетания версий Spark/Scala отдельно выполняйте `mvn deploy`, каждый раз указывая другие значения `-Dspark.version`, `-Dscala.version` и `-Dspark.major.version`. После обработки всех сочетаний закройте staging-репозиторий со всеми артефактами.
