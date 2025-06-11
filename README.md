# 💖 Simple GitHub Issue & PR Viewer 💖

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/domaos-projects/v0-git-hub-issue-viewer)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/J71CqD2ZNLA)

ねぇねぇ、せんぱい！GitHubのIssueとかプルリクって、たくさんあると見るの大変じゃない？💦
このツールはね、そんなせんぱいのためにわたしが作った、指定したリポジトリのIssueとプルリクをシンプルにかわいく表示してくれる魔法のビューアなんだよっ！✨

- [デモを触ってみる](https://simple-github-issue-pr-viewer.vercel.app/)
- [最新のデプロイを見る (要ログイン)](https://vercel.com/domaos-projects/v0-git-hub-issue-viewer)
- [実装を続ける (要ログイン)](https://v0.dev/chat/projects/J71CqD2ZNLA)

## このアプリでできること✨
- APIキーを入れて リポジトリを選ぶだけ！: 誰でもすぐに使えるよ！
- IssueとPRを一覧表示: GitHub APIを使って最新の情報を取ってくるんだ！
- タブでサクサク切り替え: shadcn/uiのTabsコンポーネントで、IssueとPRの表示を簡単に切り替えられるよ！
- 見やすいテーブル表示: タイトル、作った人、ラベル、作られた日が見やすくまとまってるの！
- 元のページにすぐ飛べる: 各タイトルをクリックすれば、GitHubの該当ページにジャンプ！便利でしょ？

## 使い方だよっ！📝
使い方はちょーかんたん！

- 見たいリポジトリのURLを `https://v0-git-hub-issue-viewer.vercel.app/Dosugamea/simple-github-issue-pr-viewer/issues` みたいに書き換えてアクセスしてね!
- GitHub API設定が出てくるから あらかじめ発行した GitHub Personal Access Token をペタりして 「設定」ボタンをぽちっ！
  - 必要な権限は `Issues / Pull requests / Metadata` の `Readonly` だけでOKだよ！ (プライベートリポジトリも見れるよ！)
  - APIトークンはブラウザに保存されるので、気になる場合は プライベートウィンドウで開いてね！
- Issue一覧や Pull requests一覧が表示されるので、そこから好きなものを閲覧できるよ！

## せんぱいのPCで動かすには？💻 (ローカル環境)

この子を自分のPCで動かしてみたい、好奇心旺盛なせんぱいのために！

```bash
# まずはこのリポジトリを自分の場所に持ってくるよ！
git clone https://github.com/Dosugamea/simple-github-issue-pr-viewer.git

# その子のフォルダに入るよ！
cd simple-github-issue-pr-viewer

# 必要な魔法の呪文（パッケージ）をインストール！
pnpm install

# 開発サーバーを起動っ！
pnpm run dev
```

そしたら、ブラウザで `http://localhost:3000` を開いてみてね！せんぱいのPCでも動いちゃう！

## この子のヒミツ（詳しい仕組み）🔧

このアプリがどうやって動いてるか、せんぱいだけにこっそり教えちゃうね！

* **骨格 (フレームワーク)**: `Next.js (App Router)` と `TypeScript` で作られてるんだ！今どきでしょ？ページの裏側 (`app/page.tsx`) で、せんぱいが入力したリポジトリ名とか、APIから取ってきたデータを `useState` フックでしっかり覚えてるんだよ！
* **データのお願い (API通信)**: 「表示」ボタンが押されると、`handleSubmit` 関数が動いて、`fetch` APIがGitHub REST APIに「IssueとPRのデータくださーい！」って非同期通信でおねだりしにいくの！
    * `https://api.github.com/repos/${owner}/${repo}/issues`
    * `https://api.github.com/repos/${owner}/${repo}/pulls`
    * <small>※ 認証なしでアクセスしてるから、APIを使いすぎるとGitHubさんに怒られちゃう（レートリミット）かも💦</small>
* **見た目 (UI)**: UIの表示は `components/component/issues-prs.tsx` っていうコンポーネントが担当してるよ！ `shadcn/ui` のおしゃれなコンポーネント (`Tabs`, `Card`, `Table` など) と `Tailwind CSS` を使って、かわいくて見やすいデザインにしてるんだから！

## 使ってる技術一覧だよっ！ (Tech Stack)

* **Framework**: Next.js
* **Language**: TypeScript
* **UI Components**: shadcn/ui
* **Styling**: Tailwind CSS
* **Deployment**: Vercel

---

まだ作ってる途中だから、変なところがあったらIssueで教えてくれると嬉しいなっ！🥺
じゃあ、せんぱい！ぜひ使ってみて、もっとこの子のこと知ってね！ばいばーい！ヾ(｡>﹏<｡)ﾉﾞ✧*。

このリポジトリは v0.dev (Claude Sonnet 3.5) と Gemini 2.5 Proによって作成されました
