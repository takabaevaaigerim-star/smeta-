
(function () {
  "use strict";

  var items = document.getElementById("items");
  var template = document.getElementById("row-template");
  var total = document.getElementById("total");
  var addButton = document.getElementById("add-row");
  var dateInput = document.getElementById("date");

  var discountInput = document.getElementById("discount");
  var vatInput = document.getElementById("vat");
  var currencyInput = document.getElementById("currency");

  var rowNumber = 0;

  function today() {
    var now = new Date();
    var local = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );
    return local.toISOString().slice(0, 10);
  }

  function toNumber(raw) {
    if (raw == null) return 0;

    var text = String(raw)
      .replace(/\s/g, "")
      .replace(/[₸₽$€]/g, "")
      .replace(",", ".");

    if (!/^-?\d+(\.\d+)?$/.test(text)) return 0;

    var value = Number(text);
    return Number.isFinite(value) ? value : 0;
  }

  function formatMoney(amount) {
    var safe = Number.isFinite(amount) ? amount : 0;
    var rounded = Math.round(safe);
    var currency = currencyInput.value;

    var formatted = Math.abs(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    return (rounded < 0 ? "-" : "") +
      formatted + " " + currency;
  }

  function rows() {
    return items.querySelectorAll(".item");
  }

  function recalc() {
    var sum = 0;
    var list = rows();

    for (var i = 0; i < list.length; i++) {
      var qty = toNumber(
        list[i].querySelector(".js-qty").value
      );
      var price = toNumber(
        list[i].querySelector(".js-price").value
      );

      var line = qty * price;
      if (!Number.isFinite(line)) line = 0;

      sum += line;

      list[i].querySelector(".js-sum").textContent =
        formatMoney(line);
    }

    if (!Number.isFinite(sum)) sum = 0;

    var discountPercent = Math.min(
      100, Math.max(0, toNumber(discountInput.value))
    );

    var vatPercent = Math.max(
      0, toNumber(vatInput.value)
    );

    var subtotal = Math.round(sum);
    var discount = Math.round(
      subtotal * discountPercent / 100
    );

    var afterDiscount = subtotal - discount;
    var vat = Math.round(
      afterDiscount * vatPercent / 100
    );

    var finalTotal = afterDiscount + vat;

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
    var row = template.content
      .firstElementChild.cloneNode(true);

    rowNumber++;

    var qty = row.querySelector(".js-qty");
    var price = row.querySelector(".js-price");
    var sum = row.querySelector(".js-sum");

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
    var button = event.target.closest(".js-remove");
    if (!button) return;

    var row = button.closest(".item");

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

    var row = event.target.closest(".item");
    var list = rows();

    if (!row || row !== list[list.length - 1]) return;

    event.preventDefault();
    addRow(true);
  });

  addRow(false);
})();
