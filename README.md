# Switch Sound Output

Windows のサウンド出力デバイスをワンクリックで切り替えられる、常時最前面のガジェットアプリ。  
Electron + Vite + Vue 3 製。透過・フレームレスウィンドウ（300×180px）で動作する。

## 動作環境

- Windows 10 / 11

## インストール

[Releases](../../releases) から最新の ZIP をダウンロードして任意のフォルダに展開し、`SwitchSoundOutput.exe` を実行する。

## 開発者向けセットアップ

```bash
npm install
```

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | Vite開発サーバー(port 5173) + Electron を同時起動 |
| `npm run build` | 型チェック + `dist/` へのビルド |
| `npm run electron` | Electron のみ起動（`dist/` が存在する前提） |

## 使い方

### 初回設定

1. アプリを起動する
2. デバイスが未設定の場合は自動的に設定画面が開く
3. **Device タブ** で「Earphone device」と「Speaker device」にそれぞれ対応するデバイスを選択する
4. **Save** を押して設定を保存する

設定済みの場合はメイン画面が直接表示される。設定を変更したいときはウィンドウにカーソルを合わせて右上の ⚙ をクリックする。

### デバイスの切り替え

- ウィンドウにカーソルを合わせると **Change** ボタンが表示される
- **Change** をクリックすると、EarphoneとSpeakerが交互に切り替わる

### レイアウト設定

設定画面の **Layout タブ** で、デバイスごとに Change ボタンの位置とUIの色をカスタマイズできる。

| 設定項目 | 説明 |
|---|---|
| UI Color | ボタンおよびウィンドウ枠の色 |
| Top / Left (px) | ボタンの表示位置（ウィンドウ左上基準） |

## カスタム画像

`custom/` ディレクトリ内の PNG ファイルを差し替えることで、背景画像を自由に変更できる。

| ファイル | 使用タイミング |
|---|---|
| `custom/earphone.png` | Earphone デバイスが選択中のとき |
| `custom/speaker.png` | Speaker デバイスが選択中のとき |

- サイズ：300×180px 推奨
  - サイズが異なる場合、自動的に300x180pxにフィッティングして表示される
- 画像の透過（アルファチャンネル）はそのまま反映される。背景を透過させたい場合は PNG の透過領域として画像側で設定する
- アニメーションさせたい場合は APNG 形式を使う（拡張子は `.png` のまま）

### デフォルト画像のクレジット

| ファイル | 撮影者 | 出典 |
|---|---|---|
| `earphone.png` | [Behnam Norouzi](https://unsplash.com/@behy_studio) | [Unsplash](https://unsplash.com/photos/j3b15qP-ckc) |
| `speaker.png` | [C D-X](https://unsplash.com/@cdx2) | [Unsplash](https://unsplash.com/photos/PDX_a_82obo) |

画像は [Unsplash ライセンス](https://unsplash.com/license) のもとで提供されている。

## アーキテクチャメモ

### Always-On-Top 戦略

他のアプリに最前面を奪われないよう 3 重対策が入っている（`electron/main.js` の `enforceAlwaysOnTop` 参照）：

1. `setAlwaysOnTop(true, "pop-up-menu")` で強いレベルを指定
2. `show` / `restore` / `focus` イベントで再適用
3. `always-on-top-changed` で `false` になったら即座に復元

### ホバー検出

透過ウィンドウは CSS の `:hover` が機能しないため、カーソル座標をポーリング（50ms間隔）して検出している。ホバー中のみ Change ボタンと設定アイコンを表示する。
