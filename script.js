
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const items = $("items");
  const template = $("row-template");
  const discountInput = $("discount");
  const vatInput = $("vat");
  const currencyInput = $("currency");
  const dateInput = $("date");

  const STORAGE_KEY = "smeta-draft-v1";
  const COMPANY_KEY = "smeta-my-company-v1";

  let rowNumber = 0;
  let statusTimer;

  function today() {
    const now = new Date();
    const local = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return local.toISOString().slice(0, 10);
  }

  function toNumber(raw) {
    if (raw == null) return 0;

    const text = String(raw)
      .replace(/\s/g, "")
      .replace(/[₸₽$€]/g, "")
      .replace(",", ".");

    if (!/^-?\d+(\.\d+)?$/.test(text)) return 0;

    const value = Number(text);
    return Number.isFinite(value) ? value : 0;
  }

  function money(amount) {
    const safe = Number.isFinite(amount) ? amount : 0;
    const rounded = Math.round(safe);

    const formatted = Math.abs(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return (rounded < 0 ? "-" : "") +
      formatted + " " + currencyInput.value;
  }

  function rows() {
    return Array.from(items.querySelectorAll(".item"));
  }

  function calculate() {
    let sum = 0;

    rows().forEach((row) => {
      const qty = toNumber(
        row.querySelector(".js-qty").value
      );
      const price = toNumber(
        row.querySelector(".js-price").value
      );

      const line = qty * price;
      const safeLine = Number.isFinite(line) ? line : 0;

      sum += safeLine;

      row.querySelector(".js-sum").textContent =
        money(safeLine);
    });

    if (!Number.isFinite(sum)) sum = 0;

    const subtotal = Math.round(sum);

    const discountRate = Math.min(
      100,
      Math.max(0, toNumber(discountInput.value))
    );

    const vatRate = Math.max(
      0,
      toNumber(vatInput.value)
    );

    const discount = Math.round(
      subtotal * discountRate / 100
    );

    const afterDiscount = subtotal - discount;
    const vat = Math.round(
      afterDiscount * vatRate / 100
    );

    const finalTotal = afterDiscount + vat;

    $("subtotal").textContent = money(subtotal);
    $("discount-amount").textContent = money(-discount);
    $("after-discount").textContent = money(afterDiscount);
    $("vat-amount").textContent = money(vat);
    $("total").textContent = money(finalTotal);

    $("discount-row").hidden = discount === 0;
    $("after-discount-row").hidden = discount === 0;
    $("vat-row").hidden = vat === 0;

    return {
      subtotal,
      discount,
      afterDiscount,
      vat,
      finalTotal
    };
  }

  function addRow(focusName = false, data = {}) {
    const row = template.content.firstElementChild
      .cloneNode(true);

    rowNumber++;

    row.querySelector(".js-qty").id =
      "qty-" + rowNumber;

    row.querySelector(".js-price").id =
      "price-" + rowNumber;

    row.querySelector(".js-sum").id =
      "sum-" + rowNumber;

    row.querySelector(".js-name").value =
      data.name || "";

    row.querySelector(".js-qty").value =
      data.qty ?? "";

    row.querySelector(".js-price").value =
      data.price ?? "";

    row.querySelector(".js-unit").value =
      data.unit || "шт";

    items.appendChild(row);
    calculate();

    if (focusName) {
      row.querySelector(".js-name").focus();
    }
  }

  function getDraft() {
    return {
      from: $("from").value,
      to: $("to").value,
      number: $("number").value,
      date: dateInput.value,
      discount: discountInput.value,
      vat: vatInput.value,
      currency: currencyInput.value,
      comment: $("comment").value,

      positions: rows().map((row) => ({
        name: row.querySelector(".js-name").value,
        qty: row.querySelector(".js-qty").value,
        unit: row.querySelector(".js-unit").value,
        price: row.querySelector(".js-price").value
      }))
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(getDraft())
      );

      // Урок 7: отдельно запоминаем реквизиты компании.
      localStorage.setItem(
        COMPANY_KEY,
        $("from").value
      );
    } catch (error) {
      console.warn(
        "Не удалось сохранить черновик",
        error
      );
    }
  }

  function restoreDraft() {
    let draft = null;
    let savedCompany = "";

    try {
      draft = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

      savedCompany =
        localStorage.getItem(COMPANY_KEY) || "";
    } catch (error) {
      console.warn("Ошибка чтения черновика", error);
    }

    if (!draft || typeof draft !== "object") {
      $("from").value = savedCompany;
      dateInput.value = today();
      addRow();
      return;
    }

    $("from").value = savedCompany || draft.from || "";
    $("to").value = draft.to || "";
    $("number").value = draft.number || "1";
    dateInput.value = draft.date || today();

    discountInput.value = draft.discount ?? 0;
    vatInput.value = draft.vat ?? 0;

    if (["₸", "₽", "$", "€"].includes(draft.currency)) {
      currencyInput.value = draft.currency;
    }

    $("comment").value = draft.comment || "";

    if (
      Array.isArray(draft.positions) &&
      draft.positions.length
    ) {
      draft.positions.forEach((position) => {
        addRow(false, position);
      });
    } else {
      addRow();
    }

    calculate();
  }

  function update() {
    calculate();
    saveDraft();
  }

  $("add-row").addEventListener("click", () => {
    addRow(true);
    saveDraft();
  });

  // Сохраняем все изменения в форме.
  document.querySelectorAll(
    "input, select, textarea"
  ).forEach((field) => {
    field.addEventListener("input", update);
    field.addEventListener("change", update);
  });

  items.addEventListener("click", (event) => {
    const button = event.target.closest(".js-remove");
    if (!button) return;

    const row = button.closest(".item");

    if (rows().length === 1) {
      row.querySelector(".js-name").value = "";
      row.querySelector(".js-qty").value = "";
      row.querySelector(".js-price").value = "";
      row.querySelector(".js-unit").value = "шт";
    } else {
      row.remove();
    }

    update();
  });

  items.addEventListener("keydown", (event) => {
    if (
      event.key !== "Enter" ||
      event.target.closest("button")
    ) return;

    const row = event.target.closest(".item");
    const list = rows();

    if (!row || row !== list[list.length - 1]) return;

    event.preventDefault();
    addRow(true);
    saveDraft();
  });

  // Урок 7: при создании новой сметы
  // название компании НЕ очищается.
  $("new-estimate").addEventListener("click", () => {
    if (!confirm(
      "Создать новую смету? Текущий черновик будет очищен."
    )) {
      return;
    }

    const company = $("from").value;

    const nextNumber =
      (parseInt($("number").value, 10) || 0) + 1;

    $("to").value = "";
    $("number").value = String(nextNumber);
    dateInput.value = today();

    discountInput.value = "0";
    vatInput.value = "0";
    currencyInput.value = "₸";
    $("comment").value = "";

    rows().forEach((row) => row.remove());
    addRow();

    // Восстанавливаем реквизиты.
    $("from").value = company;

    $("copy-fallback").hidden = true;
    $("copy-status").textContent = "";

    update();
  });

  function whatsappText() {
    const result = calculate();

    const lines = [
      "Смета № " + ($("number").value || "—") +
      " от " + (dateInput.value || "—"),
      "",
      "От кого: " + ($("from").value || "—"),
      "Для кого: " + ($("to").value || "—"),
      ""
    ];

    rows().forEach((row) => {
      const name =
        row.querySelector(".js-name").value.trim();

      const qty = toNumber(
        row.querySelector(".js-qty").value
      );

      const unit =
        row.querySelector(".js-unit").value;

      const price = toNumber(
        row.querySelector(".js-price").value
      );

      const line = qty * price;

      // Не добавляем пустые позиции в сообщение.
      if (!name && qty === 0 && price === 0) {
        return;
      }

      lines.push(
        "• " + (name || "Без названия") +
        " — " + qty + " " + unit +
        " × " + money(price) +
        " = " + money(line)
      );
    });

    lines.push(
      "",
      "Сумма: " + money(result.subtotal)
    );

    if (result.discount !== 0) {
      lines.push(
        "Скидка: " + money(-result.discount)
      );

      lines.push(
        "Сумма со скидкой: " +
        money(result.afterDiscount)
      );
    }

    if (result.vat !== 0) {
      lines.push("НДС: " + money(result.vat));
    }

    lines.push(
      "Итого к оплате: " +
      money(result.finalTotal)
    );

    if ($("comment").value.trim()) {
      lines.push(
        "",
        "Комментарий: " +
        $("comment").value.trim()
      );
    }

    return lines.join("\n");
  }

  $("copy-whatsapp").addEventListener(
    "click",
    async () => {
      const text = whatsappText();

      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error(
            "Буфер обмена недоступен"
          );
        }

        await navigator.clipboard.writeText(text);

        $("copy-fallback").hidden = true;
        $("copy-status").textContent =
          "Скопировано ✓";

        clearTimeout(statusTimer);

        statusTimer = setTimeout(() => {
          $("copy-status").textContent = "";
        }, 2000);

      } catch (error) {
        $("copy-fallback").hidden = false;
        $("copy-text").value = text;
        $("copy-text").focus();
        $("copy-text").select();

        $("copy-status").textContent =
          "Скопируйте текст вручную (⌘ + C).";
      }
    }
  );

  $("save-pdf").addEventListener("click", () => {
    calculate();
    window.print();
  });

  window.addEventListener("beforeprint", () => {
    const number = $("number").value || "—";
    const date = dateInput.value || "—";

    document.querySelector(
      ".hero h1"
    ).textContent =
      "Смета № " + number + " от " + date;
  });

  window.addEventListener("afterprint", () => {
    document.querySelector(
      ".hero h1"
    ).textContent = "Смета за 5 минут";
  });

  restoreDraft();
})();
