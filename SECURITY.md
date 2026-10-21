# Security policy

## What is in this repository

Code, data, maps and documents. **No credentials.** No API keys, no service tokens, no `.env` file, no endpoint of a
private service. The extractor reads its configuration from the environment (`LLM_BASE_URL`, `LLM_API_KEY`,
`LLM_MODEL`) and stops with a message if they are missing — there is deliberately no default host.

## If you contribute

- Never commit a key, a token or a `.env` file. `.gitignore` covers the usual names, but check with `git status`
  before committing.
- Do not paste private endpoints into issues, pull requests or the notebook. A URL is enough for somebody to use
  an unprotected service.
- Use your own model key, on your own account. A student's key stays with the student.

## If you find a problem

Open a **private** security advisory: <https://github.com/bperak/napoli-1980-musical-memory/security/advisories/new>
(Repository → Security → Advisories → Report a vulnerability). Please do not open a public issue for a live
credential or an exposed service.

Include: what you found, where, and how to reproduce it. You will get an answer within a few days; if the finding is
about a credential, it will be revoked before anything else happens.

## Scope

In scope: this repository, its published notebook and the map at <https://bperak.github.io/napoli-1980-map/>.

Out of scope: the personal websites and publications cited as sources; the Google Sheets and Docs linked from the
README, which are read-only and contain no personal data beyond the authors' names.
