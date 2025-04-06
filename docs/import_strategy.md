# **Automated Markdown Import Strategy for TTRPG Wiki**

## **1. Context**

We are developing a TTRPG wiki that syncs markdown notes from an **Obsidian-managed repository** into a **Next.js web application** deployed on **Vercel**. The markdown files are structured into a SQL database using **Prisma**, allowing efficient querying and rendering.

Currently, database hydration is manual, requiring us to run a Prisma script locally. We aim to automate this process while ensuring **efficiency, minimal resource usage, and no data loss.**

### **Repositories**

- **Markdown Repository** (MD Repo) → Stores Obsidian markdown files.
- **Application Repository** (App Repo) → Contains:
  - Next.js frontend
  - Prisma schema & scripts
  - API routes for database import
  - Git-based diff processing scripts

## **2. Chosen Solutions**

To optimize the import process, we defined a strategy that ensures **minimal database writes** by processing only modified files. Our chosen approach includes:

- **Git-based diff strategy** to detect file modifications.
- **Two execution contexts:**
  - **DEV Context** → Manually run diff-based imports from a local repo.
  - **PROD Context** → Automatically trigger imports when markdown changes are merged into `main`.
- **A hybrid import approach:**
  - First-time execution imports everything.
  - Subsequent runs only process modified files.
- **API-based automation** → Exposing REST endpoints to handle import requests.
- **Webhook integration** → Enabling automatic imports on production via GitHub Actions.
- **Prisma migration automation** → Ensuring database schema updates are applied correctly in both environments.

## **3. Summary of Our Approach**

| Context  | Old Commit Selection                                          | Action                                                           |
| -------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| **DEV**  | Last stored commit in `.last_commit` (fallback: first commit) | Manually execute script to process diff-based updates.           |
| **PROD** | Last imported commit stored in DB (fallback: `main~1`)        | Webhook triggers diff-based import. First run imports all notes. |

## **4. Implementation Process**

### **1️⃣ Exposing API Routes**

We added API routes to handle imports:

- `POST /import-all` → Parses and inserts **all** markdown files into the database.
- `POST /import-diff` → Processes only **modified** files from a Git diff.
- `POST /update-schema` → Applies Prisma migrations in production.

### **2️⃣ Implementing the Git Diff Script**

We created a script that:

1. Reads the **previous commit** (from a file in DEV, from DB in PROD).
2. Compares it with the latest commit.
3. Extracts **added, modified, and deleted files**.
4. Sends this information to the API.
5. Updates the stored commit reference.

### **3️⃣ Database Tracking for Imports**

We store **last imported commit hashes** in a table.

When a webhook is triggered, we:

1. Query the latest commit from `import_log`.
2. If it **exists**, use it for the diff.
3. If not, **run full import** (`POST /import-all`).
4. Store the new commit after import completion.

### **4️⃣ Webhook Integration for PROD**

We configure a GitHub Action or webhook to call our API upon a merge into `main`. The action performs:

1. **Schema validation & migration** (`POST /update-schema`)
2. **Database diff import** (`POST /import-diff`)
3. **Logging & monitoring** to ensure smooth execution

### **5️⃣ Prisma Migration Handling**

To ensure schema updates are correctly applied:

1. **In DEV** → Manually run `prisma migrate dev` and verify.
2. **In PROD** → The GitHub Action triggers `prisma migrate deploy` before importing markdown.

## **5. Potential Issues & Improvements**

### **🚨 Potential Issues**

- **Large diffs** → If too many files change at once, API performance might degrade.
- **Webhook failures** → If the webhook fails, we need a retry mechanism.
- **File deletions** → We must ensure deleted files are correctly removed from the DB.
- **Schema drift** → Changes in Prisma schema must be synchronized between DEV and PROD.

### **🚀 Future Improvements**

- **Batch Processing** → Process diffs in smaller chunks to reduce load.
- **Versioning System** → Store file versions to allow rollbacks.
- **Dockerization** → Support multiple vault deployments.
- **Monitoring & Alerts** → Add logging and notifications for failures.
- **CI/CD Enhancements** → Improve GitHub Actions for better automation.

## **6. Conclusion**

This solution efficiently integrates markdown updates into a database-driven wiki, minimizing unnecessary writes while ensuring data accuracy. The hybrid import system (full import for first runs, diff-based thereafter) provides a **scalable, automated, and resource-efficient workflow.** 🚀
