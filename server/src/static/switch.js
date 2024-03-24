const toggleSwitch = document.getElementById("switch");
const toggleStatus = document.getElementById("switch-status");

function onCheckboxToggle() {
  const isChecked = this.hasAttribute("checked");

  /* 1. Update toggle switch visual state. */
  this.toggleAttribute("checked");

  /* 2. Update toggle switch status text. */
  toggleStatus.innerText = isChecked ? "OFF" : " ON";
}

toggleSwitch.addEventListener("change", onCheckboxToggle);
