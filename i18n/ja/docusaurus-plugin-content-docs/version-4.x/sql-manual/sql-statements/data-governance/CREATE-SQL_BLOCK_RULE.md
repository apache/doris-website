---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "ja",
    "description": "このステートメントは SQL ブロックルールの作成に使用します。"
}
---

## 説明

このステートメントは SQL ブロックルールの作成に使用します。

SQL_BLOCK_RULE を使用すると、ユーザーによる特定の操作を制限できます。たとえば、大量のデータをスキャンするクエリを防止できます。

## 構文

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

> ルールの名前です。

**2. `<property>`**

> ルールのプロパティは、SQL の実行、スキャンの制限、スイッチの 3 つのカテゴリに分けられます。

> SQL の実行とスキャンの制限は併用できません。つまり、1 つの SQL ブロックルールで制限できるのは、どちらか一方だけです。

> **SQL 実行カテゴリ**

> 正規表現によるマッチングと完全一致によるマッチングの 2 種類があります。選択できるのはどちらか一方だけです。
>
> - sql: マッチングルールです（正規表現でマッチングするため、特殊文字はエスケープが必要です。たとえば、`select *` は `select \\*` と記述します）。ユーザーが SQL ステートメントを実行すると、システムはここで設定した SQL を正規表現として使用し、ユーザーが送信した SQL と照合します。一致すると、その SQL の実行をブロックします。
> - sqlHash: SQL の MD5 ハッシュ値です。主にスローログと組み合わせて使用します。ユーザーがハッシュ値を自分で計算する必要はありません。たとえば、スローログから特定の SQL の実行が遅いと分かった場合、`SqlHash` を `fe.audit.log` からコピーし、その SQL の実行を制限する SQL_BLOCK_RULE を作成できます。
>
> **スキャン制限カテゴリ**
> ユーザーがクエリを開始すると、クエリオプティマイザーは各テーブルについて、スキャンが必要なパーティション数、タブレット数、データ行数を計算します。以下のプロパティを使用して、3 つの数値すべて、または一部を制限できます。
> - partition_num: テーブルをスキャンするパーティションの最大数です。
> - tablet_num: テーブルをスキャンするタブレットの最大数です。
> - cardinality: テーブルをスキャンするデータ行数です。
> - require_partition_filter: パーティション化された内部テーブルまたは Hive テーブルに対するクエリに、有効なパーティションフィルターを必須とするかどうかを指定します。`true` に設定すると、サポート対象のパーティション化テーブルをパーティション列でフィルタリングせずにスキャンするクエリはブロックされます。デフォルトは `false` です。このプロパティは、Doris 4.0 系では 4.0.7 以降、Doris 4.1 系では 4.1.4 以降でサポートされます。現時点では、内部テーブルと Hive テーブルにのみ適用されます。
>
> **スイッチカテゴリ**
>
> - global: ルールをすべてのユーザーに適用するかどうかを指定します。デフォルトは false です。true に設定しない場合は、`set property` コマンドを使用して特定のユーザーにルールを適用する必要があります。
> - enable: ブロックルールを有効にするかどうかを指定します。デフォルトは true です。


## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限    | オブジェクト | 備考 |
| ------------ | ------ | ----- |
| ADMIN_PRIV | グローバル |       |

## 例

1. すべてのユーザーによる `select * from order_analysis` の実行を防ぐルールを作成します。

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```

   ルールに定義した SQL を実行すると、以下のように例外エラーが返されます。


   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: test_rule
   ```

2. 同じテーブルで 30 個を超えるパーティションのスキャンを防ぎ、クエリで読み取るデータ量を 100 億行以下に制限するルールを作成します。


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

3. SQL のマッチングには正規表現を使用します。より多くの SQL パターンに一致させるには、対応する正規表現を記述する必要があります。たとえば、以下では SQL 内の空白を無視し、名前が「order」で始まるテーブルへのクエリを防ぎます。


   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```

4. 特定のユーザーにのみ適用するルールを作成します。


   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```

   ユーザー jack にルールを適用します。


   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```

5. パーティション化された内部テーブルと Hive テーブルに対するクエリで、パーティションフィルターを必須にするルールを作成します。

   ```sql
   CREATE SQL_BLOCK_RULE test_rule5
   PROPERTIES(
       "require_partition_filter"="true",
       "global"="true",
       "enable"="true"
   );
   ```

   ルールを有効にすると、サポート対象のパーティション化テーブルで、パーティション列によるフィルターを含まないクエリはブロックされます。

   ```sql
   SELECT * FROM partitioned_table;
   ERROR 1105 (HY000): errCode = 2, detailMessage = sql hits sql block rule: test_rule5, missing partition filter
   ```

   有効なパーティションフィルターを含むクエリは、引き続き実行できます。

   ```sql
   SELECT * FROM partitioned_table WHERE dt = '2024-01-01';
   ```

## その他

よく使用する正規表現は次のとおりです。

テキストをコピー

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
