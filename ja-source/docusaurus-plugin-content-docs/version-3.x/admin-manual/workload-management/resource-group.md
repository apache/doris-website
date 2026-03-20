---
{
  "title": "リソースグループ",
  "language": "ja",
  "description": "Resource Groupは、コンピュート・ストレージ統合アーキテクチャの下で、異なるワークロード間の物理的分離を実現するメカニズムです。"
}
---
Resource Groupは、計算・ストレージ統合アーキテクチャにおいて、異なるワークロード間の物理的分離を実現するメカニズムです。その基本原理は以下の図で説明されています：

![Resource Group](/images/resource_group.png)

- タグを使用することで、BEは異なるグループに分割され、各グループはタグの名前によって識別されます。例えば、上図では、host1、host2、host3はすべてgroup aに設定され、host4とhost5はgroup bに設定されています。

- テーブルの異なるレプリカは異なるグループに配置されます。例えば、上図では、table1は3つのレプリカを持ち、すべてがgroup aに配置されており、table2は4つのレプリカを持ち、group aに2つ、group bに2つ配置されています。

- クエリ実行時は、ユーザーに基づいて異なるResource Groupが使用されます。例えば、オンラインユーザーはhost1、host2、host3上のデータのみにアクセスできるため、table1とtable2の両方にアクセスできます。しかし、オフラインユーザーはhost4とhost5のみにアクセスできるため、table2のデータのみにアクセスできます。table1はgroup bに対応するレプリカを持たないため、アクセスするとエラーが発生します。

本質的に、Resource Groupはテーブルレプリカの配置戦略であるため、以下の利点と制限があります：

- 異なるResource Groupは異なるBEを使用するため、互いに完全に分離されています。グループ内のBEが故障しても、他のグループのクエリには影響しません。データロードには複数のレプリカの成功が必要であるため、残りのレプリカ数がquorumを満たさない場合、データロードは失敗します。

- 各Resource Groupは、各テーブルの少なくとも1つのレプリカを持つ必要があります。例えば、5つのResource Groupを確立し、各グループがすべてのテーブルにアクセスする可能性がある場合、各テーブルには5つのレプリカが必要となり、これは大幅なストレージコストの増加を招く可能性があります。

## 典型的な使用例

- 読み書き分離：クラスタを2つのResource Groupに分割し、ETLジョブを実行するOffline Resource Groupと、オンラインクエリを処理するOnline Resource Groupを作成できます。データは3つのレプリカで保存され、Online Resource Groupに2つのレプリカ、Offline Resource Groupに1つのレプリカを配置します。Online Resource Groupは主に高並行性、低レイテンシのオンラインデータサービスに使用され、大規模なクエリやオフラインETL操作はOffline Resource Groupのノードを使用して実行できます。これにより、統一されたクラスタ内でオンラインサービスとオフラインサービスの両方を提供できます。

- 異なるビジネス間の分離：複数のビジネス間でデータが共有されない場合、各ビジネスにResource Groupを割り当てることで、それらの間の干渉を防ぐことができます。これにより、複数の物理クラスタを効果的に1つの大きなクラスタに統合して管理できます。

- 異なるユーザー間の分離：例えば、クラスタ内に3人のユーザーすべてで共有する必要があるビジネステーブルがあるが、彼らの間のリソース競合を最小限に抑えたい場合、テーブルの3つのレプリカを作成し、3つの異なるResource Groupに保存し、各ユーザーを特定のResource Groupにバインドできます。

## Resource Groupの設定

### BEにタグを設定する

現在のDorisクラスタにhost[1-6]という名前の6つのBEノードがあると仮定します。最初は、すべてのBEノードはデフォルトのリソースグループ（Default）に属しています。

以下のコマンドを使用して、これら6つのノードを3つのリソースグループ（group_a、group_b、group_c）に分割できます。

   ```sql
   alter system modify backend "host1:9050" set ("tag.location" = "group_a");
   alter system modify backend "host2:9050" set ("tag.location" = "group_a");
   alter system modify backend "host3:9050" set ("tag.location" = "group_b");
   alter system modify backend "host4:9050" set ("tag.location" = "group_b");
   alter system modify backend "host5:9050" set ("tag.location" = "group_c");
   alter system modify backend "host6:9050" set ("tag.location" = "group_c");
   ```
ここでは、host[1-2]でResource Group group_a、host[3-4]でResource Group group_b、host[5-6]でResource Group group_cを構成します。

   > 注意：BEは1つのResource Groupにのみ所属できます。


### Resource Groupによるデータの再配分

resource groupを分割した後、異なるresource group間でユーザーデータの異なるreplicaを配分できます。UserTableという名前のユーザーテーブルがあり、3つのresource groupのそれぞれに1つずつreplicaを格納したいと仮定します。これは以下のテーブル作成文で実現できます：

   ```sql
   create table UserTable
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
       "replication_allocation"="tag.location.group_a:1, tag.location.group_b:1, tag.location.group_c:1"
   )
   ```
このようにして、UserTableのデータは3つのレプリカに保存され、それぞれがリソースグループgroup_a、group_b、group_c内のノードに配置されます。

以下の図は、現在のノードの分割とデータ分散を示しています：

   ```text
    ┌────────────────────────────────────────────────────┐
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host1            │  │ host2            │ │
    │         │  ┌─────────────┐ │  │                  │ │
    │ group_a │  │   replica1  │ │  │                  │ │
    │         │  └─────────────┘ │  │                  │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    ├────────────────────────────────────────────────────┤
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host3            │  │ host4            │ │
    │         │                  │  │  ┌─────────────┐ │ │
    │ group_b │                  │  │  │   replica2  │ │ │
    │         │                  │  │  └─────────────┘ │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    ├────────────────────────────────────────────────────┤
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host5            │  │ host6            │ │
    │         │                  │  │  ┌─────────────┐ │ │
    │ group_c │                  │  │  │   replica3  │ │ │
    │         │                  │  │  └─────────────┘ │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    └────────────────────────────────────────────────────┘
   ```
データベースに非常に多数のテーブルが含まれる場合、各テーブルの分散戦略を変更することは煩雑になる可能性があります。そのため、Dorisではデータベースレベルで統一されたデータ分散戦略の設定もサポートしていますが、個々のテーブルの設定はデータベースレベルの設定よりも高い優先度を持ちます。例えば、4つのテーブルを持つデータベースdb1を考えてみましょう：table1にはgroup_a:1,group_b:2のレプリカ分散戦略が必要で、table2、table3、table4にはgroup_c:1,group_b:2の戦略が必要です。

    デフォルトの分散戦略でdb1を作成するには、以下のステートメントを使用できます：

   ```sql
   CREATE DATABASE db1 PROPERTIES (
   "replication_allocation" = "tag.location.group_c:1, tag.location.group_b:2"
   )
   ```
特定の分散戦略でtable1を作成する：

   ```sql
   CREATE TABLE table1
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
   "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
   )
   ```
table2、table3、table4については、作成文でreplication_allocationを指定する必要はありません。これらのテーブルはデータベースレベルのデフォルト戦略を継承するためです。

   :::caution
   データベースレベルでレプリカ配布戦略を変更しても、既存のテーブルには影響しません。
   :::


## ユーザーに対するリソースグループの設定

以下の文を使用して、ユーザーの特定のリソースグループへのアクセスを制限できます。例えば、user1はgroup_aリソースグループ内のノードのみを使用でき、user2はgroup_bのみを使用でき、user3は3つすべてのリソースグループを使用できます：

   ```sql
   set property for 'user1' 'resource_tags.location' = 'group_a';
   set property for 'user2' 'resource_tags.location' = 'group_b';
   set property for 'user3' 'resource_tags.location' = 'group_a, group_b, group_c';
   ```
設定後、user1がUserTableをクエリすると、group_aリソースグループ内のノードのデータレプリカのみにアクセスし、このグループのコンピューティングリソースを使用します。User3のクエリは任意のリソースグループのレプリカとコンピューティングリソースを使用できます。

   > 注意: デフォルトでは、ユーザーのresource_tags.locationプロパティは空です。バージョン2.0.2より前では、ユーザーはタグによる制限を受けず、任意のリソースグループを使用できます。バージョン2.0.3以降では、一般ユーザーはデフォルトで既定のリソースグループのみを使用できます。Rootユーザーとadminユーザーは任意のリソースグループを使用できます。

   :::caution 注意:
    resource_tags.locationプロパティを変更した後、変更を有効にするためにユーザーは接続を再確立する必要があります。
   :::

   

## データロードジョブのリソースグループ割り当て

データロードジョブ（insert、broker load、routine load、stream loadなどを含む）のリソース使用量は2つの部分に分けることができます：

- コンピューティング部分：データソースの読み取り、データ変換、および配信を担当します。

- 書き込み部分：データのエンコード、圧縮、およびディスクへの書き込みを担当します。

書き込みリソースはデータレプリカが配置されているノード上に存在する必要があり、コンピューティングリソースは任意のノードから割り当てることができるため、Resource Groupsはデータロードシナリオにおいてコンピューティング部分で使用されるリソースのみを制限できます。
