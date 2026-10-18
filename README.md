# Abhiram Kamarajugadda | Portfolio (Windows XP edition)

Personal portfolio of **Kamarajugadda H V N S Abhiram**, Java Backend Developer (Spring Boot, Spring MVC, Spring Data JPA, JDBC, MySQL).

The site is a Windows XP–style desktop: click the desktop icons or the **start** button to open draggable windows for About, Projects, Skills, Experience & Education, Résumé and Contact.

- Plain HTML, CSS and vanilla JavaScript. No build step, no frameworks.
- Window chrome from [XP.css](https://github.com/botoxparty/XP.css) (MIT), vendored in `vendor/xp.css/`.
- Works on desktop and mobile (windows open full-screen on small screens) and degrades to a readable page without JavaScript.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Contact

- Email: abhiram.kamarajugadda4@gmail.com
- LinkedIn: https://www.linkedin.com/in/abhiram-kamarajugadda/
- GitHub: https://github.com/Haaseth

## Startup sequence
Every page load plays an XP boot screen (~2s, click/Enter to skip) and the Welcome/login screen; click the user tile to log on. Implemented in `assets/js/boot.js` + `assets/css/boot.css`. Without JavaScript the desktop content is shown directly.
