export class Modal {
    
    baseElement?: HTMLElement;
    container?: HTMLElement;

    constructor(id: string) {
        let foundElem = document.getElementById(id);

        if (!foundElem) {
            console.error("Modal has been setup with non existent element. id:", id)
        }else{
            this.baseElement = foundElem;
        }

    }

    showModal() {

        if(!this.baseElement){
            console.error("Modal has not been incorrectly setup.");
            return;
        }

        if (!this.container) {
            let modal = this.baseElement.cloneNode(true) as HTMLElement;

            modal.id = "";
            modal.style.visibility = "";
            modal.style.display = "flex"

            let container = (this.container = document.createElement("div"));

            this.updateElemStyle(container, {
                width: "100vw",
                height: "100vh",
                position: "absolute",
                display: "flex",
                top: "0",
                left: "0",
                alignContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
                visibility: "visible",
                zIndex: "999"
            });

            container.addEventListener("click", () => {
                this.hideModal();
            })

            container.appendChild(modal);

            document.body.appendChild(container);
        } else {
            this.updateElemStyle(this.container, {
                visibility: "visible",
            });
        }
    }

    hideModal() {

        if(!this.baseElement){
            console.error("Modal has not been incorrectly setup.");
            return;
        }

        if(!this.container) return;

        this.updateElemStyle(this.container, {visibility: "hidden"});

    }

    private updateElemStyle(
        el: HTMLElement,
        style: Partial<CSSStyleDeclaration>
    ) {
        for (let attr of Object.keys(style)) {
            // @ts-ignore
            el.style[attr as string] = style[attr];
        }
    }
}
