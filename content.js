/*
 * Pixiv Keyboard Pagination
 * =========================
 * Version: 0.2.0
 *
 * [Features]
 * - ← / → : previous / next page
 * - Ctrl + ← / → : first / last page
 * - Generic pagination via `p` query parameter
 * - `/users/:id` → `/users/:id/artworks`
 *
 * [Boundary detection]
 * - Reads visible Pixiv pagination controls before navigating.
 *
 * [Changelog]
 * 0.2.0
 * - Detect first and last page from pagination controls.
 *
 * 0.1.0
 * - Initial implementation
 */

(() => {
  "use strict";

  const JUMP_PAGE = 1000;

  function getUserIdPage() {
    const match = location.pathname.match(/^\/users\/(\d+)\/?$/);
    return match ? match[1] : null;
  }

  function getPage() {
    const url = new URL(location.href);
    const value = url.searchParams.get("p");

    // 没有显式 p，视为第一页
    if (value === null) {
      return 1;
    }

    const page = Number(value);

    return Number.isInteger(page) && page >= 1
      ? page
      : null;
  }

  function goPage(page) {
    const url = new URL(location.href);
    url.searchParams.set("p", page);
    location.href = url.href;
  }

  function goUserArtworks(userId) {
    location.href = `/users/${userId}/artworks`;
  }

  function isDisabled(element) {
    return (
      element.hasAttribute("disabled") ||
      element.getAttribute("aria-disabled") === "true" ||
      element.classList.contains("disabled")
    );
  }

  function getLinkPage(element) {
    if (!element) {
      return null;
    }

    const href = element.getAttribute("href");

    if (!href) {
      return null;
    }

    const url = new URL(href, location.href);
    if (url.pathname !== location.pathname) {
      return null;
    }

    const value = url.searchParams.get("p");
    const page = value === null ? 1 : Number(value);

    return Number.isInteger(page) && page >= 1 ? page : null;
  }

  function getPaginationState(page) {
    const elements = [...document.querySelectorAll(
      'a[href], button, [role="button"]'
    )];
    const pageLinks = elements
      .map((element) => ({ element, page: getLinkPage(element) }))
      .filter((item) => item.page !== null);

    const next = elements.find((element) =>
      element.matches('[rel="next"], [aria-label*="Next" i], [aria-label*="次" i]')
    );
    const previous = elements.find((element) =>
      element.matches('[rel="prev"], [rel="previous"], [aria-label*="Previous" i], [aria-label*="前" i]')
    );
    const last = elements.find((element) =>
      element.matches('[rel="last"], [aria-label*="Last" i], [aria-label*="末" i]')
    );

    const linkedPages = pageLinks.map((item) => item.page);
    const highestLinkedPage = linkedPages.length
      ? Math.max(...linkedPages)
      : null;
    const lastPage = getLinkPage(last);

    return {
      canGoPrevious:
        page > 1 && (!previous || !isDisabled(previous)),
      canGoNext:
        page < JUMP_PAGE && (
          next
            ? !isDisabled(next)
            : lastPage !== null
              ? page < lastPage
              : highestLinkedPage !== null
                ? page < highestLinkedPage
                : true
        ),
      hasKnownLastPage: lastPage !== null,
      lastPage
    };
  }

  function isEditable(target) {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    );
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) {
        return;
      }

      if (isEditable(e.target)) {
        return;
      }

      /*
       * /users/:id
       *
       * ← / → 都进入 artworks
       */
      const userId = getUserIdPage();

      if (userId) {
        e.preventDefault();
        goUserArtworks(userId);
        return;
      }

      /*
       * 其余页面：
       *
       * 无 p  => 视为 p=1
       * 有 p=N => 当前第 N 页
       */
      const page = getPage();

      if (page === null) {
        return;
      }

      /*
       * Ctrl + ← / →
       */
      if (e.ctrlKey) {
        e.preventDefault();

        if (e.key === "ArrowLeft") {
          if (getPaginationState(page).canGoPrevious) {
            goPage(1);
          }
        } else {
          const state = getPaginationState(page);
          if (state.canGoNext) {
            goPage(state.hasKnownLastPage ? state.lastPage : JUMP_PAGE);
          }
        }

        return;
      }

      /*
       * 普通 ←
       */
      if (e.key === "ArrowLeft") {
        e.preventDefault();

        if (getPaginationState(page).canGoPrevious) {
          goPage(page - 1);
        }

        return;
      }

      /*
       * 普通 →
       */
      if (e.key === "ArrowRight") {
        if (getPaginationState(page).canGoNext) {
          e.preventDefault();
          goPage(page + 1);
        }
      }
    },
    true
  );
})();