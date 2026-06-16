export class ModalView {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.actions = [];

    this.rootElement.addEventListener("click", (event) => {
      if (event.target === this.rootElement) {
        return;
      }

      const button = event.target.closest("[data-modal-action]");

      if (!button) {
        return;
      }

      const action = this.actions.find(
        (candidate) => candidate.id === button.dataset.modalAction,
      );
      action?.handler?.();
    });
  }

  show(config) {
    this.actions = config.actions ?? [];
    this.rootElement.hidden = false;
    this.rootElement.innerHTML = "";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const title = document.createElement("h3");
    title.textContent = config.title;
    modal.appendChild(title);

    const body = document.createElement("p");
    body.textContent = config.body;
    modal.appendChild(body);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "modal__actions";

    for (const action of this.actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.modalAction = action.id;
      button.className = action.variant ?? "secondary-button";
      button.textContent = action.label;
      actionsContainer.appendChild(button);
    }

    modal.appendChild(actionsContainer);
    this.rootElement.appendChild(modal);
  }

  hide() {
    this.actions = [];
    this.rootElement.hidden = true;
    this.rootElement.innerHTML = "";
  }
}
