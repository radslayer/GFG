# GFG Cookbook

Internal recipe management site for Gourmet for Good.

## What's included

| File | Purpose |
|---|---|
| `index.html` | The complete web app (single file, no build step) |
| `gfg_recipes.json` | All 669 recipes exported from MasterCook + Cook'n |
| `import-recipes.js` | One-time script to load recipes into Firestore |
| `firestore.rules` | Security rules (only signed-in users can read/write) |

---

## First-time setup

### 1. Firebase project

You already have the project at `gfg-recipes` on Firebase Console.

**Enable these services:**
- **Authentication** → Sign-in method → Email/Password → Enable
- **Firestore Database** → Create database → Start in production mode → pick a region (us-central is fine)

**Create your team's user accounts:**  
Authentication → Users → Add user → enter email + password for each team member.

---

### 2. Get your Firebase web config

Firebase Console → Project Settings (gear icon) → Your Apps → click **</>** to add a web app if you haven't → copy the config object that looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "gfg-recipes.firebaseapp.com",
  projectId: "gfg-recipes",
  storageBucket: "gfg-recipes.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...:web:abc..."
};
```

Open `index.html` and paste those values into the `firebaseConfig` block near the bottom (search for `REPLACE_WITH_YOUR_API_KEY`).

---

### 3. Import the recipes into Firestore

This is a one-time step.

```bash
# In this folder:
npm install firebase-admin

# Download your service account key:
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# Save it as serviceAccountKey.json in this folder (do NOT commit this file to git)

node import-recipes.js
```

This will load all 669 recipes. Takes about 30–60 seconds.

---

### 4. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use gfg-recipes
firebase deploy --only firestore:rules
```

---

### 5. Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `gfg-cookbook`)
2. Push all files **except** `serviceAccountKey.json`
3. GitHub repo → Settings → Pages → Source: Deploy from branch → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/gfg-cookbook/`

---

## Using the app

| Action | How |
|---|---|
| **Browse** | Click a category in the left sidebar |
| **Search** | Type in the search box — searches name, ingredients, and directions |
| **View recipe** | Click any card |
| **Print** | Open a recipe → 🖨 Print button (formats cleanly for 8.5×11, put in sheet protector) |
| **Edit** | Open a recipe → ✏ Edit |
| **Add new** | "+ New Recipe" button in the top bar |
| **Delete** | Open a recipe → Delete |

## Notes on the data

- **504 recipes** have full ingredients + directions (from MasterCook 2021 export)
- **165 recipes** have directions only — these were added to Cook'n after the MasterCook export, so ingredient lists were lost. Cards marked **⚠ Needs ingredients** — edit them to fill in the ingredients.
- Categories can be cleaned up by editing individual recipes and reassigning the category.

## .gitignore

Add this to your repo's `.gitignore`:

```
serviceAccountKey.json
node_modules/
```
