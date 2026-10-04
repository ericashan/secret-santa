# Secret Santa website: setup guide

Your site: **https://ericashan.github.io/secret-santa/**

The website files and your Firebase settings are already in this repository. What's left happens in Firebase and GitHub settings, and works on a phone.

## 1. Firebase database
1. Go to https://console.firebase.google.com and open your **secret-santa** project.
2. **Build → Firestore Database → Create database.** Pick a location near you and choose **production mode**.

## 2. Security rules
These rules make sure only each group's organizer can draw names or change that group.
1. In your GitHub repository, open `firestore.rules` and copy everything.
2. In Firebase, open **Firestore Database → Rules**, replace everything with what you copied, and tap **Publish**.

You don't need to edit anything in the rules. Whenever this file changes, paste it again and publish.

## 3. Google sign-in (for organizers and optional syncing)
1. **Build → Authentication → Get started.**
2. **Sign-in method → Google**, switch it on, pick your email as the support email, **Save**.
3. **Settings → Authorized domains → Add domain**, enter `ericashan.github.io`.

## 4. Turn on the website
1. In this repository: **Settings → Pages**.
2. Source: **Deploy from a branch**, branch **main**, folder **/ (root)**, **Save**.
3. After a minute or two the site is live at the address above.

## Using it
- **Start a group:** open the homepage, tap **Start a group**, name it, and sign in with Google. You become that group's organizer.
- **Invite people:** on the organizer page, copy the invite link and send it out. People join with just their name. Parents add their kids from their own page.
- **Play in your own group:** open your invite link and join like everyone else.
- **My groups:** every group you join or organize appears on the homepage on that device. Sign in with Google there to see your groups on every device.
- **Draw:** when everyone's in, tap **Draw names and lock** on the organizer page. Only you can draw or start over.
- **Lost a link?** The organizer can copy anyone's personal link from the **People** list.

## What's protected
- Only a group's organizer can draw, start over, remove people, change details or delete that group.
- After the draw, nobody can join a group until its organizer starts over.
- Personal links can't be listed by anyone except that group's organizer.
- The organizer page never shows who has whom. An organizer could technically find matches in the Firebase console only if they own the Firebase project.

## Something not working?
- **"This website isn't approved for Google sign-in"**: redo step 3.3.
- **Can't create a group, join, or add a child**: paste the latest `firestore.rules` and **Publish** (step 2).
- **Page not found**: GitHub Pages isn't on yet, or needs another minute (step 4).
