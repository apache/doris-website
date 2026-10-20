---
title: Сообщить о проблеме
language: ru
description: "Официальные каналы сообщества Apache Doris для сообщений об ошибках и предложений: список рассылки и GitHub Issue, а также рекомендации по составлению сообщений."
keywords:
    - Обратная связь Apache Doris
    - Сообщение об ошибке Doris
    - Doris GitHub Issue
    - dev@doris.apache.org
    - Список рассылки Doris
    - Создать Issue
    - Шаги воспроизведения
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

# Обратная связь о проблемах {#issue-feedback}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Bug report / Feature suggestion / Usage question -->

Если при использовании Apache Doris вы обнаружили ошибку, проблему производительности или хотите предложить новую возможность, сообщите об этом сообществу через список рассылки или GitHub Issue. На этой странице описаны два официальных канала обратной связи и сведения, которые следует включить в качественное сообщение.

## Каналы обратной связи {#feedback-channel-reference}

Выберите канал в зависимости от типа проблемы:

| Канал | Когда использовать | Куда обратиться |
|------|----------|------|
| Список рассылки | Вопросы об использовании, обсуждение архитектуры и сообщества | Отправьте письмо на `dev@doris.apache.org` (сначала необходимо подписаться) |
| GitHub Issue | Воспроизводимые ошибки, конкретные предложения новых возможностей, проблемы документации | <https://github.com/apache/doris/issues/new/choose> |
| Уязвимость безопасности | Проблемы безопасности (не раскрывайте публично) | См. [Раскрытие уязвимостей безопасности](security) |

## Способы отправки сообщения {#feedback-methods}

### Способ 1: список рассылки {#method-1-mailing-list}

1. Отправьте письмо с любой темой и содержимым на `dev-subscribe@doris.apache.org` и следуйте инструкциям для завершения подписки (подробнее см. [Подписка на список рассылки](subscribe-mail-list)).
2. После подтверждения подписки отправьте письмо на `dev@doris.apache.org` с описанием проблемы или предложения.

### Способ 2: GitHub Issue {#method-2-github-issue}

Откройте [страницу создания Issue](https://github.com/apache/doris/issues/new/choose) и отправьте Bug Report или Feature Request по шаблону.

## Как составить полезное сообщение {#key-points-for-high-quality-feedback}

<!-- Knowledge type: Writing guide -->

Чтобы сообщество быстрее определило причину проблемы, включите следующие сведения:

- **Подробно опишите проблему**: приложите журналы, основные сообщения об ошибках, а также результаты уже выполненной диагностики и анализа.
- **Сведите пример к минимуму**: сузьте область проблемы и уберите не относящийся к ней бизнес-контекст.
- **Укажите шаги воспроизведения**: приложите минимальный SQL, конфигурацию или скрипт для воспроизведения проблемы.
- **Сосредоточьтесь на самой проблеме**: по возможности отделите её от бизнес-сценария. Если контекст необходим, изложите его ясно и конкретно.

## Связанные ссылки {#related-links}

- [Подписка на список рассылки](subscribe-mail-list): подпишитесь на список рассылки dev за 5 шагов.
- [Раскрытие уязвимостей безопасности](security): сообщите об уязвимости по процедуре ASF.
- [Присоединиться к сообществу](join-community): другие каналы, включая Slack, Twitter и LinkedIn.
