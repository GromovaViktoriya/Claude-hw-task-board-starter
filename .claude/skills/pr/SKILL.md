---
name: pr
description: Описание PR из застейдженного диффа
disable-model-invocation: true
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(npm test:*)
---

Дифф: !`git diff --staged`
Ветка: !`git branch --show-current`

Составь описание пул-реквеста: что изменилось и зачем,
на что смотреть ревьюеру в первую очередь, что могло сломаться.
Без воды и без пересказа диффа построчно.