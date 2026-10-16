# Carl Christian Quist – Portfolio

Personal portfolio for Carl Christian Quist, IT Officer and Software Developer in Accra, Ghana.
Built from the structure of the Pearl Amissah portfolio in this repository (home, work, contact
pages) and filled with content from Carl's CV and GitHub repositories.

## Pages

| Page | Contents |
|---|---|
| `index.html` | Introduction, focus areas, three featured projects, skills |
| `projects.html` | All 16 projects, filterable by GRA, Websites, Apps, and Linux & open source |
| `resume.html` | Full web resume with a print stylesheet (Print or save as PDF) |
| `contact.html` | Email, phone and GitHub, plus a form that opens a pre-filled email |

## Structure

```
myportfolio/
├── index.html
├── projects.html
├── resume.html
├── contact.html
└── assets/
    ├── css/styles.css   # shared styles, light and dark themes
    ├── css/print.css    # resume print layout
    └── js/main.js       # theme toggle, project filters, contact form, copy buttons
```

Plain HTML, CSS and JavaScript. No build step.

## Preview locally

```bash
cd myportfolio
python3 -m http.server 4177
```

Then open http://localhost:4177.

## Deploy

- On the existing Vercel project for this repository, the site is served at `/myportfolio/`.
- To deploy it on its own, create a Vercel project from this repository and set
  **Root Directory** to `myportfolio`.

## Updating

- Add a project: copy an `<article class="project">` block in `projects.html`, place it in the
  right group, and update the counts on the filter buttons.
- Add a photo: put the image in `assets/` and replace the `CQ` monogram in the header, or add it
  to the hero in `index.html`.
