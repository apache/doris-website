---
{
    "title": "AI_AGG",
    "language": "ru",
    "description": "Агрегирует указанный столбец с помощью большой языковой модели в соответствии с инструкциями пользователя."
}
---

## Описание {#description}

Агрегирует указанный столбец с помощью большой языковой модели в соответствии с инструкциями пользователя.

## Синтаксис {#syntax}

```sql
AI_AGG([<resource_name>], <expr>, <instruction>)
```

<a id="parameter-description"></a>

## Параметры {#parameters}

| Параметр         | Описание                                             |
| ----------------- | ------------------------------------------------------- |
| `<resource_name>` | Имя используемого ресурса. Необязательный параметр.                  |
| `<expr>`          | Текстовый столбец для агрегации. Количество символов в одном тексте должно быть меньше 128K.|
| `<instruction>`   | Инструкция для выполнения. Допускаются только литералы.      |

## Возвращаемое значение {#return-value}

Начиная с версии 4.1.5, AI_AGG возвращает весь сгенерированный моделью текст в виде одного результата, в том числе текст, содержащий массив JSON. Функция не разбивает этот массив на несколько результатов агрегации. Для формата OpenAI Responses она пропускает нетекстовые элементы вывода, такие как элементы рассуждений и вызовов инструментов, и объединяет `output_text` из элементов сообщений. Если ответ содержит статус, он должен быть `completed`; неполный ответ или ответ без текста приводит к ошибке.

Возвращает строку, содержащую результат агрегации.

Если все входные значения равны NULL, возвращает NULL.

Результат генерируется языковой моделью, поэтому вывод может различаться.

## Пример {#example}

Следующая таблица содержит примеры обращений в службу поддержки:
```sql
CREATE TABLE support_tickets (
    ticket_id      BIGINT,
    customer_name  VARCHAR(100),
    subject        VARCHAR(200),
    details        TEXT
)
DUPLICATE KEY(ticket_id)
DISTRIBUTED BY HASH(ticket_id) BUCKETS 5
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO support_tickets VALUES
(1, 'Alice', 'Login Failure', 'Cannot log in after password reset. Tried clearing cache and different browsers.'),
(2, 'Bob', 'Login Failure', 'Same problem as Alice. Also seeing 502 errors on the SSO page.'),
(3, 'Carol', 'Payment Declined', 'Credit card charged twice but order still shows pending.'),
(4, 'Dave', 'Slow Dashboard', 'Dashboard takes >30 seconds to load since the last release.'),
(5, 'Eve', 'Login Failure', 'Getting redirected back to login after entering 2FA code.');
```

Можно использовать `AI_AGG` для обобщения проблем клиентов по темам обращений:
```sql
SELECT
    subject,
    AI_AGG(
        'ai_resource_name',
        details,
        'Summarize every ticket detail into one short paragraph of 40 words or less.'
    ) AS ai_summary
FROM support_tickets
GROUP BY subject;
```

```text
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| subject          | ai_summary                                                                                                                                                                                                |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Slow Dashboard   | The dashboard loading time has significantly increased to over 30 seconds following the latest release, indicating a potential issue with the recent update.                                              |
| Login Failure    | User experiences login issues, including redirection post-2FA, inability to log in after password reset despite using different browsers and clearing cache, and encountering 502 errors on the SSO page. |
| Payment Declined | The customer's credit card was charged twice, but the order status remains pending, indicating a potential issue with the transaction processing or system update.                                        |
+------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Пример 2：

Следующая таблица содержит примеры отзывов пользователей платформы электронной коммерции.
```sql
CREATE TABLE product_reviews (
    review_id   BIGINT,
    product_id  BIGINT,
    rating      TINYINT,
    comment     STRING
)
DUPLICATE KEY(review_id)
DISTRIBUTED BY HASH(product_id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO product_reviews VALUES
(1, 1001, 5, '鞋子尺码刚好，穿着舒服，颜色也好看，物流很快！'),
(2, 1001, 4, '质量不错，就是鞋底有点硬，需要磨合几天。'),
(3, 1001, 3, '外观和图片一样，但收到时有轻微胶味。'),
(4, 1002, 5, '杯子小巧，出汁快，清洗也方便，上班带着刚好。'),
(5, 1002, 3, '声音有点大，不过能接受，充满电只能榨 5 杯。'),
(6, 1002, 2, '用了两周就充不进电，售后换货流程太慢。'),
(7, 1003, 5, '面料透气不闷热，袖口设计很贴心，UPF50+ 确实晒不黑。'),
(8, 1003, 4, '颜色好看，但拉链有点卡顿，需要用力。'),
(9, 1004, 5, '降噪给力，地铁里也能安静听歌，续航一周充一次。');
```

Использование AI_AGG для обобщения и оценки:
```sql
SET default_ai_resource = 'ai_resource_name';
SELECT
    product_id,
    AI_AGG(
        comment,
        '请把多条用户评价总结成一句话，突出买家最关心的优点和缺点，控制在50字以内。'
    ) AS 评价摘要
FROM product_reviews
GROUP BY product_id;
```

```text
+------------+--------------------------------------------------------------------------------------------------------------+
| product_id | 评价摘要                                                                                                     |
+------------+--------------------------------------------------------------------------------------------------------------+
|       1003 | 该产品面料透气、防晒效果好且颜色美观，但拉链使用不顺畅。                                                     |
|       1004 | 用户评价该产品降噪效果好，续航能力强，一周充一次电。                                                         |
|       1001 | 买家普遍认为鞋子穿着舒适、外观好看且物流快，但鞋底偏硬且有轻微胶味。                                         |
|       1002 | 买家认为该榨汁杯小巧便携、出汁快且易清洗，但电池续航短且售后换货流程慢。                                     |
+------------+--------------------------------------------------------------------------------------------------------------+
```
