This repository is configured to deploy GitHub Pages from the repository root using the workflow in .github/workflows/deploy.yml.

To publish a site, add your static site files (e.g., index.html) to the repository root and push to the main branch. The workflow will run on push and deploy the files to GitHub Pages.

Notes:
- You confirmed you have admin rights. If Pages doesn't become active after the workflow runs, go to Settings → Pages to verify and configure the custom domain (if any).
- If you want me to add a minimal index.html or serve from /docs instead, tell me and I can update the repo.
