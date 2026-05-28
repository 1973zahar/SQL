# GitHub setup

Цільовий репозиторій:

```text
https://github.com/1973zahar/SQL
```

## Публікація через Git

У папці `C:\Users\Zak\Documents\CRM`:

```powershell
git init
git add .
git commit -m "Initial modular CRM project"
git branch -M main
git remote add origin https://github.com/1973zahar/SQL.git
git push -u origin main
```

## Варіант 2. Через GitHub CLI

Якщо встановлено `gh`:

```powershell
gh repo view 1973zahar/SQL
git init
git add .
git commit -m "Initial modular CRM project"
git branch -M main
git remote add origin https://github.com/1973zahar/SQL.git
git push -u origin main
```

## Що потрібно встановити локально

- Git
- Node.js LTS
- Docker Desktop або Docker Engine
- GitHub CLI, якщо хочете створювати репозиторій з консолі
