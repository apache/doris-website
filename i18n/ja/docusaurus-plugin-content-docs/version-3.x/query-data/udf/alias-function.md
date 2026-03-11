---
{
  "title": "エイリアス関数",
  "description": "エイリアス関数とは、関数にエイリアス名を割り当てることを指します。",
  "language": "ja"
}
---
# Alias ファンクション

## 概要

alias functionとは、関数にエイリアス名を割り当てることを指します。システムに関数や式フラグメントの新しいシグネチャを登録することで、互換性の向上や利便性の向上を目指します。

alias functionは、他のカスタム関数と同様に、2つのスコープをサポートします：`LOCAL`と`GLOBAL`。

- `LOCAL`: alias functionは現在のデータベーススコープ下に登録されます。他のデータベース下でalias functionを使用する必要がある場合は、完全修飾名を使用する必要があります。つまり、`<Database Name>.<ファンクション Name>`です。

- `GLOBAL`: alias functionはグローバルスコープ下に登録されます。任意のデータベース下で関数名により直接アクセスできます。

## 使用例

### 関数へのエイリアスの割り当て

このシナリオはシステム移行でよく見られます。ユーザーが他のデータベースシステムを対象とする既存のクエリを持っている場合、これらのクエリにはDorisの関数と同じ機能を持つが名前が異なる関数が含まれている可能性があります。この場合、この関数に新しいalias functionを定義することで、ユーザーが変更を意識することなく移行を完了できます。

### クエリ文の簡素化

このシナリオは複雑な分析でよく見られます。複雑なクエリ文を書く際、1つの文内または異なる文間で大量の繰り返し式フラグメントが存在する可能性があります。この複雑な式フラグメントにalias functionを作成することで、クエリ文を簡素化でき、記述の利便性と保守性を向上させることができます。

## サポートされるスコープ

### 式の要件

現在、alias functionは、それらが指し示す実際の式のルートノードが関数式でなければならないことを要求します。

正当な例：

```sql
-- Create an alias function named func with parameters INT, INT, actually pointing to the expression abs(foo + bar);  
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);  
-- Create an alias function named func with parameters DATETIMEV2(3), INT, actually pointing to the expression date_trunc(days_sub(foo, bar), 'day')  
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) AS date_trunc(days_sub(foo, bar), 'day')
```
不正な例:

```sql
-- The root expression is not a function  
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```
### パラメータ要件

現在、alias関数は可変長パラメータをサポートしておらず、少なくとも1つのパラメータを持つ必要があります。
