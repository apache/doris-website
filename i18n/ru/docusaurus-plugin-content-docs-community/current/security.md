---
title: Раскрытие информации об уязвимостях безопасности
language: ru
description: "Как сообщить об уязвимостях безопасности в Apache Doris: свяжитесь с командой безопасности ASF по адресу security@apache.org и следуйте официальной процедуре ответственного раскрытия информации."
keywords:
    - безопасность Apache Doris
    - уязвимость безопасности Doris
    - security@apache.org
    - команда безопасности ASF
    - ответственное раскрытие информации
    - сообщение об уязвимости
    - CVE
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

# Раскрытие информации об уязвимостях безопасности {#security-vulnerability-disclosure}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Vulnerability reporting / Security disclosure -->

Apache Software Foundation (ASF) придерживается строгого подхода к вопросам безопасности своих программных проектов. Apache Doris также уделяет пристальное внимание вопросам безопасности, связанным с возможностями и функциональностью продукта. На этой странице описано, как сообщить об уязвимостях безопасности или потенциальных угрозах для Doris в рамках официальной процедуры ASF.

## Краткая справка о канале для сообщений {#reporting-channel-quick-reference}

| Параметр | Описание |
|------|------|
| Получатель | [Команда безопасности Apache](http://www.apache.org/security/) |
| Адрес электронной почты | [security@apache.org](mailto:security@apache.org) |
| Название проекта | Всегда указывайте `Doris` в письме |
| Принцип раскрытия информации | **Не раскрывайте информацию** об уязвимости через публичные каналы до отправки письма |

## Порядок отправки сообщения {#reporting-steps}

<!-- Knowledge type: Procedure -->

1. **Подготовьте письмо**: Отправьте его на адрес [security@apache.org](mailto:security@apache.org) и убедитесь, что в теме и тексте письма явно указано название проекта `Doris`.
2. **Опишите проблему**: Чётко укажите область воздействия, затронутые версии и возможные сценарии атак, связанные с уязвимостью или потенциальной угрозой.
3. **Приложите шаги для воспроизведения**: Предоставьте минимальные шаги для воспроизведения, PoC или фрагменты журналов, позволяющие воспроизвести проблему безопасности.
4. **Дождитесь ответа**: Команда безопасности Apache и сообщество Doris свяжутся с вами напрямую после оценки и анализа.

## Важные замечания {#important-notes}

- **Не раскрывайте информацию публично**: Не обсуждайте уязвимость в публичных каналах, включая GitHub Issues, списки рассылки, Slack и социальные сети, пока не получите ответ от команды безопасности и не согласуете сроки раскрытия информации.
- **Не используйте обычные каналы обратной связи**: О проблемах безопасности нельзя сообщать через GitHub Issues или список рассылки dev, описанные на странице [«Обратная связь»](feedback).
- **Соблюдайте процедуру ответственного раскрытия информации**: Полное описание процедуры приведено в [Политике ASF по раскрытию информации о проблемах безопасности](http://www.apache.org/security/).

## Связанные ссылки {#related-links}

- [Главная страница команды безопасности ASF](http://www.apache.org/security/)
- [Обратная связь](feedback): Канал для вопросов, не связанных с безопасностью.
- [Присоединяйтесь к сообществу](join-community): Другие каналы общения с сообществом.
