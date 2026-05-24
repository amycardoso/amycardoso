# README Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic code-block README with a colorful, badge-enhanced version that preserves every word of the original copy.

**Architecture:** Single-file edit to `README.md` — remove the outer code block wrapper, insert capsule-render gradient lines around the ASCII art, and add shields.io pill badges after the tech and interests lines. No new files created except a `.gitignore` entry.

**Tech Stack:** Markdown, HTML `<img>` tags, [capsule-render](https://capsule-render.vercel.app) (gradient lines), [shields.io](https://shields.io) (badges).

---

### Task 1: Protect brainstorm artifacts from git

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Check if .gitignore exists**

```bash
cat .gitignore 2>/dev/null || echo "no .gitignore"
```

- [ ] **Step 2: Add `.superpowers/` entry**

If `.gitignore` exists, append to it. If not, create it.

```bash
echo '.superpowers/' >> .gitignore
```

- [ ] **Step 3: Verify**

```bash
cat .gitignore
```

Expected output includes the line `.superpowers/`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore superpowers brainstorm artifacts"
```

---

### Task 2: Rewrite README.md

**Files:**
- Modify: `README.md`

The current README is entirely inside one code block (backtick fence). We need to break it out, add the gradient lines, and add badges. The final file must look exactly as shown in Step 1 below.

- [ ] **Step 1: Replace the entire contents of README.md with the following**

```markdown
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:f72585,50:7209b7,100:4cc9f0&height=3" width="100%" />

```
 █████╗ ███╗   ███╗██╗   ██╗
██╔══██╗████╗ ████║╚██╗ ██╔╝
███████║██╔████╔██║ ╚████╔╝
██╔══██║██║╚██╔╝██║  ╚██╔╝
██║  ██║██║ ╚═╝ ██║   ██║
╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:4cc9f0,50:7209b7,100:f72585&height=3" width="100%" />

· · · · · · · · · · · · ·

dev based in brazil. 
building backend (java/spring) & ai/ml by day.
leading teams — the stressful, beautiful two sides of the same coin.

![java](https://img.shields.io/badge/java-f72585?style=flat-square&logo=openjdk&logoColor=white) ![spring](https://img.shields.io/badge/spring-7209b7?style=flat-square&logo=spring&logoColor=white) ![ai/ml](https://img.shields.io/badge/ai%2Fml-4cc9f0?style=flat-square&logoColor=0d0d1a)

outside the terminal: 
piano keys, generative art, and the art of living. 
finding focus in books; i build for work, but i create for myself.

![piano](https://img.shields.io/badge/piano-4361ee?style=flat-square) ![generative art](https://img.shields.io/badge/generative%20art-f72585?style=flat-square) ![books](https://img.shields.io/badge/books-f4d03f?style=flat-square&logoColor=0d0d1a)

· · · · · · · · · · · · ·

*the best code i write is the code nobody asked for.*
```

> **Note on the code block inside the markdown above:** The ASCII art lines sit inside a fenced code block (triple backticks). The outer markdown content (img tags, badges, text) is outside any code block. Make sure the backtick fences are correct — the ASCII art should be monospace-rendered, everything else rendered as markdown.

- [ ] **Step 2: Verify the file looks correct locally**

```bash
cat -n README.md
```

Check:
- Line 1 is the `<img>` capsule-render tag (top gradient)
- Lines 3–10 are inside a code block (the AMY ASCII art)
- Line 12 is the second `<img>` capsule-render tag (bottom gradient)
- Line 14 is `· · · · · · · · · · · · ·`
- Badge lines appear after the backend line and after the interests line
- Last line is `*the best code i write is the code nobody asked for.*`

- [ ] **Step 3: Preview in a markdown renderer**

If you have the GitHub CLI:
```bash
gh repo view --web
```

Or push to a branch and check the GitHub preview. Confirm:
- The gradient lines render as thin colored bars (pink→violet→cyan and reverse)
- The ASCII art is in a monospace code block, unchanged
- The three tech badges appear as colored pill labels
- The three interest badges appear as colored pill labels
- All original text is present and unchanged

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "feat: add gradient lines and colored badges to profile README"
```

---

### Task 3: Push and verify on GitHub

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Open your GitHub profile**

Navigate to `https://github.com/amycardoso` in a browser.

- [ ] **Step 3: Confirm rendering**

Check all of the following:
- [ ] Top gradient line renders (thin pink→violet→cyan bar)
- [ ] ASCII art `AMY` block renders in monospace, inside a styled code block
- [ ] Bottom gradient line renders (thin cyan→violet→pink bar, reversed)
- [ ] `· · · · · · · · · · · · ·` separators visible
- [ ] `java` badge: pink background, OpenJDK logo, white text
- [ ] `spring` badge: violet background, Spring logo, white text
- [ ] `ai/ml` badge: cyan background, dark text
- [ ] `piano` badge: indigo-blue background
- [ ] `generative art` badge: pink background
- [ ] `books` badge: gold background, dark text
- [ ] Closing italic quote renders in italics
- [ ] No stray backtick fences or raw HTML visible

If the capsule-render lines don't appear (rare GitHub CSP issue), fallback: replace both `<img>` tags with a plain `---` horizontal rule — it's less colorful but preserves layout.
