---
{
  "title": "ワークロードグループ バインド Computeグループ",
  "language": "ja",
  "description": "DorisはCompute Group機能を通じて、クラスター内のBE（Backend）リソースの論理的な分割をサポートします。"
}
---
## 背景
Dorisは、Compute Group機能を通じて、クラスタ内のBE（Backend）リソースの論理的分割をサポートし、独立したサブクラスタユニットを形成して、異なるビジネス当事者に対する計算およびストレージリソースの物理的隔離を実現します。ビジネス当事者間の負荷特性には大きな違いがあるため、Workload Groupsに対する設定要件はしばしば明確な区別を示します。

初期バージョンでは、ユーザが設定したWorkload GroupsはすべてのCompute Groupsにわたってグローバルに有効になり、異なるビジネス当事者が同じWorkload Group設定セットを共有することを強いられていました。例えば、ビジネスAの高並行クエリとビジネスBの大規模データ分析では完全に異なるリソースクォータが必要になる可能性がありますが、旧アーキテクチャはそのような差別化されたニーズを満たすことができず、リソース管理の柔軟性を制限していました。

これを解決するため、最新バージョンでは、Workload GroupsをCompute Groupsにバインドするメカニズムが導入され、各Compute Groupが独立したWorkload Groupsで設定できるようになりました。

## Compute Group の紹介
Compute Groupは、当初ストレージ計算分離アーキテクチャの下でのコア概念として機能し、単一クラスタ内での独立サブクラスタの論理的分割を実現するように設計されています。ストレージ計算統合アーキテクチャでは、同等の機能を持つ概念はResource Groupと呼ばれます。どちらもクラスタリソースの隔離とグループ化された管理を実現できます。

Dorisの計算リソース管理システムについて議論する際、Compute GroupとResource Groupは論理的に同等の概念として見なすことができ、この理解により理解コストが大幅に削減されます。ただし、特定のインターフェース呼び出しレベルでは、両方とも元の独立した呼び出し仕様と使用ロジックを変更せずに維持しています。

したがって、この記事で述べられているWorkload GroupsをCompute Groupsにバインドする概念と使用方法は、ストレージ計算統合アーキテクチャとストレージ計算分離アーキテクチャの両方に適用されます。

## 原理の紹介
クラスタに、Compute Group AとCompute Group Bと名付けられた2つのCompute Groupがあり、それぞれビジネス当事者Aとビジネス当事者Bにサービスを提供し、2つのビジネスシステムは完全に独立して動作していると仮定します。

同時に、クラスタには2つのWorkload Groupsが設定されています：ビジネスAによって作成されたgroup_aとビジネスBによって作成されたgroup_bです。2つのグループのリソース設定クォータの合計は、クラスタの総リソースの100%を正確に満たします。

### 以前のバージョンでのWorkload Groupの設計
以前のバージョンでは、group_1とgroup_2は、異なるBEがすでにCompute Groupsに従ってグループ化されていたとしても、すべてのBEノードで有効になっていました。
以前の設計では、ビジネスAがgroup_aを作成すると、すべてのWorkload Groupsの累積リソース値がすでに100%に達していたため、新しいWorkload Groupsを作成することはできませんでした。さらに、group_bはビジネスBによって作成され、ビジネスAとビジネスBは完全に独立したビジネス当事者であるため、ビジネスAはgroup_bにアクセスすることも変更することもできませんでした。
権限ポリシーが両当事者にWorkload Groupsへのアクセスを許可したとしても、ビジネスロジックの完全な独立性により、リソース設定要件に大きな違いがある可能性があります（例：ビジネスAの高並行クエリとビジネスBのバッチコンピューティングで異なるリソース配分が必要）。これにより、旧アーキテクチャでは差別化された管理のニーズを満たすことが困難でした。

![wg_bind_cg](/images/wg_bind_cg1.png)

### 現在の設計
現在のバージョンでは、Workload GroupはCompute Groupへのバインドをサポートしており、これは異なるCompute Groupsが異なるWorkload Group設定を持てることを意味します。以下の図に示すように：

![wg_bind_cg](/images/wg_bind_cg2.png)

## 使用方法

:::tip
DorisはデフォルトのCompute Groupメカニズムを提供しています：指定された割り当てなしに新しいBEノードが追加される場合、自動的にデフォルトのCompute Groupに配置されます。具体的には、計算ストレージ分離アーキテクチャでは、デフォルトのCompute Groupはdefault_compute_groupと名付けられ、一方、統合計算ストレージアーキテクチャでは、defaultと名付けられます。
:::

1. group_aという名前のWorkload Groupを作成し、compute_group_aという名前のCompute Groupにバインドします。

```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```
2. 作成時にCompute Groupが指定されていない場合、Workload GroupはデフォルトのCompute Groupにバインドされます。

```
create workload group group_a properties('cpu_share'='1024')
```
3. compute_group_a から group_a という名前の Workload Group を削除します。

```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```
4. Workload Groupを削除する際にCompute Groupが指定されていない場合、システムはdefaultという名前のCompute GroupからWorkload Groupを削除しようとします。

```
create workload group group_a properties('cpu_share'='1024')
```
5. 同様に、Workload Groupを変更する際は、ALTER文でCompute Groupを指定する必要があります。Compute Groupが指定されていない場合、システムはデフォルトのCompute Group下のWorkload Groupを変更しようとします。ALTER文はWorkload Groupのプロパティのみを変更し、Compute Groupとのバインディング関係は変更できないことに注意してください。

```
alter workload group group_a for compute_group_a properties('cpu_share'='2048')
```
## 注意
1. Workload GroupとCompute Group間のバインド関係の変更は現在サポートされていません。Workload Groupは作成時に固定のCompute Groupに属し、Compute Group間での移動はできません。
2. Dorisを古いバージョンから新しいバージョンにアップグレードする際、システムは古いWorkload Groupに基づいて各Compute Groupに対して同一名（ただし異なるID）の新しいWorkload Groupを自動的に作成します。例えば、古いバージョンのクラスターに2つのCompute Groupがあり、group_aという名前のWorkload Groupが存在する場合、アップグレード後、Dorisはこれら2つのCompute Groupのそれぞれに新しいgroup_a Workload Groupを作成します。これらの新しいWorkload Groupは元のgroup_aとは異なるIDを持ち、どのCompute Groupにも関連付けられていなかった元のgroup_aはシステムによって自動的に削除されます。
3. Workload Groupの認証管理は変更されません。Workload Groupの認証は引き続きその名前との関連付けによって実現されます。
4. Dorisには、normalという名前のデフォルトのWorkload Groupがあります。新しいCompute Groupが作成されるたびに、Dorisはそれに対してnormalのWorkload Groupを自動的に生成します。逆に、Compute Groupが削除されると、対応するnormalのWorkload Groupも自動的に削除されます。これは、normalのWorkload Groupのライフサイクル管理がDorisによって完全に自動化されており、手動での介入が不要であることを意味します。
