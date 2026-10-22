---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "ru",
    "description": "Эта инструкция используется для создания правила блокировки SQL."
}
---

## Описание {#description}

Эта инструкция используется для создания правила блокировки SQL.

SQL_BLOCK_RULE позволяет запрещать пользователям определённые операции, например сканирование больших объёмов данных.

## Синтаксис {#syntax}

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## Обязательные параметры {#required-parameters}

**1. `<rule_name>`**

> Имя правила.

**2. `<property>`**

> Свойства правила делятся на три категории: выполнение SQL, ограничения сканирования и переключатели.

> Категории выполнения SQL и ограничений сканирования взаимоисключающие: одно правило блокировки SQL может задавать ограничения только для одной из них.

> **Категория выполнения SQL**

> Доступны два типа сопоставления: по регулярному выражению и точное. Можно выбрать только один из них.
>
> - sql: Правило сопоставления на основе регулярного выражения. Специальные символы необходимо экранировать: например, `select *` следует записывать как `select \\*`. Когда пользователь выполняет инструкцию SQL, система использует заданный здесь SQL как регулярное выражение для сопоставления с SQL, отправленным пользователем. При совпадении выполнение SQL блокируется.
> - sqlHash: Хеш MD5 инструкции SQL. Используется главным образом совместно с журналами медленных запросов. Пользователям не нужно самостоятельно вычислять хеш. Например, если журнал медленных запросов показывает, что определённый SQL выполняется медленно, можно скопировать `SqlHash` из `fe.audit.log` и создать SQL_BLOCK_RULE, чтобы ограничить выполнение этого SQL.
>
> **Категория ограничений сканирования**
> Когда пользователь отправляет запрос, оптимизатор запросов вычисляет для каждой таблицы количество партиций, tablet и строк данных, которые необходимо просканировать. Следующие свойства позволяют ограничить все три показателя одновременно или только некоторые из них.
> - partition_num: Максимальное количество партиций, сканируемых в одной таблице.
> - tablet_num: Максимальное количество tablet, сканируемых в одной таблице.
> - cardinality: Количество строк данных, сканируемых в одной таблице.
> - require_partition_filter: Требуется ли для запроса к партиционированной внутренней таблице или таблице Hive действенный фильтр по партициям. Если установлено значение `true`, запросы, сканирующие поддерживаемую партиционированную таблицу без фильтрации по столбцу партиционирования, блокируются. Значение по умолчанию — `false`. Это свойство поддерживается в Doris начиная с версии 4.0.7 в серии 4.0 и начиная с версии 4.1.4 в серии 4.1. В настоящее время оно действует только для внутренних таблиц и таблиц Hive.
>
> **Категория переключателей**
>
> - global: Действует ли правило для всех пользователей. Значение по умолчанию — false. Если значение true не установлено, правило необходимо применить к конкретному пользователю с помощью команды `set property`.
> - enable: Включено ли правило блокировки. Значение по умолчанию — true.


## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Привилегия    | Объект | Примечания |
| ------------ | ------ | ----- |
| ADMIN_PRIV | Глобальный уровень |       |

## Примеры {#example}

1. Создание правила, запрещающего всем пользователям выполнять `select * from order_analysis`

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```

   При выполнении SQL, заданного в правиле, возвращается ошибка, как показано ниже:


   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: test_rule
   ```

2. Создание правила, запрещающего сканировать более 30 партиций одной таблицы и ограничивающего объём данных запроса до 10 миллиардов строк


   ```sql
   CREATE SQL_BLOCK_RULE test_rule2 
   PROPERTIES
   (
       "partition_num" = "30",
       "cardinality" = "10000000000",
       "global" = "true",
       "enable" = "true"
   );
   ```

3. Сопоставление SQL основано на регулярных выражениях. Чтобы охватить больше вариантов SQL, необходимо составить соответствующие регулярные выражения. Например, следующее правило игнорирует пробельные символы в SQL и запрещает запросы к таблицам, имена которых начинаются с "order":


   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```

4. Создание правила, действующего только для определённых пользователей


   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```

   Применение правила к пользователю jack


   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```

5. Создание правила, требующего включать фильтр по партициям в запросы к партиционированным внутренним таблицам и таблицам Hive

   ```sql
   CREATE SQL_BLOCK_RULE test_rule5
   PROPERTIES(
       "require_partition_filter"="true",
       "global"="true",
       "enable"="true"
   );
   ```

   После включения правила запрос к поддерживаемой партиционированной таблице без фильтра по столбцу партиционирования будет заблокирован:

   ```sql
   SELECT * FROM partitioned_table;
   ERROR 1105 (HY000): errCode = 2, detailMessage = sql hits sql block rule: test_rule5, missing partition filter
   ```

   Запросы с действенным фильтром по партициям по-прежнему могут выполняться:

   ```sql
   SELECT * FROM partitioned_table WHERE dt = '2024-01-01';
   ```

## Прочее {#others}

Ниже приведены распространённые регулярные выражения:

Копировать текст

```text
. : Matches any single character except the newline character `\n`.

* : Matches the preceding element zero or more times. For example, a* matches zero or more 'a's.

+ : Matches the preceding element one or more times. For example, a+ matches one or more 'a's.

? : Matches the preceding element zero or one time. For example, a? matches zero or one 'a'.

[] : Defines a character set. For example, [aeiou] matches any vowel.

[^] : When used in a character set, ^ indicates negation, matching characters not in the set. For example, [^0-9] matches any non-digit character.

() : Groups expressions, allowing quantifiers to be applied to them. For example, (ab)+ matches consecutive 'ab's.

| : Indicates logical OR. For example, a|b matches 'a' or 'b'.

^ : Matches the beginning of a string. For example, ^abc matches strings starting with 'abc'.

$ : Matches the end of a string. For example, xyz$ matches strings ending with 'xyz'.

\ : Escapes special characters, making them ordinary characters. For example, \\. matches the period character '.'.

\s : Matches any whitespace character, including spaces, tabs, newlines, etc.

\d : Matches any digit character, equivalent to [0-9].

\w : Matches any word character, including letters, digits, and underscores, equivalent to [a-zA-Z0-9_].
```
