const root = document.documentElement;

const themeToggle =
  document.getElementById("themeToggle");

const year =
  document.getElementById("year");

const glow =
  document.querySelector(".cursor-glow");


year.textContent =
  new Date().getFullYear();



const savedTheme =
  localStorage.getItem("theme");


if (
  savedTheme === "light" ||
  savedTheme === "dark"
) {

  root.dataset.theme =
    savedTheme;

}

else if (
  window.matchMedia(
    "(prefers-color-scheme: light)"
  ).matches
) {

  root.dataset.theme =
    "light";

}



themeToggle.addEventListener(
  "click",
  () => {

    const next =
      root.dataset.theme === "light"
        ? "dark"
        : "light";


    root.dataset.theme =
      next;


    localStorage.setItem(
      "theme",
      next
    );

  }
);



const revealObserver =
  new IntersectionObserver(

    entries => {

      entries.forEach(
        entry => {

          if (
            entry.isIntersecting
          ) {

            entry.target
              .classList
              .add("is-visible");


            revealObserver
              .unobserve(
                entry.target
              );

          }

        }
      );

    },

    {

      threshold:
        0.12,

      rootMargin:
        "0px 0px -6% 0px"

    }

  );



document
  .querySelectorAll(".reveal")
  .forEach(
    (el, index) => {

      el.style.transitionDelay =
        `${
          Math.min(
            index % 5,
            4
          ) * 50
        }ms`;


      revealObserver.observe(
        el
      );

    }
  );



if (
  window.matchMedia(
    "(pointer: fine)"
  ).matches
) {

  window.addEventListener(
    "mousemove",
    event => {

      glow.style.left =
        `${event.clientX}px`;

      glow.style.top =
        `${event.clientY}px`;

      glow.style.opacity =
        "1";

    }
  );


  window.addEventListener(
    "mouseleave",
    () => {

      glow.style.opacity =
        "0";

    }
  );

}



const sections =
  [
    ...document.querySelectorAll(
      "section[id]"
    )
  ];


const navLinks =
  [
    ...document.querySelectorAll(
      ".desktop-nav a"
    )
  ];



const sectionObserver =
  new IntersectionObserver(

    entries => {

      const visible =
        entries

          .filter(
            entry =>
              entry.isIntersecting
          )

          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio
          )[0];


      if (!visible)
        return;


      navLinks.forEach(
        link => {

          link.dataset.active =
            String(

              link.getAttribute(
                "href"
              ) ===
              `#${visible.target.id}`

            );


          link.style.color =

            link.dataset.active ===
            "true"

              ? "var(--text)"

              : "";

        }
      );

    },

    {

      threshold:
        [0.15, 0.35, 0.6],

      rootMargin:
        "-25% 0px -55% 0px"

    }

  );



sections.forEach(
  section =>

    sectionObserver.observe(
      section
    )

);
