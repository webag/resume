## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Git and publishing

- **Never commit or push on your own.** Do not run `git commit`, `git push`, `git tag`, `git merge`, `gh pr create`, `gh release`, or any deploy/publish command unless the user has explicitly approved that exact action in the current conversation.
- Approval is per action: permission to edit files, build, or stage a change does not cover committing or pushing. Ask again for every commit and every push.
- Before asking, prepare the change, run `npm run check` and `npm run build`, and show the user what is about to be committed (`git status`, `git diff --stat`).
- Read-only git commands (`git status`, `git diff`, `git log`, `git remote -v`, `gh run list`) are always allowed.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
