/*
 * Pixiv Keyboard Pagination
 * =========================
 * Version: 0.1.0
 *
 * [Features]
 * - ← / → : previous / next page
 * - Ctrl + ← / → : first / last page
 * - Generic pagination via `p` query parameter
 * - `/users/:id` → `/users/:id/artworks`
 *
 * [Known Issues]
 * - Actual last page may be less than p=1000
 *
 * [Changelog]
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
          // p=1 时不跳自己
          if (page > 1) {
            goPage(1);
          }
        } else {
          goPage(JUMP_PAGE);
        }

        return;
      }

      /*
       * 普通 ←
       */
      if (e.key === "ArrowLeft") {
        e.preventDefault();

        // p=1 不跳自己
        if (page > 1) {
          goPage(page - 1);
        }

        return;
      }

      /*
       * 普通 →
       */
      if (e.key === "ArrowRight") {
        e.preventDefault();

        goPage(page + 1);
      }
    },
    true
  );
})();