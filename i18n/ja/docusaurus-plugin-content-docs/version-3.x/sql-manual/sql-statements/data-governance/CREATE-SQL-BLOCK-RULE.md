---
{
  "title": "CREATE SQL_BLOCK_RULE を作成する",
  "description": "この文はSQLブロックルールを作成するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはSQLブロックルールを作成するために使用されます。

SQL_BLOCK_RULEは、大量のデータのスキャンを回避するなど、ユーザーが特定の操作を実行することを制限するために使用できます。

## Syntax

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```
## 必須パラメータ

**1. `<rule_name>`**

> ルールの名前。


**2. `<property>`**

> ルールのプロパティは、SQL実行、スキャン制限、スイッチの3つのカテゴリに分けることができます。
>
> SQL実行とスキャン制限のカテゴリは相互排他的であり、SQLブロックルールはそのうちの1つのみを制限できることを意味します。
>
>
> **SQL実行カテゴリ**
>
> 正規表現マッチングと完全一致をそれぞれ表す2つのタイプがあります。そのうち1つのみを選択できます。
>
> - sql: マッチングルール（正規表現マッチングに基づき、特殊文字はエスケープが必要です。例えば、`select *`は`select \\*`と記述する必要があります）。ユーザーがSQL文を実行する際、システムはここで設定されたSQLを正規表現として使用し、ユーザーが送信したSQLとマッチングします。マッチした場合、そのSQLの実行がブロックされます。
> - sqlHash: SQLのMD5ハッシュ値。これは主にスローログと組み合わせて使用されます。ユーザーがハッシュ値を自分で計算する必要はありません。例えば、スローログで特定のSQLの実行が遅いことが示されている場合、`fe.audit.log`から`SqlHash`をコピーしてSQL_BLOCK_RULEを作成し、このSQLの実行を制限できます。
>
> **スキャン制限カテゴリ**
> ユーザーがクエリを開始すると、クエリオプティマイザは各Tableでスキャンが必要なパーティション数、tablet数、データ行数を計算します。以下のプロパティを使用して、これら3つの数値をすべて同時に、または一部のみを制限できます。
> - partition_num: Tableがスキャンするパーティションの最大数。
> - tablet_num: Tableがスキャンするtabletの最大数。
> - cardinality: Tableがスキャンするデータの行数。
>
> **スイッチカテゴリ**
>
> - global: ルールがすべてのユーザーに対して有効かどうか。デフォルトはfalseです。trueに設定されていない場合、`set property`コマンドを通じて特定のユーザーにルールを適用する必要があります。
> - enable: ブロックルールが有効かどうか。デフォルトはtrueです。


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege    | Object | 注釈 |
| ------------ | ------ | ----- |
| ADMIN_PRIV | Global |       |

## 例

1. すべてのユーザーが`select * from order_analysis`を実行することを防ぐルールを作成

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```
ルールで定義されたSQLを実行すると、以下のように例外エラーが返されます：

   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
   ```
2. 同一Tableの30パーティション以上のスキャンを防止し、クエリデータ量を100億行以下に制限するルールを作成する

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
3. SQLマッチングは正規表現に基づいています。より多くのSQLパターンをマッチさせたい場合は、対応する正規表現を記述する必要があります。例えば、SQL内のスペースを無視し、"order"で始まるTableへのクエリを防ぐ場合は、以下のようになります：

   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```
4. 特定のユーザーにのみ適用されるルールを作成する

   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```
ルールをユーザーjackに適用する

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```
## その他

一般的な正規表現は以下の通りです：

TextCopy

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
