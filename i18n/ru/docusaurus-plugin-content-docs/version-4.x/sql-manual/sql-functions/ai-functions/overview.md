---
{
    "title": "Обзор | Функции AI",
    "language": "ru",
    "description": "Функция AI — это встроенная функция Doris, использующая возможности искусственного интеллекта (AI).",
    "sidebar_label": "Обзор"
}
---

# Обзор {#overview}

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

## Описание {#description}

Функция AI — это встроенная функция Doris, использующая возможности искусственного интеллекта (AI). Пользователи могут напрямую вызывать AI в запросах SQL для выполнения различных интеллектуальных задач обработки текста. Функции AI подключаются к нескольким популярным поставщикам AI (таким как OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot и др.) через механизм ресурсов Doris.

Используемый AI должен предоставляться внешним по отношению к Doris сервисом и поддерживать анализ текста.

---

## Настройка ресурса AI {#configure-ai-resource}

Перед использованием функций AI необходимо создать ресурс типа AI для централизованного управления параметрами доступа к API AI.

### Пример: создание ресурса AI {#example-create-ai-resource}

```sql
CREATE RESOURCE "ai_resource_name"
PROPERTIES (
    'type' = 'ai',
    'ai.provider_type' = 'openai',
    'ai.endpoint' = 'https://endpoint_example',
    'ai.model_name' = 'model_example',
    'ai.api_key' = 'sk-xxx',
    'ai.temperature' = '0.7',
    'ai.max_token' = '1024',
    'ai.max_retries' = '3',
    'ai.retry_delay_second' = '1',
    'ai.dimensions' = '1024'
);
 ```

##### Описание параметров {#parameter-description}

`type`: обязательный параметр, должен иметь значение `ai`, обозначающее тип ресурса AI.

`ai.provider_type`: обязательный параметр для группы общей модели. Указывает внешнего поставщика AI. Поддерживаются OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI и Jina. Если другой поставщик использует API, совместимый с [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) или [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), укажите соответствующий тип совместимого поставщика.

Допустимый тип поставщика не означает, что он поддерживает все функции AI. Например, VoyageAI и Jina поддерживают эмбеддинги и не могут использоваться в качестве моделей генерации текста.

`ai.endpoint`: обязательный параметр для группы общей модели. Указывает адрес конечной точки API AI.

`ai.model_name`: обязательный параметр для группы общей модели. Указывает имя модели.

`ai.api_key`: ключ API для группы общей модели. Обязателен, кроме случая `ai.provider_type = local`.

`ai.temperature`: необязательный параметр. Управляет случайностью генерируемого содержимого. Принимает число с плавающей точкой от 0 до 1. 
Значение по умолчанию — -1, что означает, что параметр не задан.

`ai.max_token`: необязательный параметр. Ограничивает максимальное количество токенов в генерируемом содержимом.
Значение по умолчанию — -1, что означает, что параметр не задан. Для Anthropic значение по умолчанию — 2048.

`ai.max_retries`: необязательный параметр. Максимальное количество повторных попыток для одного запроса. Значение по умолчанию — 3.

`ai.retry_delay_second`: необязательный параметр. Задержка в секундах перед повторной попыткой. Значение по умолчанию — 0.

`ai.dimensions`: необязательный параметр, задающий размерность вектора, возвращаемого [EMBED](./distance-functions/embed.md). 
**Перед настройкой обязательно убедитесь, что модель, указанная в `ai.model_name`, поддерживает настройку размерности вектора**, 
иначе вызов модели может завершиться ошибкой.

### Настройка отдельных моделей эмбеддингов (начиная с 4.1.5) {#dedicated-embedding-model-configuration-since-415}

Начиная с версии 4.1.5, в ресурсе AI можно отдельно настроить общую модель, модель текстовых эмбеддингов и модель мультимодальных эмбеддингов. Хотя бы одна группа должна быть настроена полностью. Если для группы задано хотя бы одно свойство подключения или ключ API, в ней должны быть указаны `endpoint`, `provider_type` и `model_name`, а также `api_key` для поставщиков, отличных от `LOCAL`. Отсутствующие поля не наследуются из других групп.

| Группа модели | Свойства подключения | Ключ API | Применение |
| --- | --- | --- | --- |
| Общая | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | Генерация текста и другие функции AI; резервный вариант, если отдельная группа эмбеддингов не настроена |
| Текстовые эмбеддинги | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | Текстовый ввод для `EMBED()`; резервный вариант для мультимодального ввода |
| Мультимодальные эмбеддинги | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | Мультимодальный ввод в формате JSON для `EMBED()` |

Для текстового ввода `EMBED()` сначала выбирает группу текстовых эмбеддингов, затем общую группу. Для мультимодального ввода `EMBED()` выбирает группу мультимодальных эмбеддингов, затем группу текстовых эмбеддингов, затем общую группу. Выбранные поставщик и модель должны поддерживать фактический тип медиаданных. Ресурс, содержащий только группы эмбеддингов, может обслуживать соответствующие вызовы `EMBED()`, но не функции генерации текста, которым требуется общая модель.

Например, ресурсу, используемому только для текстовых эмбеддингов, не нужна общая модель генерации:

```sql
CREATE RESOURCE "text_embed_resource"
PROPERTIES (
    "type" = "ai",
    "ai.embed.provider_type" = "openai",
    "ai.embed.endpoint" = "https://<embedding-service>/v1/embeddings",
    "ai.embed.model_name" = "<embedding-model>",
    "ai.embed.api_key" = "<api-key>"
);
```

Замените параметры подключения значениями из конфигурации вашего сервиса. При успешном создании возвращается `Query OK`. Общие настройки, такие как `ai.dimensions` и параметры повторных попыток, по-прежнему берутся из конфигурации ресурса.

### Глубина рассуждений: `ai.effort` (начиная с 4.1.5) {#reasoning-effort-aieffort-since-415}

Начиная с версии 4.1.5, необязательное строковое свойство `ai.effort` задаёт глубину рассуждений. По умолчанию оно не задано и не передаётся поставщику. Используйте значения в нижнем регистре с учётом правил проверки поставщика:

| Поставщик | Допустимые значения |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| Проверка свойства для других поставщиков | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

Успешная проверка свойства не означает, что каждая модель поддерживает выбранную глубину рассуждений. Выберите значение, поддерживаемое вашим сервисом и моделью. Свойство `ai.effort` не заменяет `ai.max_token`.

### Права на создание, изменение и удаление (начиная с 4.1.5) {#create-alter-and-drop-permissions-since-415}

Для создания ресурса AI требуются глобальные привилегии `ADMIN`. Начиная с версии 4.1.5, параметр конфигурации FE [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) позволяет дополнительно ограничить круг пользователей, которые могут создавать ресурсы. Его значение по умолчанию, `*`, не вводит дополнительных ограничений по пользователям.

Ресурс AI, созданный пользователем `root` начиная с версии 4.1.5, может изменять или удалять только `root`; другим учётным записям доступ запрещён, даже если у них есть привилегии `ADMIN`. Ресурсы, существовавшие до обновления и не имеющие этой отметки, не получают её задним числом. Для остальных ресурсов сохраняются существующие проверки привилегий.

---

## Выбор ресурса и переменные сеанса {#resource-selection-and-session-variables}

При вызове функций AI ресурс можно указать двумя способами:

- Явно: передать имя ресурса непосредственно при вызове функции.
- Неявно: заранее задать переменную сеанса, после чего функция автоматически использует соответствующий ресурс.

Формат задания переменной сеанса:
```sql
SET default_ai_resource='resource_name';
```

Формат вызова функции:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Приоритет выбора ресурса {#resource-selection-priority}

При вызове AI_Function используемый ресурс определяется в следующем порядке:

1. Ресурс, явно указанный пользователем при вызове
2. Глобальный ресурс по умолчанию (`default_ai_resource`)

Пример:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## Функции AI {#ai-functions}

В настоящее время Doris поддерживает следующие функции AI:

- `AI_CLASSIFY`: классификация информации

- `AI_EXTRACT`: извлечение информации

- `AI_FILTER`：фильтрация информации

- `AI_FIXGRAMMAR`: исправление грамматических ошибок

- `AI_GENERATE`: генерация текста

- `AI_MASK`: маскирование конфиденциальной информации

- `AI_SENTIMENT`: анализ тональности

- `AI_SIMILARITY`: сравнение семантического сходства текстов

- `AI_SUMMARIZE`: создание краткого изложения текста

- `AI_TRANSLATE`: перевод

- `AI_AGG`: агрегированный анализ нескольких текстов из разных строк

### Примеры {#examples}

1. `AI_TRANSLATE`
```sql
SELECT AI_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `AI_SENTIMENT`
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DBMS.');
```

Подробное описание функций и их использования приведено в документации каждой конкретной функции.
