# Self-hosted fonts

Both files are the **latin subset, variable-weight** builds served by Google
Fonts, committed here so `next build` never downloads anything. They are loaded
through `next/font/local` in `src/app/layout.tsx`.

| File | Family | Weights | Source |
| --- | --- | --- | --- |
| `Inter-Variable.woff2` | Inter | 100–900 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2 |
| `JetBrainsMono-Variable.woff2` | JetBrains Mono | 100–800 | https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwE.woff2 |

Licenses (both SIL Open Font License 1.1):

- Inter — <https://github.com/rsms/inter>
- JetBrains Mono — <https://github.com/JetBrains/JetBrainsMono>

To swap or add a font, drop the `.woff2` in this directory and point
`localFont({ src: ... })` at it. Do **not** reintroduce `next/font/google`: it
fetches at compile time and fails the build without network egress.

Note: only the latin subset is bundled. Characters outside it (e.g. Devanagari)
fall back to the system stack declared in `globals.css`. Add the `latin-ext`
file if names with Central/Eastern European diacritics show up in rosters.
