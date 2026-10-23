---
title: Выпуск Doris SDK
language: ru
description: "Процесс выпуска Apache Doris SDK: этапы prepare/perform Maven Release, загрузка в SVN и голосование сообщества."
keywords:
    - Apache Doris
    - Doris SDK
    - Процесс выпуска
    - Maven Release
    - Загрузка в SVN
    - Голосование сообщества
    - Подпись GPG
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

# Выпуск Doris SDK {#release-doris-sdk}

<!-- Knowledge type: Operating procedure -->
<!-- Applies to: Apache release process / SDK release -->

Исходный код Doris SDK хранится отдельно от основного репозитория Doris в репозитории [apache/doris-sdk](https://github.com/apache/doris-sdk). В этом документе на примере выпуска `Doris SDK v1.0.0` рассматривается весь процесс от публикации в Maven Staging до голосования сообщества.

## Обзор процесса выпуска {#release-process-overview}

| Этап | Цель | Основные артефакты |
|------|---------|---------------|
| 1. Подготовка к выпуску | Выполнить предварительные требования для выпуска (KEYS, учётные записи, окружение и т. д.) | Ключ GPG, учётная запись Apache |
| 2. Подготовка ветки | Создать ветку релиза в репозитории | Ветка `1.0.0-release` |
| 3. Публикация в Maven Staging | Создать тег релиза и опубликовать артефакты в Apache Maven Staging | Тег, репозиторий Staging |
| 4. Подготовка SVN | Загрузить пакет исходного кода, подпись и файлы контрольных сумм в SVN | tar.gz / .asc / .sha512 |
| 5. Начало голосования | Начать голосование в списке рассылки dev@doris | Письмо с объявлением голосования |
| 6. Завершение выпуска | Архивировать релиз и объявить о нём после успешного голосования | Пакет релиза |

## 1. Подготовка к выпуску {#1-prepare-for-release}

Выполните предварительные требования для выпуска, описанные в документе [Подготовка к выпуску](./release-prepare).

## 2. Публикация в Maven {#2-publish-to-maven}

### 2.1 Подготовка ветки {#21-prepare-the-branch}

Создайте в репозитории ветку `1.0.0-release` и переключитесь на неё:

```shell
git checkout -b 1.0.0-release
```

### 2.2 Публикация в Maven Staging {#22-publish-to-maven-staging}

Выполните следующие команды, чтобы создать тег релиза:

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

Здесь `-DpushChanges=false` означает, что созданные ветка и тег не отправляются в репозиторий во время выполнения команды.

После запуска `mvn release:prepare` нужно последовательно указать следующие три значения:

| Вводимые данные | Описание | Пример |
|-------|-------------|---------|
| Версия Doris SDK | Выпускаемая версия в формате `{sdk.version}` | `1.0.0` |
| Имя тега релиза | Имя тега, создаваемого локально | `1.0.0` |
| Следующая версия | Используется только для создания локальной ветки; практического значения не имеет | `1.0.1-SNAPSHOT` |

**Распространённые проблемы:**

- `mvn release:prepare` может запросить парольную фразу GPG.
- Если появляется ошибка `gpg: no valid OpenPGP data found`, выполните следующую команду и повторите попытку:

    ```shell
    export GPG_TTY=$(tty)
    ```

После успешного выполнения `mvn release:prepare` локально создаются тег и ветка, а в текущую ветку добавляются два коммита:

1. Первый коммит соответствует созданному тегу.
2. Второй коммит соответствует ветке следующей версии.

Проверить это можно с помощью `git log`.

Убедившись, что локальный тег корректен, отправьте его в репозиторий:

```shell
git push upstream --tags
```

Здесь `upstream` указывает на репозиторий `apache/doris-sdk`.

Наконец, выполните команду perform, чтобы опубликовать артефакты сборки в Maven Staging:

```shell
mvn release:perform
```

После успешного выполнения команды опубликованную версию можно найти в [репозиториях Apache Maven Staging](https://repository.apache.org/#stagingRepositories):

![](/images/staging-repositories.png)

**Примечание: опубликованные артефакты должны включать файл подписи `.asc`.**

Если что-то пошло не так, выполните откат в следующем порядке:

1. Удалите локальный тег.
2. Удалите тег в репозитории.
3. Удалите два созданных локальных коммита.
4. Выполните `drop` для промежуточного релиза на странице Staging Repository.
5. Повторите описанные выше действия.

После проверки нажмите кнопку `close` на странице, чтобы завершить публикацию в Staging.

### 2.3 Подготовка SVN {#23-prepare-svn}

#### 2.3.1 Получение рабочей копии репозитория SVN {#231-check-out-the-svn-repository}

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.3.2 Упаковка исходного кода из тега и создание подписи {#232-package-the-tag-source-and-generate-the-signature}

В качестве примера используется `1.0.0`; для других тегов действия аналогичны:

```shell
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-sdk-1.0.0-src/ | gzip > apache-doris-sdk-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-sdk-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-sdk-1.0.0-src.tar.gz
sha512sum apache-doris-sdk-1.14_2.12-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

В macOS используйте `shasum` вместо `sha512sum`:

```shell
shasum -a 512 apache-doris-sdk-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

В результате вы получите три файла:

```text
apache-doris-sdk-1.0.0-src.tar.gz
apache-doris-sdk-1.0.0-src.tar.gz.asc
apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

#### 2.3.3 Загрузка в SVN {#233-upload-to-svn}

Переместите эти три файла в каталог SVN `doris/doris-sdk/1.0.0/`. Итоговая структура каталогов SVN будет выглядеть так:

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-sdk
│   └── 1.0.0
│       ├── apache-doris-sdk-1.0.0-src.tar.gz
│       ├── apache-doris-sdk-1.0.0-src.tar.gz.asc
│       └── apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

Каталог `1.2.3-rc01` относится к основному репозиторию Doris, а в `doris-sdk/1.0.0` находятся файлы этого релиза.

Инструкции по подготовке файла KEYS приведены в документе [Подготовка к выпуску](./release-prepare).

### 2.4 Голосование {#24-vote}

Начните голосование в списке рассылки `dev@doris.apache.org`. Используйте следующий шаблон письма:

```text
Hi All,

This is a call for the vote to release Apache Doris-SDK 1.0.0

The git tag for the release:
https://github.com/apache/doris-sdk/releases/tag/1.0.0

Release Notes are here:
https://github.com/apache/doris-sdk/blob/1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-sdk/1.0.0/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because …
```

## 3. Завершение выпуска {#3-complete-the-release}

После успешного голосования выполните все оставшиеся действия по выпуску, описанные в документе [Завершение выпуска](./release-complete).

## Приложение: публикация в SNAPSHOT {#appendix-publishing-to-snapshot}

Snapshot не является релизной версией Apache и используется только для предварительного ознакомления перед выпуском. Опубликовать версию Snapshot можно после её обсуждения и одобрения со стороны PMC.

Перейдите в каталог Doris SDK и выполните:

```shell
mvn deploy
```

После этого версию Snapshot можно найти по адресу:

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-sdk/
```

## Часто задаваемые вопросы {#faq}

### Q1: `mvn release:prepare` завершается ошибкой `gpg: no valid OpenPGP data found` {#q1-mvn-releaseprepare-fails-with-gpg-no-valid-openpgp-data-found}

GPG не привязан к текущему терминалу. Выполните `export GPG_TTY=$(tty)` и повторите попытку.

### Q2: Шаг `close` на этапе Staging завершается ошибкой `No public key` {#q2-the-close-step-in-the-staging-phase-fails-with-no-public-key}

Открытый ключ GPG не загружен на сервер ключей. Выполните следующую команду, чтобы отправить открытый ключ на общедоступный сервер ключей:

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

Узнать `<KEY_ID>` можно с помощью `gpg -k`.

### Q3: Я допустил ошибку. Как выполнить откат? {#q3-i-made-a-mistake-how-do-i-roll-back}

Выполните следующие действия по порядку:

1. Удалите локальный тег: `git tag -d <tag>`.
2. Удалите удалённый тег: `git push upstream --delete <tag>`.
3. Откатите два локальных коммита релиза.
4. Выполните `drop` для промежуточного релиза на странице Staging Repositories.
5. Снова выполните `mvn release:prepare` и `mvn release:perform`.
