---
{
  "title": "タイムゾーン",
  "language": "ja",
  "description": "Dorisはカスタムタイムゾーン設定をサポートします"
}
---
Dorisはカスタムタイムゾーン設定をサポートしています

## 基本概念

Doris内には、タイムゾーンに関連する以下の2つのパラメータが存在します：

- `system_time_zone` : サーバー起動時に、マシンに設定されたタイムゾーンに応じて自動的に設定され、設定後は変更できません。
- `time_zone` : クラスターの現在のタイムゾーン。この変数はクラスター開始時に`system_time_zone`と同じ値に設定され、ユーザーが手動で変更しない限り再度変更されることはありません。

## 具体的な操作

1. `SHOW VARIABLES LIKE '% time_zone%'`

    現在のタイムゾーン関連設定を表示

2. `SET [global] time_zone = 'Asia/Shanghai';`

   このコマンドはセッションレベルでタイムゾーンを設定します。`global`キーワードが使用された場合、Doris FEはパラメータを永続化し、その後のすべての新しいセッションに対して有効になります。

## データソース

タイムゾーンデータには、タイムゾーンの名前、対応する時間オフセット、およびサマータイムの変更が含まれています。BEが配置されているマシンでは、データのソースは`TZDIR`コマンドによって返されるディレクトリです。サポートされていない場合は、`/usr/share/zoneinfo`ディレクトリが使用されます。

## タイムゾーンの影響

### 1. functions

`NOW()`や`CURTIME()`などの時間関数によって表示される値、および`show load`、`show backends`の時間値を含みます。

ただし、`create table`の時間型パーティション列のless than値には影響せず、`date/datetime`型として格納された値の表示にも影響しません。

タイムゾーンの影響を受ける関数：

- `FROM_UNIXTIME`: UTCタイムスタンプが与えられた場合、Dorisセッション`time_zone`で指定されたタイムゾーンでの日付と時刻を返します。例えば、`time_zone`が`CST`の場合、`FROM_UNIXTIME(0)`は`1970-01-01 08:00:00`を返します。

- `UNIX_TIMESTAMP`: 日付と時刻が与えられた場合、Dorisセッション`time_zone`で指定されたタイムゾーンでのUTCタイムスタンプを返します。例えば、`time_zone`が`CST`の場合、`UNIX_TIMESTAMP('1970-01-01 08:00:00')`は`0`を返します。

- `CURTIME`: 現在のDorisセッション`time_zone`で指定されたタイムゾーンの時刻を返します。

- `NOW`: 現在のDorisセッション`time_zone`で指定されたタイムゾーンの日付と時刻を返します。

- `CONVERT_TZ`: 指定されたタイムゾーンから別のタイムゾーンへdatetimeを変換します。

### 2. 時間型の値

`DATE`および`DATETIME`型について、データインポート時にタイムゾーン変換をサポートしています。

- データにタイムゾーンがある場合、例えば現在のDoris `time_zone = +00:00`で"2020-12-12 12:12:12+08:00"の場合、データはDorisにインポートされ、実際の値は"2020-12-12 04:12:12"になります。

- データにタイムゾーンが含まれていない場合、例えば"2020-12-12 12:12:12"の場合、時刻は絶対時刻とみなされ、変換は行われません。

### 3. サマータイム

サマータイムは本質的に、特定の日付に変更される名前付きタイムゾーンの実際の時間オフセットです。

例えば、`America/Los_Angeles`タイムゾーンには、毎年おおよそ3月と11月に開始および終了するサマータイム調整が含まれています。つまり、`America/Los_Angeles`の実際のタイムゾーンオフセットは、3月のサマータイム開始時に`-08:00`から`-07:00`に変更され、11月のサマータイム終了時に`-07:00`から`-08:00`に変更されます。
サマータイムを有効にしたくない場合は、`America/Los_Angeles`ではなく`time_zone`を`-08:00`に設定してください。

## 使用方法

タイムゾーン値はさまざまな形式で指定できます。以下の標準形式がDorisで十分にサポートされています：

1. "Asia/Shanghai"、"America/Los_Angeles"などの標準的な名前付きタイムゾーン形式。この形式は[このマシンのタイムゾーンデータ](#data-source)から派生します。"Etc/GMT+3"なども、このカテゴリに属します。

2. "+02:30"、"-10:00"などの標準的なオフセット形式（"+12:03"などの特殊なオフセットはサポートされていません）

3. 略語タイムゾーン形式、現在以下のみサポート：

   1. "GMT"、"UTC"、"+00:00"タイムゾーンと同等

   2. "CST"、"Asia/Shanghai"タイムゾーンと同等

4. Zuluタイムゾーンの単一文字Z、"+00:00"タイムゾーンと同等

また、すべてのアルファベットの解析は大文字小文字を区別しません。

注意：実装の違いにより、現在Dorisの一部のインポートでは他の形式もサポートされています。**本番環境では、ここに記載されていないこれらの形式に依存すべきではなく、それらの動作はいつでも変更される可能性があります**ので、バージョン更新時は関連するchangelogに注意してください。

## ベストプラクティス

### タイムゾーンセンシティブデータ

タイムゾーンの問題には、主に3つの影響が関わります：

1. セッション変数`time_zone` -- クラスタータイムゾーン

2. インポート時に指定されるheader `timezone`（Stream Load、Broker Loadなど） -- インポートタイムゾーン

3. "2023-12-12 08:00:00+08:00"の"+08:00"のようなタイムゾーン型リテラル -- データタイムゾーン

以下のように理解できます：

Dorisは現在、さまざまなタイムゾーンのデータをDorisにインポートすることと互換性があります。Doris自体の`DATETIME`およびその他の時間型にはタイムゾーン情報が含まれておらず、インポート後のデータはタイムゾーンの変更に伴って変更されないため、時間データがDorisにインポートされる場合、以下の2つのカテゴリに分けることができます：

1. 絶対時間

   絶対時間とは、それが関連するデータシーンがタイムゾーンと関係がないことを意味します。このタイプのデータは、タイムゾーンサフィックスなしでインポートし、そのまま格納する必要があります。

2. 特定のタイムゾーンの時間

   特定のタイムゾーンの時間とは、それが関連するデータシーンがタイムゾーンと関係があることを意味します。このタイプのデータは、特定のタイムゾーンサフィックス付きでインポートする必要があります。インポート時に、Dorisクラスター`time_zone`タイムゾーンまたはStream Load/Broker Loadで指定されたheader `timezone`に変換されます。

   このタイプのデータは、インポート後、インポート時に指定されたタイムゾーンで絶対時間として格納されるように変換されるため、その後のインポートとクエリではこのタイムゾーンを維持して、データの意味の混乱を避ける必要があります。

 * Insert文については、以下の例を通じて説明できます：

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
    * Stream LoadやBroker Loadなどのインポートメソッドでは、ヘッダー`timezone`はDorisクラスタの`time_zone`を上書きするため、インポート中は一貫している必要があります。
    * Stream LoadやBroker Loadなどのインポートメソッドでは、ヘッダー`timezone`はインポート変換で使用される関数に影響します。
    * インポート時にヘッダー`timezone`が指定されていない場合、デフォルトで現在のクラスタタイムゾーンが使用されます。
   :::

**まとめると、タイムゾーンの問題に対処するためのベストプラクティスは以下の通りです:**

:::info Best Practices
1. クラスタが表すタイムゾーンを確認し、使用前に`time_zone`を設定し、その後は変更しないでください。

2. インポート時にヘッダー`timezone`をクラスタ`time_zone`と一致するように設定してください。

3. 絶対時刻の場合は、タイムゾーンサフィックスなしでインポートし、タイムゾーンを持つ時刻の場合は、特定のタイムゾーンサフィックスでインポートすると、インポート後にDoris `time_zone`タイムゾーンに変換されます。
:::

### 夏時間

夏時間の開始時刻と終了時刻は[現在のタイムゾーンデータソース](#data-source)から取得され、現在の年のタイムゾーン位置において公式に認められた実際の時刻と必ずしも完全に対応するとは限りません。このデータはICANNによって維持されています。現在の年に対して夏時間が指定された通りに動作することを確実にする必要がある場合は、Dorisによって選択されたデータソースがICANNが公開する最新のタイムゾーンデータであることを確認してください。ダウンロードアクセスについては以下を参照してください。

### 情報更新

実世界のタイムゾーンと夏時間データは、さまざまな理由により時々変更される可能性があり、IANAは定期的にこれらの変更を記録し、対応するタイムゾーンファイルを更新しています。Dorisのタイムゾーン情報を最新のIANAデータと最新の状態に保ちたい場合は、以下のいずれかを実行してください:

1. パッケージマネージャーを使用してアップデート

現在のオペレーティングシステムで使用されているパッケージマネージャーに応じて、対応するコマンドを使用してタイムゾーンデータを直接アップデートできます:

```shell
# yum
> sudo yum update tzdata
# apt
> sudo apt update tzdata
```
この方法で更新されたデータは、システムの`$TZDIR`（通常は`usr/share/zoneinfo`）配下に配置されます。

2. IANA time zone databaseを手動でpullする（推奨）

ほとんどのLinuxディストリビューションでは、tzdataがタイムリーに同期されないパッケージマネージャーがあります。time zoneデータの正確性が重要な場合は、IANAが公開するデータを定期的にpullすることができます：

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```
次に、抽出されたフォルダ内のREADMEファイルに従って、特定のzoneinfoデータを生成します。生成されたデータは`$TZDIR`フォルダを上書きするためにコピーする必要があります。

BEマシン上で上記のすべての操作が完了した後、対応するBE上で**必ず**再起動しなければ変更が有効になりませんので、ご注意ください。

## 関連資料

- [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

- [IANA Time Zone Database](https://www.iana.org/time-zones)

- [The tz-announce Archives](https://mm.icann.org/pipermail/tz-announce/)
