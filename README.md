# Technical Support – Knowledge Base (Notes of TS)

A practical collection of notes, guides, and examples covering Technical Support and DevOps tools. This repository serves as a handy reference for installing, configuring, and working daily with popular development technologies.

---

## How to Initialize Git and Connect to the Repository?

Below is a set of basic commands that will help you initialize a local repository on your machine and push your files to GitHub.

```bash
# Initialize a new local Git repository in the current folder
git init

# Add all files from the current directory to the staging area
git add .

# Save the staged changes to the repository history with a descriptive message
git commit -m "Initial commit - project setup"

# Rename the default branch to 'main' (GitHub standard)
git branch -M main

# Link the local repository to the remote GitHub repository (replace with your actual URL)
git remote add origin https://github.com

# Push local changes to GitHub and set the upstream tracking branch
git push -u origin main
```

---

## Repository Contents (Table of Topics)

The documentation is divided into five main subject areas:

* **WSL (Windows Subsystem for Linux)**
  * Where to use
  * Installation
  * Custom version of Ubuntu
  * Configuration of user
* **Jenkins**
  * Where to use
  * Installation/Upgrade
  * Pipeline
* **Docker**
  * Where to use
  * Installation
  * Docker commands
  * Docker compose pipeline
* **Git**
  * Where to use
  * Installation
  * Commands often used
* **GitHub**
  * Where to use
  * Installation
  * Repositories
  * Runner

---

## Useful Links

* [GitHub – Homepage](https://github.com)
* [Official Git Documentation](https://git-scm.com)
