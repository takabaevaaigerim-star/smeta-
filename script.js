
(function () {
  "use strict";

  const items = document.getElementById("items");
  const template = document.getElementById("row-template");
  const total = document.getElementById("total");
  const addButton = document.getElementById("add-row");
  const dateInput = document.getElementById("date");
  const discountInput = document.getElementById("discount");
  const vatInput = document.getElementById("vat");
  const currencyInput = document.getElementById("currency");
  const pdfButton = document.getElementById("save-pdf");

  let rowNumber = 0;

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

  function formatMoney(amount) {
    const safe = Number.isFinite(amount) ? amount : 0;
    const rounded = Math.round(safe);
    const currency = currencyInput.value;

    const formatted = Math.abs(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return (rounded < 0 ? "-" : "") +
      formatted + " " + currency;
  }

  function rows() {
    return items.querySelectorAll(".item");
  }

  function recalc() {
    let sum = 0;

    rows().forEach(function (row) {
      const qty = toNumber(
        row.querySelector(".js-qty").value
      );
      const price = toNumber(
        row.querySelector(".js-price").value
      );

      let line = qty * price;
      if (!Number.isFinite(line)) line = 0;

      sum += line;

      row.querySelector(".js-sum").textContent =
        formatMoney(line);
    });

    if (!Number.isFinite(sum)) sum = 0;

    const discountPercent = Math.min(
      100, Math.max(0, toNumber(discountInput.value))
    );
    const vatPercent = Math.max(
      0, toNumber(vatInput.value)
    );

    const subtotal = Math.round(sum);
    const discount = Math.round(
      subtotal * discountPercent / 100
    );
    const afterDiscount = subtotal - discount;
    const vat = Math.round(
      afterDiscount * vatPercent / 100
    );
    const finalTotal = afterDiscount + vat;

    document.getElementById("subtotal").textContent =
      formatMoney(subtotal);
    document.getElementById("discount-amount").textContent =
      formatMoney(-discount);
    document.getElementById("after-discount").textContent =
      formatMoney(afterDiscount);
    document.getElementById("vat-amount").textContent =
      formatMoney(vat);

    document.getElementById("discount-row").hidden =
      discount === 0;
    document.getElementById("after-discount-row").hidden =
      discount === 0;
    document.getElementById("vat-row").hidden =
      vat === 0;

    total.textContent = formatMoney(finalTotal);
  }

  function addRow(focusName) {
    const row = template.content
      .firstElementChild.cloneNode(true);

    rowNumber++;

    const qty = row.querySelector(".js-qty");
    const price = row.querySelector(".js-price");
    const sum = row.querySelector(".js-sum");

    qty.id = "qty-" + rowNumber;
    price.id = "price-" + rowNumber;
    sum.id = "sum-" + rowNumber;

    items.appendChild(row);
    recalc();

    if (focusName) {
      row.querySelector(".js-name").focus();
    }
  }

  function clearRow(row) {
    row.querySelector(".js-name").value = "";
    row.querySelector(".js-qty").value = "";
    row.querySelector(".js-price").value = "";
    row.querySelector(".js-unit").value = "шт";
  }

  if (!dateInput.value) {
    dateInput.value = today();
  }

  addButton.addEventListener("click", function () {
    addRow(true);
  });

  items.addEventListener("input", recalc);
  items.addEventListener("change", recalc);

  discountInput.addEventListener("input", recalc);
  vatInput.addEventListener("input", recalc);
  currencyInput.addEventListener("change", recalc);

  items.addEventListener("click", function (event) {
    const button = event.target.closest(".js-remove");
    if (!button) return;

    const row = button.closest(".item");

    if (rows().length === 1) {
      clearRow(row);
    } else {
      row.remove();
    }

    recalc();
  });

  items.addEventListener("keydown", function (event) {
    if (
      event.key !== "Enter" ||
      event.target.closest("button")
    ) return;

    const row = event.target.closest(".item");
    const list = rows();

    if (!row || row !== list[list.length - 1]) return;

    event.preventDefault();
    addRow(true);
  });

  // Сохранение сметы в PDF через печать браузера
  pdfButton.addEventListener("click", function () {
    recalc();
    window.print();
  });

  // Заголовок для печати
  function updatePrintTitle() {
    const number =
      document.getElementById("number").value || "—";
    const date = dateInput.value || "—";

    document.querySelector(".hero h1").textContent =
      "Смета № " + number + " от " + date;
  }

  window.addEventListener("beforeprint", updatePrintTitle);

  window.addEventListener("afterprint", function () {
    document.querySelector(".hero h1").textContent =
      "Смета за 5 минут";
  });

  addRow(false);
})();
