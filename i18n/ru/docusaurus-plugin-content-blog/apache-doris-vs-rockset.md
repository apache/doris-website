---
{
  "title": "Почему Apache Doris является лучшей открытой альтернативой Rockset",
  "summary": "Среди многочисленных альтернатив Rockset Apache Doris относится к немногим продуктам, охватывающим все его ключевые возможности.",
  "description": "Среди многочисленных альтернатив Rockset Apache Doris относится к немногим продуктам, охватывающим все его ключевые возможности.",
  "date": "2024-06-24",
  "author": "velodb.io · Zaki Lu, Apache Doris Committer",
  "tags": [
    "Tech Sharing"
  ],
  "externalLink": "https://www.velodb.io/blog/567",
  "image": "/images/doris-vs-rockset.jpeg"
}
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

Компания OpenAI вызвала широкий резонанс в отрасли данных, объявив о [приобретении Rockset](https://openai.com/index/openai-acquires-rockset/), полностью управляемой облачной аналитической базы данных. Наряду с поздравлениями возник вопрос:  **почему именно [Rockset](https://rockset.com)**?

![Приобретение Rockset компанией OpenAI](/images/openai-twitter-rockset.png)

Rockset основал в 2016 году Venkat Venkataramani, бывший директор по разработке Meta. Компания специализируется на поиске и аналитике в реальном времени. По сравнению с другими СУБД её отличают следующие возможности.

- **Обновление данных в реальном времени**: получение и доставка актуальных данных с обновлением отдельных полей за миллисекунды.

- **Объединённый индекс**: сочетание инвертированного индекса, колоночного и строкового хранения для эффективных и гибких запросов.

- **Встроенная поддержка полуструктурированных данных**: обработка полуструктурированных данных, хеш-соединений и соединений вложенными циклами.

- **Совместимость с SQL и JOIN**: поисковый индекс оптимизирован для различных запросов с соединениями.

Новость также поставила пользователей Rockset перед срочной задачей: за три месяца им предстояло найти альтернативу для своих сценариев. Это создало возможности для других аналитических баз данных, однако лишь немногие из них предоставляют все перечисленные ключевые функции. Одна из таких систем: Apache Doris.

Apache Doris представляет собой открытое хранилище данных для аналитики в реальном времени, которым пользуются более 4000 компаний по всему миру. Оно предоставляет следующие возможности.

- **Обновление данных в реальном времени**: Apache Doris поддерживает [обновление в реальном времени](https://doris.apache.org/docs/table-design/data-model/unique) и удаление данных, а также частичное обновление столбцов, что полезно при частых изменениях.

- **Гибридное строковое и колоночное хранение**: Apache Doris является колоночным хранилищем и показывает высокую производительность OLAP в [ClickBench](https://benchmark.clickhouse.com/). Строковое хранение также позволяет обслуживать [высококонкурентные точечные запросы](https://doris.apache.org/docs/query/high-concurrent-point-query/), отвечая почти на миллион запросов за миллисекунды.

- **[Инвертированный индекс](https://doris.apache.org/docs/table-design/index/inverted-index) и полнотекстовый поиск**: Apache Doris позволяет создавать индексы на всех полях и гибко сочетать их для многомерного анализа и эффективного поиска по ключевым словам.

- **Встроенная поддержка полуструктурированных данных**: Apache Doris добавил тип [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT) для гибкой схемы и быстрых запросов при экономичном хранении. По сравнению с традиционной обработкой JSON он может повысить производительность в 10 раз.

- **Поддержка различных SQL-запросов и [операций соединения](https://doris.apache.org/docs/query/join-optimization/doris-join-optimization)**: Apache Doris обладает высокой совместимостью с синтаксисом и интерфейсами MySQL, поддерживает INNER JOIN, CROSS JOIN и все виды OUTER JOIN. Автоматическая оптимизация с учётом типов данных помогает обеспечить производительность в разных условиях.

Apache Doris является проектом верхнего уровня Apache Software Foundation и поддерживается быстро растущим сообществом. На момент публикации оригинала у проекта было более 11.8K звёзд GitHub и 636 участников разработки.

Apache Doris является открытой альтернатива Rockset. За дополнительной помощью обращайтесь по адресу dev@doris.apache.org .
