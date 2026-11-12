---
title: Выпуск Apache Doris Shade
language: ru
description: "Процесс выпуска Apache Doris Shade: подготовка и публикация релиза с помощью Maven, загрузка в SVN и голосование сообщества."
keywords:
    - выпуск Apache Doris Shade
    - подготовка релиза Maven
    - публикация релиза Maven
    - голосование Apache
    - Maven Staging
    - SVN dist
    - менеджер релиза
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

# Выпуск Apache Doris Shade {#release-apache-doris-shade}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache vote process -->

Репозиторий Doris Shade независим от основного репозитория Doris и расположен по адресу:

- [https://github.com/apache/doris-Shade](https://github.com/apache/doris-Shade)

В этом документе на примере выпуска Doris Shade v1.0.0 описан полный процесс выпуска компонентов типа Shade, включая использование плагина Maven release, подготовку SVN и голосование сообщества.

## Подготовка к выпуску {#prepare-for-release}

Сначала настройте окружение для подписания, SVN и Maven, следуя документу [Подготовка к выпуску](./release-prepare).

## Публикация в Maven {#release-to-maven}

### 1. Подготовка ветки {#1-prepare-the-branch}

Создайте в репозитории ветку `1.0.0-release` и переключитесь на неё.

### 2. Публикация в Maven Staging {#2-release-to-maven-staging}

Запустите плагин Maven release, чтобы создать тег релиза:

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

`-DpushChanges=false` означает, что созданные ветка и тег **не** отправляются в репозиторий автоматически во время выполнения.

В ходе выполнения `release:prepare` запрашивает три значения:

| Запрашиваемое значение | Рекомендуемое значение | Пример |
| --- | --- | --- |
| Версия Doris Shade | Используйте значение по умолчанию в формате `{shade.version}` | `1.0.0` |
| Имя тега релиза | Используйте имя тега по умолчанию | `1.0.0` |
| Следующая версия | Используется для локальной ветки, практического значения не имеет | `1.0.1-SNAPSHOT` |

В ходе выполнения может потребоваться ввести парольную фразу GPG. Если появится сообщение `gpg: no valid OpenPGP data found`, сначала выполните `export GPG_TTY=$(tty)` и повторите попытку.

После успешного выполнения `mvn release:prepare` локально создаются тег и ветка, а в текущую ветку добавляются два новых коммита:

1. Первый коммит соответствует созданному тегу.
2. Второй коммит соответствует ветке для следующей версии.

Проверить это можно с помощью `git log`.

Убедившись, что локальный тег корректен, отправьте его в репозиторий:

```bash
git push upstream --tags
```

Здесь `upstream` указывает на репозиторий `apache/doris-shade`.

Наконец, выполните release:perform:

```bash
mvn release:perform
```

После успешного выполнения опубликованная версия появится по адресу [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories):

![](/images/staging-repositories.png)

:::caution Примечание
Убедитесь, что среди артефактов есть файл подписи `.asc`.
:::

Если что-то пошло не так, необходимо:

1. Удалить локальный тег.
2. Удалить тег в репозитории.
3. Удалить два новых локальных коммита.
4. Удалить репозиторий Staging.
5. Повторить описанные выше шаги.

Убедившись, что всё корректно, нажмите кнопку `close`, чтобы завершить публикацию в Staging.

### 3. Подготовка SVN {#3-prepare-svn}

Получите рабочую копию репозитория Dev SVN:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Упакуйте исходный код из тега и создайте файл подписи и файл контрольной суммы SHA512 (в следующем примере используется `1.0.0`):

```bash
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-shade-1.0.0-src/ | gzip > apache-doris-shade-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-shade-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-shade-1.0.0-src.tar.gz
sha512sum apache-doris-shade-1.14_2.12-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

В macOS используйте:

```bash
shasum -a 512 apache-doris-shade-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

В результате вы получите три файла:

| Файл | Назначение |
| --- | --- |
| `apache-doris-shade-1.0.0-src.tar.gz` | Архив исходного кода |
| `apache-doris-shade-1.0.0-src.tar.gz.asc` | Файл подписи GPG |
| `apache-doris-shade-1.0.0-src.tar.gz.sha512` | Файл контрольной суммы SHA512 |

Переместите эти три файла в каталог SVN:

```text
doris/doris-shade/1.0.0/
```

Пример полной структуры каталогов SVN:

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-shade
│   └── 1.0.0
│       ├── apache-doris-shade-1.0.0-src.tar.gz
│       ├── apache-doris-shade-1.0.0-src.tar.gz.asc
│       └── apache-doris-shade-1.0.0-src.tar.gz.sha512
```

Здесь `1.2.3-rc01` является каталогом основного релиза Doris, а `doris-shade/1.0.0` содержит файлы этого релиза.

> О подготовке файла KEYS см. соответствующий раздел документа [Подготовка к выпуску](./release-prepare).

### 4. Голосование {#4-vote}

Начните голосование в списке рассылки `dev@doris.apache.org`. Используйте следующий шаблон:

```text
Hi all,

This is a call for the vote to release Apache Doris-Shade 1.0.0

The git tag for the release:
https://github.com/apache/doris-shade/releases/tag/doris-shade-1.0.0

Release Notes are here:
https://github.com/apache/doris-shade/blob/doris-shade-1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-shade/

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

Чтобы завершить весь процесс выпуска, следуйте документу [Завершение выпуска](./release-complete).

## Приложение: публикация в SNAPSHOT {#appendix-release-to-snapshot}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot не является релизом Apache. Он используется только для предварительного ознакомления перед выпуском. Публиковать версию Snapshot можно только после обсуждения и одобрения PMC.

Перейдите в каталог doris-shade:

```bash
mvn deploy
```

После этого версию snapshot можно найти по следующему адресу:

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-shade/
```

## Частые вопросы и устранение неполадок {#faq--troubleshooting}

**Вопрос: при выполнении `mvn release:prepare` появляется сообщение `gpg: no valid OpenPGP data found`?**

Терминал не может принять парольную фразу GPG. Выполните `export GPG_TTY=$(tty)` и повторите попытку.

**Вопрос: как полностью отменить изменения после сбоя `mvn release:perform`?**

Выполните следующие действия по порядку: удалите локальный тег (`git tag -d <tag>`), удалите удалённый тег (`git push upstream :refs/tags/<tag>`), откатите два локальных коммита (`git reset --hard HEAD~2`), удалите соответствующий репозиторий в Apache Staging, затем снова выполните `mvn release:clean` и `mvn release:prepare`.

**Вопрос: чем использование плагина Maven release отличается от создания тега вручную с последующим выполнением `mvn deploy`?**

`release:prepare/perform` автоматически изменяет версии, создаёт теги и загружает артефакты, что подходит для проектов с простым pom, таких как Shade. Ручной подход даёт больше гибкости в сценариях с несколькими артефактами, например при выпуске Spark Connector для разных версий Spark.
