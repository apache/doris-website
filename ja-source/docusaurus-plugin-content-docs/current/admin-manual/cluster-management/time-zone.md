---
{
  "title": "タイムゾーン",
  "language": "ja",
  "description": "Dorisはカスタムタイムゾーン設定をサポートしています"
}
---
Dorisはカスタムタイムゾーン設定をサポートしています

## 基本概念

Doris内には以下の2つのタイムゾーン関連パラメータが存在します：

- `system_time_zone`：サーバー起動時に、マシンで設定されたタイムゾーンに従って自動的に設定され、設定後は変更できません。
- `time_zone`：クラスタの現在のタイムゾーンです。この変数は、クラスタ開始時に`system_time_zone`と同じ値に設定され、ユーザーが手動で変更しない限り再度変更されることはありません。

## 具体的な操作

1. `SHOW VARIABLES LIKE '% time_zone%'`

    現在のタイムゾーン関連設定を表示します

2. `SET [global] time_zone = 'Asia/Shanghai';`

   このコマンドはセッションレベルでタイムゾーンを設定します。`global`キーワードが使用された場合、Doris FEはパラメータを永続化し、その後のすべての新しいセッションに対して有効になります。

## データソース

タイムゾーンデータには、タイムゾーンの名前、対応する時間オフセット、およびサマータイムの変更が含まれます。BEが配置されているマシンでは、データのソースはコマンド`TZDIR`によって返されるディレクトリです。サポートされていない場合は、ディレクトリ`/usr/share/zoneinfo`が使用されます。

## タイムゾーンの影響

### 1. 関数

`NOW()`や`CURTIME()`などの時間関数によって表示される値、および`show load`、`show backends`の時間値が含まれます。

ただし、`create table`の時間型パーティション列のless than値には影響せず、`date/datetime`型として保存された値の表示にも影響しません。

タイムゾーンによって影響を受ける関数：

- `FROM_UNIXTIME`：UTCタイムスタンプが与えられると、Dorisセッション`time_zone`で指定されたタイムゾーンでの日付と時刻を返します。例えば、`time_zone`が`CST`の場合、`FROM_UNIXTIME(0)`は`1970-01-01 08:00:00`を返します。

- `UNIX_TIMESTAMP`：日付と時刻が与えられると、Dorisセッション`time_zone`で指定されたタイムゾーンでのUTCタイムスタンプを返します。例えば`time_zone`が`CST`の場合、`UNIX_TIMESTAMP('1970-01-01 08:00:00')`は`0`を返します。

- `CURTIME`：現在のDorisセッション`time_zone`で指定されたタイムゾーンの時刻を返します。

- `NOW`：現在のDorisセッション`time_zone`で指定されたタイムゾーンの日付と時刻を返します。

- `CONVERT_TZ`：指定されたタイムゾーンから別のタイムゾーンにdatetimeを変換します。

### 2. 時間型の値

`DATE`および`DATETIME`型については、データインポート時のタイムゾーン変換をサポートしています。

- データにタイムゾーンが含まれている場合（例：「2020-12-12 12:12:12+08:00」で現在のDoris `time_zone = +00:00`の場合）、データはDorisにインポートされ、実際の値は「2020-12-12 04:12:12」になります。

- データにタイムゾーンが含まれていない場合（例：「2020-12-12 12:12:12」）、時刻は絶対時刻として考慮され、変換は発生しません。

`TIMESTAMPTZ`型については、データインポート時にタイムゾーン変換もサポートしており、入力時間値を一律でUTC（協定世界時）に変換し、出力時に現在のセッションのタイムゾーンオフセットを追加します。

- データにタイムゾーンが含まれている場合（例：「2020-12-12 12:12:12+08:00」）、Dorisはそのタイムゾーン情報を変換に使用します。

- データにタイムゾーンが含まれていない場合（例：「2020-12-12 12:12:12」）、Dorisは変換に現在のセッションのタイムゾーン設定を使用します。

現在のセッションの`time_zone`は`TIMESTAMPTZ`型の出力に影響します。例えば、現在のセッションが`time_zone="+08:00"`で`TIMESTAMPTZ`型の値が`2020-12-12 12:12:12+08:00`と仮定した場合、`time_zone`を変更後、出力値は変更されます：

```
set time_zone = "+08:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 12:12:12+08:00 |
+---------------------------+

set time_zone = "+07:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 11:12:12+07:00 |
+---------------------------+
```
### 3. Daylight Saving Time

Daylight Saving Timeは、本質的に名前付きタイムゾーンの実際の時刻オフセットであり、特定の日付に変更されます。

例えば、`America/Los_Angeles`タイムゾーンには、毎年概ね3月と11月に開始・終了するDaylight Saving Time調整が含まれています。つまり、`America/Los_Angeles`の実際のタイムゾーンオフセットは、3月のDaylight Savings Time開始時に`-08:00`から`-07:00`に変更され、11月のDaylight Savings Time終了時に`-07:00`から`-08:00`に変更されます。
Daylight Saving Timeを有効にしたくない場合は、`America/Los_Angeles`ではなく`time_zone`を`-08:00`に設定してください。

## 使用方法

タイムゾーン値は様々なフォーマットで指定できます。Dorisでは以下の標準フォーマットが十分にサポートされています：

1. 標準的な名前付きタイムゾーンフォーマット。例："Asia/Shanghai"、"America/Los_Angeles"。このフォーマットは[このマシン上のタイムゾーンデータ](#data-source)に由来します。"Etc/GMT+3"なども このカテゴリに属します。

2. 標準的なオフセットフォーマット。例："+02:30"、"-10:00"（"+12:03"などの特殊なオフセットはサポートされていません）

3. 略語タイムゾーンフォーマット。現在以下のみサポート：

   1. "GMT"、"UTC"、"+00:00"タイムゾーンと同等

   2. "CST"、"Asia/Shanghai"タイムゾーンと同等

4. Zulu タイムゾーンを表す単一文字Z、"+00:00"タイムゾーンと同等

また、アルファベットの解析はすべて大文字小文字を区別しません。

注意：実装が異なるため、Dorisの一部のインポートでは現在、他のフォーマットもサポートされています。**本番環境では、ここに記載されていないこれらのフォーマットに依存すべきではなく、その動作はいつでも変更される可能性があります**。バージョン更新の際は関連するchangelogに注意してください。

## ベストプラクティス

### Time Zone Sensitive Data

タイムゾーンの問題には主に3つの影響があります：

1. セッション変数`time_zone` -- クラスタータイムゾーン

2. インポート時に指定されるheader `timezone`（Stream Load、Broker Loadなど）-- インポートタイムゾーン

3. "2023-12-12 08:00:00+08:00"内のタイムゾーンタイプリテラル"+08:00" -- データタイムゾーン

これを以下のように理解できます：

Dorisは現在、様々なタイムゾーンのデータをDorisにインポートすることと互換性があります。Doris自体の`DATETIME`などの時刻タイプはタイムゾーン情報を含まず、インポート後にタイムゾーンの変更でデータが変わることはないため、時刻データがDorisにインポートされる際、以下の2つのカテゴリに分けることができます：

1. 絶対時刻

   絶対時刻とは、それが関連付けられているデータシーンがタイムゾーンと無関係であることを意味します。このタイプのデータはタイムゾーン接尾辞なしでインポートされ、そのまま保存されるべきです。

2. 特定のタイムゾーンでの時刻

   特定のタイムゾーンでの時刻とは、それが関連付けられているデータシナリオがタイムゾーンに関連していることを意味します。このタイプのデータについては、特定のタイムゾーン接尾辞付きでインポートされるべきです。インポート時に、Dorisクラスターの`time_zone`タイムゾーンまたはStream Load/Broker Loadで指定されたheader `timezone`に変換されます。

   このタイプのデータは、インポート後にインポート時に指定されたタイムゾーンでの絶対時刻ストレージに変換されるため、後続のインポートとクエリはデータの意味の混乱を避けるためにこのタイムゾーンを維持する必要があります。

 * Insert文については、以下の例で説明できます：

    ```sql
    Doris > select @@time_zone;
    +---------------+
    | @@time_zone   |
    +---------------+
    | Asia/Shanghai |
    +---------------+
    
    Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- The imported data specifies a time zone of +02:00
    
    Doris > select * from dt;
    +---------------------+
    | dt                  |
    +---------------------+
    | 2020-12-12 18:12:12 | --- Is converted to the Doris cluster time zone Asia/Shanghai, subsequent imports and queries should maintain this time zone.
    +---------------------+
    
    Doris > set time_zone = 'America/Los_Angeles';
    
    Doris > select * from dt;
    +---------------------+
    | dt                  |
    +---------------------+
    | 2020-12-12 18:12:12 | --- If time_zone is modified, the time value will not change accordingly, and its meaning during query will be confused.
    +---------------------+
    ```
* Stream LoadやBroker Loadなどのインポート方法では、ヘッダー`timezone`を指定することでこれを実現できます。例えば、Stream Loadの場合、以下の例で説明できます：

    ```shell
    cat dt.csv
    2020-12-12 12:12:12+02:00
    
    curl --location-trusted -u root: \
     -H "Expect:100-continue" \
     -H "strict_mode: true" \
     -H "timezone: Asia/Shanghai" \
     -T dt.csv -XPUT \
     http://127.0.0.1:8030/api/test/dt/_stream_load
    ```
    ```sql
    Doris > select @@time_zone;
    +---------------+
    | @@time_zone   |
    +---------------+
    | Asia/Shanghai |
    +---------------+
    
    Doris > select * from dt;
    +---------------------+
    | dt                  |
    +---------------------+
    | 2020-12-12 18:12:12 | --- Is converted to the Doris cluster time zone Asia/Shanghai, subsequent imports and queries should maintain this time zone.
    +---------------------+
    ```
:::tip
    * Stream LoadやBroker Loadなどのインポート方法では、ヘッダー`timezone`がDorisクラスターの`time_zone`を上書きするため、インポート中は一貫している必要があります。
    * Stream LoadやBroker Loadなどのインポート方法では、ヘッダー`timezone`がインポート変換で使用される関数に影響します。
    * インポート時にヘッダー`timezone`が指定されていない場合、現在のクラスタータイムゾーンがデフォルトになります。
   :::

**まとめると、タイムゾーンの問題に対処するためのベストプラクティスは以下の通りです:**

:::info Best Practices
1. 使用前にクラスターが表すタイムゾーンを確認し、`time_zone`を設定して、その後は変更しないでください。

2. インポート時にヘッダー`timezone`をクラスターの`time_zone`と一致するよう設定してください。

3. 絶対時刻の場合は、タイムゾーンサフィックスなしでインポートしてください。タイムゾーン付きの時刻の場合は、特定のタイムゾーンサフィックス付きでインポートすると、インポート後にDorisの`time_zone`タイムゾーンに変換されます。
:::

### 夏時間

夏時間の開始時刻と終了時刻は[現在のタイムゾーンデータソース](#data-source)から取得され、必ずしも現在年のタイムゾーン場所で実際に公式に認識されている時刻と正確に対応するとは限りません。このデータはICANNによって維持されています。現在年で指定されているとおりに夏時間が動作することを保証する必要がある場合は、Dorisによって選択されたデータソースがICANNが公開した最新のタイムゾーンデータであることを確認してください。ダウンロードアクセスについては以下を参照してください。

### 情報の更新

実世界のタイムゾーンと夏時間データは様々な理由で時々変更される可能性があり、IANAは定期的にこれらの変更を記録し、対応するタイムゾーンファイルを更新しています。Dorisのタイムゾーン情報を最新のIANAデータと同期させたい場合は、以下のいずれかを実行してください:

1. Package Managerを使用して更新する

現在のオペレーティングシステムで使用されているパッケージマネージャーに応じて、対応するコマンドを使用してタイムゾーンデータを直接更新できます:

```shell
# yum
> sudo yum update tzdata
# apt
> sudo apt update tzdata
```
この方法で更新されたデータは、システムの `$TZDIR`（通常は `usr/share/zoneinfo`）の下に配置されます。

2. IANA time zone databaseを手動でpullする（推奨）

ほとんどのLinuxディストリビューションでは、tzdataが適時に同期されないパッケージマネージャーを使用しています。time zoneデータの精度が重要な場合は、IANAが発行するデータを定期的にpullすることができます：

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```
次に、展開されたフォルダ内のREADMEファイルに従って、特定のzoneinfoデータを生成します。生成されたデータは`$TZDIR`フォルダを上書きするようにコピーする必要があります。

上記の全ての操作は、BEマシン上で完了した後、対応するBE上で**必ず**再起動する必要があることにご注意ください。

## 参考資料

- [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

- [IANA Time Zone Database](https://www.iana.org/time-zones)

- [The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
