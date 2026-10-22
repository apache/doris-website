---
{
    "title": "Обзор | Функции AI",
    "language": "ru",
    "description": "Функция AI представляет собой встроенную функцию Doris, основанную на возможностях искусственного интеллекта (AI).",
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

Функция AI представляет собой встроенную функцию Doris, основанную на возможностях искусственного интеллекта (AI). Пользователи могут вызывать AI непосредственно в SQL-запросах для выполнения различных задач интеллектуальной обработки текста. Функции AI подключаются к различным популярным поставщикам AI (например, OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot и другим) с помощью механизма ресурсов Doris.

Используемый AI должен предоставляться вне Doris и поддерживать анализ текста.

---

## Настройка ресурса AI {#configure-ai-resource}

Перед использованием функций AI необходимо создать ресурс типа AI для централизованного управления данными доступа к API AI.

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

`type`: обязательный параметр, значение должно быть `ai`; служит идентификатором типа ai.

`ai.provider_type`: обязательный параметр для группы универсальной модели. Указывает внешнего поставщика AI. Поддерживаются OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI и Jina. Если другой поставщик использует API, совместимый с [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) или [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), укажите соответствующий совместимый тип поставщика.

Допустимый тип поставщика не означает, что он поддерживает все функции AI. Например, VoyageAI и Jina поддерживают создание эмбеддингов и не могут использоваться в качестве моделей генерации текста.

`ai.endpoint`: обязательный параметр для группы универсальной модели. Указывает конечную точку API AI.

`ai.model_name`: обязательный параметр для группы универсальной модели. Указывает имя модели.

`ai.api_key`: ключ API для группы универсальной модели. Обязателен, если не задано `ai.provider_type = local`.

`ai.temperature`: необязательный параметр. Управляет случайностью генерируемого содержимого. Принимает значение с плавающей точкой от 0 до 1. 
Значение по умолчанию: -1, что означает, что параметр не задан.

`ai.max_token`: необязательный параметр. Ограничивает максимальное количество токенов в генерируемом содержимом.
Значение по умолчанию: -1, что означает, что параметр не задан. Для Anthropic значение по умолчанию равно 2048.

`ai.max_retries`: необязательный параметр. Максимальное количество повторных попыток для одного запроса. Значение по умолчанию: 3.

`ai.retry_delay_second`: необязательный параметр. Задержка перед повторной попыткой в секундах. Значение по умолчанию в ветке разработки равно 1; в Doris 4.1.5 оно равно 0.

`ai.dimensions`: необязательный параметр, управляющий размерностью вектора, возвращаемого [EMBED](./distance-functions/embed.md). 
**Перед настройкой обязательно убедитесь, что модель, указанная в `ai.model_name`, поддерживает настраиваемую размерность вектора**, 
иначе вызов модели может завершиться ошибкой.

### Настройка отдельных моделей эмбеддингов (начиная с 4.1.5) {#dedicated-embedding-model-configuration-since-415}

Начиная с версии 4.1.5, в ресурсе AI можно отдельно настроить универсальную модель, модель текстовых эмбеддингов и модель мультимодальных эмбеддингов. Необходимо полностью настроить хотя бы одну группу. Если для группы задано хотя бы одно свойство подключения или ключ API, эта группа должна содержать `endpoint`, `provider_type` и `model_name`, а также `api_key` для всех поставщиков, кроме `LOCAL`. Отсутствующие поля не наследуются из других групп.

| Группа моделей | Свойства подключения | Ключ API | Использование |
| --- | --- | --- | --- |
| Универсальная | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | Генерация текста и другие функции AI; резервный вариант, если отдельная группа эмбеддингов не настроена |
| Текстовые эмбеддинги | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | Текстовые входные данные для `EMBED()`; резервный вариант для мультимодальных входных данных |
| Мультимодальные эмбеддинги | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | Мультимодальные входные данные в формате JSON для `EMBED()` |

При обработке текста `EMBED()` сначала выбирает группу текстовых эмбеддингов, затем универсальную группу. При обработке мультимодальных данных `EMBED()` выбирает группу мультимодальных эмбеддингов, затем группу текстовых эмбеддингов, затем универсальную группу. Выбранные поставщик и модель должны поддерживать фактический тип медиаданных. Ресурс, содержащий только группы эмбеддингов, может обслуживать соответствующие вызовы `EMBED()`, но не функции генерации текста, которым требуется универсальная модель.

Например, ресурсу, используемому только для текстовых эмбеддингов, универсальная модель генерации не нужна:

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

Замените значения подключения в соответствии с настройками вашего сервиса. При успешном создании возвращается `Query OK`. Общие настройки, такие как `ai.dimensions` и параметры повторных попыток, по-прежнему берутся из конфигурации ресурса.

### Глубина рассуждений: `ai.effort` (начиная с 4.1.5) {#reasoning-effort-aieffort-since-415}

Начиная с версии 4.1.5, необязательное строковое свойство `ai.effort` задаёт глубину рассуждений. По умолчанию оно не задано и не отправляется поставщику. Используйте значения в нижнем регистре с учётом проверки со стороны поставщика:

| Поставщик | Допустимые значения |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| Проверка свойства для других поставщиков | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

Успешная проверка свойства не означает, что каждая модель поддерживает выбранную глубину рассуждений. Выберите значение, поддерживаемое вашим сервисом и моделью. Свойство `ai.effort` не заменяет `ai.max_token`.

### Права на создание, изменение и удаление (начиная с 4.1.5) {#create-alter-and-drop-permissions-since-415}

Для создания ресурса AI требуются глобальные права `ADMIN`. Начиная с версии 4.1.5, параметр конфигурации FE [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) позволяет дополнительно ограничить круг пользователей, которым разрешено создавать ресурсы. Его значение по умолчанию, `*`, не добавляет ограничений по учётной записи.

Ресурс AI, созданный пользователем `root` начиная с версии 4.1.5, может изменять или удалять только `root`; другим учётным записям будет отказано, даже если у них есть права `ADMIN`. Ресурсы, существовавшие до обновления и не имеющие этой метки, не получают её задним числом. Для остальных ресурсов сохраняются существующие проверки прав.

---

## Выбор ресурса и переменные сеанса {#resource-selection-and-session-variables}

При вызове функций AI ресурс можно указать двумя способами:

- Явно: передать имя ресурса непосредственно при вызове функции.
- Неявно: заранее задать переменную сеанса, после чего функция будет автоматически использовать соответствующий ресурс.

Формат задания переменной сеанса:
```sql
SET default_ai_resource='resource_name';
```

Формат вызова функции:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Приоритет выбора ресурса {#resource-selection-priority}

При вызове AI_Function ресурс выбирается в следующем порядке:

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

- `AI_FIXGRAMMAR`: исправление грамматики

- `AI_GENERATE`: генерация текста

- `AI_MASK`: маскирование конфиденциальной информации

- `AI_SENTIMENT`: анализ тональности

- `AI_SIMILARITY`: сравнение семантического сходства текстов

- `AI_SUMMARIZE`: создание краткого содержания текста

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

Подробное описание функций и способов их использования приведено в документации по каждой конкретной функции.
