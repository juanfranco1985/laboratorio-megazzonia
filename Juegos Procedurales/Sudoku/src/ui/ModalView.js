export class ModalView {
  constructor(container) {
    this.container = container;
  }

  render(modal) {
    if (!modal) {
      this.container.innerHTML = "";
      this.container.hidden = true;
      return;
    }

    this.container.hidden = false;
    this.container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-card ${modal.kind || ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-body">
          <h2 id="modal-title">${modal.title}</h2>
          <div class="modal-copy">${modal.body}</div>
          <div class="modal-actions">${modal.actions}</div>
        </div>
      </div>
    `;
  }
}
