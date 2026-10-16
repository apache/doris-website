---
{
    "title": "タイムゾーンの管理",
    "language": "ja",
    "description": "Doris のタイムゾーン関連パラメータ、設定方法、夏時間の扱い、データ取り込み時のタイムゾーン変換について説明します。タイムゾーンに依存するデータを扱う際のベストプラクティスも紹介します。",
    "keywords": [
        "Doris time zone",
        "time_zone",
        "system_time_zone",
        "set time_zone",
        "Asia/Shanghai",
        "time zone configuration",
        "daylight saving time",
        "tzdata",
        "IANA time zone",
        "Stream Load timezone",
        "DATETIME time zone",
        "TIMESTAMPTZ"
    ]
}
---

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenarios: Cluster initialization time zone configuration / Cross-time-zone data ingestion / Daylight saving time adjustment -->

Doris ではタイムゾーンを任意に設定できます。このドキュメントでは、Doris のタイムゾーン関連パラメータの意味、確認と設定の方法、タイムゾーンが関数とデータ型に与える影響、夏時間の扱い、タイムゾーンに依存するデータのベストプラクティスについて説明します。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| クラスターの初期設定 | デプロイ後、業務上の所在地や統一基準に合わせて `time_zone` を設定します |
| 異なるタイムゾーンのデータ取り込み | Stream Load、Broker Load などで、タイムゾーン情報の有無にかかわらずデータを取り込みます |
| 関数の戻り値の調整 | `NOW()`、`CURTIME()`、`FROM_UNIXTIME` などの関数の戻り値に適用されるタイムゾーンを調整します |
| 夏時間への対応 | `America/Los_Angeles` など、夏時間への切り替えがある名前付きタイムゾーンを扱います |
| タイムゾーンデータの更新 | IANA が新しい tzdata バージョンを公開した後、BE マシンのタイムゾーンデータを更新します |

## 基本概念

Doris には、次の二つのタイムゾーン関連パラメータがあります。

| パラメータ | 変更可能 | 説明 |
| --- | --- | --- |
| `system_time_zone` | いいえ | サーバー起動時に、マシンのローカルタイムゾーンに基づいてシステムが自動的に設定します。設定後は変更できません。 |
| `time_zone` | はい | クラスターの現在のタイムゾーンです。クラスター起動時は `system_time_zone` と同じで、手動で変更しない限り変わりません。 |

## タイムゾーンの確認と設定

### 現在のタイムゾーンの確認

次の SQL 文を実行して、タイムゾーン関連の変数を確認します。

```sql
show variables like '%time_zone%';
```

### タイムゾーンの設定

`time_zone` は `SET` 文で変更します。

```sql
SET [global] time_zone = 'Asia/Shanghai';
```

- `global` キーワードを指定しない場合、現在のセッションでのみ有効になります。
- `global` キーワードを指定した場合、Doris FE がパラメータを永続化し、以降に開始するすべての新しいセッションに適用されます。

### タイムゾーンデータの参照元 {#time-zone-data-source}

タイムゾーンデータには、タイムゾーン名、対応する UTC オフセット、夏時間による変更などの情報が含まれます。BE マシンでは、`TZDIR` コマンドが返すディレクトリからデータを取得します。このコマンドがサポートされていない場合は、`/usr/share/zoneinfo` ディレクトリを参照します。

## タイムゾーンの値の形式

タイムゾーンの値には複数の形式を使用できます。Doris が完全にサポートする標準形式は次のとおりです。

| 種類 | 例 | 説明 |
| --- | --- | --- |
| 標準の名前付きタイムゾーン | `Asia/Shanghai`、`America/Los_Angeles`、`Etc/GMT+3` | [ローカルのタイムゾーンデータ](#time-zone-data-source)から取得します |
| 標準のオフセット形式 | `+02:30`、`-10:00` | `+12:03` のような特殊なオフセットはサポートされません |
| タイムゾーンの略称 | `GMT`、`UTC` | `+00:00` タイムゾーンと同等です |
| タイムゾーンの略称 | `CST` | `Asia/Shanghai` タイムゾーンと同等です |
| 一文字の Z | `Z` | ズールータイムゾーンを表し、`+00:00` タイムゾーンと同等です |

また、英字の解析では大文字と小文字が区別されません。

:::caution 注意
実装上の違いにより、取り込み方法によっては、現在ほかの形式もサポートされています。**本番環境では、ここに記載されていない形式に依存しないでください。動作は予告なく変わる可能性があります。** 関連する更新については、各リリースの変更履歴を確認してください。
:::

## タイムゾーンの影響

### 関数への影響

タイムゾーンは、`NOW()` や `CURTIME()` などの時刻関数の戻り値、および `SHOW LOAD` と `SHOW BACKENDS` に表示される時刻に影響します。

ただし、時刻型パーティション列の `LESS THAN` に指定する値には**影響しません**（`CREATE TABLE` での定義時）。また、`DATE`、`DATETIME`、`TIMESTAMP_NS` 型として保存されたデータの表示値にも影響しません。

タイムゾーンの影響を受ける関数は次のとおりです。

| 関数 | 動作 |
| --- | --- |
| `FROM_UNIXTIME` | UTC タイムスタンプを受け取り、Doris セッションの `time_zone` で指定されたタイムゾーンの日付と時刻を返します。たとえば、`time_zone` が `CST` の場合、`FROM_UNIXTIME(0)` は `1970-01-01 08:00:00` を返します。 |
| `UNIX_TIMESTAMP` | 日付と時刻を受け取り、Doris セッションの `time_zone` で指定されたタイムゾーンに基づく UTC タイムスタンプを返します。たとえば、`time_zone` が `CST` の場合、`UNIX_TIMESTAMP('1970-01-01 08:00:00')` は `0` を返します。 |
| `CURTIME` | Doris セッションの `time_zone` で指定されたタイムゾーンの現在時刻を返します。 |
| `NOW` | Doris セッションの `time_zone` で指定されたタイムゾーンの現在の日付と時刻を返します。 |
| `CONVERT_TZ` | 日付と時刻を、指定されたタイムゾーンから別の指定されたタイムゾーンに変換します。 |

### 時刻型への影響

#### DATE / DATETIME / TIMESTAMP_NS 型

`DATE`、`DATETIME`、`TIMESTAMP_NS` 型では、データ取り込み時のタイムゾーン変換がサポートされています。`TIMESTAMP_NS` は、秒の小数部を九桁保持しつつ、`DATETIME` と同じくタイムゾーン情報を持たずに保存されます。

- **タイムゾーン情報があるデータ**: たとえば、`2020-12-12 12:12:12+08:00` を取り込み、Stream Load のヘッダー `timezone` を `+00:00` に設定した場合、Doris に実際に保存される値は `2020-12-12 04:12:12` です。
- **タイムゾーン情報がないデータ**: たとえば、`2020-12-12 12:12:12` は絶対時刻として扱われ、変換は行われません。

#### TIMESTAMPTZ 型

`TIMESTAMPTZ` 型でも、データ取り込み時のタイムゾーン変換がサポートされています。入力時刻は一律に UTC（協定世界時）に変換され、出力時には現在のセッションのタイムゾーンが適用されます。

- **タイムゾーン情報があるデータ**: たとえば、`2020-12-12 12:12:12+08:00` の場合、Doris は指定されたタイムゾーン情報を使用して変換します。
- **タイムゾーン情報がないデータ**: たとえば、`2020-12-12 12:12:12` の場合、Doris は現在のセッションのタイムゾーン設定を使用して変換します。

現在のセッションの `time_zone` は、`TIMESTAMPTZ` 型の出力に影響します。たとえば、現在のセッションで `time_zone="+08:00"`、`TIMESTAMPTZ` の値が `2020-12-12 12:12:12+08:00` の場合、`time_zone` を変更すると出力値は次のように変わります。

```sql
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

### 夏時間

夏時間とは、名前付きタイムゾーンの実際のオフセットが、一定の期間内に変わることです。

たとえば、`America/Los_Angeles` タイムゾーンでは、毎年三月頃に夏時間が始まり、十一月頃に終わります。三月に夏時間が始まると、`America/Los_Angeles` の実際のオフセットは `-08:00` から `-07:00` に変わります。十一月に夏時間が終わると、`-07:00` から `-08:00` に戻ります。

夏時間を適用したくない場合は、`time_zone` を `-08:00` に設定し、`America/Los_Angeles` を使用しないでください。

## ベストプラクティス

### タイムゾーンに依存するデータの扱い

<!-- Knowledge type: Best practice -->
<!-- Applicable scenarios: Cross-time-zone data ingestion and queries -->

タイムゾーンに関する問題には、主に次の三つの要素が関係します。

1. **クラスターのタイムゾーン**: セッション変数 `time_zone`。
2. **取り込み時のタイムゾーン**: Stream Load、Broker Load などの取り込み方法で指定するヘッダー `timezone`。
3. **データのタイムゾーン**: データ中のタイムゾーン表記（たとえば、`+08:00` は `2023-12-12 08:00:00+08:00` に含まれるタイムゾーン表記です）。

Doris は現在、任意のタイムゾーンのデータを取り込めます。`DATETIME` や `TIMESTAMP_NS` などの時刻型は内部にタイムゾーン情報を持たず、取り込み後にタイムゾーンを変更しても保存済みのデータは変わりません。そのため、Doris に取り込む時刻データは次の二種類に分けられます。

1. **絶対時刻**

    絶対時刻とは、データを扱う場面がタイムゾーンに依存しないことを意味します。この種のデータを取り込むときは、タイムゾーンの接尾辞を付けないでください。データはそのまま保存されます。

2. **特定のタイムゾーンにおける時刻**

    特定のタイムゾーンにおける時刻とは、データを扱う場面がタイムゾーンに依存することを意味します。この種のデータを取り込むときは、具体的なタイムゾーンの接尾辞を付けてください。取り込み時に、データは Doris クラスターの `time_zone`、または Stream Load や Broker Load のヘッダー `timezone` で指定されたタイムゾーンに変換されます。

    取り込み後、この種のデータは取り込み時に指定したタイムゾーンでの絶対時刻として保存されます。データの意味を損なわないよう、以降の取り込みとクエリでは同じタイムゾーンを維持してください。

#### INSERT 文の例

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- The ingested data specifies the time zone as +02:00

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+

Doris > set time_zone = 'America/Los_Angeles';

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- If time_zone is changed, the time value does not change, and its meaning at query time becomes inconsistent.
+---------------------+
```

#### Stream Load の例

Stream Load や Broker Load などの取り込み方法では、ヘッダー `timezone` を指定してタイムゾーンを変換できます。例を示します。

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
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+
```

:::tip
- Stream Load や Broker Load などでは、ヘッダー `timezone` が Doris クラスターの `time_zone` より優先されるため、取り込み時には両者を一致させてください。
- Stream Load や Broker Load などでは、ヘッダー `timezone` は取り込み時の変換に使用する関数にも影響します。
- 取り込み時にヘッダー `timezone` を指定しない場合は、デフォルトで現在のクラスターのタイムゾーンが使用されます。
:::

#### ベストプラクティスのまとめ

:::info ベストプラクティス
1. 使用前にクラスターが表すタイムゾーンを確認して `time_zone` を設定し、その後は変更しないでください。
2. 取り込み時には、ヘッダー `timezone` をクラスターの `time_zone` と一致させてください。
3. 絶対時刻を取り込む場合は、タイムゾーンの接尾辞を付けないでください。タイムゾーンを持つ時刻を取り込む場合は、具体的なタイムゾーンの接尾辞を付けてください。取り込み後、データは Doris の `time_zone` のタイムゾーンに変換されます。
:::

### 夏時間に関する推奨事項

夏時間の開始時刻と終了時刻は、[現在のタイムゾーンデータの参照元](#time-zone-data-source)から取得されるため、対象地域でその年に公式に定められた時刻と必ずしも完全には一致しません。このデータは ICANN が管理しています。

夏時間の動作をその年の公式ルールに合わせるには、Doris が使用するデータソースを、ICANN が公開する最新のタイムゾーンデータに更新してください。ダウンロード方法は後述します。

## タイムゾーン情報の更新

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Time zone data synchronization / IANA tzdata update -->

現実のタイムゾーンや夏時間に関するデータは、さまざまな理由で随時変更されます。IANA はこれらの変更を定期的に記録し、対応するタイムゾーンファイルを更新しています。Doris のタイムゾーン情報を最新の IANA データと一致させるには、次のいずれかの方法を使用します。

### 方法 1: パッケージマネージャーで更新する

使用中の OS のパッケージマネージャーに応じて、対応するコマンドでタイムゾーンデータを直接更新します。

```shell
# yum
sudo yum update tzdata
# apt
sudo apt update tzdata
```

この方法で更新されるデータは、システムの `$TZDIR`（通常は `/usr/share/zoneinfo`）にあります。

### 方法 2: IANA タイムゾーンデータベースを直接取得する（推奨）

多くの Linux ディストリビューションでは、パッケージマネージャー経由の tzdata 更新が適時に同期されません。タイムゾーンデータの正確性が特に重要な場合は、IANA が定期的に公開するデータを直接取得してください。

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

その後、展開したフォルダー内の README に従って、必要な zoneinfo データを生成します。生成したデータを `$TZDIR` ディレクトリにコピーし、既存のファイルを上書きしてください。

:::caution 重要
BE マシンで上記の操作をすべて完了したら、変更を反映するために**該当する BE を再起動する必要があります**。
:::

## FAQ

### Q: `time_zone` を変更した後、既存データのクエリ結果が予期せず変わる場合は？

`DATETIME` や `TIMESTAMP_NS` などの型は内部にタイムゾーン情報を持たず、取り込み後にクラスターのタイムゾーンを変更しても保存済みの値は変わりません。使用前にクラスターのタイムゾーンを確認して `time_zone` を設定し、その後は変更しないでください。

### Q: Stream Load で取り込んだデータの時差が想定と異なる場合は？

ヘッダー `timezone` とクラスターの `time_zone` が一致していません。ヘッダー `timezone` をクラスターの `time_zone` と一致させてください。

### Q: `NOW()` が返す時刻がローカル時刻と一致しない場合は？

クラスターの `time_zone` がローカルタイムゾーンと一致していません。`SET global time_zone = 'Asia/Shanghai'` で調整してください。

### Q: 名前付きタイムゾーンの夏時間への切り替えが、その年のルールと一致しない場合は？

BE マシンの tzdata が古くなっています。パッケージマネージャーを使うか、IANA の tzdata を直接取得して更新し、その後 BE を再起動してください。

### Q: `America/Los_Angeles` を使用しているが、夏時間を適用したくない場合は？

名前付きタイムゾーンには夏時間のルールが含まれます。代わりに `-08:00` のような固定オフセット形式を使用してください。

## 関連資料

- タイムゾーン形式の一覧: [tz データベースのタイムゾーン一覧](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- IANA タイムゾーンデータベース: [IANA タイムゾーンデータベース](https://www.iana.org/time-zones)
- ICANN タイムゾーンデータベース: [tz-announce アーカイブ](https://mm.icann.org/pipermail/tz-announce/)
