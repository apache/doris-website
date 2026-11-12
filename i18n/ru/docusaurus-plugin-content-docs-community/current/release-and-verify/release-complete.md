---
title: Завершение выпуска
language: ru
description: "Завершение выпуска Apache Doris: SVN-каталог Release, ссылки для скачивания, примечания к выпуску и удаление старых версий."
keywords:
    - Apache Doris
    - Завершение выпуска
    - SVN-каталог Release
    - Ссылки для скачивания
    - Примечания к выпуску
    - Выпуск в Maven
    - Письмо с объявлением
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

# Завершение выпуска {#complete-the-release}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Apache release process / Release wrap-up -->

В этом документе описаны заключительные действия, которые необходимо выполнить после успешного завершения голосования по выпуску в списке рассылки `dev@doris`.

## Контрольный список завершения выпуска {#release-completion-checklist}

| Шаг | Действие | Исполнитель |
|------|--------|--------------|
| 1. Загрузка пакета в Release | Переместить пакет исходного кода, файлы подписей и контрольных сумм из `dev` в `release` | Участник PMC |
| 2. Публикация репозитория Maven Staging | Нажать `Release` в Apache Nexus | Менеджер выпуска |
| 3. Подготовка примечаний к выпуску | Обновить GitHub Release и страницу загрузок официального сайта | Менеджер выпуска |
| 4. Удаление старых версий из SVN | Оставить только последнюю версию и заменить ссылки на старые версии архивными URL | Менеджер выпуска |
| 5. Отправка письма с объявлением | Объявить о новом выпуске в `dev@doris` | Менеджер выпуска |

## 1. Загрузка пакета в Release {#1-upload-the-package-to-release}

После успешного завершения официального голосования по выпуску сначала отправьте письмо `[Result]`, затем подготовьте пакет выпуска. Скопируйте пакет исходного кода, файлы подписей и файлы хешей из соответствующей папки, ранее опубликованной в `dev`, в новый каталог (например, `1.1.0`). Примечания:

- Имя файла **не должно содержать суффикс `rcxx`** (файл можно переименовать, но подпись нельзя создавать заново).
- Хеши можно вычислить заново; результат будет тем же.

> Выполнить этот шаг могут только участники PMC.

Исходный путь в SVN:

```text
https://dist.apache.org/repos/dist/dev/doris/
```

Целевой путь в SVN:

```text
https://dist.apache.org/repos/dist/release/doris/
```

Пример команды:

```shell
svn mv -m "move doris 1.1.0-rc05 to release" \
    https://dist.apache.org/repos/dist/dev/doris/1.1 \
    https://dist.apache.org/repos/dist/release/doris/1.1
```

При первом выпуске необходимо также скопировать файл KEYS и добавить его в каталог release в SVN. После успешного добавления опубликованные файлы будут доступны по адресу:

```text
https://dist.apache.org/repos/dist/release/doris/1.xx/
```

Через некоторое время они также появятся на официальном сайте Apache:

```text
http://www.apache.org/dist/doris/1.xx/
```

## 2. Публикация ссылок на сайте Doris и GitHub {#2-publish-links-on-the-doris-website-and-github}

В этом разделе в качестве примера используется Doris Core. Для других компонентов замените соответствующие названия.

### 2.1 Создание ссылок для скачивания {#21-create-download-links}

| Тип ссылки | URL |
|-----------|-----|
| Ссылка для скачивания | `http://www.apache.org/dyn/closer.cgi?filename=doris/1.xx/apache-doris-1.xx-src.tar.gz&action=download` |
| Скачивание через wget | `https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| Исходное расположение | `https://www.apache.org/dist/doris/1.xx/` |
| Точка входа Closer | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| Пакет исходного кода | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| Подпись ASC | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.asc` |
| Контрольная сумма sha512 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.sha512` |
| KEYS | `http://archive.apache.org/dist/doris/KEYS` |

Пример команды wget:

```shell
wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz"
```

Подробные правила см. в [рекомендациях Apache по страницам загрузок](http://www.apache.org/dev/release-download-pages#closer).

### 2.2 Maven {#22-maven}

В [промежуточных репозиториях Apache Maven](https://repository.apache.org/#stagingRepositories) найдите соответствующий Staging Repo:

1. Если он ещё не закрыт, сначала нажмите `close`.
2. Нажмите `Release`, чтобы выполнить официальный выпуск.

> Если на шаге `close` появляется сообщение `No public key: Key with id: (xxx) was not able to be located on`, выполните следующую команду, чтобы отправить открытый ключ на общедоступный сервер ключей, затем повторите закрытие:
>
> ```shell
> gpg --keyserver hkp://keyserver.ubuntu.com --send-keys xxx
> ```
>
> Значение `xxx` можно получить с помощью `gpg -k`.

### 2.3 Подготовка примечаний к выпуску {#23-prepare-the-release-notes}

Необходимо обновить информацию в двух местах:

#### 2.3.1 Страница выпуска на GitHub {#231-github-release-page}

```text
https://github.com/apache/doris/releases/tag/0.9.0-rc01
```

#### 2.3.2 Страница загрузок сайта Doris {#232-doris-website-download-page}

Страница загрузок представляет собой файл Markdown, расположенный по следующим путям:

```text
docs/zh-CN/downloads/downloads.md
docs/en/downloads/downloads.md
```

Необходимо внести два изменения:

1. Заменить URL для скачивания предыдущей версии на URL архива Apache (см. следующий раздел).
2. Добавить информацию о скачивании новой версии.

### 2.4 Удаление старых версий из SVN {#24-clean-up-old-versions-in-svn}

#### 2.4.1 Удаление старых версий из SVN {#241-delete-old-versions-from-svn}

В SVN достаточно хранить пакеты только последней версии. После нового выпуска удалите старые версии, чтобы по следующим двум путям остались только пакеты последней версии:

```text
https://dist.apache.org/repos/dist/release/doris/
https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.4.2 Замена ссылок на URL архива {#242-replace-with-the-archive-url}

На странице загрузок сайта Doris замените URL для скачивания старых версий на URL страницы архива:

| Тип | URL |
|------|-----|
| Страница загрузок | `http://doris.apache.org/downloads.html` |
| Страница архива | `http://archive.apache.org/dist/doris` |

В Apache действует механизм синхронизации, который архивирует ранее выпущенные версии. Порядок действий описан в разделе [Как архивировать](https://www.apache.org/legal/release-policy.html#how-to-archive). Даже после удаления старых пакетов из SVN они остаются доступны на странице архива.

## 3. Письмо с объявлением {#3-announce-email}

Тема письма:

```text
[ANNOUNCE] Apache Doris 1.xx release
```

Отправьте письмо в список рассылки:

```text
dev@doris.apache.org
```

Текст письма:

```text
Hi All,

We are pleased to announce the release of Apache Doris 1.xx.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The release is available at:
http://doris.apache.org/master/zh-CN/downloads/downloads.html

Thanks to everyone who has contributed to this release, and the release note can be found here:
https://github.com/apache/doris/releases

Best Regards,

On behalf of the Doris team,
xxx
```

## Часто задаваемые вопросы {#faq}

### Вопрос 1: При выполнении `svn mv` возникает ошибка прав доступа? {#q1-svn-mv-reports-a-permission-error}

Только участники PMC имеют право записи в каталог `release` в SVN. Обычным коммиттерам необходимо обратиться к участнику PMC, чтобы он выполнил операцию от их имени.

### Вопрос 2: Maven сообщает об ошибке `No public key` после нажатия `Release`? {#q2-maven-reports-no-public-key-after-clicking-release}

Открытый ключ GPG не был загружен на общедоступный сервер ключей. Выполните следующую команду, чтобы отправить открытый ключ на общедоступный сервер ключей, затем повторите попытку:

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` можно получить с помощью `gpg -k`.

### Вопрос 3: Ссылка для скачивания на сайте возвращает ошибку 404? {#q3-the-download-link-on-the-website-returns-404}

Возможные причины:

- Файлы только что добавлены в каталог release в SVN; распространение по CDN занимает от 10 до 30 минут.
- Старые версии удалены, но ссылки на странице загрузок ещё не заменены на URL архива.

### Вопрос 4: Пользователи не могут найти старую версию для скачивания? {#q4-users-cannot-find-an-old-version-when-downloading}

Apache автоматически архивирует старые версии. На странице загрузок необходимо заменить ссылки на старые версии на путь `http://archive.apache.org/dist/doris/<version>/`.
