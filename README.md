# Сайт-резюме

Портфолио на [Astro](https://astro.build), хостинг на GitHub Pages.

## Команды

| Команда           | Что делает                                    |
| :---------------- | :-------------------------------------------- |
| `npm install`     | Установка зависимостей                        |
| `npm run dev`     | Dev-сервер на `localhost:4321`                |
| `npm run build`   | Сборка в `./dist/`                            |
| `npm run preview` | Просмотр собранного сайта                     |
| `npm run check`   | Проверка типов и схемы кейсов                 |

Нужен Node.js 22.23.4 или новее.

## Как добавить кейс

1. Положите обложку (16:9, лучше 1920×1080) в `src/assets/cases/<slug>.webp`.
2. Создайте `src/content/cases/<slug>.md`:

```md
---
title: "Название"
summary: "Одна строка о проекте"
type: corporate # ecommerce | corporate | catalog | landing | service | pet
cover: ../../assets/cases/<slug>.webp
url: "https://example.com"
tags: ["Astro", "1С"]
order: 5
---

## Задача
...

## Решение
...

## Результат
...
```

Личные данные (имя, опыт, навыки, контакты) лежат в `src/data/profile.ts`.

## Деплой

1. Создайте репозиторий на GitHub и запушьте ветку `main`.
2. Откройте Settings → Pages → Source и выберите **GitHub Actions**.
3. Каждый пуш в `main` собирает и публикует сайт. Путь (`/<repo>/` или корень для `<user>.github.io`) определяется автоматически.
