# Secret Santa website: setup guide

This takes about 20–30 minutes. A computer is much easier than a phone for these steps.
Everything here is free and needs no credit card.

**What you'll end up with**
- A group page at `https://YOUR-GITHUB-NAME.github.io/secret-santa/` that family open without an account.
- An organizer page at `.../secret-santa/organizer.html` that only your Google account can use.

**Files in this folder**
- `index.html` – the group page (join, wishlist, your match)
- `organizer.html` – your page (details, people, draw and lock)
- `style.css` – the look
- `firebase-config.js` – where your Firebase settings go
- `firestore.rules` – the security rules (you paste these into Firebase; don't upload this one)

---

## Part 1: Firebase (the database)

**Step 1. Create a project**
1. Go to https://console.firebase.google.com and sign in with your Gmail.
2. Click **Create a project** (or **Add project**). Name it `secret-santa`.
3. Turn off Google Analytics when asked. Click **Create project**.

**Step 2. Turn on the database**
1. In the left menu, open **Build → Firestore Database**.
2. Click **Create database**.
3. Pick a location near you (for example `nam5 (United States)`), then choose **Start in production mode**. Click **Create**.

**Step 3. Add the security rules**
These rules are what stop anyone except you from drawing or changing matches.
1. In Firestore, open the **Rules** tab.
2. Delete everything there and paste in the whole contents of `firestore.rules`.
3. Find `YOUR_GMAIL_ADDRESS@gmail.com` and replace it with your own Gmail address.
4. Click **Publish**.

**Step 4. Get your web settings**
1. Click the gear icon next to **Project Overview** → **Project settings**.
2. Under **Your apps**, click the **`</>`** (Web) icon.
3. Name it `secret-santa`. Leave "Firebase Hosting" unchecked. Click **Register app**.
4. You'll see a block of code with `const firebaseConfig = { ... }`. Keep this tab open. You'll copy those values in Part 2.

**Step 5. Turn on Google sign-in (for you only)**
1. In the left menu, open **Build → Authentication** → **Get started**.
2. Under **Sign-in method**, click **Google**, switch it on, choose your email as the support email, and click **Save**.

## Part 2: GitHub (the website)

**Step 6. Create the repository**
1. Go to https://github.com and sign up (or sign in). Note your username.
2. Click **+** (top right) → **New repository**.
3. Name it `secret-santa`, set it to **Public**, and click **Create repository**.
4. Click **uploading an existing file**. Drag in `index.html`, `organizer.html`, `style.css` and `firebase-config.js`. Click **Commit changes**.

**Step 7. Add your Firebase settings**
1. In your repository, click `firebase-config.js`, then the pencil icon to edit.
2. Replace each `PASTE_...` value with the matching value from Step 4 (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Keep the quote marks.
3. Click **Commit changes**.

**Step 8. Turn on the website**
1. In your repository, open **Settings → Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Click **Save**.
3. Wait 1–2 minutes and refresh. GitHub shows your site address: `https://YOUR-GITHUB-NAME.github.io/secret-santa/`.

**Step 9. Allow sign-in from your website**
1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain**.
2. Enter `YOUR-GITHUB-NAME.github.io` (no `https://`, no `/secret-santa`). Click **Add**.

## Part 3: Run your Secret Santa

1. Open `https://YOUR-GITHUB-NAME.github.io/secret-santa/organizer.html` and sign in with Google.
2. Fill in the group name, spending limit and exchange date.
3. Copy the invite link and send it to everyone. If you're playing, open it yourself and join too.
4. Each person joins with their name, writes a wishlist, and gets a personal link to come back with. If someone loses theirs, copy it from the **People** list on your organizer page.
5. Add any "shouldn't draw" rules, then tap **Draw names and lock**.
6. Everyone opens their personal link to see who they're buying for, along with that person's wishlist.

**What's protected**
- Only your Google account can draw, start over, remove people or change the group details. The database itself refuses anyone else, even if they tinker with the page.
- After the draw, nobody can join until you start over.
- Nobody can see a list of other people's personal links except you.
- Your organizer page never shows who has whom. Because you own the database, you could dig matches out of the Firebase console if you went looking, so just don't open the `matches` collection there.

**Next year:** open the organizer page, tap **Start over**, remove anyone who isn't playing, and draw again.

**Something not working?**
- "This page isn't set up yet": `firebase-config.js` still has `PASTE_` values (Step 7).
- "This website isn't approved for sign-in": redo Step 9.
- "isn't the organizer": the email in your rules (Step 3) doesn't match the Google account you signed in with.
- People can't join: make sure you clicked **Publish** in Step 3.
