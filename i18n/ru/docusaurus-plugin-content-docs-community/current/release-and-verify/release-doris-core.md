---
title: Выпуск Apache Doris Core
language: ru
description: "Полный процесс выпуска Apache Doris Core: подготовка ветки, создание тега, подписание, загрузка в SVN и голосования Dev и IPMC."
keywords:
    - выпуск Apache Doris Core
    - процесс выпуска Doris
    - голосование Apache
    - SVN dist
    - подписание GPG
    - кандидат на выпуск rc01
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

# Выпуск Apache Doris Core {#release-apache-doris-core}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache voting process -->

Под Doris Core понимается код в репозитории [https://github.com/apache/doris](https://github.com/apache/doris). В этом документе описан полный процесс выпуска, которому следует менеджер выпуска: от подготовки и проверки ветки до создания пакетов, подписания и голосования сообщества.

## Подготовка к выпуску {#prepare-for-release}

Сначала обратитесь к документу [Подготовка к выпуску](./release-prepare), чтобы настроить среду для подписания, работы с SVN, Maven и другими инструментами.

### 1. Подготовка ветки {#1-prepare-the-branch}

Перед выпуском создайте новую ветку выпуска, например:

```bash
git checkout -b branch-0.9
```

После создания ветки проведите тщательное тестирование, чтобы проверить работоспособность функций, сократить число ошибок и исправить наиболее важные из них. В ходе этой работы следите за сообщениями сообщества, чтобы определить, какие необходимые исправления следует перенести в ветку выпуска с помощью cherry-pick.

### 2. Закрытие и перенос задач {#2-clean-up-issues}

Просмотрите все задачи, относящиеся к этому выпуску:

- Закройте выполненные задачи.
- Перенесите на более позднюю версию те задачи, которые нельзя завершить в этом выпуске.

### 3. Включение необходимых исправлений {#3-merge-necessary-patches}

В период подготовки к выпуску в код могут вноситься важные исправления. Если сообщество сообщает о важной ошибке, исправление которой нужно включить в выпуск, менеджер выпуска оценивает её и переносит соответствующее исправление в ветку выпуска.

## Проверка ветки {#verify-the-branch}

### 1. Тестирование стабильности {#1-stability-testing}

Передайте ветку, отмеченную тегом, команде QA для тестирования стабильности. Если во время тестирования обнаружатся проблемы, требующие исправления, после подготовки соответствующих PR включите их в ветку выпуска.

Переходить к подготовке официального выпуска можно только после того, как вся ветка станет стабильной.

### 2. Проверка компиляции {#2-compilation-verification}

Обратитесь к документации по сборке и выполните сборку, чтобы убедиться, что исходный код компилируется без ошибок.

### 3. Подготовка примечаний к выпуску {#3-prepare-release-notes}

Соберите сведения об основных функциях, исправлениях ошибок и изменениях совместимости в этом выпуске и подготовьте примечания к выпуску (обычно их публикуют в виде задачи GitHub).

## Процедура голосования сообщества {#community-voting-process}

### 1. Создание тега выпуска {#1-tag-the-release}

Когда ветка станет достаточно стабильной, можно создать на ней тег.

Перед созданием тега измените переменную `build_version` в `gensrc/script/gen_build_version.sh`, например задайте `build_version="0.10.0-release"`.

```bash
$ git checkout branch-0.9
$ git tag -a 0.9.0-rc01 -m "0.9.0 release candidate 01"
$ git push origin 0.9.0-rc01
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris.git
 * [new tag]         0.9.0-rc01 -> 0.9.0-rc01

$ git tag
```

### 2. Создание пакета, подписание и загрузка {#2-package-sign-and-upload}

:::caution Примечание
Для выполнения следующих действий необходимо войти в учётную запись пользователя напрямую через терминал, например SecureCRT. Не переключайтесь в неё через `su - user` или `ssh`, иначе поле ввода пароля не появится и возникнет ошибка.
:::

Создайте архив исходного кода, затем сформируйте подпись GPG и файл контрольной суммы SHA512:

```bash
$ git checkout 0.9.0-rc01

$ git archive --format=tar 0.9.0-rc01 --prefix=apache-doris-0.9.0-incubating-src/ | gzip > apache-doris-0.9.0-incubating-src.tar.gz

$ gpg -u xxx@apache.org --armor --output apache-doris-0.9.0-incubating-src.tar.gz.asc --detach-sign apache-doris-0.9.0-incubating-src.tar.gz

$ gpg --verify apache-doris-0.9.0-incubating-src.tar.gz.asc apache-doris-0.9.0-incubating-src.tar.gz

$ sha512sum apache-doris-0.9.0-incubating-src.tar.gz > apache-doris-0.9.0-incubating-src.tar.gz.sha512

$ sha512sum --check apache-doris-0.9.0-incubating-src.tar.gz.sha512
```

| Файл | Назначение |
| --- | --- |
| `*-src.tar.gz` | Пакет исходного кода |
| `*-src.tar.gz.asc` | Файл подписи GPG |
| `*-src.tar.gz.sha512` | Файл контрольной суммы SHA512 |

Загрузите репозиторий SVN Dev:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Разместите три файла в следующей структуре каталогов SVN:

```text
./doris/
|-- 0.9.0-rc01
|   |-- apache-doris-0.9.0-incubating-src.tar.gz
|   |-- apache-doris-0.9.0-incubating-src.tar.gz.asc
|   `-- apache-doris-0.9.0-incubating-src.tar.gz.sha512
`-- KEYS
```

Зафиксируйте изменения в SVN:

```bash
svn add 0.9.0-rc01
svn commit -m "Add 0.9.0-rc1"
```

### 3. Начало голосования в списке рассылки Dev {#3-start-the-dev-mailing-list-vote}

Начните голосование в списке рассылки `dev@doris.apache.org` с темой:

> [VOTE] Выпуск Apache Doris 0.9.0-incubating-rc01

Шаблон текста письма:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

The release candidate has been tagged in GitHub as 0.9.0-rc01, available
here:
https://github.com/apache/incubator-doris/releases/tag/0.9.0-rc01

Release Notes are here:
https://github.com/apache/incubator-doris/issues/1891

Thanks to everyone who has contributed to this release.

The artifacts (source, signature and checksum) corresponding to this release
candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc1/

This has been signed with PGP key 33DBF2E0, corresponding to
lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/incubator/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

To verify and build, you can refer to following link:
http://doris.incubator.apache.org/community/release-and-verify/release-verify.html

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

Best Regards,
xxx

----
DISCLAIMER:
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

### 4. Отправка письма с результатами голосования Dev {#4-send-the-dev-vote-result-email}

После одобрения выпуска по итогам голосования отправьте письмо с результатами с темой:

> [Result][VOTE] Выпуск Apache Doris 0.9.0-incubating-rc01

Шаблон текста письма:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Zhao Chun
+1 xxx
+1 Li Chaoyong
+1 Mingyu Chen

Best Regards,
xxx
```

### 5. Начало голосования IPMC {#5-start-the-ipmc-vote}

:::tip Совет
Если проект не находится на стадии инкубации, пропустите этот и следующий разделы.
:::

Начните голосование IPMC в списке рассылки `general@incubator.apache.org` с темой:

> [VOTE] Выпуск Apache Doris 0.9.0-incubating-rc01

Шаблон текста письма:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 0.9.0-rc01, available here:
https://github.com/apache/doris/releases/tag/0.9.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc01/

This has been signed with PGP key 33DBF2E0, corresponding to lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

To verify and build, you can refer to following instruction:

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

Step1: Pull the docker image with Doris building environment
$ docker pull apache/doris:build-env-1.3.1
You can check it by listing images, its size is about 3.28GB.

Step2: Run the Docker image
You can run image directly:
$ docker run -it apache/doris:build-env-1.3.1

Step3: Download Doris source
Now you should in docker environment, and you can download Doris source package.
(If you have downloaded source and it is not in image, you can map its path to image in Step2.)
$ wget https://dist.apache.org/repos/dist/dev/doris/0.9/0.9.0-rc01/apache-doris-0.9.0.rc01-incubating-src.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-0.9.0.rc01-incubating-src.tar.gz
$ cd apache-doris-0.9.0.rc01-incubating-src
$ sh build.sh

Best Regards,
xxx

----
DISCLAIMER:
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

Ссылку на цепочку писем можно найти здесь:

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 6. Отправка письма с результатами голосования IPMC {#6-send-the-ipmc-vote-result-email}

:::tip Совет
Если проект не находится на стадии инкубации, пропустите этот раздел.
:::

Отправьте письмо с результатами на `general@incubator.apache.org` с темой:

> [RESULT][VOTE] Выпуск Apache Doris 0.9.0-incubating-rc01

Шаблон текста письма:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris 0.9.0-incubating-rc01 is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Willem Jiang
+1 Justin Mclean
+1 ShaoFeng Shi
+1 Makoto Yui

The vote thread:
https://lists.apache.org/thread.html/da05fdd8d84e35de527f27200b5690d7811a1e97d419d1ea66562130@%3Cgeneral.incubator.apache.org%3E

Best Regards,
xxx
```

## Завершение выпуска {#complete-the-release}

Обратитесь к документу [Завершение выпуска](./release-complete), чтобы выполнить все оставшиеся шаги выпуска.

## Часто задаваемые вопросы / устранение неполадок {#faq--troubleshooting}

**Вопрос: при выполнении `gpg --verify` появляется сообщение `gpg: Can't check signature: No public key`?**

На локальном компьютере отсутствует соответствующий открытый ключ. Выполните `gpg --keyserver https://keyserver.ubuntu.com/ --recv-keys <KEY_ID>` для получения открытого ключа, затем повторите попытку.

**Вопрос: при выполнении `svn commit` появляется сообщение `Authentication failed`?**

Проверьте, правильно ли заданы переменные окружения `$ASF_USERNAME` и `$ASF_PASSWORD`. В качестве пароля используется пароль Apache LDAP.

**Вопрос: можно ли завершить голосование досрочно, если с его начала прошло менее 72 часов?**

Нет. Правила Apache требуют, чтобы голосование по выпуску оставалось открытым не менее 72 часов, поэтому необходимо дождаться окончания этого срока.
