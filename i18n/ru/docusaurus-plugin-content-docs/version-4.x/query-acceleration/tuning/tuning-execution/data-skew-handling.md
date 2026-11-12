---
{
    "title": "Обработка перекоса данных: поиск и устранение узких мест в отдельных потоках MPP-запросов Doris",
    "sidebar_label": "Обработка перекоса данных",
    "language": "ru",
    "description": "Как обнаружить перекос данных в MPP-запросах Doris и устранить узкие места при однопоточном выполнении? В этой статье описаны методы диагностики и настройки с помощью метрик Profile, Broadcast и Leading Hint.",
    "keywords": ["перекос данных в Doris", "оптимизация MPP-запросов", "Join Shuffle", "Broadcast Join", "Leading Hint", "обработка перекоса данных", "настройка по Profile"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenario: Doris MPP query exhibits single-point slowness, unbalanced Join, or abnormal plan ordering -->

Перекос данных — это неравномерное распределение данных между экземплярами BE после Shuffle, из-за которого один поток становится узким местом для всего запроса. Doris — это база данных с архитектурой MPP, в которой Shuffle данных используется для ускорения параллельных вычислений. Если значения Join Key или столбца фильтра распределены неравномерно, возникает узкое место в одном потоке, замедляющее выполнение всего запроса.

В этой статье описано, как обнаруживать такие проблемы, и представлены распространённые методы настройки.

## Порядок диагностики {#troubleshooting-checklist}

<!-- Knowledge type: operation checklist -->
<!-- Applicable scenario: quickly locating skew issues -->

Прежде чем приступать к оптимизации, выполните следующие действия:

- Используйте `EXPLAIN`, чтобы просмотреть план выполнения и проверить порядок Join и способ Shuffle.
- Используйте `PROFILE`, чтобы изучить значения `max / avg / min` для метрик операторов, таких как `ExecTime` и `ProbeRows`.
- Проверьте, отличается ли `max` от `avg` на несколько порядков: это типичный признак перекоса.
- Определите источник перекоса: неравномерное распределение Join Key или ошибка оценки числа строк после фильтрации.
- Выберите соответствующий метод настройки: Broadcast Hint или Leading Hint.

## Сравнение сценариев перекоса данных {#skew-scenario-comparison}

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: quickly selecting an optimization method -->

| Сценарий | Причина | Типичные признаки | Рекомендуемый метод |
|---|---|---|---|
| Перекос данных по бакетам | Неравномерное распределение значений Join Key приводит к чрезмерному росту одной партиции после Shuffle | `ProbeRows.max` значительно превышает `avg`, а значение `ExecTime.max` аномально велико | Broadcast Join Hint |
| Перекос данных в столбце приводит к перестановке левой и правой таблиц | Оптимизатор предполагает равномерное распределение, что приводит к большим ошибкам оценки числа строк после фильтрации | Выбирается неоптимальный порядок Join, а число строк в левой таблице значительно превышает оценку | Leading Hint |

## Пример 1: перекос данных по бакетам приводит к неоптимальному выбору способа Shuffle {#case-1-bucket-data-skew-causes-suboptimal-shuffle-method}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: uneven Join Key distribution causes single-thread execution time to be significantly higher than the average -->

### Признаки {#symptoms}

Если в таблице есть перекос данных по Join Key, данные распределяются между экземплярами BE неравномерно. Это создаёт узкое место в отдельном потоке и увеличивает общее время выполнения запроса.

### Диагностика с помощью Profile {#locating-with-profile}

Изучите Profile оператора Hash Join:

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

По значениям `max` в Profile оператора Join видно, что время выполнения и ProbeRows явно указывают на перекос:

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

После Shuffle по Join Key данные распределяются неравномерно: один поток обработал 200 миллионов строк, а другой — всего несколько тысяч.

### Краткая справка по признакам перекоса {#skew-signal-quick-reference}

| Метрика | Нормальное поведение | Поведение при перекосе |
|---|---|---|
| `ExecTime` | `max` близко к `avg` | `max` значительно превышает `avg` (например, 10 с против 166 мс) |
| `ProbeRows` | Значения для всех потоков находятся в пределах одного порядка величины | `max` на несколько порядков превышает `avg` |
| `RowsProduced` | Строки распределены равномерно | Строки сосредоточены в нескольких потоках |

### Оптимизация: использование Broadcast Join Hint {#optimization-use-broadcast-join-hint}

В идеале объём данных, обрабатываемых каждым потоком, должен быть примерно одинаковым. Обратитесь к разделу «Использование Hints для управления способом Shuffle при Join» и укажите Broadcast Join Hint, чтобы данные левой таблицы не проходили Shuffle. Это позволит избежать узкого места, вызванного перекосом данных в столбце Join.

- **Цель**: избежать Shuffle большой таблицы по Join Key и чрезмерного роста одной партиции.
- **Команда**:

  ```SQL
  SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
  ```

- **Описание**: при использовании `[broadcast]` правая таблица `customer` рассылается на все узлы, а данные левой таблицы `orders` больше не проходят Shuffle. Это устраняет избыточную нагрузку на отдельный поток, вызванную перекосом Join Key.

## Пример 2: перекос данных в столбце приводит к перестановке левой и правой таблиц Join {#case-2-column-data-skew-causes-left-and-right-tables-of-join-to-be-reversed}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: inaccurate filter row-count estimation leads to an unreasonable Join order -->

### Признаки {#symptoms-1}

Оптимизатор Doris оценивает селективность, предполагая равномерное распределение данных. Большие ошибки в оценке числа строк после фильтрации влияют на выбор плана выполнения операторов. Рассмотрим следующий SQL:

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

### Анализ причин {#cause-analysis}

В предположении о равномерном распределении оптимизатор может посчитать, что число строк после фильтра `o_orderdate < '1920-01-02'` меньше числа строк в таблице `customer`, и поэтому выбрать порядок Join: `customer` join `orders`.

Однако, если реальные данные распределены неравномерно и число строк `orders`, удовлетворяющих условию, превышает число строк `customer`, более подходящим будет порядок Join: `orders` join `customer`.

### Оптимизация: использование Leading Hint {#optimization-use-leading-hint}

- **Цель**: принудительно задать более подходящий порядок Join, чтобы обойти ошибки оценки числа строк.
- **Команда**:

  ```SQL
  select /*+leading(orders customer)*/ count(*) 
  from orders, customer 
  where o_custkey = c_custkey
  and o_orderdate < '1920-01-02'
  ```

- **Описание**: обратитесь к разделу «Использование Leading Hint для управления порядком Join». Leading Hint принудительно задаёт порядок Join: `customer` join `orders`.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions and misconceptions -->

**Вопрос 1: как быстро определить, есть ли в запросе перекос данных?**

Проверьте `ExecTime` и `ProbeRows` ключевых операторов в Profile. Если `max` значительно превышает `avg` (разница на порядок величины), присутствует перекос.

**Вопрос 2: всегда ли Broadcast Join устраняет перекос?**

Не всегда. Broadcast подходит, когда правая таблица, которую нужно разослать, достаточно мала. Если правая таблица велика, рассылка приводит к значительным затратам памяти и сетевых ресурсов и может снизить производительность.

**Вопрос 3: можно ли использовать Leading Hint и Broadcast Hint вместе?**

Да. Они решают разные задачи: Leading Hint управляет порядком Join, а Broadcast Hint — способом Shuffle. Их можно сочетать для обработки сложных сценариев.

**Вопрос 4: почему оптимизатор не выбирает оптимальный план автоматически?**

Оптимизатор строит оценки на основе статистики и предположения о равномерном распределении. При сильном перекосе данных в столбце оценки становятся неточными. В таком случае требуется вмешательство с помощью Hints.

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: issue persists after tuning -->

| Проблема | Возможная причина | Рекомендуемое действие |
|---|---|---|
| OOM после добавления Broadcast Hint | Правая таблица слишком велика, и при рассылке превышается лимит памяти | Выберите другой способ Shuffle или уменьшите размер правой таблицы |
| Нет эффекта после добавления Leading Hint | Ошибка в синтаксисе Hint или оптимизатор игнорирует Hint | Используйте `EXPLAIN`, чтобы проверить, применяется ли Hint |
| `max` в Profile по-прежнему значительно превышает `avg` | Источник перекоса находится в агрегации или сканировании, а не в Join | Проверьте метрики операторов Aggregate / Scan |
| Нестабильные результаты при повторном выполнении | Устаревшая статистика | Выполните `ANALYZE TABLE`, чтобы обновить статистику |

## Итоги {#summary}

<!-- Knowledge type: summary -->
<!-- Applicable scenario: methodology recap -->

Перекос данных — распространённая проблема производительности в промышленных средах. Подход к её решению можно свести к трём шагам:

1. **Наблюдение**: используйте вывод `EXPLAIN` и `PROFILE`, чтобы изучить план и выявить узкие места при выполнении.
2. **Поиск причины**: определите источник перекоса по различиям в значениях метрик `max / avg / min`.
3. **Настройка**: используйте Broadcast Hint или Leading Hint, чтобы скорректировать план и избежать влияния перекоса данных на производительность.
