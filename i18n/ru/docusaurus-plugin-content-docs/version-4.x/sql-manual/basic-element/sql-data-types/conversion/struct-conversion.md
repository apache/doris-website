---
{
    "title": "Приведение к типам STRUCT",
    "language": "ru",
    "description": "Тип STRUCT используется для хранения и обработки структурированных данных, которые могут содержать поля разных типов, каждое из которых имеет имя и соответствующее значение."
}
---

Тип STRUCT используется для хранения и обработки структурированных данных, которые могут содержать поля разных типов, каждое из которых имеет имя и соответствующее значение. STRUCT может включать вложенные значения других сложных типов, таких как ARRAY, MAP или другие STRUCT.

## Приведение к STRUCT {#cast-to-struct}

### Из String {#from-string}

#### Строгий режим {#strict-mode}

##### Определение BNF {#bnf-definition}

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Описание правил {#rule-description}

1. Текстовое представление STRUCT должно начинаться с открывающей фигурной скобки `{` и заканчиваться закрывающей фигурной скобкой `}`.
2. Пустые STRUCT представляются непосредственно как `{}`.
3. Пары «поле: значение» внутри STRUCT разделяются запятыми `,`.
4. Каждая пара состоит из необязательного имени поля, двоеточия `:` и значения, записанных в формате "fieldname:value", либо только из значения в формате "value".
5. Все пары должны использовать единый формат: либо "fieldname:value", либо "value".
6. Имена полей и значения можно заключать в парные одинарные кавычки (`'`) или двойные кавычки (`"`). Содержимое кавычек рассматривается как единое целое.
7. До и после элементов внутри STRUCT допускаются пробельные символы.
8. При разборе к частям, соответствующим `<value-token>`, далее применяются правила разбора типа значения. Обработка частей `<field-token>` зависит от того, указаны ли имена полей:
   - **Если имена полей указаны:** поля сопоставляются **по имени**, без учёта регистра. Порядок входных полей **не обязан** совпадать с порядком, заданным в STRUCT. Поля, определённые в STRUCT, но отсутствующие во входных данных, заполняются значением NULL. В строгом режиме входное имя поля, отсутствующее в STRUCT, вызывает ошибку.
   - **Если имена полей не указаны:** поля сопоставляются по позиции, а количество значений **должно** точно совпадать с количеством полей, определённых в STRUCT.
9. Для обозначения значения null в элементах можно использовать "null".

Если формат STRUCT не соответствует требованиям, выдаётся ошибка, например:
1. Если имена полей не указаны, количество значений не совпадает с количеством полей, определённых в STRUCT.
2. Если имена полей указаны, входные данные содержат имя поля, отсутствующее в STRUCT.
3. У некоторых пар указаны имена полей, а у других нет (имена полей должны быть указаны либо у всех пар, либо ни у одной).

Если значение в STRUCT не соответствует требованиям соответствующего типа, выдаётся ошибка.

##### Примеры {#examples}

| Входная строка | Результат преобразования | Комментарий |
| --- | --- | --- |
| "{}" | {} | Корректный пустой STRUCT |
| "  {}" | Ошибка | Строка не начинается с фигурной скобки, разбор завершается ошибкой |
| '{"a":1,"b":1}' | Приведение к STRUCT\<a:int, b:int\>: {"a":1, "b":1} | Корректный STRUCT с именами полей |
| '{a:1,"b":3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей могут быть заключены в кавычки или указаны без кавычек |
| '{1,3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей не указаны, сопоставление выполняется по позиции |
| '{b:3.14,a:1}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Если имена полей указаны, поля сопоставляются по имени; порядок во входных данных может отличаться от порядка в схеме |
| '{A:1,B:3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей сопоставляются без учёта регистра |
| '{a:1}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":null} | Поле b отсутствует во входных данных и заполняется значением NULL |
| '{a:1,c:100}' | Приведение к STRUCT\<a:int, b:double\>: Ошибка | Имя поля c отсутствует в STRUCT; в строгом режиме выдаётся ошибка |
| '{a:1,3.1,c:100}' | Ошибка | Смешанный формат: у некоторых элементов указаны имена полей, а у других нет |
| '{1,3.14,100}' | Приведение к STRUCT\<a:int, b:double\>: Ошибка | Если имена полей не указаны, количество значений не совпадает с количеством определённых полей |
| '{"a":"abc","b":1}' | Приведение к STRUCT\<a:int, b:int\>: Ошибка | "abc" невозможно преобразовать в тип int |
| '{null,1}' | Приведение к STRUCT\<a:int, b:int\>: {"a":null, "b":1} | Корректный STRUCT со значением null |
| '{"name":"John","age":25}' | Приведение к STRUCT\<name:string, age:int\>: {"name":"John", "age":25} | STRUCT со строковыми значениями |
| '{{"x":1,"y":2},3}' | Приведение к STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":1,"y":2}, "z":3} | Вложенная структура STRUCT |

#### Нестрогий режим {#non-strict-mode}

##### Определение BNF {#bnf-definition-1}

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Описание правил {#rule-description-1}

1. Текстовое представление STRUCT должно начинаться с открывающей фигурной скобки `{` и заканчиваться закрывающей фигурной скобкой `}`.
2. Пустые STRUCT представляются непосредственно как `{}`.
3. Пары «поле: значение» внутри STRUCT разделяются запятыми `,`.
4. Каждая пара состоит из необязательного имени поля, двоеточия `:` и значения, записанных в формате "fieldname:value", либо только из значения в формате "value".
5. Все пары должны использовать единый формат: либо "fieldname:value", либо "value".
6. Имена полей и значения можно заключать в парные одинарные кавычки (`'`) или двойные кавычки (`"`). Содержимое кавычек рассматривается как единое целое.
7. До и после элементов внутри STRUCT допускаются пробельные символы.
8. При разборе к частям, соответствующим `<value-token>`, далее применяются правила разбора типа значения. Обработка частей `<field-token>` зависит от того, указаны ли имена полей:
   - **Если имена полей указаны:** поля сопоставляются **по имени**, без учёта регистра. Порядок входных полей **не обязан** совпадать с порядком, заданным в STRUCT. Поля, определённые в STRUCT, но отсутствующие во входных данных, заполняются значением NULL. Входное имя поля, отсутствующее в STRUCT, игнорируется.
   - **Если имена полей не указаны:** поля сопоставляются по позиции, а количество значений **должно** точно совпадать с количеством полей, определённых в STRUCT.
9. Для обозначения значения null в элементах можно использовать "null".

Если формат STRUCT не соответствует требованиям, возвращается NULL, например:
1. Если имена полей не указаны, количество значений не совпадает с количеством полей, определённых в STRUCT.
2. У некоторых пар указаны имена полей, а у других нет (имена полей должны быть указаны либо у всех пар, либо ни у одной).

Если значение в STRUCT не соответствует требованиям соответствующего типа, в соответствующую позицию записывается null.

##### Примеры {#examples-1}

| Входная строка | Результат преобразования | Комментарий |
| --- | --- | --- |
| "{}" | {} | Корректный пустой STRUCT |
| "  {}" | NULL | Строка не начинается с фигурной скобки, разбор завершается ошибкой |
| '{"a":1,"b":1}' | Приведение к STRUCT\<a:int, b:int\>: {"a":1, "b":1} | Корректный STRUCT с именами полей |
| '{a:1,"b":3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей могут быть заключены в кавычки или указаны без кавычек |
| '{1,3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей не указаны, сопоставление выполняется по позиции |
| '{b:3.14,a:1}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Если имена полей указаны, поля сопоставляются по имени; порядок во входных данных может отличаться от порядка в схеме |
| '{A:1,B:3.14}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Имена полей сопоставляются без учёта регистра |
| '{a:1}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":null} | Поле b отсутствует во входных данных и заполняется значением NULL |
| '{a:1,c:100}' | Приведение к STRUCT\<a:int, b:double\>: {"a":1, "b":null} | Неизвестное поле c игнорируется; отсутствующее поле b заполняется значением NULL |
| '{a:1,3.1,c:100}' | NULL | Смешанный формат: у некоторых элементов указаны имена полей, а у других нет |
| '{1,3.14,100}' | Приведение к STRUCT\<a:int, b:double\>: NULL | Если имена полей не указаны, количество значений не совпадает с количеством определённых полей |
| '{"a":"abc","b":1}' | Приведение к STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" невозможно преобразовать в тип int, в соответствующую позицию записывается null |
| '{null,1}' | Приведение к STRUCT\<a:int, b:int\>: {"a":null, "b":1} | Корректный STRUCT со значением null |
| '{"name":"John","age":"twenty-five"}' | Приведение к STRUCT\<name:string, age:int\>: {"name":"John", "age":null} | "twenty-five" невозможно преобразовать в тип int, в соответствующую позицию записывается null |
| '{{"x":"one","y":2},3}' | Приведение к STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | Во вложенном STRUCT при неудачном преобразовании записывается null |

### Из STRUCT\<другой тип\> {#from-structother-type}

Если исходные данные имеют тип STRUCT и целевой тип также STRUCT, должны выполняться следующие условия:

1. Исходный и целевой STRUCT должны содержать одинаковое количество элементов (полей)
2. Каждый элемент исходного STRUCT последовательно преобразуется в тип соответствующего элемента целевого STRUCT

Если эти условия не выполняются, например при несовпадении количества элементов, преобразование невозможно.

#### Строгий режим {#strict-mode-1}

##### Описание правил {#rule-description-2}

Для каждого элемента STRUCT выполняется приведение из другого типа к целевому типу. Это приведение также выполняется в строгом режиме.

##### Примеры {#examples-2}

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the whole CAST reports an error
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

#### Нестрогий режим {#non-strict-mode-1}

##### Описание правил {#rule-description-3}

Для каждого элемента STRUCT выполняется приведение из другого типа к целевому типу. Это приведение также выполняется в нестрогом режиме.

##### Примеры {#examples-3}

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the corresponding element is set to null
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+-----------------------+
| renamed_struct        |
+-----------------------+
| {"b":"123", "a":null} |
+-----------------------+
```
