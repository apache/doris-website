---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "ru",
    "description": "Этот оператор используется для создания правила блокировки SQL."
}
---

## Описание {#description}

Этот оператор используется для создания правила блокировки SQL.

SQL_BLOCK_RULE позволяет ограничивать выполнение пользователями определённых операций, например предотвращать сканирование больших объёмов данных.

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

> Категории выполнения SQL и ограничений сканирования взаимоисключающие: правило блокировки SQL может задавать ограничения только для одной из них.

> **Категория выполнения SQL**

> Предусмотрены два типа сопоставления: по регулярному выражению и точное. Можно выбрать только один из них.
>
> - sql: Правило сопоставления (на основе регулярных выражений; специальные символы необходимо экранировать, например, `select *` следует записывать как `select \\*`). При выполнении пользователем оператора SQL система использует указанный здесь SQL как регулярное выражение для сопоставления с SQL, отправленным пользователем. При совпадении выполнение SQL блокируется.
> - sqlHash: Хеш MD5 для SQL. В основном используется совместно с журналами медленных запросов. Пользователям не нужно вычислять хеш самостоятельно. Например, если журнал медленных запросов показывает, что определённый оператор SQL выполняется медленно, можно скопировать `SqlHash` из `fe.audit.log` и создать SQL_BLOCK_RULE, чтобы ограничить выполнение этого SQL.
>
> **Категория ограничений сканирования**
> При запуске запроса пользователем оптимизатор запросов вычисляет количество разделов, tablet и строк данных, которые необходимо просканировать для каждой таблицы. Следующие свойства позволяют ограничить все три значения или только некоторые из них.
> - partition_num: Максимальное количество разделов таблицы, которые могут быть просканированы.
> - tablet_num: Максимальное количество tablet таблицы, которые могут быть просканированы.
> - cardinality: Количество строк данных таблицы, которые будут просканированы.
> - require_partition_filter: Определяет, должен ли запрос к секционированной внутренней таблице или таблице Hive содержать фильтр, ограничивающий набор разделов. Если установлено значение `true`, запросы, сканирующие поддерживаемую секционированную таблицу без фильтрации по столбцу секционирования, блокируются. По умолчанию используется `false`. Это свойство поддерживается в Doris 4.0.7 и более поздних версиях серии 4.0, а также в Doris 4.1.4 и более поздних версиях серии 4.1. В настоящее время оно действует только для внутренних таблиц и таблиц Hive.
>
> **Категория переключателей**
>
> - global: Определяет, действует ли правило для всех пользователей. По умолчанию false. Если значение true не задано, правило нужно применить к конкретному пользователю с помощью команды `set property`.
> - enable: Определяет, включено ли правило блокировки. По умолчанию true.


## Требования к управлению доступом {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен обладать как минимум следующими правами:

| Привилегия    | Объект | Примечания |
| ------------ | ------ | ----- |
| ADMIN_PRIV | Глобальный уровень |       |

## Пример {#example}

1. Создайте правило, запрещающее всем пользователям выполнять `select * from order_analysis`

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```

   При выполнении SQL, указанного в правиле, возникает исключение, как показано ниже:


   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: test_rule
   ```

2. Создайте правило, запрещающее сканировать более 30 разделов одной таблицы и ограничивающее объём данных запроса до 10 миллиардов строк


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

3. Сопоставление SQL основано на регулярных выражениях. Для сопоставления с дополнительными шаблонами SQL необходимо написать соответствующие регулярные выражения. Например, можно игнорировать пробелы в SQL и запрещать запросы к таблицам, имена которых начинаются с "order", как показано ниже:


   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```

4. Создайте правило, действующее только для определённых пользователей


   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```

   Примените правило к пользователю jack


   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```

5. Создайте правило, требующее наличия фильтра по разделам в запросах к секционированным внутренним таблицам и таблицам Hive

   ```sql
   CREATE SQL_BLOCK_RULE test_rule5
   PROPERTIES(
       "require_partition_filter"="true",
       "global"="true",
       "enable"="true"
   );
   ```

   После включения правила запрос к поддерживаемой секционированной таблице без фильтра по столбцу секционирования будет заблокирован:

   ```sql
   SELECT * FROM partitioned_table;
   ERROR 1105 (HY000): errCode = 2, detailMessage = sql hits sql block rule: test_rule5, missing partition filter
   ```

   Запросы с фильтром, ограничивающим набор разделов, по-прежнему могут выполняться:

   ```sql
   SELECT * FROM partitioned_table WHERE dt = '2024-01-01';
   ```

## Дополнительно {#others}

Ниже приведены распространённые регулярные выражения:

Текст Скопировать

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
