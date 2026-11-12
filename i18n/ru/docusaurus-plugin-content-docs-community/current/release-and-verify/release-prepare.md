---
title: Подготовка релиза Apache Doris
language: ru
description: "Подготовка релиза Apache Doris: подписание с помощью GPG, настройка Maven, обсуждение DISCUSS и общий процесс выпуска релиза."
keywords:
    - Подготовка релиза Apache Doris
    - Release Manager
    - Подписание GPG и ключ PGP
    - Процесс голосования Apache
    - Maven settings.xml
    - Apache SVN dist
    - DISCUSS
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

# Подготовка релиза Apache Doris {#apache-doris-release-preparation}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Version release / Apache voting process / Release Manager preparation -->

При выпуске релизов проекта Apache необходимо строго соблюдать процедуру выпуска Apache Software Foundation. На этой странице описаны общий процесс выпуска релиза Apache Doris, подготовка среды для подписания и настройка Maven для выпуска релиза. Она предназначена для членов PMC или участников со статусом Committer, которые впервые выполняют роль Release Manager.

Официальные правила и руководства Apache по этой теме:

- [Процесс создания релиза](https://infra.apache.org/release-publishing)
- [Правила выпуска релизов](https://www.apache.org/legal/release-policy.html)
- [Публикация релизов Maven в Maven Central Repository](https://infra.apache.org/publishing-maven-artifacts.html)

Подробные инструкции по выпуску каждого компонента:

- [Выпуск Doris Core](./release-doris-core)
- [Выпуск Doris Connectors](./release-doris-connectors)
- [Выпуск Doris Shade](./release-doris-shade)
- [Выпуск Doris SDK](./release-doris-sdk)

## Формы выпуска релизов {#release-forms}

Релизы проекта Apache выпускаются в трёх основных формах:

| Форма | Описание | Обязательность |
| --- | --- | --- |
| Релиз исходного кода | Выпуск исходного кода | Обязательно |
| Бинарный релиз | Выпуск бинарных файлов (скомпилированных исполняемых файлов) | Необязательно |
| Готовые бинарные пакеты | Готовые бинарные пакеты, публикуемые на сторонних платформах, таких как Maven и Docker | Необязательно |

## Общий процесс выпуска релиза {#overall-release-process}

<!-- Knowledge type: Procedure -->

Для каждого релиза проекта один из членов PMC или участников со статусом Committer должен взять на себя роль **Release Manager**. Общий процесс выглядит следующим образом:

1. **Подготовка среды**: установите GPG и SVN, затем создайте открытый ключ для подписи (см. ниже).
2. **Подготовка релиза**:
    1. Создайте в сообществе обсуждение DISCUSS и обсудите конкретный план выпуска.
    2. Создайте ветку для релиза.
    3. Приведите в порядок задачи, относящиеся к соответствующей версии.
    4. Включите необходимые исправления в ветку релиза.
3. **Проверка ветки**:
    1. Проведите QA-тестирование стабильности.
    2. Проверьте процесс сборки кода из ветки.
    3. Подготовьте примечания к релизу.
4. **Подготовка артефактов релиза**:
    1. Создайте тег релиза.
    2. Загрузите артефакты, предназначенные для выпуска, в [репозиторий Apache Dev SVN](https://dist.apache.org/repos/dist/dev/doris).
    3. Подготовьте другие готовые бинарные пакеты (например, загрузите их в [репозиторий Maven Staging](https://repository.apache.org/#stagingRepositories)).
5. **Голосование сообщества**:
    1. Начните голосование в списке рассылки Dev сообщества Doris (`dev@doris.apache.org`).
    2. После успешного завершения голосования отправьте письмо с результатами.
6. **Завершение выпуска**:
    1. Загрузите подписанные пакеты в [репозиторий Apache Release](https://dist.apache.org/repos/dist/release/doris/) и сформируйте ссылки для скачивания.
    2. Опубликуйте ссылки для скачивания на сайте Doris и в GitHub, затем удалите из SVN пакеты старых версий.
    3. Отправьте письмо с объявлением о релизе на `dev@doris.apache.org`.

## Подготовка среды для подписания {#prepare-the-signing-environment}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: First time acting as Release Manager -->

Если вы выпускаете релиз впервые, подготовьте в своей локальной среде следующие инструменты:

| Инструмент | Назначение | Справочная информация |
| --- | --- | --- |
| Подписание релиза | Ознакомление с требованиями Apache к подписанию | [Подписание релиза](https://www.apache.org/dev/release-signing.html) |
| gpg | Создание ключа для подписи и подписание пакетов релиза | [openpgp](https://www.apache.org/dev/openpgp.html) |
| svn | Загрузка артефактов релиза в Apache SVN | [openpgp](https://www.apache.org/dev/openpgp.html) |

### Подготовка ключа GPG {#prepare-the-gpg-key}

Перед выпуском релиза Release Manager должен создать открытый ключ для подписи, загрузить его на общедоступный сервер ключей, а затем использовать этот ключ для подписания пакетов релиза.

> Если ваш ключ уже включён в [файл KEYS проекта Apache Doris](https://downloads.apache.org/doris/KEYS), этот раздел можно пропустить.

#### Установка GnuPG {#install-gnupg}

GnuPG (сокращённо GPG) — свободная программная реализация PGP, предназначенная для создания ключей и подписания файлов.

Команда установки в CentOS:

```bash
yum install gnupg
```

После установки файл конфигурации по умолчанию находится по следующему пути:

```text
~/.gnupg/gpg.conf
```

Если файл отсутствует, можно создать пустой файл.

Для подписания Apache рекомендует SHA512. Откройте `gpg.conf` и добавьте следующие три строки:

```text
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
```

#### Проверка версии GPG {#check-the-gpg-version}

Убедитесь, что GPG поддерживает SHA512:

```bash
$ gpg --version
gpg (GnuPG) 2.0.22
libgcrypt 1.5.3
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Home: ~/.gnupg
Supported algorithms:
Pubkey: RSA, ?, ?, ELG, DSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
        CAMELLIA128, CAMELLIA192, CAMELLIA256
Hash: MD5, SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
Compression: Uncompressed, ZIP, ZLIB, BZIP2
```

:::caution Примечание
Войдите в учётную запись пользователя напрямую через терминал, например SecureCRT. Не переключайтесь на неё через `su - user` или `ssh`, иначе запрос парольной фразы не появится и операция завершится ошибкой.
:::

#### Создание ключа для подписи {#generate-the-signing-key}

Выполните `gpg --gen-key` и следуйте подсказкам, используя рекомендованные настройки ниже:

| Параметр | Рекомендуемое значение | Примечания |
| --- | --- | --- |
| Тип ключа | `1` (RSA и RSA) | По умолчанию |
| Длина ключа | `4096` | Apache рекомендует не менее 4096 бит |
| Срок действия | `0` | Бессрочный |
| Настоящее имя | Совпадает с идентификатором, указанным на [id.apache.org](https://id.apache.org) | Обязательно |
| Адрес электронной почты | Адрес Apache (`xxx@apache.org`) | Обязательно |

Полный пример интерактивного сеанса:

```text
$ gpg --gen-key
gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
Your selection? 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
Key does not expire at all
Is this correct? (y/N) y

GnuPG needs to construct a user ID to identify your key.

Real name: xxx
Name must be at least 5 characters long
Real name: xxx-yyy
Email address: xxx@apache.org
Comment: xxx's key
You selected this USER-ID:
    "xxx-yyy (xxx's key) <xxx@apache.org>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? o
```

Затем нужно ввести парольную фразу (дважды, не менее 8 символов).

:::danger Важно
Обязательно запомните заданную здесь парольную фразу. Она понадобится для последующего подписания и выпуска других компонентов.
:::

Если `gpg --gen-key` надолго зависает, воспользуйтесь одним из следующих способов пополнения энтропии:

- Откройте другой терминал и выполните `find / | xargs file`, чтобы сгенерировать случайные символы.
- Установите `rng-tools` (`yum install rng-tools`) и выполните `rngd -r /dev/urandom`. После этого создание ключа завершится почти мгновенно.

#### Просмотр и экспорт открытого ключа {#view-and-export-the-public-key}

```bash
$ gpg --list-keys
/home/lide/.gnupg/pubring.gpg
-----------------------------
pub   4096R/33DBF2E0 2018-12-06
uid                  xxx-yyy  (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

Здесь `xxx-yyy` — идентификатор пользователя, а `33DBF2E0` — короткий отпечаток.

Экспортируйте открытый ключ в файл:

```bash
gpg --armor --output public-key.txt --export [user ID]
```

Пример:

```bash
$ gpg --armor --output public-key.txt --export xxx-yyy
File 'public-key.txt' already exists. Overwrite? (y/N) y
$ cat public-key.txt
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v2.0.22 (GNU/Linux)

mQINBFwJEQ0BEACwqLluHfjBqD/RWZ4uoYxNYHlIzZvbvxAlwS2mn53BirLIU/G3
9opMWNplvmK+3+gNlRlFpiZ7EvHsF/YJOAP59HmI2Z...
```

#### Загрузка открытого ключа на сервер ключей {#upload-the-public-key-to-a-key-server}

Используйте `--send-keys`, чтобы загрузить открытый ключ на сервер ключей Ubuntu:

```bash
gpg --send-keys xxxx --keyserver https://keyserver.ubuntu.com/
```

Здесь `xxxx` — строка после `pub` в выводе `--list-keys` из предыдущего шага (например, `33DBF2E0`).

Вы также можете вставить содержимое `public-key.txt` и загрузить его через веб-страницу [https://keyserver.ubuntu.com/](https://keyserver.ubuntu.com/).

После успешной загрузки ключ можно найти на этой странице, введя `0x33DBF2E0` (обратите внимание на префикс `0x`). Результаты поиска на сайте обновляются с задержкой, поэтому может потребоваться подождать около часа.

#### Получение отпечатка и его привязка к учётной записи Apache {#generate-the-fingerprint-and-bind-it-to-your-apache-account}

Сервер ключей не проверяет подлинность, поэтому любой человек может загрузить открытый ключ от вашего имени. Поэтому необходимо привязать отпечаток на [id.apache.org](https://id.apache.org), чтобы другие могли его сверить.

Получите отпечаток:

```bash
gpg --fingerprint [user ID]
```

Пример:

```text
$ gpg --fingerprint xxx-yyy
pub   4096R/33DBF2E0 2018-12-06
      Key fingerprint = 07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0
uid                  xxx-yyy (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

Вставьте полный отпечаток (`07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0`) в поле `OpenPGP Public Key Primary Fingerprint` на [https://id.apache.org](https://id.apache.org).

> Примечание: к каждой учётной записи Apache можно привязать несколько открытых ключей.

#### Добавление открытого ключа в файл KEYS {#append-the-public-key-to-the-keys-file}

:::danger Важно
**Никогда не удаляйте существующее содержимое файла KEYS.** Только добавляйте новые записи.
:::

Поочерёдно добавьте свой ключ в репозитории SVN Dev и Release:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
# edit doris/KEYS file
gpg --list-sigs [user ID] >> doris/KEYS
gpg --armor --export [user ID] >> doris/KEYS
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

```bash
svn co https://dist.apache.org/repos/dist/release/doris
# edit doris/KEYS file
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

Затем изменения автоматически синхронизируются с файлом по адресу:

```text
https://downloads.apache.org/doris/KEYS
```

В последующих письмах о голосовании по релизу используйте адрес `https://downloads.apache.org/doris/KEYS`.

## Подготовка релиза Maven {#maven-release-preparation}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Release Doris Connector / Shade / SDK -->

Для выпуска таких компонентов, как Doris Connector, Shade и SDK, необходимо использовать Maven. Для этого нужно настроить `~/.m2/settings.xml` и `~/.m2/settings-security.xml`.

### 1. Создание мастер-пароля {#1-generate-the-master-password}

Мастер-пароль используется для последующего шифрования других паролей:

```bash
mvn --encrypt-master-password <password>
```

Результат выглядит примерно так: `{VSb+6+76djkH/43...}`. Запишите его в `~/.m2/settings-security.xml`:

```xml
<settingsSecurity>
  <master>{VSb+6+76djkH/43...}</master>
</settingsSecurity>
```

### 2. Шифрование пароля учётной записи Apache {#2-encrypt-the-apache-account-password}

```bash
mvn --encrypt-password <password>
```

`<password>` — пароль вашей учётной записи Apache. Результат выглядит примерно так: `{GRKbCylpwysHfV...}`.

Добавьте следующую конфигурацию `<servers>` в `~/.m2/settings.xml`:

```xml
<servers>
  <!-- To publish a snapshot of your project -->
  <server>
    <id>apache.snapshots.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
  <!-- To stage a release of your project -->
  <server>
    <id>apache.releases.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
</servers>
```

Назначение двух записей `server id`:

| Идентификатор сервера | Назначение |
| --- | --- |
| `apache.snapshots.https` | Публикация версий SNAPSHOT |
| `apache.releases.https` | Публикация релизных версий в репозитории Staging |

## Создание обсуждения DISCUSS в сообществе {#start-a-discuss-thread-in-the-community}

<!-- Knowledge type: Procedure -->

Обсуждение DISCUSS не является обязательным этапом перед выпуском релиза, но для важных релизов **настоятельно рекомендуется** начать его в списке рассылки `dev@doris.apache.org`. Обсудить можно следующие и другие темы:

- Описание важных функций и особенности их проектирования.
- Описание исправлений ошибок.
- Изменения совместимости и примечания по обновлению.
- Предполагаемый график выпуска.

## Частые вопросы и устранение неполадок {#faq--troubleshooting}

**Вопрос: `gpg --gen-key` зависает. Что делать?**

Причина в недостатке энтропии. Выполните `find / | xargs file` либо установите `rng-tools` и выполните `rngd -r /dev/urandom`, чтобы пополнить источник случайных данных.

**Вопрос: подписание завершается ошибкой `gpg: signing failed: Inappropriate ioctl for device`?**

Терминал не может принять ввод парольной фразы. Выполните `export GPG_TTY=$(tty)` и повторите попытку.

**Вопрос: `mvn deploy` возвращает 401 Unauthorized?**

Проверьте имя пользователя и зашифрованный пароль для `apache.releases.https` в `~/.m2/settings.xml`, а также убедитесь, что мастер-пароль в `~/.m2/settings-security.xml` соответствует им.

**Вопрос: после загрузки на сервер ключей ключ не удаётся найти?**

На `keyserver.ubuntu.com` синхронизация происходит с задержкой, которая обычно составляет около часа.
