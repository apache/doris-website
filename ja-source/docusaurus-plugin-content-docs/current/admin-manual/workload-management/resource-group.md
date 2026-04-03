---
{
  "title": "リソースグループ",
  "language": "ja",
  "description": "Resource Groupは、コンピュート・ストレージ統合アーキテクチャの下で、異なるワークロード間の物理的分離を実現するメカニズムです。"
}
---
Resource Groupは、コンピュート・ストレージ統合アーキテクチャにおいて異なるワークロード間での物理的分離を実現するメカニズムです。その基本原理を以下の図で説明します：

![コンピュート・ストレージ統合アーキテクチャにおけるResource Group](/images/resource_group.png)

- tagを使用することで、BEは異なるグループに分割され、各グループはtagの名前で識別されます。例えば、上記の図では、host1、host2、host3はすべてgroup aに設定され、host4とhost5はgroup bに設定されています。

- テーブルの異なるレプリカは、異なるグループに配置されます。例えば、上記の図では、table1は3つのレプリカを持ち、すべてgroup aに配置されています。一方、table2は4つのレプリカを持ち、2つがgroup a、2つがgroup bに配置されています。

- クエリ実行時は、ユーザーに応じて異なるResource Groupが使用されます。例えば、オンラインユーザーはhost1、host2、host3上のデータにのみアクセスできるため、table1とtable2の両方にアクセスできます。しかし、オフラインユーザーはhost4とhost5にのみアクセスできるため、table2のデータにのみアクセスできます。table1はgroup b内に対応するレプリカを持たないため、アクセスするとエラーになります。

基本的に、Resource Groupはテーブルレプリカの配置戦略であるため、以下の利点と制限があります：

- 異なるResource Groupは異なるBEを使用するため、完全に分離されています。グループ内のBEが障害を起こしても、他のグループのクエリには影響しません。データロードは複数のレプリカが成功する必要があるため、残りのレプリカ数がクォーラムを満たさない場合、データロードは依然として失敗します。

- 各Resource Groupには、各テーブルの少なくとも1つのレプリカが必要です。例えば、5つのResource Groupを確立し、各グループがすべてのテーブルにアクセスする場合、各テーブルには5つのレプリカが必要となり、大幅なストレージコストが発生する可能性があります。

## 典型的なユースケース

- 読み書き分離：クラスタを2つのResource Groupに分割し、ETLジョブを実行するOffline Resource Groupと、オンラインクエリを処理するOnline Resource Groupを設けることができます。データは3つのレプリカで保存され、Online Resource Groupに2つのレプリカ、Offline Resource Groupに1つのレプリカを配置します。Online Resource Groupは主に高並行性、低レイテンシのオンラインデータサービスに使用され、大きなクエリやオフラインETL操作はOffline Resource Group内のノードを使用して実行できます。これにより、統一されたクラスタ内でオンラインとオフラインの両方のサービスを提供できます。

- 異なるビジネス間の分離：複数のビジネス間でデータが共有されない場合、各ビジネスにResource Groupを割り当てることで、それらの間の干渉を防ぐことができます。これにより、複数の物理クラスタを効果的に1つの大きなクラスタに統合して管理できます。

- 異なるユーザー間の分離：例えば、クラスタ内に3つのユーザーすべてで共有する必要があるビジネステーブルがあるが、それらの間のリソース競合を最小限に抑えたい場合、テーブルの3つのレプリカを作成し、3つの異なるResource Groupに保存して、各ユーザーを特定のResource Groupにバインドできます。

## Resource Groupの設定

### BEのtagの設定

現在のDorisクラスタにhost[1-6]という名前の6つのBEノードがあると仮定します。初期状態では、すべてのBEノードはデフォルトのリソースグループ（Default）に属しています。

以下のコマンドを使用して、これら6つのノードを3つのリソースグループ：group_a、group_b、group_cに分割できます。

   ```sql
   alter system modify backend "host1:9050" set ("tag.location" = "group_a");
   alter system modify backend "host2:9050" set ("tag.location" = "group_a");
   alter system modify backend "host3:9050" set ("tag.location" = "group_b");
   alter system modify backend "host4:9050" set ("tag.location" = "group_b");
   alter system modify backend "host5:9050" set ("tag.location" = "group_c");
   alter system modify backend "host6:9050" set ("tag.location" = "group_c");
   ```
ここでは、host[1-2]でResource Group group_a、host[3-4]でResource Group group_b、host[5-6]でResource Group group_cを構成します。

   > 注意: BEは1つのResource Groupにのみ属することができます。


### Resource Groupによるデータの再配布

リソースグループを分割した後、異なるリソースグループ間でユーザーデータの異なるレプリカを配布できます。UserTableという名前のユーザーテーブルがあり、3つのリソースグループそれぞれに1つのレプリカを保存したいと仮定します。これは以下のテーブル作成文で実現できます：

   ```sql
   create table UserTable
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
       "replication_allocation"="tag.location.group_a:1, tag.location.group_b:1, tag.location.group_c:1"
   )
   ```
このようにして、UserTable のデータは3つのレプリカに保存され、それぞれが group_a、group_b、group_c のリソースグループ内のノードに配置されます。

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
データベースに非常に多くのテーブルが含まれている場合、各テーブルの分散戦略を変更するのは煩雑になる可能性があります。そのため、Dorisはデータベースレベルで統一されたデータ分散戦略の設定もサポートしていますが、個々のテーブルの設定はデータベースレベルの設定よりも高い優先度を持ちます。例えば、4つのテーブルを持つデータベースdb1を考えてみましょう：table1にはgroup_a:1,group_b:2のレプリカ分散戦略が必要で、table2、table3、table4にはgroup_c:1,group_b:2の戦略が必要です。

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
table2、table3、table4については、作成文でreplication_allocationを指定する必要がありません。これらのテーブルはデータベースレベルのデフォルト戦略を継承するためです。

   :::caution
   データベースレベルでレプリカ分散戦略を変更しても、既存のテーブルには影響しません。
   :::


## ユーザーのResource Group設定

以下の文を使用して、ユーザーの特定のリソースグループへのアクセスを制限できます。例えば、user1はgroup_aリソースグループ内のノードのみを使用でき、user2はgroup_bのみを使用でき、user3は3つすべてのリソースグループを使用できます：

   ```sql
   set property for 'user1' 'resource_tags.location' = 'group_a';
   set property for 'user2' 'resource_tags.location' = 'group_b';
   set property for 'user3' 'resource_tags.location' = 'group_a, group_b, group_c';
   ```
設定後、user1がUserTableをクエリすると、group_aリソースグループ内のノードのデータレプリカにのみアクセスし、このグループのコンピューティングリソースを使用します。User3のクエリは、任意のリソースグループからレプリカとコンピューティングリソースを使用できます。

   > 注意: デフォルトでは、ユーザーのresource_tags.locationプロパティは空です。バージョン2.0.2以前では、ユーザーはタグによる制限を受けず、任意のリソースグループを使用できます。バージョン2.0.3以降では、一般ユーザーはデフォルトでデフォルトリソースグループのみを使用できます。RootおよびAdminユーザーは任意のリソースグループを使用できます。

   :::caution 注意:
    resource_tags.locationプロパティを変更した後、変更を有効にするためにユーザーは接続を再確立する必要があります。
   :::

   

## データロードジョブのリソースグループ割り当て

データロードジョブ（insert、broker load、routine load、stream loadなどを含む）のリソース使用量は2つの部分に分けることができます：

- コンピューティング部分：データソースの読み取り、データ変換、配信を担当します。

- 書き込み部分：データエンコード、圧縮、ディスクへの書き込みを担当します。

書き込みリソースはデータレプリカが配置されているノード上にある必要があり、コンピューティングリソースは任意のノードから割り当てることができるため、Resource Groupsはデータロードシナリオにおいてコンピューティング部分で使用されるリソースのみを制限できます。
